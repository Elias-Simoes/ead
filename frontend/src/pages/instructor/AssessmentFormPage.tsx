import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import api from '../../services/api';
import QuestionEditor from '../../components/QuestionEditor';
import { Assessment, Question, CreateQuestionData, UpdateQuestionData } from '../../types';

const AssessmentFormPage: React.FC = () => {
  const { courseId, assessmentId } = useParams<{ courseId: string; assessmentId?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dados da avaliação
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Estado de edição
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/assessments/${assessmentId}`);
      const assessment: Assessment = response.data.data;
      
      setTitle(assessment.title);
      setPassingScore(assessment.passingScore);
      setQuestions(assessment.questions || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    try {
      setSaving(true);
      setError('');

      if (!title.trim()) {
        setError('O título é obrigatório');
        return;
      }

      if (passingScore < 0 || passingScore > 100) {
        setError('A nota de corte deve estar entre 0 e 100');
        return;
      }

      if (assessmentId) {
        // Atualizar avaliação existente
        await api.patch(`/assessments/${assessmentId}`, {
          title,
          passing_score: passingScore,
        });
        setSuccess('Avaliação atualizada com sucesso!');
      } else {
        // Criar nova avaliação
        const response = await api.post(`/courses/${courseId}/assessments`, {
          title,
          type: 'multiple_choice',
          passing_score: passingScore,
        });
        
        const newAssessmentId = response.data.data.id;
        setSuccess('Avaliação criada com sucesso!');
        
        // Redirecionar para edição
        navigate(`/instructor/courses/${courseId}/assessments/${newAssessmentId}/edit`, { replace: true });
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar avaliação');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = async (data: CreateQuestionData | UpdateQuestionData) => {
    try {
      setSaving(true);
      setError('');

      if (!assessmentId) {
        setError('Salve a avaliação antes de adicionar questões');
        return;
      }

      const response = await api.post(`/assessments/${assessmentId}/questions`, data);
      const newQuestion: Question = response.data.data;
      
      setQuestions([...questions, newQuestion]);
      setShowNewQuestionForm(false);
      setSuccess('Questão adicionada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao adicionar questão');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (questionId: string, data: UpdateQuestionData) => {
    try {
      setSaving(true);
      setError('');

      const response = await api.patch(`/questions/${questionId}`, data);
      const updatedQuestion = response.data.data.question;
      
      // Atualizar lista local com os dados retornados do backend
      setQuestions(questions.map(q => 
        q.id === questionId ? updatedQuestion : q
      ));
      
      setEditingQuestionIndex(null);
      setSuccess('Questão atualizada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao atualizar questão');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');

      await api.delete(`/questions/${questionId}`);
      
      setQuestions(questions.filter(q => q.id !== questionId));
      setSuccess('Questão excluída com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao excluir questão');
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/instructor/courses/${courseId}/assessments`)}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Voltar para avaliações
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {assessmentId ? 'Editar Avaliação' : 'Nova Avaliação'}
        </h1>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-600">
          {success}
        </div>
      )}

      {/* Formulário da Avaliação */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Informações da Avaliação
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título da Avaliação
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Avaliação Final - Módulo 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nota de Corte (%)
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Nota mínima para aprovação
            </p>
          </div>

          <button
            onClick={handleSaveAssessment}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Salvando...' : assessmentId ? 'Atualizar Avaliação' : 'Criar Avaliação'}
          </button>
        </div>
      </div>

      {/* Questões */}
      {assessmentId && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Questões</h2>
              <p className="text-sm text-gray-600">
                Total de pontos: {totalPoints} | Questões: {questions.length}
              </p>
            </div>
            {!showNewQuestionForm && (
              <button
                onClick={() => setShowNewQuestionForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                + Nova Questão
              </button>
            )}
          </div>

          {/* Formulário de nova questão */}
          {showNewQuestionForm && (
            <QuestionEditor
              questionNumber={questions.length + 1}
              onSave={handleAddQuestion}
              onCancel={() => setShowNewQuestionForm(false)}
            />
          )}

          {/* Lista de questões */}
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id}>
                {editingQuestionIndex === index ? (
                  <QuestionEditor
                    question={question}
                    questionNumber={index + 1}
                    onSave={(data) => handleUpdateQuestion(question.id, data)}
                    onCancel={() => setEditingQuestionIndex(null)}
                    onDelete={() => handleDeleteQuestion(question.id)}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Questão {index + 1}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingQuestionIndex(index)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-800 mb-3">{question.text}</p>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      Pontos: {question.points}
                    </div>

                    {question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              optIndex === question.correctAnswer
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            {option}
                            {optIndex === question.correctAnswer && (
                              <span className="ml-2 text-green-600 text-sm">✓ Correta</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {questions.length === 0 && !showNewQuestionForm && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">Nenhuma questão adicionada ainda</p>
              <button
                onClick={() => setShowNewQuestionForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Adicionar Primeira Questão
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default AssessmentFormPage;
