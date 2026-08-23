'use client';

import { useState } from 'react';

interface Pregunta {
  id: string;
  enunciado: string;
  opciones: string[];
}

interface QuizFormProps {
  preguntas: Pregunta[];
  onSubmit: (respuestas: Record<string, number>) => void;
}

export default function QuizForm({ preguntas, onSubmit }: QuizFormProps) {
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});

  const handleChange = (preguntaId: string, index: number) => {
    setRespuestas((prev) => ({ ...prev, [preguntaId]: index }));
  };

  return (
    <div className="space-y-6">
      {preguntas.map((p, i) => (
        <div key={p.id} className="bg-white rounded-xl p-6 shadow-sm border">
          <p className="font-medium mb-3">{i + 1}. {p.enunciado}</p>
          <div className="space-y-2">
            {p.opciones.map((opcion, idx) => (
              <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={p.id}
                  checked={respuestas[p.id] === idx}
                  onChange={() => handleChange(p.id, idx)}
                />
                {opcion}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={() => onSubmit(respuestas)}
        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
      >
        Enviar Respuestas
      </button>
    </div>
  );
}
