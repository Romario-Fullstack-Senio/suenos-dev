import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
