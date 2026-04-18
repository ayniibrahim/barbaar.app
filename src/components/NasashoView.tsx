import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Heart, 
  ChevronLeft, 
  Search, 
  Music,
  CloudRain,
  Moon,
  Sun,
  ArrowLeft,
  Target,
  Headphones,
  Maximize2,
  Users,
  X,
  AlertCircle
} from 'lucide-react';
import { NasashoContent, NasashoCategory } from '../types';
import { cn } from '../lib/utils';
import { db, collection, getDocs, query, where } from '../firebase';

interface NasashoViewProps {
  onBack: () => void;
}

export const NasashoView = ({ onBack }: NasashoViewProps) => {
  const [activeCategory, setActiveCategory] = useState<NasashoCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTrack, setCurrentTrack] = useState<NasashoContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [nasashoContent, setNasashoContent] = useState<NasashoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [currentTrack, playbackSpeed]);

  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = (e: any) => {
      setScrolled(e.target.scrollTop > 20);
    };
    // The scroll container is the parent motion.div in App.tsx
    // But here we are inside the view. We can listen to the window or the parent.
    // Since we implemented per-page scroll in App.tsx, we should listen to the scrollable div.
    const scrollContainer = document.querySelector('.custom-scrollbar');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSeek = (amount: number) => {
    if (audioRef.current && !currentTrack?.embedUrl) {
      audioRef.current.currentTime += amount;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setPlaybackError(null);
    if (audioRef.current && !currentTrack?.embedUrl) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const fetchNasasho = async () => {
      try {
        const q = query(
          collection(db, 'nasasho'), 
          where('published', '==', true)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NasashoContent));
        setNasashoContent(fetched);
      } catch (err) {
        console.error('Error fetching nasasho:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNasasho();
  }, []);

  const [resolvedUrl, setResolvedUrl] = useState<string>('');

  const getDirectAudioUrl = (url: string) => {
    if (!url) return '';
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([^\/]+)/)?.[1] || url.match(/id=([^\&]+)/)?.[1];
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return url;
  };

  useEffect(() => {
    let isMounted = true;
    const resolveUrl = async () => {
      if (!currentTrack) {
        setResolvedUrl('');
        return;
      }

      const url = currentTrack.embedUrl || currentTrack.audioUrl || '';
      if (!url) {
        setResolvedUrl('');
        return;
      }

      // Handle Archive.org
      if (url.includes('archive.org/details/') || url.includes('archive.org/embed/')) {
        try {
          // Extract ID correctly
          const parts = url.split('/');
          const idIndex = parts.findIndex(p => p === 'details' || p === 'embed') + 1;
          const id = parts[idIndex]?.split('?')[0];
          
          if (!id) {
            if (isMounted) setResolvedUrl(url);
            return;
          }

          // Try to fetch metadata to find the first MP3
          const response = await fetch(`https://archive.org/metadata/${id}`);
          const data = await response.json();
          // Find the first file that is an MP3
          const mp3File = data.files?.find((f: any) => 
            f.name?.toLowerCase().endsWith('.mp3') && 
            (f.format?.toLowerCase().includes('mp3') || f.source === 'original')
          );
          
          if (mp3File && isMounted) {
            // Use encodeURIComponent for the filename to handle spaces/special chars
            const fileName = encodeURIComponent(mp3File.name).replace(/%20/g, '+');
            setResolvedUrl(`https://archive.org/download/${id}/${fileName}`);
            return;
          }
          
          // Fallback to simple guess
          if (isMounted) {
            setResolvedUrl(`https://archive.org/download/${id}/${id}.mp3`);
          }
        } catch (err) {
          console.warn("Failed to resolve Archive.org metadata", err);
          if (isMounted) setResolvedUrl(url);
        }
      } else {
        setResolvedUrl(getDirectAudioUrl(url));
      }
    };

    resolveUrl();
    return () => { isMounted = false; };
  }, [currentTrack]);

  useEffect(() => {
    let isMounted = true;
    if (audioRef.current && currentTrack && resolvedUrl) {
      const isYoutube = currentTrack.embedUrl?.includes('youtube.com');
      if (!isYoutube) {
        if (audioRef.current.src !== resolvedUrl) {
          audioRef.current.src = resolvedUrl;
          audioRef.current.load();
        }

        if (isPlaying) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              if (isMounted) {
                console.error("Playback failed", e.message || e);
                setPlaybackError("Failed to load audio source. The URL might be invalid or restricted.");
                setIsPlaying(false);
              }
            });
          }
        } else {
          audioRef.current.pause();
        }
      }
    }
    return () => { isMounted = false; };
  }, [isPlaying, currentTrack?.id, resolvedUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      if (!isNaN(total) && total > 0) {
        setProgress((current / total) * 100);
        setDuration(total);
      }
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // Handle Archive.org links
    if (url.includes('archive.org/details/') || url.includes('archive.org/embed/')) {
      const id = url.split('/').pop()?.split('?')[0];
      return `https://archive.org/embed/${id}`;
    }
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      // Convert /view or /edit to /preview
      let sanitized = url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
      if (!sanitized.endsWith('/preview')) {
        sanitized = sanitized.split('?')[0].replace(/\/$/, '') + '/preview';
      }
      return sanitized;
    }
    // Handle YouTube links
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const handleTrackSelect = (track: NasashoContent) => {
    setPlaybackError(null);
    
    // Check if it's an Archive.org link that we want to treat as direct audio
    const isArchive = track.embedUrl?.includes('archive.org');
    
    if (currentTrack?.id === track.id) {
      if (!track.embedUrl || isArchive) {
        setIsPlaying(!isPlaying);
      } else {
        setIsFullScreen(true);
      }
    } else {
      // Stop current audio if any
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      
      // Only go full screen for non-archive embeds (like YouTube)
      if (track.embedUrl && !isArchive) {
        setIsFullScreen(true);
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const filteredContent = nasashoContent.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories: { id: NasashoCategory | 'All', label: string, icon: React.ReactNode }[] = [
    { id: 'All', label: 'All', icon: <Music size={14} /> },
    { id: 'Podcast', label: 'Podcast', icon: <Headphones size={14} /> },
    { id: 'Quran', label: 'Quran', icon: <Sun size={14} /> },
    { id: 'Nature', label: 'Nature', icon: <CloudRain size={14} /> },
    { id: 'Sleep', label: 'Sleep', icon: <Moon size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-bg text-text pb-32 relative">
      <main className="p-6 space-y-12">
        {/* Search & Categories - Subtly Integrated */}
        <section className="space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20 group-focus-within:text-brand transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search for calm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/40 border border-border/50 rounded-2xl pl-12 pr-4 py-4 text-xs font-medium focus:ring-4 ring-brand/5 transition-all outline-none placeholder:text-text/20 shadow-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-6 px-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                  activeCategory === cat.id 
                    ? "bg-text text-bg border-text shadow-xl shadow-text/10" 
                    : "bg-card/40 text-text/40 border-border/50 hover:bg-bg"
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest">Loading Nasasho...</p>
          </div>
        ) : (
          <>
            {/* Stories Section (Featured) */}
            {activeCategory === 'All' && !searchQuery && nasashoContent.length > 0 && (
              <section>
                <h3 className="text-[11px] font-black text-text/40 uppercase tracking-[0.2em] mb-6">Stories</h3>
                <div className="grid grid-cols-1 gap-4">
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTrackSelect(nasashoContent[0])}
                    className="relative h-72 rounded-[3.5rem] overflow-hidden group cursor-pointer border border-border/50 shadow-sm"
                  >
                    {nasashoContent[0].image ? (
                      <img 
                        src={nasashoContent[0].image} 
                        alt={nasashoContent[0].title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
                        <Music size={48} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Glassy Header Overlay */}
                    <div className="absolute bottom-10 left-10 p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 min-w-[200px]">
                      <h4 className="text-3xl font-serif font-black text-white mb-1 tracking-tight">Stories</h4>
                      <p className="text-sm text-white/80 font-medium">{nasashoContent[0].reciter || 'Selected Works'}</p>
                    </div>

                    <div className="absolute top-10 right-10 w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-3xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                      <Play size={28} fill="currentColor" />
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* Content Grid */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black text-text/40 uppercase tracking-[0.2em]">
                  {activeCategory === 'All' ? 'Discover' : activeCategory}
                </h3>
                <span className="text-[10px] font-bold text-text/20 tracking-widest">{filteredContent.length} items</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {filteredContent
                  .filter(item => item.id !== nasashoContent[0]?.id || activeCategory !== 'All' || searchQuery)
                  .map((item) => (
                  <motion.div
                    key={`nasasho-${item.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTrackSelect(item)}
                    className="flex flex-col cursor-pointer group transition-all duration-300"
                  >
                    <div className="relative aspect-square rounded-[2.5rem] overflow-hidden mb-5 border border-border/40 shadow-sm group-hover:shadow-xl group-hover:border-brand/20 transition-all duration-500">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
                          <Music size={24} />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.5rem] border border-white/20 flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-all duration-500 mr-1 shadow-2xl">
                          {currentTrack?.id === item.id && isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">{item.duration}</span>
                      </div>
                    </div>
                    
                    <div className="px-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">{item.category}</span>
                        <span className="w-1 h-1 rounded-full bg-text/10" />
                        <span className="text-[9px] font-bold text-text/30 uppercase tracking-widest truncate max-w-[80px]">{(item.reciter || 'Archive').toUpperCase()}</span>
                      </div>
                      <h4 className="text-[15px] font-black text-text leading-snug group-hover:text-brand transition-colors line-clamp-2 tracking-tight">
                        {item.title}
                      </h4>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Audio Player Overlay */}
      <AnimatePresence>
        {currentTrack && !isFullScreen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="bg-brand-dark text-white p-5 shadow-2xl border border-white/10 relative overflow-hidden rounded-[2.5rem]">
              <div className="flex items-center gap-5 relative z-10">
                  <motion.div 
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-brand/30 p-1"
                  >
                    {currentTrack.image ? (
                      <img src={currentTrack.image} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-brand/10 flex items-center justify-center text-brand rounded-full">
                        <Music size={20} />
                      </div>
                    )}
                  </motion.div>
                
                <div className="flex-1 min-w-0" onClick={() => setIsFullScreen(true)}>
                  <h4 className="text-sm font-black truncate leading-tight">{currentTrack.title}</h4>
                  <p className="text-[9px] text-brand font-black uppercase tracking-[0.2em] mt-1">
                    {currentTrack.reciter || currentTrack.category}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isBuffering && (!currentTrack.embedUrl || currentTrack.embedUrl.includes('archive.org')) && (
                    <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin mr-2" />
                  )}
                  {(!currentTrack.embedUrl || currentTrack.embedUrl.includes('archive.org')) && (
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 bg-brand text-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-all"
                    >
                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsFullScreen(true)}
                    className="w-10 h-10 bg-white/5 text-white/60 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <Maximize2 size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentTrack(null);
                      setIsPlaying(false);
                      handleStop();
                    }}
                    className="w-10 h-10 bg-white/5 text-white/40 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {playbackError && (
                <div className="mt-3 flex items-center gap-2 text-rose-400 text-[10px] font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  <AlertCircle size={14} />
                  {playbackError}
                </div>
              )}

              {!currentTrack.embedUrl || currentTrack.embedUrl.includes('archive.org') ? (
                <div className="mt-4 space-y-1">
                  <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Player / Embed Player */}
      <AnimatePresence>
        {isFullScreen && currentTrack && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] bg-bg flex flex-col"
          >
            <header className="relative z-10 p-6 flex items-center justify-between border-b border-border">
              <button 
                onClick={() => setIsFullScreen(false)}
                className="w-12 h-12 bg-card border border-border rounded-2xl flex items-center justify-center text-text/60 hover:text-brand transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="text-center">
                <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em]">Now Playing</p>
                <p className="text-xs font-bold text-text/40 mt-1">{currentTrack.category}</p>
              </div>
              <button 
                onClick={() => {
                  setIsFullScreen(false);
                  setCurrentTrack(null);
                  setIsPlaying(false);
                  handleStop();
                }}
                className="w-12 h-12 bg-card border border-border rounded-2xl flex items-center justify-center text-text/60 hover:text-rose-500 transition-colors"
              >
                <X size={24} />
              </button>
            </header>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-8">
              {currentTrack.embedUrl && !currentTrack.embedUrl.includes('archive.org') ? (
                <div className={cn(
                  "w-full max-w-4xl rounded-[2rem] overflow-hidden border border-border shadow-2xl bg-black transition-all aspect-video"
                )}>
                  <iframe 
                    src={getEmbedUrl(currentTrack.embedUrl)} 
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    title={currentTrack.title}
                  />
                </div>
              ) : (
                <div className="w-full max-w-md flex flex-col items-center">
                  <motion.div 
                    layoutId={`track-image-${currentTrack.id}`}
                    className="w-full aspect-square rounded-[3rem] overflow-hidden shadow-2xl border border-border mb-12"
                  >
                    {currentTrack.image ? (
                      <img src={currentTrack.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
                        <Music size={120} />
                      </div>
                    )}
                  </motion.div>

                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-black mb-2 tracking-tight text-text">{currentTrack.title}</h3>
                    <p className="text-lg text-brand font-bold">{currentTrack.reciter || currentTrack.category}</p>
                    <p className="text-sm text-text/40 mt-4 max-w-xs mx-auto leading-relaxed">{currentTrack.description}</p>
                    
                    {playbackError && (
                      <div className="mt-6 flex items-center justify-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                        <AlertCircle size={16} />
                        {playbackError}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="w-full space-y-8">
                    <div className="space-y-3">
                      <div className="relative h-2 bg-border rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-brand"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono font-bold text-text/30">
                        <span>{formatTime(currentTime)}</span>
                        <span>{currentTrack.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-around">
                      <button 
                        onClick={handleSpeedChange}
                        className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center text-[10px] font-black text-brand uppercase tracking-widest hover:bg-brand/10 transition-all"
                        title="Playback Speed"
                      >
                        {playbackSpeed}x
                      </button>
                      <button onClick={() => handleSeek(-10)} className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center text-text/60 hover:text-brand transition-all active:scale-90">
                        <SkipBack size={24} />
                      </button>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-20 h-20 bg-brand text-brand-dark rounded-3xl flex items-center justify-center shadow-2xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1.5" />}
                      </button>
                      <button onClick={() => handleSeek(10)} className="w-14 h-14 bg-card border border-border rounded-2xl flex items-center justify-center text-text/60 hover:text-brand transition-all active:scale-90">
                        <SkipForward size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <footer className="relative z-10 p-12 flex justify-center">
              <div className="flex items-center gap-8 text-text/10">
                <Volume2 size={20} />
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: currentTrack.title,
                        text: `Listening to ${currentTrack.title} in Barbaar App`,
                        url: window.location.href
                      }).catch(() => {});
                    }
                  }}
                  className="text-text/40 hover:text-brand transition-colors"
                >
                  <Users size={20} />
                </button>
                <Heart size={20} />
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <audio 
        ref={audioRef}
        {...({ referrerPolicy: 'no-referrer' } as any)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onError={(e) => {
          const error = (e.target as HTMLAudioElement).error;
          console.error("Nasasho Audio Error:", error);
          setIsPlaying(false);
          let message = "Failed to load audio. Please check if the source URL is valid.";
          if (error?.code === 4) message = "The audio format is not supported or the source is unavailable (404/403).";
          setPlaybackError(message);
        }}
        className="hidden"
      />
    </div>
  );
};
