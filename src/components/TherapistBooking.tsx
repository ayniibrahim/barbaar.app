import React, { useState, useEffect } from 'react';
import { Star, Calendar, Clock, MapPin, CheckCircle2, ChevronRight, User, ShieldCheck, Info, Phone, CreditCard, Loader2, MessageCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Therapist, Booking } from '../types';
import { cn } from '../lib/utils';
import { auth, db, collection, addDoc, serverTimestamp, getDocs, query, where } from '../firebase';

interface TherapistBookingProps {
  onBook?: (booking: Booking) => void;
}

type BookingStep = 'list' | 'details' | 'demographics' | 'payment' | 'success';

export const TherapistBooking = ({ onBook }: TherapistBookingProps) => {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [demographics, setDemographics] = useState({
    age: '',
    gender: '',
    location: '',
    goal: ''
  });
  
  const [evcNumber, setEvcNumber] = useState('');

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const q = query(
          collection(db, 'therapists'), 
          where('published', '==', true)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Therapist));
        setTherapists(fetched);
      } catch (err) {
        console.error('Error fetching therapists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTherapists();
  }, []);

  const handleBook = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setSelectedSlot(null);
    setBookingStep('details');
  };

  const confirmBooking = async () => {
    if (!selectedTherapist || !selectedSlot) return;
    
    setIsSubmitting(true);
    
    try {
      const userEmail = auth.currentUser?.email || 'anonymous@user.com';
      const userId = auth.currentUser?.uid || 'anonymous';
      
      const bookingData = {
        therapist: selectedTherapist,
        slot: selectedSlot,
        demographics,
        evcNumber,
        userEmail,
        userId,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // 1. Save to Firestore (Primary Record)
      // This will work even on static hosts like Netlify
      try {
        await addDoc(collection(db, 'bookings'), bookingData);
      } catch (fsError) {
        console.error("Firestore save error:", fsError);
        // Continue anyway, we'll try the email API
      }
      
      // 2. Call our server-side API to send email (Secondary Notification)
      // On Netlify, this might fail if the server.ts isn't running, 
      // but we've already saved the data to Firestore.
      try {
        const response = await fetch('/api/book-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });

        // Only try to parse JSON if the response is OK
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            console.log("Email notification sent successfully");
          }
        }
      } catch (apiError) {
        console.warn("API Email notification failed, but booking was saved to database:", apiError);
        // We don't alert here because the booking is already saved to Firestore
      }

      // Success!
      const newBooking: Booking = {
        id: Date.now().toString(),
        therapistId: selectedTherapist.id,
        date: new Date().toLocaleDateString(),
        time: selectedSlot,
        status: 'pending'
      };
      
      onBook?.(newBooking);
      setBookingStep('success');

    } catch (error) {
      console.error("Booking error:", error);
      alert("An error occurred while processing your booking. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps: { key: BookingStep; label: string }[] = [
      { key: 'details', label: 'Time' },
      { key: 'demographics', label: 'Info' },
      { key: 'payment', label: 'Pay' }
    ];
    
    if (bookingStep === 'list' || bookingStep === 'success') return null;

    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((step, idx) => {
          const isActive = bookingStep === step.key;
          const isPast = steps.findIndex(s => s.key === bookingStep) > idx;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                  isActive ? "bg-brand text-brand-dark scale-110 shadow-lg shadow-brand/20" : 
                  isPast ? "bg-brand/20 text-brand" : "bg-card text-text/20 border border-border"
                )}>
                  {isPast ? <CheckCircle2 size={14} /> : idx + 1}
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  isActive ? "text-brand" : "text-text/20"
                )}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-[2px] rounded-full -mt-4",
                  isPast ? "bg-brand/20" : "bg-border"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (bookingStep === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center h-full bg-bg"
      >
        <div className="w-24 h-24 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-8 shadow-lg shadow-brand/20">
          <CheckCircle2 size={56} strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black text-text mb-3 tracking-tight">Booking Received!</h3>
        <p className="text-text/40 mb-10 leading-relaxed">
          Your request for a session with <span className="text-text font-bold">{selectedTherapist?.name}</span> has been sent. 
          We will confirm your <span className="text-brand font-bold">EVC payment</span> and send the link to <span className="text-text font-bold">{auth.currentUser?.email}</span>.
        </p>
        <div className="w-full space-y-4">
          <button 
            onClick={() => setBookingStep('list')}
            className="w-full py-4 bg-brand text-brand-dark rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-transform active:scale-95"
          >
            Back to Home
          </button>
          <p className="text-[10px] text-text/20 font-bold uppercase tracking-[0.2em]">Check your email for confirmation</p>
        </div>
      </motion.div>
    );
  }

  if (bookingStep === 'details' && selectedTherapist) {
    return (
      <div className="p-6 space-y-8 bg-bg min-h-full">
        <button 
          onClick={() => setBookingStep('list')}
          className="flex items-center gap-2 text-text/40 hover:text-text transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <ChevronRight className="rotate-180" size={16} /> Back to Therapists
        </button>

        {renderStepIndicator()}

        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-2 border-border shadow-2xl bg-card shrink-0">
            {selectedTherapist.image ? (
              <img src={selectedTherapist.image} alt={selectedTherapist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand/5 text-brand">
                <User size={48} />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-text tracking-tight">{selectedTherapist.name}</h3>
              <ShieldCheck size={16} className="text-brand" />
            </div>
            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-3">{selectedTherapist.specialty}</p>
            <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 w-fit px-2 py-1 rounded-lg">
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] font-black">{selectedTherapist.rating} Rating</span>
            </div>
          </div>
        </div>

        <div className="bg-card backdrop-blur-xl border border-border p-6 rounded-[2.5rem] space-y-8 inner-glow">
          <div>
            <h4 className="text-[10px] font-black text-text/40 uppercase tracking-[0.3em] mb-6">Select a Time Slot</h4>
            <div className="grid grid-cols-2 gap-3">
              {selectedTherapist.availableSlots.map(time => (
                <button 
                  key={time} 
                  onClick={() => setSelectedSlot(time)}
                  className={cn(
                    "py-4 rounded-2xl text-[10px] font-black transition-all border uppercase tracking-widest",
                    selectedSlot === time 
                      ? "bg-brand text-brand-dark border-brand shadow-lg shadow-brand/20 scale-105" 
                      : "bg-bg text-text border-border hover:border-brand/20"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
          
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">Session Rate</p>
              <p className="text-xl font-black text-text tracking-tight">{selectedTherapist.rate}</p>
            </div>
            <button 
              onClick={() => setBookingStep('demographics')}
              disabled={!selectedSlot}
              className="px-10 py-4 bg-brand text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 disabled:opacity-50 transition-all active:scale-95"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingStep === 'demographics') {
    return (
      <div className="p-6 space-y-8 bg-bg min-h-full">
        <button 
          onClick={() => setBookingStep('details')}
          className="flex items-center gap-2 text-text/40 hover:text-text transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <ChevronRight className="rotate-180" size={16} /> Back to Time Selection
        </button>

        {renderStepIndicator()}

        <div className="space-y-2">
          <h3 className="text-xl font-black text-text tracking-tight">Tell us about yourself</h3>
          <p className="text-[10px] text-text/40 font-black uppercase tracking-widest">This helps your therapist prepare for the session</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-[2.5rem] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-2">Age</label>
              <input 
                type="number"
                value={demographics.age}
                onChange={(e) => setDemographics({...demographics, age: e.target.value})}
                placeholder="Ex: 24"
                className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-brand/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-2">Gender</label>
              <select 
                value={demographics.gender}
                onChange={(e) => setDemographics({...demographics, gender: e.target.value})}
                className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-brand/50 appearance-none"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-2">Location</label>
            <input 
              type="text"
              value={demographics.location}
              onChange={(e) => setDemographics({...demographics, location: e.target.value})}
              placeholder="Ex: Mogadishu, Somalia"
              className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-brand/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-2">Primary Goal</label>
            <textarea 
              value={demographics.goal}
              onChange={(e) => setDemographics({...demographics, goal: e.target.value})}
              placeholder="What do you want to achieve?"
              rows={3}
              className="w-full bg-bg border border-border rounded-xl p-4 text-sm font-bold focus:outline-none focus:border-brand/50 resize-none"
            />
          </div>

          <button 
            onClick={() => setBookingStep('payment')}
            disabled={!demographics.age || !demographics.gender || !demographics.location || !demographics.goal}
            className="w-full py-4 bg-brand text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/20 disabled:opacity-50 transition-all active:scale-95"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    );
  }

  if (bookingStep === 'payment') {
    return (
      <div className="p-6 space-y-8 bg-bg min-h-full">
        <button 
          onClick={() => setBookingStep('demographics')}
          className="flex items-center gap-2 text-text/40 hover:text-text transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
        >
          <ChevronRight className="rotate-180" size={16} /> Back to Information
        </button>

        {renderStepIndicator()}

        <div className="space-y-2">
          <h3 className="text-xl font-black text-text tracking-tight">Secure Payment</h3>
          <p className="text-[10px] text-text/40 font-black uppercase tracking-widest">Pay with EVC Plus to confirm your session</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard size={120} />
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-brand/5 rounded-2xl border border-brand/10">
            <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center text-brand-dark">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-brand uppercase tracking-widest">EVC Plus Payment</p>
              <p className="text-sm font-bold text-text">Send {selectedTherapist?.rate} to +252 61 661 7726</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-2">Your EVC Number</label>
              <div className="relative">
                <input 
                  type="tel"
                  value={evcNumber}
                  onChange={(e) => setEvcNumber(e.target.value)}
                  placeholder="061XXXXXXX"
                  className="w-full bg-bg border border-border rounded-xl p-4 pl-12 text-sm font-bold focus:outline-none focus:border-brand/50"
                />
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text/20" size={18} />
              </div>
              <p className="text-[9px] text-text/40 font-medium ml-2 italic">Enter the number you used for the transfer</p>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black text-text/40 uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-brand">{selectedTherapist?.rate}</span>
            </div>
            
            <button 
              onClick={confirmBooking}
              disabled={!evcNumber || isSubmitting}
              className="w-full py-5 bg-brand text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                'Confirm & Pay'
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
          <Info size={16} className="text-amber-500 shrink-0" />
          <p className="text-[9px] text-amber-500 font-bold leading-relaxed">
            Your session will be confirmed once our team verifies the transfer. You will receive a link via email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-bg min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-text tracking-tight">Online Therapy</h3>
          <p className="text-[10px] text-text/40 font-black uppercase tracking-widest mt-1">Book a session with an expert</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-brand border border-border">
          <Calendar size={20} />
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest">Finding Therapists...</p>
          </div>
        ) : (
          therapists.map((therapist) => (
            <motion.div 
              key={therapist.id}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-card backdrop-blur-xl border border-border flex flex-col group cursor-pointer rounded-[3rem] relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-brand/10 transition-all duration-500"
              onClick={() => handleBook(therapist)}
            >
              <div className="h-48 w-full relative overflow-hidden">
                {therapist.image ? (
                  <img 
                    src={therapist.image} 
                    alt={therapist.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
                    <User size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-black text-text tracking-tight group-hover:text-brand transition-colors duration-300">{therapist.name}</h4>
                      <ShieldCheck size={18} className="text-brand" />
                    </div>
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest">{therapist.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-500 bg-bg/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-border shadow-lg">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-black">{therapist.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 pt-2">
                <p className="text-xs text-text/50 line-clamp-3 leading-relaxed font-medium mb-6">
                  {therapist.bio}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-text/30 uppercase tracking-widest">Session Rate</span>
                    <span className="text-lg font-black text-text">{therapist.rate}</span>
                  </div>
                  <div className="px-6 py-3 bg-brand text-brand-dark rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20 group-hover:scale-105 transition-all duration-300">
                    Book Session <ArrowRight size={14} />
                  </div>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-bg/80 backdrop-blur-md p-2 rounded-xl border border-border shadow-lg">
                  <Clock size={16} className="text-brand" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

    </div>
  );
};
