import React, { useState, useEffect } from 'react';
import { Home, PenTool, User, Library, Moon, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ViewType } from '../types';

interface BottomNavProps {
  activeView: ViewType;
  onViewChange: (view: ViewType, params?: any) => void;
}

export const BottomNav = ({ activeView, onViewChange }: BottomNavProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const currentScrollY = target.scrollTop;
      
      // Only hide if scrolled down more than 50px and moving down
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        // Show if moving up or near the top
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    const scrollContainer = document.querySelector('.custom-scrollbar');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [lastScrollY]);

  const navItems: { id: ViewType; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'journal', label: 'Insight', icon: PenTool },
    { id: 'resources', label: 'Library', icon: Library },
    { id: 'nasasho', label: 'Nasasho', icon: Moon },
    { id: 'profile', label: 'User', icon: User },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-8 left-0 right-0 z-[60] px-6 flex justify-center pointer-events-none"
        >
          <nav className="bg-bg/60 backdrop-blur-2xl border border-border/40 rounded-[2rem] p-1.5 flex items-center gap-1 shadow-2xl shadow-black/10 pointer-events-auto">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-500 group",
                  activeView === item.id 
                    ? "bg-brand text-brand-dark shadow-lg shadow-brand/20" 
                    : "text-text/40 hover:text-brand hover:bg-brand/5"
                )}
              >
                <item.icon size={18} strokeWidth={activeView === item.id ? 3 : 2.5} />
                {activeView === item.id && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
