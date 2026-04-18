import React, { useState } from 'react';
import { Bell, Sun, Moon, Coffee } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeType, AppNotification, ViewType } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  theme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  activeView: ViewType;
  onViewChange: (view: ViewType, params?: any) => void;
}

export const Header = ({ 
  theme, 
  onThemeChange, 
  notifications, 
  onMarkRead, 
  onClearAll,
  activeView,
  onViewChange
}: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getSubtitle = () => {
    switch(activeView) {
      case 'home': return 'Self-Growth';
      case 'journal': return 'Reflection';
      case 'resources': return 'Library';
      case 'nasasho': return 'Nasasho';
      case 'profile': return 'Community';
      case 'therapy': return 'Support';
      default: return 'Wellness';
    }
  };

  const getKeyword = () => {
    switch(activeView) {
      case 'home': return 'Home';
      case 'journal': return 'Journaling';
      case 'resources': return 'Growth';
      case 'nasasho': return 'Relaxation';
      case 'profile': return 'Settings';
      case 'therapy': return 'Consultation';
      default: return 'Explore';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-3xl border-b border-border/40 px-6 py-6 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Logo Section */}
        <div className="flex items-center gap-4 shrink-0 group cursor-pointer" onClick={() => onViewChange('home')}>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <Logo size={24} />
            </div>
            <div className="flex items-center gap-2 mt-1.5 opacity-40">
              <span className="text-[9px] font-black text-text uppercase tracking-widest">{getSubtitle()}</span>
              <span className="w-px h-2.5 bg-text/20" />
              <span className="text-[9px] font-black text-text uppercase tracking-widest">{getKeyword()}</span>
            </div>
          </div>
        </div>
        
        {/* Actions Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center bg-card/40 p-1 rounded-xl border border-border/40">
            <button 
              onClick={() => onThemeChange('light')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                theme === 'light' ? "bg-brand text-brand-dark shadow-sm" : "text-text/40 hover:text-text"
              )}
            >
              <Sun size={14} />
            </button>
            <button 
              onClick={() => onThemeChange('sepia')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                theme === 'sepia' ? "bg-brand-dark text-bg shadow-sm" : "text-text/40 hover:text-text"
              )}
            >
              <Coffee size={14} />
            </button>
            <button 
              onClick={() => onThemeChange('dark')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                theme === 'dark' ? "bg-brand text-brand-dark shadow-sm" : "text-text/40 hover:text-text"
              )}
            >
              <Moon size={14} />
            </button>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl bg-card/40 border border-border/40 relative transition-all",
                showNotifications ? "text-brand border-brand/20 shadow-lg" : "text-text/60 hover:text-text"
              )}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full border-2 border-card"></span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-[55] bg-transparent" 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 bg-card border border-border rounded-3xl shadow-2xl z-[60] overflow-hidden"
                  >
                    <div className="p-4 border-b border-border flex items-center justify-between bg-bg/30">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-text/60">Notifications</h4>
                      <button 
                        onClick={onClearAll}
                        className="text-[8px] font-black uppercase tracking-widest text-brand hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n, idx) => (
                          <div 
                            key={`${n.id}-${idx}`} 
                            onClick={() => {
                              onMarkRead(n.id);
                            }}
                            className={cn(
                              "p-4 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-bg/30",
                              !n.read && "bg-brand/[0.03]"
                            )}
                          >
                            <div className="flex gap-3">
                              <span className="text-lg">{n.icon || '🔔'}</span>
                              <div>
                                <p className="text-xs font-black text-text mb-0.5">{n.title}</p>
                                <p className="text-[10px] text-text/60 leading-tight">{n.content}</p>
                                <p className="text-[8px] text-text/20 font-bold uppercase mt-1">
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-[10px] font-bold text-text/20 uppercase tracking-widest">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
