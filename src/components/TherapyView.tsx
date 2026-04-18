import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, MessageSquare, Users, Heart, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { Message, Booking, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { TherapistBooking } from './TherapistBooking';
import { BarbaarChat } from './BarbaarChat';

interface TherapyViewProps {
  user: UserProfile;
  onBack: () => void;
  onBookTherapist: (booking: Booking) => void;
  initialTab?: 'booking' | 'chat';
}

export const TherapyView = ({ user, onBack, onBookTherapist, initialTab }: TherapyViewProps) => {
  const [activeTab, setActiveTab] = useState<'booking' | 'chat'>(initialTab || 'booking');

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col max-w-md mx-auto">
      <header className="bg-card/80 backdrop-blur-xl border-b border-border shrink-0">
        <div className="flex items-center gap-4 px-6 py-4">
          <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors text-text">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-lg font-black tracking-tight text-text">Therapy Center</h2>
            <p className="text-[10px] text-text/40 font-black uppercase tracking-widest">Professional Online Therapy</p>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="flex gap-2 bg-bg p-1 rounded-2xl border border-border">
            <button
              onClick={() => setActiveTab('booking')}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                activeTab === 'booking' ? "bg-card text-text shadow-sm" : "text-text/30"
              )}
            >
              <Heart size={14} />
              Book Session
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                activeTab === 'chat' ? "bg-card text-text shadow-sm" : "text-text/30"
              )}
            >
              <Shield size={14} />
              Barbaar Chat
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'booking' ? (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1"
            >
              <TherapistBooking onBook={onBookTherapist} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <BarbaarChat user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
