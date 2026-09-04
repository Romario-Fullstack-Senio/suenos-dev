'use client';

import { PerfilForm } from '@/components/forms/PerfilForm';
import { TwoFactorSettings } from '@/components/forms/TwoFactorSettings';
import { SesionesActivas } from '@/components/forms/SesionesActivas';

export default function PerfilPage() {
  return (
    <div className="pb-16">
      <PerfilForm />
      <div className="max-w-md mx-auto mt-6 space-y-6">
        <TwoFactorSettings />
        <SesionesActivas />
      </div>
    </div>
  );
}
