import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, ChevronRight, PenLine, X, Sparkles, ChevronLeft, BarChart2, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JournalEntry, Mood, MoodLog } from '../types';
import { cn } from '../lib/utils';
import { MoodTracker } from './MoodTracker';
import { MoodInsights } from './MoodInsights';

interface JournalViewProps {
  entries: JournalEntry[];
  moodLogs: MoodLog[];
  onAddEntry: (content: string, mood?: Mood) => Promise<string>;
  onUpdateEntry: (id: string, content: string, mood?: Mood) => void;
  onBack?: () => void;
  onWritingModeChange?: (isWriting: boolean) => void;
}

const moodEmojis: Record<Mood, string> = {
  'very-sad': '😔',
  'sad': '😕',
  'neutral': '😐',
  'happy': '🙂',
  'very-happy': '✨',
};

export const JournalView = ({ entries, moodLogs, onAddEntry, onUpdateEntry, onBack, onWritingModeChange }: JournalViewProps) => {
  const [isWriting, setIsWriting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Autosave logic
  useEffect(() => {
    if (onWritingModeChange) {
      onWritingModeChange(isWriting);
    }
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isWriting) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus('saving');
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 1000); // 1s debounce for stability

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [content, selectedMood]);

  const handleAutoSave = async () => {
    if (!content.trim()) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    if (editingEntry && editingEntry.id !== 'temp-id') {
      onUpdateEntry(editingEntry.id, content, selectedMood);
    } else {
      const newId = await onAddEntry(content, selectedMood);
      if (newId) {
        setEditingEntry({ 
          id: newId, 
          content, 
          mood: selectedMood, 
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
        });
      } else {
        // Fallback for tracking session even if ID isn't back yet
        setEditingEntry({ id: 'temp-id', content, mood: selectedMood, date: new Date().toLocaleDateString() });
      }
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const resetForm = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (isWriting && content.trim()) {
      await handleAutoSave(); // Final save
    }

    setContent('');
    setSelectedMood(undefined);
    setIsWriting(false);
    setEditingEntry(null);
    setSaveStatus('idle');
    isFirstRender.current = true;
  };

  const handleEdit = (entry: JournalEntry) => {
    isFirstRender.current = true; // Prevent autosave on initial load
    setEditingEntry(entry);
    setContent(entry.content);
    setSelectedMood(entry.mood);
    setIsWriting(true);
  };

  return (
    <div className="min-h-screen bg-bg pb-32">
      <div className="max-w-md mx-auto px-6">
        <header className="pt-12 pb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-text">Journal</h2>
              <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em]">Reflections</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInsights(!showInsights)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all border",
                showInsights 
                  ? "bg-brand/10 border-brand/20 text-brand" 
                  : "bg-card border-border text-text/20 hover:text-text/40"
              )}
            >
              <BarChart2 size={18} />
            </button>
            <button 
              onClick={() => {
                resetForm();
                setIsWriting(true);
              }}
              className="w-10 h-10 bg-brand text-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-all"
            >
              <Plus size={20} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {showInsights ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <MoodInsights logs={moodLogs} />
            </motion.div>
          ) : (
            <motion.div
              key="entries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {entries.length === 0 ? (
                <div className="text-center py-32">
                  <div className="w-12 h-12 bg-text/[0.02] rounded-full flex items-center justify-center mx-auto mb-4">
                    <PenLine className="text-text/10" size={20} />
                  </div>
                  <p className="text-[10px] font-black text-text/10 uppercase tracking-[0.2em]">Empty Canvas</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleEdit(entry)}
                    className="bg-card rounded-3xl p-6 shadow-sm border border-border active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-black text-text/40 uppercase tracking-widest">
                        {entry.date}
                      </span>
                      {entry.mood && (
                        <span className="text-base opacity-60">{moodEmojis[entry.mood]}</span>
                      )}
                    </div>
                    <p className="text-text/70 text-sm leading-relaxed font-medium line-clamp-2">
                      {entry.content}
                    </p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isWriting && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-bg z-[200] flex flex-col"
          >
            <header className="flex items-center justify-between px-6 pt-12 pb-6">
              <button 
                onClick={resetForm} 
                className="p-2 text-text/20 hover:text-rose-500 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-text/10 uppercase tracking-[0.2em]">
                  {editingEntry ? editingEntry.date : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-brand uppercase tracking-widest">
                    {content.trim() ? content.trim().split(/\s+/).filter(w => w.length > 0).length : 0} Words
                  </span>
                  <div className="h-4 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {saveStatus === 'saving' && (
                        <motion.div 
                          key="saving"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-[8px] font-black text-text/20 uppercase tracking-widest"
                        >
                          <Loader2 size={8} className="animate-spin" />
                          Syncing
                        </motion.div>
                      )}
                      {saveStatus === 'saved' && (
                        <motion.div 
                          key="saved"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500/30 uppercase tracking-widest"
                        >
                          <Check size={8} />
                          Saved
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="w-10" />
            </header>
            
            <div className="px-10 mb-8">
              <MoodTracker 
                selectedMood={selectedMood} 
                onSelectMood={setSelectedMood} 
              />
            </div>

            <div className="flex-1 px-10 pb-10">
              <textarea 
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing..."
                className="w-full h-full text-base outline-none resize-none leading-relaxed text-text font-medium placeholder:text-text/5 bg-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
