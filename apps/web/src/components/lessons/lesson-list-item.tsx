'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, GripVertical } from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
};

export function LessonListItem({ 
  lesson, 
  courseId,
  index 
}: { 
  lesson: Lesson; 
  courseId: string;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-all ${
        isDragging 
          ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-500/20 opacity-90' 
          : 'border-slate-200 hover:border-indigo-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-950'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-slate-400 hover:text-indigo-600 active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </button>

      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xs font-bold text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-900 dark:text-slate-400">
        {index + 1}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/instructor/courses/${courseId}/lessons/${lesson.id}`}
          className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
        >
          {lesson.title}
        </Link>
      </div>

      <ChevronRight className="size-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}
