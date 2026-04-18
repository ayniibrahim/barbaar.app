import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Clock, 
  GripVertical, 
  Trash2, 
  Calendar, 
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import { Task, Priority } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskItemProps {
  task: Task;
  onToggleTask: (id: string) => void;
  onStartFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const SortableTaskItem: React.FC<SortableTaskItemProps> = ({ task, onToggleTask, onStartFocus, onDeleteTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const priorityColors = {
    high: 'text-red-500 bg-red-500/10 border-red-500/10',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/10',
    low: 'text-brand bg-brand/10 border-brand/10',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "flex items-center gap-4 p-5 bg-card border border-border rounded-[2.5rem] group cursor-pointer transition-all relative overflow-hidden shadow-sm",
        task.completed && "opacity-40 grayscale-[0.5]",
        isDragging && "shadow-2xl shadow-black/50 border-brand/30 bg-card/80"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-2 -ml-2 text-text/40 hover:text-text/70 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleTask(task.id);
        }}
        className={cn(
          "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shrink-0 shadow-sm",
          task.completed 
            ? "bg-brand border-brand text-brand-dark" 
            : "bg-card border-border text-transparent hover:border-brand/30 hover:bg-brand/5"
        )}
        title={task.completed ? "Mark as incomplete" : "Quick Complete"}
      >
        <CheckCircle2 size={24} strokeWidth={3} className={cn(
          "transition-transform duration-500",
          task.completed ? "scale-100" : "scale-0"
        )} />
        {!task.completed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 size={24} strokeWidth={3} className="text-brand/20" />
          </div>
        )}
      </button>
      
      <div className="flex-1 min-w-0" onClick={() => task.completed ? onToggleTask(task.id) : onStartFocus(task.id)}>
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "text-sm font-black text-text transition-all tracking-tight truncate",
            task.completed && "line-through text-text/40"
          )}>
            {task.title}
          </h4>
          <span className={cn(
            "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
            priorityColors[task.priority]
          )}>
            {task.priority}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-text/60">
            <Clock size={10} />
            <p className="text-[9px] font-bold uppercase tracking-widest">
              {task.completed ? `Done` : task.time}
            </p>
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1 text-text/60">
              <Calendar size={10} />
              <p className="text-[9px] font-bold uppercase tracking-widest">
                {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.1, color: '#ef4444' }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteTask(task.id);
        }}
        className="w-8 h-8 rounded-xl bg-text/5 flex items-center justify-center text-text/30 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={14} />
      </motion.button>
    </motion.div>
  );
};

type SortType = 'priority' | 'dueDate' | 'createdAt';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onStartFocus: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (activeId: string, overId: string) => void;
  showCompleted?: boolean;
  hideHeader?: boolean;
}

export const TaskList = ({ 
  tasks, 
  onToggleTask, 
  onStartFocus, 
  onDeleteTask, 
  onReorderTasks, 
  showCompleted = false,
  hideHeader = false
}: TaskListProps) => {
  const [sortBy, setSortBy] = useState<SortType>('priority');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderTasks(active.id as string, over.id as string);
    }
  };

  const filteredTasks = tasks.filter(t => t.completed === showCompleted);

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const pMap = { high: 0, medium: 1, low: 2 };
      return 0; 
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  if (filteredTasks.length === 0) return null;

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text/60">
            {showCompleted ? 'History' : 'Ongoing Focus'}
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSortBy('priority')}
              className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all",
                sortBy === 'priority' ? "bg-brand text-brand-dark border-brand" : "text-text/60 border-border bg-card"
              )}
            >
              Priority
            </button>
            <button 
              onClick={() => setSortBy('dueDate')}
              className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all",
                sortBy === 'dueDate' ? "bg-brand text-brand-dark border-brand" : "text-text/60 border-border bg-card"
              )}
            >
              Due
            </button>
            <button 
              onClick={() => setSortBy('createdAt')}
              className={cn(
                "text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all",
                sortBy === 'createdAt' ? "bg-brand text-brand-dark border-brand" : "text-text/60 border-border bg-card"
              )}
            >
              New
            </button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedTasks.map((task) => (
                <SortableTaskItem 
                  key={task.id} 
                  task={task} 
                  onToggleTask={onToggleTask}
                  onStartFocus={onStartFocus}
                  onDeleteTask={onDeleteTask}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
