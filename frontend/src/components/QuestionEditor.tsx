import React, { useState, useEffect } from 'react';
import { Question, CreateQuestionData, UpdateQuestionData } from '../types';

interface QuestionEditorProps {
  question?: Question;
  onSave: (data: CreateQuestionData | UpdateQuestionData) => void;
  onCancel: () => void;
  onDelete?: () => void;
  questionNumber: number;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question,
  onSave,
  onCancel,
  onDelete,
  questionNumber,
}) => {
  const [formData, setFormData] = useState({
    text: question?.text || '',
    type: question?.type || 'multiple_choice' as const,
    options: question?.options || ['', '', '', ''],
    correct_answer: question?.correctAnswer ?? 0,
  });

  // Atualizar formData quando a questão mudar
  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text || '',
        type: question.type || 'multiple_choice',
        options: question.options || ['', '', '', ''],
        correct_answer: question.correctAnswer ?? 0,
      });
    }
  }, [question]);

  const [errors, setErrors] = useState<string[]>([]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData({
        ...formData,
        options: [...formData.options, ''],
      });
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        options: newOptions,
        correct_answer: formData.correct_answer >= newOptions.length ? 0 : formData.correct_answer,
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.text.trim()) {
      newErrors.push('O texto da questão é obrigatório');
    }

    if (formData.type === 'multiple_choice') {
      const filledOptions = formData.options.filter(opt => opt.trim());
      if (filledOptions.length < 2) {
        newErrors.push('É necessário pelo menos 2 opções preenchidas');
      }

      if (formData.correct_answer >= formData.options.length) {
        newErrors.push('Resposta correta inválida');
      }

      if (!formData.options[formData.correct_answer]?.trim()) {
        newErrors.push('A resposta correta não pode estar vazia');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateQuestionData | UpdateQuestionData = {
      text: formData.text.trim(),
      type: formData.type,
      points: 0, // Será recalculado automaticamente pelo backend
      order_index: question?.order || questionNumber,
    };

    if (formData.type === 'multiple_choice') {
      data.options = formData.options.filter(opt => opt.trim());
      data.correct_answer = formData.correct_answer;
    }

    onSave(data);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Questão {questionNumber}
        </h3>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-600 hover:text-red-800"
          >
            Excluir
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Texto da questão */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Texto da Questão
          </label>
          <textarea
            value={formData.text}
            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Digite o enunciado da questão..."
          />
        </div>

        {/* Opções de múltipla escolha */}
        {formData.type === 'multiple_choice' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opções de Resposta
            </label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correct_answer"
                    checked={formData.correct_answer === index}
                    onChange={() => setFormData({ ...formData, correct_answer: index })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Opção ${index + 1}`}
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {formData.options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                + Adicionar opção
              </button>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Selecione o círculo ao lado da resposta correta
            </p>
          </div>
        )}

        {/* Erros */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <ul className="list-disc list-inside text-sm text-red-600">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {question ? 'Atualizar' : 'Adicionar'} Questão
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionEditor;
