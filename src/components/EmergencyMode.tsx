import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { AlertCircle, CheckCircle2, XCircle, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmergencyModeProps {
  onComplete: (points: number) => void;
  onExit: () => void;
}

type Path = 'spiritual' | 'biological' | 'neurological';
type Feeling = 'depressed' | 'anxious' | 'trauma';

interface Activity {
  id: string;
  title: string;
  somaliTitle: string;
  description: string;
  howToDo: string;
  whyItHelps: string;
  somaliHowToDo: string;
  somaliWhyItHelps: string;
}

const ACTIVITIES: Record<Feeling, Activity[]> = {
  depressed: [
    { 
      id: 'd1', 
      title: 'Gentle Stretching', 
      somaliTitle: 'Jimicsi Fudud', 
      description: 'Slowly stretch your arms and neck to wake up your body.',
      howToDo: 'Stand up and reach for the sky. Slowly roll your shoulders back 5 times.',
      whyItHelps: 'Physical movement releases endorphins and reduces cortisol, helping lift your mood.',
      somaliHowToDo: 'Itaagso oo gacmaha kor u qaad. Garabka dib u wareeji 5 jeer si tartiib ah.',
      somaliWhyItHelps: 'Dhaqdhaqaaqa jirka wuxuu soo daayaa hormoonnada farxadda, wuxuuna yareeyaa walwalka.'
    },
    { 
      id: 'd2', 
      title: 'Hydration Break', 
      somaliTitle: 'Cabitaan Biyo', 
      description: 'Drink a glass of water slowly, focusing on the sensation.',
      howToDo: 'Take a glass of cold water. Sip it slowly and feel the coolness in your throat.',
      whyItHelps: 'Dehydration can mimic fatigue and low mood. Water refreshes your brain and body.',
      somaliHowToDo: 'Koob biyo qabow ah qaado. Si tartiib ah u cab oo dareen qabowga dhuuntaada.',
      somaliWhyItHelps: 'Biyo la\'aantu waxay keentaa daal iyo niyad-jab. Biyuhu waxay dib u cusboonaysiiyaan maskaxda.'
    },
    { 
      id: 'd3', 
      title: 'Light Movement', 
      somaliTitle: 'Dhaqdhaqaaq', 
      description: 'Walk around your room for 3 minutes.',
      howToDo: 'Walk at a steady pace. Notice each step and how your feet touch the floor.',
      whyItHelps: 'Walking activates both sides of the brain, helping process emotions and reducing stagnation.',
      somaliHowToDo: 'Qolka dhex soco 3 daqiiqo. U fiirso tallaabo kasta oo aad qaadayso.',
      somaliWhyItHelps: 'Socodku wuxuu kiciyaa labada dhinac ee maskaxda, wuxuuna caawiyaa habaynta shucuurta.'
    },
    { 
      id: 'd4', 
      title: 'Sunlight Exposure', 
      somaliTitle: 'Iftiinka Qorraxda', 
      description: 'Open a window or step outside for a moment to feel the light.',
      howToDo: 'Face the light (not directly at the sun). Close your eyes and feel the warmth on your face.',
      whyItHelps: 'Sunlight boosts serotonin, the hormone that helps you feel calm and focused.',
      somaliHowToDo: 'Daaqadda fur ama dibadda u bax. Indhaha isku qabo oo dareen diirimaadka qorraxda.',
      somaliWhyItHelps: 'Iftiinka qorraxdu wuxuu kordhiyaa serotonin, kaas oo kaa caawiya inaad degganaato.'
    },
  ],
  anxious: [
    { 
      id: 'a1', 
      title: '5-4-3-2-1 Grounding', 
      somaliTitle: 'Xaqiiqada ku soo laabo', 
      description: 'Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.',
      howToDo: 'Look around. Say the items out loud. Touch the textures. Listen for background hums.',
      whyItHelps: 'This technique pulls your brain out of anxious thoughts and back into the present moment.',
      somaliHowToDo: 'Hareerahaaga eeg. Sheeg 5 shay oo aad aragto, 4 aad taaban karto, 3 aad maqlayso...',
      somaliWhyItHelps: 'Farsamadan waxay maskaxdaada ka soo saartaa walwalka waxayna ku soo celisaa hadda.'
    },
    { 
      id: 'a2', 
      title: 'Cold Water Splash', 
      somaliTitle: 'Biyo Qabow', 
      description: 'Splash cold water on your face to reset your nervous system.',
      howToDo: 'Use very cold water. Splash your face 3 times. Pat dry slowly.',
      whyItHelps: 'The "Mammalian Dive Reflex" instantly slows your heart rate and calms your nervous system.',
      somaliHowToDo: 'Biyo aad u qabow isticmaal. Wajiga isaga shub 3 jeer si aad u naxdo ugana soo baxdo walwalka.',
      somaliWhyItHelps: 'Biyaha qabow waxay isla markiiba hoos u dhigaan garaaca wadnaha, waxayna dejiyaan dareemayaasha.'
    },
    { 
      id: 'a3', 
      title: 'Humming', 
      somaliTitle: 'Hum-humayn', 
      description: 'Hum a low tone to vibrate your chest and calm the vagus nerve.',
      howToDo: 'Close your lips. Make a deep "Mmmm" sound. Feel the vibration in your chest.',
      whyItHelps: 'Vibrations stimulate the vagus nerve, which signals your body to relax and feel safe.',
      somaliHowToDo: 'Bushimaha isku qabo. Samee dhawaaq "Mmmm" ah oo dheer. Dareen gariirka xabadkaaga.',
      somaliWhyItHelps: 'Gariirku wuxiu kiciyaa dareemaha "vagus", kaas oo jirka u sheega inuu is dejiyo.'
    },
    { 
      id: 'a4', 
      title: 'Box Breathing', 
      somaliTitle: 'Neefta Afar-geeska', 
      description: 'Inhale 4s, Hold 4s, Exhale 4s, Hold 4s.',
      howToDo: 'Follow the visual guide. Keep your shoulders relaxed while breathing.',
      whyItHelps: 'Rhythmic breathing balances the oxygen in your blood and calms the fight-or-flight response.',
      somaliHowToDo: 'Raac tilmaamaha muuqaalka ah. Garabka iska deji inta aad neefsanayso.',
      somaliWhyItHelps: 'Neefsashada habaysan waxay dheellitirtaa ogsajiinta dhiigga, waxayna dejisaa cabsida.'
    },
  ],
  trauma: [
    { 
      id: 't1', 
      title: 'Safe Space Visualization', 
      somaliTitle: 'Muuqaal Nabadeed', 
      description: 'Close your eyes and imagine a place where you feel completely safe.',
      howToDo: 'Think of the colors, smells, and sounds of this safe place. Stay there in your mind.',
      whyItHelps: 'Your brain reacts to imagined safety similarly to real safety, lowering stress levels.',
      somaliHowToDo: 'Ka fikir midabada, urta, iyo dhawaaqyada meel aad ku dareemayso nabad buuxda.',
      somaliWhyItHelps: 'Maskaxdu waxay u falcelisaa nabad-gelyada aad qiyaasayso sida mid dhab ah oo kale.'
    },
    { 
      id: 't2', 
      title: 'Self-Hug', 
      somaliTitle: 'Isku Duubni', 
      description: 'Wrap your arms around yourself and squeeze gently for comfort.',
      howToDo: 'Cross your arms. Place hands on opposite shoulders. Squeeze and hold for 10 seconds.',
      whyItHelps: 'Physical pressure releases oxytocin, the "bonding hormone," providing a sense of security.',
      somaliHowToDo: 'Gacmaha isku dhaaf. Gacmaha saar garabka kale. Isku duub 10 ilbiriqsi.',
      somaliWhyItHelps: 'Cadaadiska jirka wuxuu soo daayaa oxytocin, kaas oo ku siinaya dareen ammaan.'
    },
    { 
      id: 't3', 
      title: 'Walax Taabasho', 
      somaliTitle: 'Walax Taabasho', 
      description: 'Hold a physical object and focus intensely on its texture and weight.',
      howToDo: 'Pick up a stone, a pen, or a piece of fabric. Describe its details in your mind.',
      whyItHelps: 'Focusing on external physical reality helps disconnect from internal distressing memories.',
      somaliHowToDo: 'Qaado dhagax, qalin, ama maro. Ka fikir faahfaahinta shayga aad gacanta ku hayso.',
      somaliWhyItHelps: 'U fiirsashada waxyaabaha dhabta ah waxay kaa caawisaa inaad ka go\'do xusuusta xun.'
    },
    { 
      id: 't4', 
      title: 'Butterfly Hug', 
      somaliTitle: 'Hab-siinta Balanbaalista', 
      description: 'Cross your arms and tap your shoulders alternately like wings.',
      howToDo: 'Cross arms on chest. Tap left shoulder, then right. Repeat slowly like a butterfly.',
      whyItHelps: 'Bilateral stimulation (tapping both sides) helps the brain process and calm intense emotions.',
      somaliHowToDo: 'Gacmaha xabadka isku dhaaf. Taabo garabka bidix, ka dibna kan midig. Si tartiib ah u soco.',
      somaliWhyItHelps: 'Taabashada labada dhinac waxay caawisaa maskaxda inay dejiso shucuurta xooggan.'
    },
  ],
};

export const EmergencyMode = ({ onComplete, onExit }: EmergencyModeProps) => {
  const [currentPath, setCurrentPath] = useState<Path>(() => {
    const paths: Path[] = ['spiritual', 'biological', 'neurological'];
    return paths[Math.floor(Math.random() * paths.length)];
  });
  const [step, setStep] = useState<'active' | 'feeling_selection' | 'activity_selection' | 'activity_timer'>('active');
  const [selectedFeeling, setSelectedFeeling] = useState<Feeling | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [activityTimeLeft, setActivityTimeLeft] = useState(180); // 3 minutes
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [dikriIndex, setDikriIndex] = useState(0);
  const [dikriCount, setDikriCount] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dikriIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dikriWords = ['SubhaanAllah', 'Alhamdulillah', 'Allahu Akbar'];

  useEffect(() => {
    if (isLongPressing && step === 'active' && currentPath === 'spiritual') {
      dikriIntervalRef.current = setInterval(() => {
        setDikriCount(prev => {
          if (prev >= 32) {
            // Trigger a stronger vibration on completion of 33
            if (navigator.vibrate) navigator.vibrate(200);
            setDikriIndex(idx => (idx + 1) % 3);
            return 0;
          }
          // Subtle vibration for each count
          if (navigator.vibrate) navigator.vibrate(50);
          return prev + 1;
        });
      }, 600); // Roughly 20 seconds for 33 counts if held continuously
    } else {
      if (dikriIntervalRef.current) clearInterval(dikriIntervalRef.current);
    }
    return () => {
      if (dikriIntervalRef.current) clearInterval(dikriIntervalRef.current);
    };
  }, [isLongPressing, step, currentPath]);

  useEffect(() => {
    if (step === 'active') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStep('feeling_selection');
            return 0;
          }
          if (prev === 31) setShowSkip(true);
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  useEffect(() => {
    if (step === 'activity_timer') {
      activityTimerRef.current = setInterval(() => {
        setActivityTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(activityTimerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (activityTimerRef.current) clearInterval(activityTimerRef.current);
    };
  }, [step]);

  // Path A: Spiritual Logic
  // Removed automatic interval, now handled by long press count

  const handleComplete = (success: boolean) => {
    if (success) {
      onComplete(50); // Sabr points
    } else {
      setStep('feeling_selection');
    }
  };

  const renderPath = () => {
    switch (currentPath) {
      case 'spiritual':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-10">
            <motion.div 
              className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-12"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Hold to count • 33 times each
            </motion.div>
            
            <div className="h-32 flex flex-col items-center justify-center mb-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={dikriWords[dikriIndex]}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isLongPressing ? 1 : 0.3, 
                    y: 0,
                    scale: isLongPressing ? 1 : 0.9,
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <h2 className="text-5xl font-black text-white tracking-tighter mb-2">
                    {dikriWords[dikriIndex]}
                  </h2>
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(33)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-1 h-1 rounded-full transition-all duration-300",
                          i < dikriCount ? "bg-teal-400 scale-125" : "bg-white/10"
                        )}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-16">
              <AnimatePresence>
                {isLongPressing && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [1.5, 1.6, 1.5], 
                      opacity: [0.5, 0.8, 0.5],
                      x: [0, -2, 2, -2, 2, 0] 
                    }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                    className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full"
                  />
                )}
              </AnimatePresence>
              
              <motion.div 
                onMouseDown={() => setIsLongPressing(true)}
                onMouseUp={() => setIsLongPressing(false)}
                onMouseLeave={() => setIsLongPressing(false)}
                onTouchStart={() => setIsLongPressing(true)}
                onTouchEnd={() => setIsLongPressing(false)}
                animate={{
                  scale: isLongPressing ? 1.1 : 1,
                  x: isLongPressing ? [0, -1, 1, -1, 1, 0] : 0,
                  boxShadow: isLongPressing ? '0 0 40px rgba(45,212,191,0.4)' : '0 0 0px rgba(0,0,0,0)'
                }}
                transition={{ x: { duration: 0.1, repeat: Infinity } }}
                className={cn(
                  "w-32 h-32 rounded-full border-2 border-white/10 flex flex-col items-center justify-center transition-colors duration-500 relative overflow-hidden",
                  isLongPressing ? "border-teal-400 bg-teal-400/10" : "bg-transparent"
                )}
              >
                <div className="text-[10px] font-black text-white/40 mb-1 z-10">
                  {dikriCount} / 33
                </div>
                <motion.div 
                  animate={{
                    scale: isLongPressing ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className={cn(
                    "w-12 h-12 rounded-full transition-all duration-500",
                    isLongPressing ? "bg-teal-400" : "bg-white/10"
                  )} 
                />
              </motion.div>
            </div>
          </div>
        );

      case 'biological':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-10">
            <div className="relative mb-24">
              {/* Layered Glows */}
              <motion.div 
                className="absolute inset-0 bg-teal-400/10 blur-[100px] rounded-full"
                animate={{ scale: [1, 1.8, 1.8, 1] }}
                transition={{ duration: 10, repeat: Infinity, times: [0, 0.4, 0.6, 1], ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute inset-0 bg-emerald-400/5 blur-[60px] rounded-full"
                animate={{ scale: [1, 1.4, 1.4, 1] }}
                transition={{ duration: 10, repeat: Infinity, times: [0, 0.4, 0.6, 1], ease: "easeInOut", delay: 0.5 }}
              />
              
              {/* Main Breathing Circle */}
              <motion.div 
                className="relative w-48 h-48 rounded-full border border-white/10 flex items-center justify-center p-4"
                animate={{ 
                  scale: [1, 1.6, 1.6, 1],
                  borderColor: ['rgba(255,255,255,0.1)', 'rgba(45,212,191,0.5)', 'rgba(45,212,191,0.5)', 'rgba(255,255,255,0.1)']
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity,
                  times: [0, 0.4, 0.6, 1],
                  ease: "easeInOut"
                }}
              >
                {/* Inner Pulsing Core */}
                <motion.div 
                  className="w-full h-full rounded-full bg-gradient-to-tr from-teal-500/30 via-emerald-400/20 to-teal-300/10 backdrop-blur-xl shadow-[inset_0_0_40px_rgba(45,212,191,0.2)]"
                  animate={{ 
                    opacity: [0.4, 1, 1, 0.4],
                    rotate: [0, 180, 180, 360],
                    backgroundColor: ['rgba(20,184,166,0.3)', 'rgba(52,211,153,0.5)', 'rgba(52,211,153,0.5)', 'rgba(20,184,166,0.3)']
                  }}
                  transition={{ duration: 10, repeat: Infinity, times: [0, 0.4, 0.6, 1] }}
                />
                
                {/* Floating Particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-teal-300/40 rounded-full"
                    animate={{
                      x: [0, Math.cos(i * 45) * 120, 0],
                      y: [0, Math.sin(i * 45) * 120, 0],
                      opacity: [0, 0.8, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      times: [0, 0.4, 1],
                      delay: i * 0.15
                    }}
                  />
                ))}
              </motion.div>
            </div>

            <div className="h-16 overflow-hidden">
              <motion.p 
                className="text-teal-400 font-black uppercase tracking-[0.5em] text-2xl"
                animate={{ 
                  y: [64, 0, 0, -64, -64, -128, -128],
                  opacity: [0, 1, 1, 1, 1, 1, 0]
                }}
                transition={{ 
                  duration: 10, 
                  repeat: Infinity,
                  times: [0, 0.05, 0.4, 0.45, 0.6, 0.65, 1]
                }}
              >
                Neefqaado<br/><br/>Haay<br/><br/>Sii Daay
              </motion.p>
            </div>
            
            <p className="mt-12 text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
              Follow the rhythm • 4-2-4
            </p>
          </div>
        );

      case 'neurological':
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <motion.div 
              className="absolute text-white/5"
              style={{ fontSize: '300px', fontWeight: 100 }}
            >
              ∞
            </motion.div>
            
            <motion.div
              className="relative z-10"
              animate={{
                x: [-160, 160, -160],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,0.8)] flex items-center justify-center relative">
                <Moon size={24} className="text-slate-900" fill="currentColor" />
                <motion.div 
                  className="absolute inset-0 bg-white/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </motion.div>

            <div className="absolute bottom-20 left-0 right-0 text-center px-10">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-2">
                Moon Movement (EMDR)
              </p>
              <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest">
                Keep head still • Follow with eyes only
              </p>
            </div>
          </div>
        );
    }
  };

  if (step === 'feeling_selection') {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-xs"
        >
          <div className="mb-12">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Sidee dareemaysaa?</h2>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">How are you feeling right now?</p>
          </div>
          
          <div className="space-y-4">
            {[
              { id: 'depressed', label: 'Depressed', somali: 'Niyad-jab' },
              { id: 'anxious', label: 'Anxious', somali: 'Walwal' },
              { id: 'trauma', label: 'Trauma', somali: 'Naxdin' }
            ].map((f) => (
              <motion.button 
                key={f.id}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedFeeling(f.id as Feeling); setStep('activity_selection'); }}
                className="w-full py-6 bg-white/5 text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] border border-white/10 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.02)] group"
              >
                <span className="block text-teal-400 opacity-60 group-hover:opacity-100 transition-opacity mb-1">{f.somali}</span>
                {f.label}
              </motion.button>
            ))}
          </div>

          <button 
            onClick={() => handleComplete(true)}
            className="mt-12 text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white/40 transition-colors"
          >
            Waan ladnahay (I'm okay now)
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'activity_selection' && selectedFeeling) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Dooro waxaad samaynayso</h2>
            <p className="text-teal-400/60 text-[10px] font-black uppercase tracking-[0.3em]">Choose a 3-minute activity</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {ACTIVITIES[selectedFeeling].map((act, i) => (
              <motion.button 
                key={act.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.08)' }}
                onClick={() => { setSelectedActivity(act); setStep('activity_timer'); }}
                className="w-full p-6 bg-white/5 text-white rounded-3xl text-left border border-white/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h4 className="font-black text-teal-400 uppercase tracking-[0.2em] text-[9px] mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  {act.somaliTitle}
                </h4>
                <p className="font-black text-sm tracking-tight group-hover:text-teal-50 transition-colors">{act.title}</p>
              </motion.button>
            ))}
          </div>

          <button 
            onClick={() => setStep('feeling_selection')}
            className="mt-10 text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white/40 transition-colors"
          >
            Back to feelings
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'activity_timer' && selectedActivity) {
    const minutes = Math.floor(activityTimeLeft / 60);
    const seconds = activityTimeLeft % 60;

    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-md my-auto"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{selectedActivity.somaliTitle}</h2>
            <p className="text-teal-400 font-black uppercase tracking-[0.3em] text-[10px]">{selectedActivity.title}</p>
          </div>

          <div className="relative w-48 h-48 mx-auto mb-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-teal-400/5 blur-3xl rounded-full" />
            
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
              <motion.circle 
                cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="2" fill="transparent" 
                className="text-teal-400"
                strokeDasharray={527}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 527 - (527 * activityTimeLeft) / 180 }}
                transition={{ duration: 1, ease: 'linear' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-left">
              <h4 className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">Sida loo sameeyo (How to do)</h4>
              <p className="text-white/80 text-xs leading-relaxed font-medium">
                {selectedActivity.somaliHowToDo}
              </p>
              <p className="text-white/40 text-[10px] mt-1 italic">
                {selectedActivity.howToDo}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-left">
              <h4 className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-2">Maxay ku caawinaysaa? (Why it helps)</h4>
              <p className="text-white/80 text-xs leading-relaxed font-medium">
                {selectedActivity.somaliWhyItHelps}
              </p>
              <p className="text-white/40 text-[10px] mt-1 italic">
                {selectedActivity.whyItHelps}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete(100)}
              className="py-5 bg-teal-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-teal-500/20"
            >
              Waan dhameeye (I'm done)
            </motion.button>
            <button 
              onClick={() => onExit()}
              className="py-4 text-white/20 text-[10px] font-black uppercase tracking-widest hover:text-white/40 transition-colors"
            >
              Skip Activity
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] select-none touch-none overflow-hidden">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <motion.div 
          className="h-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 60, ease: 'linear' }}
        />
      </div>

      {/* Main Content */}
      <div className="h-full">
        {renderPath()}
      </div>

      {/* Skip Button */}
      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setStep('feeling_selection')}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 px-8 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-[0.2em]"
          >
            Waan ladnahay
          </motion.button>
        )}
      </AnimatePresence>

      {/* Exit Button (Hidden but accessible for safety) */}
      <button 
        onClick={onExit}
        className="absolute top-8 right-8 text-white/10 hover:text-white/40 transition-colors"
      >
        <XCircle size={24} />
      </button>
    </div>
  );
};
