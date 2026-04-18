import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, MessageSquare, User, Shield, X, Clock, AlertCircle } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  limit
} from 'firebase/firestore';
import { ChatRoom, ChatMessage, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface BarbaarChatProps {
  user: UserProfile;
}

export const BarbaarChat = ({ user }: BarbaarChatProps) => {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user.id) return;

    // Listen for user's active or waiting room
    const roomsQuery = query(
      collection(db, 'chat_rooms'),
      where('user_id', '==', user.id),
      where('status', 'in', ['waiting', 'active']),
      limit(1)
    );

    const unsubRoom = onSnapshot(roomsQuery, (snapshot) => {
      if (!snapshot.empty) {
        setRoom({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ChatRoom);
      } else {
        setRoom(null);
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_rooms');
      setIsLoading(false);
    });

    // Listen for total waiting count to show queue position
    const waitingQuery = query(
      collection(db, 'chat_rooms'),
      where('status', '==', 'waiting'),
      orderBy('created_at', 'asc')
    );

    const unsubWaiting = onSnapshot(waitingQuery, (snapshot) => {
      const waitingRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      setWaitingCount(waitingRooms.length);
      
      // If user is waiting, find their position
      if (room?.status === 'waiting') {
        const position = waitingRooms.findIndex(r => r.id === room.id) + 1;
        // You could use this position in the UI
      }
    });

    return () => {
      unsubRoom();
      unsubWaiting();
    };
  }, [user.id, room?.id, room?.status]);

  useEffect(() => {
    if (!room?.id) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('room_id', '==', room.id),
      orderBy('created_at', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });

    return () => unsubMessages();
  }, [room?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartChat = async () => {
    try {
      setIsSending(true);
      await addDoc(collection(db, 'chat_rooms'), {
        user_id: user.id,
        user_name: user.name,
        status: 'waiting',
        created_at: serverTimestamp(),
        last_message_at: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_rooms');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !room || isSending) return;

    try {
      setIsSending(true);
      const text = inputText.trim();
      setInputText('');

      await addDoc(collection(db, 'chat_messages'), {
        room_id: room.id,
        sender_id: user.id,
        sender_name: user.name,
        sender_type: 'user',
        text,
        created_at: serverTimestamp()
      });

      await updateDoc(doc(db, 'chat_rooms', room.id), {
        last_message_at: serverTimestamp()
      });

      scrollToBottom();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="text-brand" size={40} />
        </div>
        <h3 className="text-xl font-black text-text mb-2">Barbaar Free Chat</h3>
        <p className="text-sm text-text/40 leading-relaxed mb-8">
          Need guidance or support? Chat with our team 24/7. 
          We're here to help you on your growth journey.
        </p>
        <button
          onClick={handleStartChat}
          disabled={isSending}
          className="w-full py-4 bg-brand text-brand-dark rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSending ? <Loader2 className="animate-spin" size={20} /> : "Start Chatting"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border bg-card/30 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
            <Shield className="text-brand" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-text">Barbaar Support</h4>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                room.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )} />
              <span className="text-[9px] font-black text-text/40 uppercase tracking-widest">
                {room.status === 'active' ? 'Live Support' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_type === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-5 py-3.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed",
                isMe 
                  ? "bg-brand text-brand-dark rounded-tr-none" 
                  : "bg-card border border-border text-text rounded-tl-none"
              )}>
                {msg.text}
              </div>
              <span className="text-[8px] font-black text-text/20 uppercase tracking-widest mt-2 px-1">
                {msg.created_at?.toDate ? msg.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
              </span>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-card/50 border-t border-border backdrop-blur-md pb-10">
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="w-full bg-bg border border-border rounded-2xl px-6 py-4 pr-16 text-sm font-medium focus:outline-none focus:border-brand transition-all disabled:opacity-50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="absolute right-2 top-2 w-12 h-12 bg-brand text-brand-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </form>
        <p className="text-[8px] font-black text-text/20 uppercase tracking-[0.3em] text-center mt-6">
          Barbaar Support • 24/7 Live Guidance
        </p>
      </div>
    </div>
  );
};
