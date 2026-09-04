'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ShieldOff, Copy } from 'lucide-react';

type Vista = 'cargando' | 'apagado' | 'configurando' | 'codigos-respaldo' | 'encendido' | 'desactivando';

export function TwoFactorSettings() {
  const [vista, setVista] = useState<Vista>('cargando');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigosRespaldo, setCodigosRespaldo] = useState<string[]>([]);
  const [passwordDesactivar, setPasswordDesactivar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<{ enabled: boolean }>('/auth/2fa/status')
      .then((r) => setVista(r.enabled ? 'encendido' : 'apagado'))
      .catch(() => setVista('apagado'));
  }, []);

  async function iniciarConfiguracion() {
    setEnviando(true);
    setError('');
    try {
      const r = await apiPost<{ secret: string; qrDataUrl: string }>('/auth/2fa/setup', {});
      setSecret(r.secret);
      setQrDataUrl(r.qrDataUrl);
      setCodigo('');
      setVista('configurando');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar la configuración');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarActivacion(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await apiPost<{ codigosRespaldo: string[] }>('/auth/2fa/confirm', { codigo: codigo.trim() });
      setCodigosRespaldo(r.codigosRespaldo);
      setVista('codigos-respaldo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto');
    } finally {
      setEnviando(false);
    }
  }

  async function desactivar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await apiPost('/auth/2fa/disable', { password: passwordDesactivar });
      toast.success('Verificación en dos pasos desactivada');
      setPasswordDesactivar('');
      setVista('apagado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contraseña incorrecta');
    } finally {
      setEnviando(false);
    }
  }

  function copiarCodigos() {
    navigator.clipboard.writeText(codigosRespaldo.join('\n')).then(() => toast.success('Códigos copiados'));
  }

  if (vista === 'cargando') {
    return <div className="h-24 bg-ink/[0.04] rounded-xl animate-pulse" />;
  }

  if (vista === 'codigos-respaldo') {
    return (
      <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-500" /> Verificación en dos pasos activada
        </h3>
        <p className="text-sm text-ink-muted mb-4">
          Guardá estos códigos de respaldo en un lugar seguro — cada uno sirve para entrar UNA sola vez si perdés
          acceso a tu app de autenticación. No se van a volver a mostrar.
        </p>
        <div className="bg-cloud-50 border border-ink/[0.1] rounded-lg p-4 font-mono text-sm grid grid-cols-2 gap-2 mb-4">
          {codigosRespaldo.map((c) => <span key={c}>{c}</span>)}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={copiarCodigos}>
            <Copy className="w-4 h-4 mr-1.5 inline" /> Copiar
          </Button>
          <Button type="button" onClick={() => setVista('encendido')}>
            Ya los guardé
          </Button>
        </div>
      </div>
    );
  }

  if (vista === 'configurando') {
    return (
      <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
        <h3 className="font-semibold mb-3">Escaneá el código con tu app</h3>
        <p className="text-sm text-ink-muted mb-4">
          Usá Google Authenticator, Authy o cualquier app compatible con TOTP.
        </p>
        {qrDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL generada por el backend, no una imagen remota
          <img src={qrDataUrl} alt="Código QR para configurar la verificación en dos pasos" className="w-48 h-48 mx-auto mb-3 rounded-lg border border-ink/[0.1]" />
        )}
        <p className="text-xs text-ink-soft text-center mb-4">
          ¿No podés escanearlo? Ingresá este código a mano: <code className="font-mono">{secret}</code>
        </p>
        <form onSubmit={confirmarActivacion}>
          <Input
            label="Código de 6 dígitos"
            placeholder="123456"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            error={error}
          />
          <Button type="submit" isLoading={enviando} disabled={!codigo.trim() || enviando} className="w-full mt-2">
            Confirmar y activar
          </Button>
        </form>
      </div>
    );
  }

  if (vista === 'desactivando') {
    return (
      <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07]">
        <h3 className="font-semibold mb-3">Desactivar verificación en dos pasos</h3>
        <form onSubmit={desactivar}>
          <Input
            label="Confirmá tu contraseña"
            type="password"
            placeholder="••••••••"
            value={passwordDesactivar}
            onChange={(e) => setPasswordDesactivar(e.target.value)}
            error={error}
          />
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={() => { setVista('encendido'); setError(''); }}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={enviando} disabled={!passwordDesactivar.trim() || enviando}>
              Desactivar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-cloud-100 rounded-xl p-6 shadow-sm border border-ink/[0.07] flex items-center justify-between gap-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2">
          {vista === 'encendido' ? (
            <><ShieldCheck className="w-4 h-4 text-green-500" /> Verificación en dos pasos activada</>
          ) : (
            <><ShieldOff className="w-4 h-4 text-ink-soft" /> Verificación en dos pasos</>
          )}
        </h3>
        <p className="text-sm text-ink-muted mt-1">
          {vista === 'encendido'
            ? 'Tu cuenta pide un código además de la contraseña al iniciar sesión.'
            : 'Sumá una capa extra de seguridad con una app de autenticación (Google Authenticator, Authy).'}
        </p>
      </div>
      {vista === 'encendido' ? (
        <Button type="button" variant="ghost" onClick={() => setVista('desactivando')} className="flex-shrink-0">
          Desactivar
        </Button>
      ) : (
        <Button type="button" onClick={iniciarConfiguracion} isLoading={enviando} className="flex-shrink-0">
          Activar
        </Button>
      )}
    </div>
  );
}
