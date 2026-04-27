'use client';

import { useState } from 'react';
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
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { LessonListItem } from './lesson-list-item';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { BookOpen, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Lesson = {
  id: string;
  title: string;
  sort_order: number;
};

export function LessonList({ 
  courseId, 
  initialLessons 
}: { 
  courseId: string; 
  initialLessons: Lesson[];
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [isUpdating, setIsUpdating] = useState(false);
  const { getAccessToken } = useSupabaseAccessToken();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);

      setIsUpdating(true);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');

        await apiFetch('/lessons/reorder', token, {
          method: 'POST',
          body: JSON.stringify({
            lessonIds: newLessons.map((l) => l.id),
          }),
        });
        router.refresh();
      } catch (error) {
        console.error('Failed to reorder lessons', error);
        // Revert on error
        setLessons(lessons);
      } finally {
        setIsUpdating(false);
      }
    }
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-800 dark:bg-slate-950/40">
        <BookOpen className="mx-auto size-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-500 font-medium">Your course is empty. Start by adding your first lesson above.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {isUpdating && (
        <div className="absolute -top-10 right-0 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Loader2 className="size-3 animate-spin text-indigo-500" />
          Updating order...
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={lessons.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {lessons.map((lesson, index) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              index={index}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
