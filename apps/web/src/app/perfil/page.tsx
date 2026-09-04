'use client';

import { PerfilForm } from '@/components/forms/PerfilForm';
import { TwoFactorSettings } from '@/components/forms/TwoFactorSettings';

export default function PerfilPage() {
  return (
    <div className="pb-16">
      <PerfilForm />
      <div className="max-w-md mx-auto mt-6">
        <TwoFactorSettings />
      </div>
    </div>
  );
}
