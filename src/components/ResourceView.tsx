import React, { useState, useEffect } from 'react';
import { Play, Book, Headphones, FileText, Search, ChevronRight, Sparkles, Zap, Heart, Award, Activity, Moon, Clock, Filter, ArrowLeft, Target, Bookmark, CheckCircle2, MoreHorizontal, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Resource, ResourceType } from '../types';
import { db, collection, getDocs, query, where, orderBy } from '../firebase';

const CATEGORIES = [
  { id: 'wellness', title: 'Wellness', description: 'Nurture your body and soul', icon: <Heart size={20} className="text-emerald-500/80" /> },
  { id: 'growth', title: 'Growth', description: 'Unlock your full potential', icon: <Zap size={20} className="text-blue-500/80" /> },
  { id: 'productivity', title: 'Productivity', description: 'Master your focus', icon: <Activity size={20} className="text-amber-500/80" /> },
  { id: 'habits', title: 'Habits', description: 'Daily consistency', icon: <Sparkles size={20} className="text-purple-500/80" /> },
];

const TABS: { id: 'Article' | 'Book Summary' | 'Course'; label: string }[] = [
  { id: 'Article', label: 'Articles' },
  { id: 'Book Summary', label: 'Books' },
  { id: 'Course', label: 'Courses' },
];

const ResourceListItem: React.FC<{
  resource: Resource;
  onClick: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
  isCompleted: boolean;
}> = ({ resource, onClick, isSaved, onToggleSave, isCompleted }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="flex items-center gap-4 bg-white rounded-3xl p-3 border border-border/5 shadow-sm cursor-pointer group hover:border-[#10B981]/30 transition-all"
    >
      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
        {resource.image ? (
          <img 
            src={resource.image} 
            alt={resource.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
            <Book size={24} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-text leading-tight mb-2 group-hover:text-[#10B981] transition-colors">
          {resource.title}
        </h4>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-text/40 tracking-wider uppercase">
            {isCompleted ? 'COMPLETED' : `${resource.duration} READ`}
          </span>
          <span className="text-text/20 text-[10px]">•</span>
          <span className="text-[10px] font-bold text-text/40 tracking-wider uppercase truncate">
            {resource.category.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="shrink-0 pr-2">
        {isCompleted ? (
          <div className="w-7 h-7 rounded-full bg-[#DCFCE7] text-[#10B981] flex items-center justify-center">
            <CheckCircle2 size={18} fill="currentColor" className="text-white" />
          </div>
        ) : (
          <button 
            onClick={onToggleSave}
            className={cn(
              "p-2 rounded-xl transition-all",
              isSaved ? "text-[#10B981]" : "text-text/20 hover:text-[#10B981]"
            )}
          >
            <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const ResourceGridItem: React.FC<{
  resource: Resource;
  onClick: () => void;
}> = ({ resource, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="flex flex-col bg-white rounded-[2rem] overflow-hidden border border-border/5 group cursor-pointer shadow-sm h-full"
    >
      <div className="relative aspect-square overflow-hidden">
        {resource.image ? (
          <img 
            src={resource.image} 
            alt={resource.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
            <Book size={32} />
          </div>
        )}
      </div>
      <div className="p-4 bg-white">
        <h4 className="text-sm font-bold text-text mb-1 group-hover:text-[#10B981] transition-colors line-clamp-2 leading-snug">
          {resource.title}
        </h4>
        <p className="text-[10px] font-bold text-text/40 uppercase tracking-tight">
          {resource.type === 'Course' ? 'Video Course' : `${resource.duration} summary`}
        </p>
      </div>
    </motion.div>
  );
};

interface ResourceViewProps {
  onSelectResource: (resource: Resource) => void;
  onBack?: () => void;
  savedResources: string[];
  completedResources: string[];
  onToggleSave: (id: string) => void;
}

export const ResourceView = ({ 
  onSelectResource, 
  onBack, 
  savedResources, 
  completedResources,
  onToggleSave 
}: ResourceViewProps) => {
  const [activeTab, setActiveTab] = useState<'Article' | 'Book Summary' | 'Course'>('Article');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(
          collection(db, 'resources'), 
          where('published', '==', true)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
        setResources(fetched);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const weeklyGoalTarget = 5;
  const weeklyCompletedCount = completedResources.length % weeklyGoalTarget; // Simplified logic
  const weeklyProgressPercentage = (weeklyCompletedCount / weeklyGoalTarget) * 100;

  const filteredResources = resources.filter(resource => {
    const matchesTab = resource.type === activeTab;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const featuredArticles = filteredResources.slice(0, 3);
  const featuredIds = new Set(featuredArticles.map(r => r.id));
  const recommendedResources = resources
    .filter(r => !featuredIds.has(r.id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-50 bg-[#F8F9FA]">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 text-text/80 hover:text-brand transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-text tracking-tight">Wellness Resources</h1>
        <button className="p-2 -mr-2 text-text/80 hover:text-brand transition-all">
          <Search size={22} />
        </button>
      </header>

      <main className="space-y-6 px-6 pb-20">
        {/* Weekly Goal Card */}
        <section className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#22C55E] flex items-center justify-center">
                <Zap size={24} fill="currentColor" />
              </div>
              <span className="text-[11px] font-bold text-text/40 uppercase tracking-widest">Weekly Goal</span>
            </div>
            <span className="text-sm font-bold text-text">{weeklyCompletedCount}/{weeklyGoalTarget} Completed</span>
          </div>
          
          <div className="space-y-4">
            <div className="h-2.5 w-full bg-[#F1F3F5] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${weeklyProgressPercentage}%` }}
                className="h-full bg-[#10B981] rounded-full"
              />
            </div>
            <div className="flex items-center gap-2 text-[#10B981]">
              <CheckCircle2 size={18} fill="currentColor" className="text-white bg-[#10B981] rounded-full" />
              <p className="text-xs font-semibold">You've consumed {weeklyCompletedCount} resources this week!</p>
            </div>
          </div>
        </section>

        {/* Segmented Tabs */}
        <section className="border-b border-border/20 pt-2">
          <div className="flex items-center">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-4 text-sm font-bold relative transition-all",
                  activeTab === tab.id ? "text-text" : "text-text/30"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#10B981]"
                  />
                )}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Featured Articles Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text">Featured {activeTab === 'Article' ? 'Articles' : activeTab === 'Course' ? 'Courses' : 'Books'}</h3>
                <button className="text-xs font-bold text-brand hover:underline">View All</button>
              </div>
              <div className="flex flex-col gap-3">
                {featuredArticles.length > 0 ? (
                  featuredArticles.map((resource) => (
                    <ResourceListItem 
                      key={`featured-${resource.id}`}
                      resource={resource}
                      onClick={() => onSelectResource(resource)}
                      isSaved={savedResources.includes(resource.id)}
                      onToggleSave={(e) => {
                        e.stopPropagation();
                        onToggleSave(resource.id);
                      }}
                      isCompleted={completedResources.includes(resource.id)}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-border/50">
                    <p className="text-xs font-bold text-text/30 uppercase tracking-widest">No resources found</p>
                  </div>
                )}
              </div>
            </section>

            {/* Recommended for You Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-text">Recommended for You</h3>
              <div className="grid grid-cols-2 gap-4">
                {recommendedResources.map((resource) => (
                  <ResourceGridItem 
                    key={`recommended-${resource.id}`}
                    resource={resource}
                    onClick={() => onSelectResource(resource)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
