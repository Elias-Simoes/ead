import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface PaymentMetrics {
  conversionRateByMethod: {
    card: {
      total: number;
      successful: number;
      rate: number;
    };
    pix: {
      total: number;
      successful: number;
      rate: number;
    };
  };
  installmentDistribution: {
    [key: number]: number;
  };
  pixMetrics: {
    averageConfirmationTime: number;
    expirationRate: number;
    averageDiscount: number;
  };
  totalRevenue: {
    card: number;
    pix: number;
    total: number;
  };
  period: {
    start: string;
    end: string;
  };
}

interface PaymentMethodStats {
  method: 'card' | 'pix';
  count: number;
  totalAmount: number;
  averageAmount: number;
}

const PaymentMetricsDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<PaymentMetrics | null>(null);
  const [stats, setStats] = useState<PaymentMethodStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchMetrics();
  }, [dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');

      const [metricsResponse, statsResponse] = await Promise.all([
        api.get('/admin/payments/metrics', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        }),
        api.get('/admin/payments/stats', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          },
        }),
      ]);

      setMetrics(metricsResponse.data.data);
      setStats(statsResponse.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Carregando métricas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard de Métricas de Pagamento</h1>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Período</h2>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Data Inicial</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Data Final</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(metrics.totalRevenue.total)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Receita Cartão</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(metrics.totalRevenue.card)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Receita PIX</h3>
          <p className="text-3xl font-bold text-purple-600">
            {formatCurrency(metrics.totalRevenue.pix)}
          </p>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Taxa de Conversão por Método</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Cartão de Crédito</h3>
            <div className="space-y-2">
              <p>Total de tentativas: {metrics.conversionRateByMethod.card.total}</p>
              <p>Pagamentos bem-sucedidos: {metrics.conversionRateByMethod.card.successful}</p>
              <p className="text-2xl font-bold text-blue-600">
                Taxa: {metrics.conversionRateByMethod.card.rate.toFixed(2)}%
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">PIX</h3>
            <div className="space-y-2">
              <p>Total de tentativas: {metrics.conversionRateByMethod.pix.total}</p>
              <p>Pagamentos bem-sucedidos: {metrics.conversionRateByMethod.pix.successful}</p>
              <p className="text-2xl font-bold text-purple-600">
                Taxa: {metrics.conversionRateByMethod.pix.rate.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Installment Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Distribuição de Parcelas</h2>
        <div className="space-y-2">
          {Object.entries(metrics.installmentDistribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([installments, count]) => (
              <div key={installments} className="flex justify-between items-center">
                <span>{installments}x</span>
                <div className="flex items-center gap-4">
                  <div className="w-64 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{
                        width: `${
                          (count /
                            Math.max(
                              ...Object.values(metrics.installmentDistribution)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold w-16 text-right">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* PIX Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Métricas PIX</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Tempo Médio de Confirmação</h3>
            <p className="text-2xl font-bold text-purple-600">
              {formatTime(metrics.pixMetrics.averageConfirmationTime)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Taxa de Expiração</h3>
            <p className="text-2xl font-bold text-red-600">
              {metrics.pixMetrics.expirationRate.toFixed(2)}%
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Desconto Médio Utilizado</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.pixMetrics.averageDiscount)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Estatísticas por Método</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Método</th>
                <th className="text-right py-3 px-4">Quantidade</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-right py-3 px-4">Ticket Médio</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.method} className="border-b">
                  <td className="py-3 px-4">
                    {stat.method === 'card' ? 'Cartão de Crédito' : 'PIX'}
                  </td>
                  <td className="text-right py-3 px-4">{stat.count}</td>
                  <td className="text-right py-3 px-4">
                    {formatCurrency(stat.totalAmount)}
                  </td>
                  <td className="text-right py-3 px-4">
                    {formatCurrency(stat.averageAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentMetricsDashboardPage;
