'use client';

import ReactMarkdown from 'react-markdown';

export function LessonMarkdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-300 prose-headings:text-slate-900 dark:prose-headings:text-slate-50 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 dark:prose-code:bg-slate-800 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-a:text-blue-600 dark:prose-a:text-blue-400">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
