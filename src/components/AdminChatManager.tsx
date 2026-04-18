import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  User, 
  Shield, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  XCircle,
  AlertCircle
} from 'lucide-react';
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
  getDoc
} from 'firebase/firestore';
import { ChatRoom, ChatMessage } from '../types';
import { cn } from '../lib/utils';

export const AdminChatManager = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_REPLIES = [
    "How can I help you today?",
    "Thank you for reaching out!",
    "I'm here to support your growth journey.",
    "Could you tell me more about that?",
    "That's a great achievement! Keep going.",
  ];

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    let roomsQuery = query(
      collection(db, 'chat_rooms'),
      orderBy('last_message_at', 'desc')
    );

    if (filter !== 'all') {
      roomsQuery = query(
        collection(db, 'chat_rooms'),
        where('status', '==', filter),
        orderBy('last_message_at', 'desc')
      );
    }

    const unsubRooms = onSnapshot(roomsQuery, (snapshot) => {
      const fetchedRooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatRoom));
      setRooms(fetchedRooms);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat_rooms');
      setIsLoading(false);
    });

    return () => unsubRooms();
  }, [filter]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chat_messages'),
      where('room_id', '==', selectedRoomId),
      orderBy('created_at', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat_messages');
    });

    return () => unsubMessages();
  }, [selectedRoomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAcceptChat = async (roomId: string) => {
    try {
      await updateDoc(doc(db, 'chat_rooms', roomId), {
        status: 'active',
        assigned_team_member_id: auth.currentUser?.uid,
        assigned_team_member_name: auth.currentUser?.displayName || 'Barbaar Team',
        last_message_at: serverTimestamp()
      });
      setSelectedRoomId(roomId);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'chat_rooms');
    }
  };

  const handleCloseChat = async (roomId: string) => {
    try {
      await updateDoc(doc(db, 'chat_rooms', roomId), {
        status: 'closed',
        last_message_at: serverTimestamp()
      });
      if (selectedRoomId === roomId) setSelectedRoomId(null);
      setShowCloseConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'chat_rooms');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedRoomId || isSending) return;

    try {
      setIsSending(true);
      const text = inputText.trim();
      setInputText('');

      await addDoc(collection(db, 'chat_messages'), {
        room_id: selectedRoomId,
        sender_id: auth.currentUser?.uid,
        sender_name: auth.currentUser?.displayName || 'Barbaar Team',
        sender_type: 'team',
        text,
        created_at: serverTimestamp()
      });

      await updateDoc(doc(db, 'chat_rooms', selectedRoomId), {
        last_message_at: serverTimestamp()
      });

      scrollToBottom();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] lg:h-[calc(100vh-12rem)] bg-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm relative">
      {/* Rooms List - Responsive Sidebar */}
      <AnimatePresence mode="wait">
        {(showSidebar || window.innerWidth >= 1024) && (
          <motion.div 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className={cn(
              "w-80 border-r border-border flex flex-col bg-bg/30 z-20 absolute lg:relative h-full transition-all",
              !showSidebar && "hidden lg:flex"
            )}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-text uppercase tracking-widest">Support Queue</h3>
                <button 
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden p-2 text-text/20 hover:text-text transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                {(['all', 'waiting', 'active', 'closed'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all whitespace-nowrap",
                      filter === f 
                        ? "bg-brand border-brand text-brand-dark" 
                        : "bg-white border-border text-text/40 hover:border-brand/30"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text/20" size={14} />
                <input 
                  type="text" 
                  placeholder="Search users..."
                  className="w-full bg-white border border-border rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold focus:outline-none focus:border-brand transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="animate-spin text-brand" size={24} />
                </div>
              ) : rooms.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageSquare className="text-text/10 mx-auto mb-4" size={40} />
                  <p className="text-[10px] font-black text-text/30 uppercase tracking-widest">No chats found</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      if (window.innerWidth < 1024) setShowSidebar(false);
                    }}
                    className={cn(
                      "w-full p-4 border-b border-border/50 text-left transition-all hover:bg-white flex items-center gap-3 group",
                      selectedRoomId === room.id ? "bg-white border-l-4 border-l-brand" : ""
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text/40 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                      <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-black text-text truncate">{room.user_name}</h4>
                        <span className="text-[8px] font-bold text-text/20 uppercase">
                          {room.last_message_at?.toDate ? room.last_message_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                          room.status === 'waiting' ? "bg-amber-500/10 text-amber-500" :
                          room.status === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-slate-500/10 text-slate-500"
                        )}>
                          {room.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-text/10 group-hover:text-text/30" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedRoom ? (
          <>
            {/* Chat Header */}
            <div className="px-4 lg:px-8 py-4 border-b border-border flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3 lg:gap-4">
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="lg:hidden p-2 -ml-2 text-text/40 hover:text-brand transition-colors"
                >
                  <MessageSquare size={20} />
                </button>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                  <User size={20} className="lg:hidden" />
                  <User size={24} className="hidden lg:block" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs lg:text-sm font-black text-text truncate">{selectedRoom.user_name}</h3>
                  <p className="text-[8px] lg:text-[10px] font-black text-text/40 uppercase tracking-widest truncate">User ID: {selectedRoom.user_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                {selectedRoom.status === 'waiting' && (
                  <button
                    onClick={() => handleAcceptChat(selectedRoom.id)}
                    className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-brand text-brand-dark rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span className="hidden sm:inline">Accept Chat</span>
                    <span className="sm:hidden">Accept</span>
                  </button>
                )}
                {selectedRoom.status === 'active' && (
                  <button
                    onClick={() => setShowCloseConfirm(selectedRoom.id)}
                    className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-rose-500 text-white rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    <XCircle size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span className="hidden sm:inline">Close Session</span>
                    <span className="sm:hidden">Close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 lg:space-y-6 bg-bg/10">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <MessageSquare size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">No messages yet</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.sender_type === 'team';
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[70%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "px-5 py-3.5 rounded-2xl text-sm font-medium shadow-sm",
                      isMe 
                        ? "bg-brand text-brand-dark rounded-tr-none" 
                        : "bg-white border border-border text-text rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 px-1">
                      <span className="text-[8px] font-black text-text/20 uppercase tracking-widest">
                        {msg.sender_name} • {msg.created_at?.toDate ? msg.created_at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 lg:p-8 border-t border-border bg-white space-y-4">
              {selectedRoom.status === 'active' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {QUICK_REPLIES.map((reply, i) => (
                    <button
                      key={i}
                      onClick={() => setInputText(reply)}
                      className="px-3 py-1.5 bg-bg border border-border rounded-lg text-[8px] lg:text-[10px] font-bold text-text/60 whitespace-nowrap hover:border-brand hover:text-brand transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={selectedRoom.status === 'active' ? "Type your response..." : "Accept chat to respond"}
                  disabled={selectedRoom.status !== 'active' || isSending}
                  className="w-full bg-bg border border-border rounded-xl lg:rounded-2xl px-4 lg:px-6 py-3 lg:py-4 pr-14 lg:pr-16 text-xs lg:text-sm font-medium focus:outline-none focus:border-brand transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending || selectedRoom.status !== 'active'}
                  className="absolute right-1.5 lg:right-2 top-1.5 lg:top-2 w-10 h-10 lg:w-12 lg:h-12 bg-brand text-brand-dark rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={18} className="lg:w-5 lg:h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-brand/5 rounded-full flex items-center justify-center mb-6">
              <Shield className="text-brand/20" size={48} />
            </div>
            <h3 className="text-xl font-black text-text mb-2">Barbaar Support Console</h3>
            <p className="text-sm text-text/40 max-w-xs mx-auto leading-relaxed">
              Select a chat room from the sidebar to start providing guidance and support to the community.
            </p>
          </div>
        )}
      </div>
      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-border"
            >
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-text mb-2">Close Chat Session?</h3>
              <p className="text-sm text-text/40 mb-8">This will end the live support session for this user. You can still view the history in the 'closed' tab.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCloseConfirm(null)}
                  className="flex-1 py-4 bg-bg text-text/60 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-border hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleCloseChat(showCloseConfirm)}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Close Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
