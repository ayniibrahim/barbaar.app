import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Type, Moon, Sun, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Settings2, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Resource } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI, Modality } from "@google/genai";

interface ResourceReaderProps {
  resource: Resource;
  onBack: () => void;
  onComplete?: (resource: Resource) => void;
  theme: 'light' | 'sepia' | 'dark';
  onThemeChange: (theme: 'light' | 'sepia' | 'dark') => void;
}

export const ResourceReader = ({ resource, onBack, onComplete, theme, onThemeChange }: ResourceReaderProps) => {
  const [fontSize, setFontSize] = useState(18);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isExternalAudio, setIsExternalAudio] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isHighlightingEnabled, setIsHighlightingEnabled] = useState(true);
  
  // Highlighting state (Word-level for engagement)
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [currentChunkWords, setCurrentChunkWords] = useState<string[]>([]);
  
  // Chunking state for faster loading
  const [chunks, setChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [audioQueue, setAudioQueue] = useState<Map<number, string>>(new Map());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper: Split text into safe chunks for TTS (~1000-1500 chars)
  const createTTSChunks = (text: string) => {
    if (!text) return [];
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    const result: string[] = [];
    
    paragraphs.forEach(p => {
      if (p.length > 1500) {
        // Sub-split large paragraphs by sentences
        const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
        let currentSubChunk = "";
        sentences.forEach(s => {
          if ((currentSubChunk + s).length > 1500) {
            if (currentSubChunk) result.push(currentSubChunk.trim());
            currentSubChunk = s;
          } else {
            currentSubChunk += s;
          }
        });
        if (currentSubChunk) result.push(currentSubChunk.trim());
      } else if (p.trim()) {
        result.push(p.trim());
      }
    });
    return result;
  };

  // Helper to get direct audio URL (shared logic with NasashoView)
  const getDirectAudioUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const id = url.match(/[-\w]{25,}/);
      return id ? `https://docs.google.com/uc?export=download&id=${id[0]}` : url;
    }
    return url;
  };

  // Resolve external audio URL (Archive.org etc)
  useEffect(() => {
    let isMounted = true;
    const resolveAudio = async () => {
      const url = resource.audioUrl || resource.embedUrl || '';
      if (!url) return;

      // Handle Archive.org
      if (url.includes('archive.org/details/') || url.includes('archive.org/embed/')) {
        try {
          const parts = url.split('/');
          const idIndex = parts.findIndex(p => p === 'details' || p === 'embed') + 1;
          const id = parts[idIndex]?.split('?')[0];
          
          if (!id) {
            if (isMounted) {
              setAudioUrl(getDirectAudioUrl(url));
              setIsExternalAudio(true);
            }
            return;
          }

          const response = await fetch(`https://archive.org/metadata/${id}`);
          const data = await response.json();
          const mp3File = data.files?.find((f: any) => 
            f.name?.toLowerCase().endsWith('.mp3') && 
            (f.format?.toLowerCase().includes('mp3') || f.source === 'original')
          );
          
          if (mp3File && isMounted) {
            const fileName = encodeURIComponent(mp3File.name).replace(/%20/g, '+');
            setAudioUrl(`https://archive.org/download/${id}/${fileName}`);
            setIsExternalAudio(true);
            return;
          }
          
          if (isMounted) {
            setAudioUrl(`https://archive.org/download/${id}/${id}.mp3`);
            setIsExternalAudio(true);
          }
        } catch (err) {
          console.warn("Failed to resolve Archive.org metadata in reader", err);
          if (isMounted) {
            setAudioUrl(getDirectAudioUrl(url));
            setIsExternalAudio(true);
          }
        }
      } else if (resource.type === 'Podcast' || resource.audioUrl) {
        if (isMounted) {
          setAudioUrl(getDirectAudioUrl(url));
          setIsExternalAudio(true);
        }
      }
    };

    resolveAudio();
    return () => { isMounted = false; };
  }, [resource.id]);

  // Initialize chunks when content changes
  useEffect(() => {
    const text = resource.pages ? resource.pages[currentPage] : resource.content;
    if (text) {
      const saferChunks = createTTSChunks(text);
      setChunks(saferChunks);
      setCurrentChunkIndex(0);
      
      // Reset highlighting and queue
      if (!isExternalAudio) {
        setAudioQueue(new Map());
        setAudioUrl(null);
        setActiveWordIndex(-1);
      }
    }
  }, [resource.id, currentPage, isExternalAudio]);

  // Handle word splitting for word-by-word tracking
  useEffect(() => {
    if (chunks[currentChunkIndex] && isHighlightingEnabled) {
      const words = chunks[currentChunkIndex].split(/\s+/);
      setCurrentChunkWords(words);
    } else {
      setCurrentChunkWords([]);
    }
  }, [chunks, currentChunkIndex, isHighlightingEnabled]);

  // Audio time update logic with word-level estimation
  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration > 0) {
      const currentTime = audioRef.current.currentTime;
      const totalDuration = audioRef.current.duration;
      setProgress((currentTime / totalDuration) * 100);

      // Estimate active word if highlighting is enabled
      if (isHighlightingEnabled && currentChunkWords.length > 0) {
        // We use a slightly more nuanced estimation by considering a small lead time
        // for better synchronization with the voice
        const totalChars = currentChunkWords.join(' ').length;
        let cumulativeChars = 0;
        let found = false;

        const syncOffset = 0.1; // 100ms offset for better perceived sync

        for (let i = 0; i < currentChunkWords.length; i++) {
          cumulativeChars += currentChunkWords[i].length + 1;
          const estimatedEndTime = (cumulativeChars / totalChars) * (totalDuration - syncOffset);
          
          if (currentTime < estimatedEndTime) {
            setActiveWordIndex(i);
            found = true;
            break;
          }
        }
        if (!found) setActiveWordIndex(currentChunkWords.length - 1);
      }
    }
  };

  // Auto-scroll to active word
  const activeWordRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (isHighlightingEnabled && isPlaying && activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeWordIndex, isHighlightingEnabled, isPlaying]);

  // Tracking blobs for cleanup on unmount
  const audioQueueRef = useRef(audioQueue);
  useEffect(() => {
    audioQueueRef.current = audioQueue;
  }, [audioQueue]);

  // Cleanup blobs ONLY on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      audioQueueRef.current.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const generateAudioChunk = async (index: number, retries = 2, delay = 1000) => {
    if (audioQueue.has(index)) return audioQueue.get(index);
    if (index >= chunks.length) return null;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      let voiceName = 'Zephyr'; 
      let languageInstruction = 'Read this text with a natural, engaging, and professional human voice. Use appropriate pauses and emotional nuance.';
      
      if (resource.language === 'so') {
        // Switching to Kore for Somali as requested for a smoother, more natural feel
        voiceName = 'Kore'; 
        languageInstruction = 'U Akhri qoraalkan si dabiici ah, xirfad leh, oo dareen leh adigoo isticmaalaya lahjada saxda ah ee Af-Soomaaliga. Hubi inaad si habsan u dhawaaqdo erey kasta.';
      }

      const textToRead = chunks[index];
      const prompt = `${languageInstruction}\n\nCONTENT:\n${textToRead}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const header = new ArrayBuffer(44);
        const view = new DataView(header);
        
        const writeString = (offset: number, string: string) => {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + bytes.length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
        view.setUint16(32, numChannels * bitsPerSample / 8, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, bytes.length, true);
        
        const blob = new Blob([header, bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        setAudioQueue(prev => new Map(prev).set(index, url));
        return url;
      }
    } catch (error: any) {
      // Check for 429 Resource Exhausted
      const errorMsg = error?.message || '';
      if (errorMsg.includes('429') && retries > 0) {
        console.warn(`Quota exceeded for chunk ${index}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateAudioChunk(index, retries - 1, delay * 2);
      }
      
      console.error(`Error generating audio chunk ${index}:`, error);
      if (errorMsg.includes('429')) {
        setPlaybackError("AI Voice quota exceeded. Please wait a moment before trying again.");
      }
    }
    return null;
  };

  const handleGenerateAudio = async () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    if (chunks.length === 0) return;

    setIsAudioLoading(true);
    setPlaybackError(null);
    
    // Switch to sequential generation to avoid hitting 429 quota limits
    const url0 = await generateAudioChunk(0);

    if (url0) {
      setAudioUrl(url0);
      setIsPlaying(true);
      // Pre-generate next items sequentially with a small delay
      if (chunks.length > 1) {
        setTimeout(() => generateAudioChunk(1), 500);
      }
    }
    setIsAudioLoading(false);
  };

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const winScroll = scrollTop;
      const height = scrollHeight - clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(scrolled);

      if (scrolled > 95 && !isCompleted && !resource.pages) {
        setIsCompleted(true);
        onComplete?.(resource);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleChunkEnded = async () => {
    const nextIndex = currentChunkIndex + 1;
    if (nextIndex < chunks.length) {
      let nextUrl = audioQueue.get(nextIndex);
      setActiveWordIndex(-1); // Reset highlight for new chunk
      
      if (!nextUrl) {
        setIsAudioLoading(true);
        nextUrl = await generateAudioChunk(nextIndex) || undefined;
        setIsAudioLoading(false);
      }

      if (nextUrl) {
        setCurrentChunkIndex(nextIndex);
        setAudioUrl(nextUrl);
        setIsPlaying(true);
        // Pre-generate the next one with a small delay to respect rate limits
        if (nextIndex + 1 < chunks.length) {
          setTimeout(() => generateAudioChunk(nextIndex + 1), 500);
        }
      }
    } else {
      setIsPlaying(false);
      setProgress(100);
      setActiveWordIndex(-1);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch(err => console.log("Autoplay blocked or failed:", err));
    }
  }, [audioUrl]);

  // Auto-start narrator for better UX as requested
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!audioUrl && !isAudioLoading && chunks.length > 0) {
        handleGenerateAudio();
      }
    }, 1000); // Small delay to ensure component is ready
    return () => clearTimeout(timer);
  }, [chunks]);

  const themes = {
    light: 'bg-[#FDFCFB] text-[#2D2D2D]',
    sepia: 'bg-[#F4ECD8] text-[#5B4636]',
    dark: 'bg-[#121212] text-[#E0E0E0]',
  };

  const isBook = resource.type === 'Book Summary' && resource.pages;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn("fixed inset-0 z-50 flex flex-col overflow-hidden", themes[theme])}
    >
      {/* Reading Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-text/5 z-50">
        <motion.div 
          className="h-full bg-brand"
          style={{ width: `${isBook ? ((currentPage + 1) / resource.pages!.length) * 100 : readingProgress}%` }}
        />
      </div>

      {/* Top Bar */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-border/50 backdrop-blur-2xl sticky top-0 z-10 bg-inherit/80">
        <button 
          onClick={onBack}
          className="p-3 hover:bg-brand/10 text-brand rounded-2xl transition-all active:scale-90"
        >
          <ArrowLeft size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-text/5 p-1 rounded-2xl">
            <button 
              onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
              className="p-2.5 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              <Type size={16} />
            </button>
            <button 
              onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
              className="p-2.5 hover:bg-white/50 dark:hover:bg-white/10 rounded-xl transition-all"
            >
              <Type size={20} />
            </button>
          </div>
          <div className="w-px h-8 bg-border/50 mx-1" />
          <div className="flex gap-2">
            <button 
              onClick={() => onThemeChange('light')}
              className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2", theme === 'light' ? "border-brand bg-brand/5" : "border-transparent bg-text/5")}
            >
              <Sun size={18} />
            </button>
            <button 
              onClick={() => onThemeChange('sepia')}
              className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2", theme === 'sepia' ? "border-[#5B4636]/40 bg-[#F4ECD8]" : "border-transparent bg-[#F4ECD8]/50")}
            >
              <div className="w-4 h-4 rounded-full bg-[#F4ECD8] border border-[#5B4636]/20" />
            </button>
            <button 
              onClick={() => onThemeChange('dark')}
              className={cn("w-10 h-10 rounded-xl transition-all flex items-center justify-center border-2", theme === 'dark' ? "border-brand bg-white/10" : "border-transparent bg-white/5")}
            >
              <Moon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main 
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-8 py-16 no-scrollbar"
      >
        <article 
          className={cn(
            "max-w-2xl mx-auto space-y-12 transition-all duration-500",
            resource.language === 'ar' && "text-right"
          )}
          dir={resource.language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="space-y-6 text-center mb-16">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">
              {resource.type} • {resource.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-black leading-[1.1] tracking-tight">
              {resource.title}
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand text-[10px] font-bold">
                {resource.author?.[0] || 'B'}
              </div>
              <p className="text-sm font-medium opacity-60">
                {resource.author || 'Barbaar Academy'}
              </p>
            </div>

            {playbackError && (
              <div className="mt-8 flex items-center justify-center gap-2 text-rose-500 text-xs font-bold bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 max-w-md mx-auto">
                <Settings2 size={16} className="animate-spin" />
                {playbackError}
              </div>
            )}
          </div>

          <div 
            className="leading-[2.2] font-serif"
            style={{ fontSize: `${fontSize}px` }}
          >
            {isBook ? (
              <div className="space-y-10">
                <div className="bg-card/30 p-10 md:p-16 rounded-[3rem] min-h-[500px] flex flex-col justify-center shadow-inner border border-border/50 backdrop-blur-sm relative overflow-hidden">
                  <p className="mb-6">
                    {isHighlightingEnabled && currentPage === currentChunkIndex && !isExternalAudio ? (
                      currentChunkWords.map((word, wIdx) => (
                        <span 
                          key={wIdx}
                          ref={activeWordIndex === wIdx ? activeWordRef : null}
                          className={cn(
                            "transition-colors duration-200 px-0.5 rounded",
                            activeWordIndex === wIdx 
                              ? "bg-brand text-brand-dark shadow-[0_0_30px_rgba(118,176,110,0.3)]" 
                              : "opacity-100"
                          )}
                        >
                          {word}{' '}
                        </span>
                      ))
                    ) : (
                      resource.pages![currentPage]
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-8 border-t border-border">
                  <button 
                    disabled={currentPage === 0}
                    onClick={() => {
                      setCurrentPage(prev => prev - 1);
                      setAudioUrl(null);
                      setIsPlaying(false);
                      setActiveWordIndex(-1);
                    }}
                    className="px-6 py-3 bg-card border border-border rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-20 text-text/60"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold opacity-40">Page {currentPage + 1} of {resource.pages!.length}</span>
                  <button 
                    disabled={currentPage === resource.pages!.length - 1}
                    onClick={() => {
                      const next = currentPage + 1;
                      setCurrentPage(next);
                      setAudioUrl(null);
                      setIsPlaying(false);
                      setActiveWordIndex(-1);
                      if (next === resource.pages!.length - 1 && !isCompleted) {
                        setIsCompleted(true);
                        onComplete?.(resource);
                      }
                    }}
                    className="px-6 py-3 bg-brand text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-20"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                {chunks.map((para, i) => {
                  // Focus Logic: Hide non-active chunks if highlights are on to keep focus simple
                  const isFocused = i === currentChunkIndex;
                  const isNear = Math.abs(i - currentChunkIndex) <= 1;
                  
                  if (isHighlightingEnabled && !isFocused && !isNear && isPlaying) return null;

                  return (
                    <motion.p 
                      key={i}
                      initial={false}
                      animate={{ 
                        opacity: isHighlightingEnabled && isPlaying ? (isFocused ? 1 : 0.2) : 1,
                        scale: isHighlightingEnabled && isPlaying && isFocused ? 1 : 0.98,
                        filter: isHighlightingEnabled && isPlaying && !isFocused ? 'blur(2px)' : 'blur(0px)'
                      }}
                      className="transition-all duration-500"
                    >
                      {isHighlightingEnabled && i === currentChunkIndex && !isExternalAudio ? (
                        currentChunkWords.map((word, wIdx) => (
                          <span 
                            key={wIdx}
                            ref={activeWordIndex === wIdx ? activeWordRef : null}
                            className={cn(
                              "transition-colors duration-200 px-1 rounded animate-in fade-in zoom-in-95 duration-300",
                              activeWordIndex === wIdx 
                                ? "bg-brand text-brand-dark shadow-[0_0_30px_rgba(118,176,110,0.3)]" 
                                : "text-text/80"
                            )}
                          >
                            {word}{' '}
                          </span>
                        ))
                      ) : (
                        para
                      )}
                    </motion.p>
                  );
                })}
              </div>
            )}
          </div>
        </article>
      </main>

      {/* Audio Player Bar */}
      <footer className="px-4 md:px-6 py-4 md:py-6 border-t border-border bg-inherit backdrop-blur-xl">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono opacity-60 w-8">{formatTime((progress / 100) * duration)}</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 bg-text/10 rounded-full appearance-none cursor-pointer accent-brand"
            />
            <span className="text-[10px] font-mono opacity-60 w-8">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-widest mb-1 truncate">{resource.title}</h4>
              <p className="text-[10px] opacity-60 uppercase tracking-widest truncate">
                {isExternalAudio ? 'Original Audio' : 'AI Narrator'} • {resource.language === 'so' ? 'Somali' : resource.language === 'ar' ? 'Arabic' : 'English'}
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-6">
              <button className="p-2 opacity-40 hover:opacity-100 transition-opacity hidden sm:block">
                <SkipBack size={20} />
              </button>
              
              <button 
                onClick={handleGenerateAudio}
                disabled={isAudioLoading}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-brand text-brand-dark flex items-center justify-center shadow-lg shadow-brand/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isAudioLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" className="ml-1" />
                )}
              </button>

              <button className="p-2 opacity-40 hover:opacity-100 transition-opacity hidden sm:block">
                <SkipForward size={20} />
              </button>
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <button 
                onClick={() => setIsHighlightingEnabled(!isHighlightingEnabled)}
                className={cn(
                  "p-2 transition-all rounded-xl border flex items-center justify-center gap-2",
                  isHighlightingEnabled ? "bg-brand/10 border-brand/20 text-brand" : "opacity-40 border-transparent"
                )}
                title="Line Highlighting"
              >
                <BookOpen size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Highlights</span>
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 opacity-60 hover:opacity-100 transition-opacity"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button className="p-2 opacity-60 hover:opacity-100 transition-opacity hidden sm:block">
                <Settings2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            if (isExternalAudio) {
              setIsPlaying(false);
            } else {
              handleChunkEnded();
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            const error = (e.target as HTMLAudioElement).error;
            console.error("Audio playback error:", error);
            setIsPlaying(false);
            setIsAudioLoading(false);
            let message = "Playback failed - The audio source could not be loaded.";
            if (error?.code === 4) message = "The audio format is not supported or the source is unavailable.";
            setPlaybackError(message);
          }}
        />
      )}
    </motion.div>
  );
};
