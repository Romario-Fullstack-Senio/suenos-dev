'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

type TipoPregunta = 'opcion_unica' | 'verdadero_falso' | 'seleccion_multiple';

interface Pregunta {
  id: string;
  enunciado: string;
  opciones: string[];
  tipo: TipoPregunta;
}

interface Quiz {
  id: string;
  titulo: string;
  cursoId: string;
  puntajeMinimo: number;
  preguntas: Pregunta[];
}

interface QuizResult {
  intentoId: string;
  puntaje: number;
  aprobado: boolean;
}

export default function QuizPage() {
  const params = useParams();
  const cursoId = params.cursoId as string;
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  // Índices seleccionados por pregunta — un solo elemento para opción
  // única/verdadero-falso, uno o más para selección múltiple.
  const [respuestas, setRespuestas] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [cursoId]);

  async function loadQuiz() {
    try {
      const data = await apiGet(`/quizzes/${cursoId}`) as Quiz;
      if (data.id) {
        setQuiz(data);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  }

  function seleccionarUnica(preguntaId: string, indice: number) {
    setRespuestas(prev => ({ ...prev, [preguntaId]: [indice] }));
  }

  function toggleMultiple(preguntaId: string, indice: number) {
    setRespuestas(prev => {
      const actuales = prev[preguntaId] ?? [];
      const yaMarcada = actuales.includes(indice);
      return {
        ...prev,
        [preguntaId]: yaMarcada ? actuales.filter(i => i !== indice) : [...actuales, indice],
      };
    });
  }

  async function handleSubmit() {
    if (!quiz || !user) return;
    setSubmitting(true);

    try {
      // El backend espera un array por pregunta (number[][]), en el MISMO
      // orden que quiz.preguntas — cada uno con los índices seleccionados.
      const respuestasArray = quiz.preguntas.map((pregunta) => respuestas[pregunta.id] ?? []);

      const data = await apiPost('/quizzes/resolver', {
        quizId: quiz.id,
        estudianteId: user.id,
        respuestas: respuestasArray,
      }) as QuizResult;

      setResult(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar el quiz');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-muted">Cargando quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-ink-muted">No hay quiz disponible para este curso</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-cloud-100 rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-ink mb-4">
            {result.aprobado ? '🎉 ¡Felicidades!' : '😔 No aprobado'}
          </h1>
          <p className="text-ink-muted mb-2">Tu puntaje:</p>
          <p className="text-4xl font-bold text-primary mb-4">{result.puntaje}%</p>
          <p className="text-ink-muted mb-6">
            {result.aprobado
              ? 'Has aprobado el quiz. ¡Sigue adelante!'
              : `Necesitas al menos ${quiz.puntajeMinimo}% para aprobar. Intenta de nuevo.`}
          </p>
          <Button onClick={() => window.history.back()}>
            Volver al curso
          </Button>
        </div>
      </div>
    );
  }

  const todasRespondidas = quiz.preguntas.every(p => (respuestas[p.id] ?? []).length > 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-ink mb-2">{quiz.titulo}</h1>
        <p className="text-ink-muted mb-8">
          Puntaje mínimo: {quiz.puntajeMinimo}%
        </p>

        <div className="space-y-6">
          {quiz.preguntas.map((pregunta, index) => {
            const esMultiple = pregunta.tipo === 'seleccion_multiple';
            const seleccionadas = respuestas[pregunta.id] ?? [];
            return (
              <div key={pregunta.id} className="bg-cloud-100 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <p className="font-medium text-ink">
                    {index + 1}. {pregunta.enunciado}
                  </p>
                  {esMultiple && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Selección múltiple
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {pregunta.opciones.map((opcion, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        seleccionadas.includes(i)
                          ? 'border-primary bg-primary/5'
                          : 'border-ink/[0.07] hover:border-primary/30'
                      }`}
                    >
                      <input
                        type={esMultiple ? 'checkbox' : 'radio'}
                        name={pregunta.id}
                        checked={seleccionadas.includes(i)}
                        onChange={() => (esMultiple ? toggleMultiple(pregunta.id, i) : seleccionarUnica(pregunta.id, i))}
                        className="flex-shrink-0"
                      />
                      {opcion}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={!todasRespondidas || submitting}
            className="w-full"
          >
            {submitting ? 'Enviando...' : 'Enviar respuestas'}
          </Button>
        </div>
      </div>
    </div>
  );
}
