import { Suspense } from 'react';
import { LoginForm } from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
