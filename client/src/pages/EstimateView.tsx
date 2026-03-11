import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEstimate } from '../api/client';
import EstimateTable from '../components/EstimateTable';
import { ArrowLeft, Layers, Hash, Banknote, Sigma, SplitSquareVertical, ClipboardList, Package } from 'lucide-react';

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
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
        <p className="font-medium">Ошибка загрузки сметы</p>
        <p className="text-sm">{error || 'Смета не найдена'}</p>
        <button onClick={() => navigate('/')} className="mt-2 text-sm text-blue-400 hover:text-blue-300 underline">
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
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Назад
          </Link>
          <h1 className="text-xl font-bold text-gray-100">{estimate.name || 'Локальный сметный расчёт'}</h1>
          {estimate.object && (
            <p className="text-gray-400 text-sm mt-0.5">Объект: {estimate.object}</p>
          )}
        </div>
        <span className="px-2 py-1 bg-[#2E3033] text-gray-400 text-xs rounded-lg font-mono uppercase border border-[#444]">
          {estimate.sourceFormat}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard icon={<Layers className="w-4 h-4 text-blue-400" />} label="Разделов" value={estimate.sections.length} />
        <InfoCard icon={<Hash className="w-4 h-4 text-purple-400" />} label="Позиций" value={totalItems} />
        <InfoCard icon={<Banknote className="w-4 h-4 text-emerald-400" />} label="Прямые затраты" value={formatCurrency(estimate.totals.directCost)} />
        <InfoCard icon={<Sigma className="w-4 h-4 text-amber-400" />} label="Всего" value={formatCurrency(estimate.totals.total)} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <Link
          to={`/estimate/${id}/decompose`}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <SplitSquareVertical className="w-4 h-4" /> Декомпозиция расценок
        </Link>
        <Link
          to={`/estimate/${id}/vor`}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> Сформировать ВОР
        </Link>
        <Link
          to={`/estimate/${id}/materials`}
          className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Package className="w-4 h-4" /> Список материалов
        </Link>
      </div>

      {/* Estimate table */}
      <EstimateTable estimate={estimate} />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-[#1F2023] border border-[#333] rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-lg font-semibold text-gray-100">{value}</p>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (!n) return '0.00';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
