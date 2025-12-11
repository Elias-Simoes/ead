import { useState } from 'react'
import api from '../services/api'

export interface LessonResource {
  id?: string
  type: 'image' | 'pdf' | 'video' | 'link'
  title: string
  description?: string
  url?: string
  file?: File
  fileSize?: number
  mimeType?: string
}

interface LessonResourcesManagerProps {
  lessonId?: string
  resources: LessonResource[]
  onChange: (resources: LessonResource[]) => void
}

export const LessonResourcesManager = ({ resources, onChange }: LessonResourcesManagerProps) => {
  const [uploading, setUploading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newResource, setNewResource] = useState<LessonResource>({
    type: 'image',
    title: '',
    description: '',
  })

  const handleAddResource = async () => {
    if (!newResource.title) {
      alert('Por favor, adicione um título para o recurso')
      return
    }

    if (newResource.type !== 'link' && !newResource.file) {
      alert('Por favor, selecione um arquivo')
      return
    }

    if (newResource.type === 'link' && !newResource.url) {
      alert('Por favor, adicione uma URL')
      return
    }

    try {
      setUploading(true)

      // Se for arquivo, fazer upload
      if (newResource.file) {
        const formData = new FormData()
        formData.append('file', newResource.file)

        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        newResource.url = uploadRes.data.data.url
        newResource.fileSize = newResource.file.size
        newResource.mimeType = newResource.file.type
      }

      // Adicionar à lista
      onChange([...resources, { ...newResource }])

      // Resetar formulário
      setNewResource({
        type: 'image',
        title: '',
        description: '',
      })
      setShowAddForm(false)
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Erro ao adicionar recurso')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveResource = (index: number) => {
    if (confirm('Deseja remover este recurso?')) {
      const updated = resources.filter((_, i) => i !== index)
      onChange(updated)
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️'
      case 'pdf': return '📄'
      case 'video': return '🎥'
      case 'link': return '🔗'
      default: return '📎'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Lista de Recursos */}
      {resources.length > 0 && (
        <div className="space-y-2">
          {resources.map((resource, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                  {resource.description && (
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  )}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span className="capitalize">{resource.type}</span>
                    {resource.fileSize && (
                      <>
                        <span>•</span>
                        <span>{formatFileSize(resource.fileSize)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveResource(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão Adicionar */}
      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium"
        >
          + Adicionar Recurso
        </button>
      )}

      {/* Formulário de Adicionar */}
      {showAddForm && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
          <h4 className="font-semibold text-gray-900">Novo Recurso</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Recurso
            </label>
            <select
              value={newResource.type}
              onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="image">Imagem</option>
              <option value="pdf">PDF</option>
              <option value="video">Vídeo</option>
              <option value="link">Link Externo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={newResource.title}
              onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Diagrama de Arquitetura"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrição opcional"
            />
          </div>

          {newResource.type === 'link' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL *
              </label>
              <input
                type="url"
                value={newResource.url || ''}
                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://exemplo.com"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo *
              </label>
              <input
                type="file"
                accept={
                  newResource.type === 'image' ? 'image/*' :
                  newResource.type === 'pdf' ? '.pdf' :
                  newResource.type === 'video' ? 'video/*' : '*'
                }
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setNewResource({ ...newResource, file })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {newResource.file && (
                <p className="text-sm text-gray-600 mt-1">
                  {newResource.file.name} ({formatFileSize(newResource.file.size)})
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewResource({ type: 'image', title: '', description: '' })
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              disabled={uploading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddResource}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? 'Enviando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
