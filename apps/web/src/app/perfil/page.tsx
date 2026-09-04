'use client';

import { PerfilForm } from '@/components/forms/PerfilForm';
import { TwoFactorSettings } from '@/components/forms/TwoFactorSettings';
import { SesionesActivas } from '@/components/forms/SesionesActivas';
import { EliminarCuenta } from '@/components/forms/EliminarCuenta';

export default function PerfilPage() {
  return (
    <div className="pb-16">
      <PerfilForm />
      <div className="max-w-md mx-auto mt-6 space-y-6">
        <TwoFactorSettings />
        <SesionesActivas />
        <EliminarCuenta />
      </div>
    </div>
  );
}
