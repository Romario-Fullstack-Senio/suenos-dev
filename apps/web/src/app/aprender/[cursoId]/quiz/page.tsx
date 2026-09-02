'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';

interface Pregunta {
  id: string;
  enunciado: string;
  opciones: string[];
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
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
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

  function handleRespuesta(preguntaId: string, opcion: string) {
    setRespuestas(prev => ({ ...prev, [preguntaId]: opcion }));
  }

  async function handleSubmit() {
    if (!quiz || !user) return;
    setSubmitting(true);

    try {
      const respuestasArray = Object.entries(respuestas).map(([preguntaId, respuesta]) => ({
        preguntaId,
        respuesta,
      }));

      const data = await apiPost('/quizzes/resolver', {
        quizId: quiz.id,
        estudianteId: user.id,
        respuestas: respuestasArray,
      }) as QuizResult;

      setResult(data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-suenos-deep flex items-center justify-center">
        <p className="text-suenos-muted">Cargando quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-suenos-deep flex items-center justify-center">
        <p className="text-suenos-muted">No hay quiz disponible para este curso</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-suenos-deep flex items-center justify-center p-4">
        <div className="bg-suenos-surface rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-suenos-text mb-4">
            {result.aprobado ? '🎉 ¡Felicidades!' : '😔 No aprobado'}
          </h1>
          <p className="text-suenos-muted mb-2">Tu puntaje:</p>
          <p className="text-4xl font-bold text-blue-600 mb-4">{result.puntaje}%</p>
          <p className="text-suenos-muted mb-6">
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

  return (
    <div className="min-h-screen bg-suenos-deep p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-suenos-text mb-2">{quiz.titulo}</h1>
        <p className="text-suenos-muted mb-8">
          Puntaje mínimo: {quiz.puntajeMinimo}%
        </p>

        <div className="space-y-6">
          {quiz.preguntas.map((pregunta, index) => (
            <div key={pregunta.id} className="bg-suenos-surface rounded-xl shadow-sm p-6">
              <p className="font-medium text-suenos-text mb-4">
                {index + 1}. {pregunta.enunciado}
              </p>
              <div className="space-y-2">
                {pregunta.opciones.map(opcion => (
                  <label
                    key={opcion}
                    className={`block p-3 rounded-lg border border-suenos-border cursor-pointer transition-colors ${
                      respuestas[pregunta.id] === opcion
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-suenos-border border-suenos-border hover:border-suenos-border border-suenos-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name={pregunta.id}
                      value={opcion}
                      checked={respuestas[pregunta.id] === opcion}
                      onChange={() => handleRespuesta(pregunta.id, opcion)}
                      className="sr-only"
                    />
                    {opcion}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(respuestas).length < quiz.preguntas.length || submitting}
            className="w-full"
          >
            {submitting ? 'Enviando...' : 'Enviar respuestas'}
          </Button>
        </div>
      </div>
    </div>
  );
}
