import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { MoodLog, Mood } from '../types';
import { motion } from 'motion/react';

interface MoodInsightsProps {
  logs: MoodLog[];
}

const MOOD_VALUES: Record<Mood, number> = {
  'very-sad': 1,
  'sad': 2,
  'neutral': 3,
  'happy': 4,
  'very-happy': 5,
};

const MOOD_LABELS: Record<Mood, string> = {
  'very-sad': 'Struggling',
  'sad': 'Down',
  'neutral': 'Okay',
  'happy': 'Good',
  'very-happy': 'Great',
};

const MOOD_COLORS: Record<Mood, string> = {
  'very-sad': '#F43F5E', // rose-500
  'sad': '#F97316',     // orange-500
  'neutral': '#F59E0B',  // amber-500
  'happy': '#10B981',    // emerald-500
  'very-happy': '#00BFA5', // brand
};

export const MoodInsights: React.FC<MoodInsightsProps> = ({ logs }) => {
  const chartData = useMemo(() => {
    // Sort logs by date to ensure trend is chronological
    return [...logs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Last 7 logs
      .map(log => ({
        date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: MOOD_VALUES[log.mood],
        mood: log.mood,
        label: MOOD_LABELS[log.mood]
      }));
  }, [logs]);

  const moodDistribution = useMemo(() => {
    const counts: Record<Mood, number> = {
      'very-sad': 0,
      'sad': 0,
      'neutral': 0,
      'happy': 0,
      'very-happy': 0,
    };
    logs.forEach(log => {
      counts[log.mood]++;
    });
    return Object.entries(counts).map(([mood, count]) => ({
      mood,
      label: MOOD_LABELS[mood as Mood],
      count,
      color: MOOD_COLORS[mood as Mood],
    }));
  }, [logs]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-4 rounded-2xl shadow-xl border border-border">
          <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">{data.date}</p>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MOOD_COLORS[data.mood as Mood] }} />
            <p className="text-sm font-black text-text">{data.label}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={6} 
        fill={MOOD_COLORS[payload.mood as Mood]} 
        stroke="var(--card-bg)" 
        strokeWidth={2}
      />
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-text tracking-tight">Mood Trend</h3>
            <p className="text-[10px] font-black text-text/40 uppercase tracking-widest">Your last 7 check-ins</p>
          </div>
          <div className="flex items-center gap-2 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/20">
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-[9px] font-black text-brand uppercase tracking-widest">Accurate Analysis</span>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="currentColor" className="text-border/10" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }} 
                className="text-text/40"
                dy={10}
              />
              <YAxis 
                domain={[1, 5]} 
                ticks={[1, 2, 3, 4, 5]} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => {
                  const labels: Record<number, string> = { 1: '😟', 3: '😐', 5: '😊' };
                  return labels[value] || '';
                }}
                tick={{ fill: 'currentColor', fontSize: 14 }}
                className="text-text/40"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="currentColor"
                className="text-brand/20"
                strokeWidth={3}
                dot={<CustomizedDot />}
                activeDot={{ r: 8, strokeWidth: 0, fill: '#00BFA5' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
          {Object.entries(MOOD_LABELS).map(([mood, label]) => (
            <div key={mood} className="flex flex-col items-center gap-2 opacity-80">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood as Mood] }} />
              <span className="text-[7px] font-black text-text/60 uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border p-8 rounded-[2.5rem] shadow-sm"
      >
        <div className="mb-8">
          <h3 className="text-lg font-black text-text tracking-tight">Mood Distribution</h3>
          <p className="text-[10px] font-black text-text/40 uppercase tracking-widest">Overall Frequency</p>
        </div>

        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={moodDistribution} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card p-3 rounded-xl shadow-xl border border-border">
                        <p className="text-[10px] font-black text-text/40 uppercase tracking-widest mb-1">{payload[0].payload.label}</p>
                        <p className="text-sm font-black text-text">{payload[0].value} Times</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={32}>
                {moodDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-5 gap-2 mt-6">
          {moodDistribution.map((item) => (
            <div key={item.mood} className="text-center">
              <div className="text-sm font-black text-text mb-1">{item.count}</div>
              <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ 
                    backgroundColor: item.color, 
                    width: `${logs.length > 0 ? (item.count / logs.length) * 100 : 0}%` 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
