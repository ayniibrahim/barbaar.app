import React, { useState } from 'react';
import { X, Clock, AlertCircle, Calendar, Bell, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { Priority } from '../types';
import { cn } from '../lib/utils';

interface AddTaskModalProps {
  onClose: () => void;
  onAdd: (title: string, time: string, priority: Priority, dueDate: string) => void;
}

export const AddTaskModal = ({ onClose, onAdd }: AddTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [reminder, setReminder] = useState(true);
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    // Round to next 30 mins
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const date = new Date(dateTime);
    const formattedTime = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    onAdd(title, formattedTime, priority, date.toISOString());
    onClose();
  };

  const priorities: { type: Priority; icon: any; color: string }[] = [
    { type: 'low', icon: <Clock size={14} />, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { type: 'medium', icon: <Target size={14} />, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    { type: 'high', icon: <Zap size={14} />, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' }
  ];

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-2xl z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        className="bg-card w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl border-t border-border sm:border relative overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-brand" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-text/5 flex items-center justify-center text-text/40 hover:text-rose-500 transition-all z-10"
        >
          <X size={24} />
        </button>

        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-text tracking-tight">Set New Focus</h3>
            <p className="text-[10px] font-black text-text/30 uppercase tracking-[0.2em] mt-1">Define your next milestone</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 overflow-y-auto pb-4 custom-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40 ml-1">Focus Goal</label>
            <div className="relative group">
              <input 
                autoFocus
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Deep Work Session"
                className="w-full bg-text/5 border-2 border-transparent rounded-2xl px-6 py-5 outline-none focus:border-brand focus:bg-transparent transition-all text-lg font-black text-text placeholder:text-text/20"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand/20 group-focus-within:text-brand transition-colors">
                <Target size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40 ml-1">Priority Level</label>
            <div className="grid grid-cols-3 gap-3">
              {priorities.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => setPriority(p.type)}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all",
                    priority === p.type 
                      ? "bg-brand text-brand-dark border-brand shadow-lg shadow-brand/20 scale-105" 
                      : "bg-text/5 text-text/40 border-border hover:bg-text/10"
                  )}
                >
                  {p.icon}
                  {p.type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40 ml-1">Schedule</label>
              <div className="flex items-center gap-3 bg-text/5 p-4 rounded-2xl border border-border focus-within:border-brand/50 focus-within:bg-transparent transition-all">
                <Calendar size={18} className="text-brand shrink-0" />
                <input 
                  type="datetime-local" 
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="bg-transparent outline-none text-xs font-black text-text w-full [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text/40 ml-1">Reminders</label>
              <button
                type="button"
                onClick={() => setReminder(!reminder)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all",
                  reminder ? "bg-brand/10 border-brand/30 text-brand" : "bg-text/5 border-border text-text/40"
                )}
              >
                <div className="flex items-center gap-2">
                  <Bell size={18} className={reminder ? "animate-bounce" : ""} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{reminder ? 'Active' : 'Muted'}</span>
                </div>
                <div className={cn(
                  "w-8 h-4 rounded-full relative transition-colors",
                  reminder ? "bg-brand" : "bg-text/20"
                )}>
                  <div className={cn(
                    "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                    reminder ? "right-1" : "left-1"
                  )} />
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest text-text/40 hover:bg-text/5 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!title.trim()}
              className="flex-[2] bg-brand text-brand-dark font-black py-4 rounded-2xl shadow-lg shadow-brand/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <Zap size={16} fill="currentColor" />
              Commit Focus
            </button>
          </div>
          <p className="text-[9px] text-center text-text/30 font-bold uppercase tracking-widest mt-6 shrink-0">
            Focusing on one thing at a time is your superpower
          </p>
        </form>
      </motion.div>
    </div>
  );
};
