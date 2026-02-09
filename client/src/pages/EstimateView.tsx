import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEstimate } from '../api/client';
import EstimateTable from '../components/EstimateTable';

export default function EstimateView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadEstimate(id);
  }, [id]);

  const loadEstimate = async (estimateId: string) => {
    try {
      const data = await getEstimate(estimateId);
      setEstimate(data.estimate);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p className="font-medium">Ошибка загрузки сметы</p>
        <p className="text-sm">{error || 'Смета не найдена'}</p>
        <button onClick={() => navigate('/')} className="mt-2 text-sm underline">
          Вернуться к загрузке
        </button>
      </div>
    );
  }

  const totalItems = estimate.sections.reduce((sum: number, s: any) => sum + s.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">&larr; Назад</Link>
          </div>
          <h1 className="text-xl font-bold text-gray-800">{estimate.name || 'Локальный сметный расчёт'}</h1>
          {estimate.object && (
            <p className="text-gray-600 text-sm mt-0.5">Объект: {estimate.object}</p>
          )}
        </div>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono uppercase">
          {estimate.sourceFormat}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <InfoCard label="Разделов" value={estimate.sections.length} />
        <InfoCard label="Позиций" value={totalItems} />
        <InfoCard label="Прямые затраты" value={formatCurrency(estimate.totals.directCost)} />
        <InfoCard label="Всего" value={formatCurrency(estimate.totals.total)} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Link
          to={`/estimate/${id}/decompose`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Декомпозиция расценок
        </Link>
        <Link
          to={`/estimate/${id}/vor`}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          Сформировать ВОР
        </Link>
        <Link
          to={`/estimate/${id}/materials`}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
        >
          Список материалов
        </Link>
      </div>

      {/* Estimate table */}
      <EstimateTable estimate={estimate} />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (!n) return '0.00';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
