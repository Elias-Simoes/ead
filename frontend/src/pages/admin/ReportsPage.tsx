import { useState, useEffect } from 'react'
import { Navbar } from '../../components/Navbar'
import api from '../../services/api'

interface ReportData {
  subscriptions: {
    totalActive: number
    newThisMonth: number
    cancelledThisMonth: number
    retentionRate: number
    churnRate: number
  }
  courses: {
    totalPublished: number
    totalEnrollments: number
    averageCompletionRate: number
    mostAccessedCourses: Array<{
      courseId: string
      title: string
      accessCount: number
    }>
  }
  financial: {
    mrr: number
    totalRevenue: number
    averageRevenuePerUser: number
    projectedAnnualRevenue: number
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [reportType, setReportType] = useState<'overview' | 'subscriptions' | 'courses' | 'financial'>('overview')

  useEffect(() => {
    fetchReportData()
  }, [dateRange, reportType])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/reports/${reportType}`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      })
      setReportData(response.data.data || response.data || null)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await api.get('/admin/reports/export', {
        params: {
          format,
          type: reportType,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `relatorio-${reportType}-${Date.now()}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      alert('Erro ao exportar relatório')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-2 text-gray-600">Análise detalhada da plataforma</p>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Relatório
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Visão Geral</option>
                <option value="subscriptions">Assinaturas</option>
                <option value="courses">Cursos</option>
                <option value="financial">Financeiro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={() => handleExport('csv')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Exportar CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {reportData && (
          <>
            {/* Subscriptions Report */}
            {reportData.subscriptions && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Assinaturas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-sm text-gray-600">Total Ativas</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reportData.subscriptions.totalActive}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-600">Novas este Mês</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reportData.subscriptions.newThisMonth}
                    </p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <p className="text-sm text-gray-600">Canceladas este Mês</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reportData.subscriptions.cancelledThisMonth}
                    </p>
                  </div>
                  <div className="border-l-4 border-teal-500 pl-4">
                    <p className="text-sm text-gray-600">Taxa de Retenção</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(reportData.subscriptions.retentionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <p className="text-sm text-gray-600">Taxa de Churn</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(reportData.subscriptions.churnRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Report */}
            {reportData.courses && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Cursos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="text-sm text-gray-600">Total Publicados</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reportData.courses.totalPublished}
                    </p>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <p className="text-sm text-gray-600">Total de Matrículas</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {reportData.courses.totalEnrollments}
                    </p>
                  </div>
                  <div className="border-l-4 border-pink-500 pl-4">
                    <p className="text-sm text-gray-600">Taxa Média de Conclusão</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {(reportData.courses.averageCompletionRate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {reportData.courses.mostAccessedCourses && reportData.courses.mostAccessedCourses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cursos Mais Acessados</h3>
                    <div className="space-y-2">
                      {reportData.courses.mostAccessedCourses.map((course, idx) => (
                        <div key={course.courseId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold mr-3">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-gray-900">{course.title}</span>
                          </div>
                          <span className="text-gray-600">{course.accessCount} acessos</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Financial Report */}
            {reportData.financial && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Financeiro</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="border-l-4 border-emerald-500 pl-4">
                    <p className="text-sm text-gray-600">MRR</p>
                    <p className="text-3xl font-bold text-gray-900">
                      R$ {reportData.financial.mrr.toFixed(2)}
                    </p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-3xl font-bold text-gray-900">
                      R$ {reportData.financial.totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="border-l-4 border-cyan-500 pl-4">
                    <p className="text-sm text-gray-600">Receita Média por Usuário</p>
                    <p className="text-3xl font-bold text-gray-900">
                      R$ {reportData.financial.averageRevenuePerUser.toFixed(2)}
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="text-sm text-gray-600">Projeção Anual</p>
                    <p className="text-3xl font-bold text-gray-900">
                      R$ {reportData.financial.projectedAnnualRevenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
