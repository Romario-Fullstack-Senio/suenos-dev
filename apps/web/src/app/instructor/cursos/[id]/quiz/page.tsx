'use client';

import { useParams } from 'next/navigation';
import { QuizInstructorForm } from '@/components/forms/QuizInstructorForm';

export default function QuizPage() {
  const params = useParams();
  const cursoId = params.id as string;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <QuizInstructorForm cursoId={cursoId} />
    </div>
  );
}
