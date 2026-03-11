import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEstimate, decomposeEstimate } from '../api/client';
import WorkDecomposition from '../components/WorkDecomposition';
import { ArrowLeft, SplitSquareVertical, ClipboardList, CheckCircle2 } from 'lucide-react';

export default function DecompositionPage() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadEstimate(id);
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

  const handleDecompose = async () => {
    if (!id) return;
    setIsDecomposing(true);
    setError(null);

    try {
      const decompResult = await decomposeEstimate(id);
      setResult(decompResult);
      await loadEstimate(id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDecomposing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!estimate) {
    return <div className="text-red-400">Смета не найдена</div>;
  }

  return (
    <div className="space-y-6">
      <Link to={`/estimate/${id}`} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> К смете
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <SplitSquareVertical className="w-5 h-5 text-blue-400" />
          Декомпозиция расценок
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Разбор составных расценок на отдельные виды работ для формирования ВОР
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          <p className="font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Декомпозиция завершена
          </p>
          <div className="flex gap-4 mt-1 text-xs text-emerald-300/70">
            <span>Всего: {result.totalItems}</span>
            <span>Из кэша: {result.fromCache}</span>
            <span>Из AI: {result.fromAI}</span>
            <span>Из парсинга: {result.fromParsed}</span>
          </div>
          {result.warnings?.length > 0 && (
            <ul className="mt-2 text-xs list-disc list-inside text-yellow-400">
              {result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          )}
        </div>
      )}

      <WorkDecomposition
        estimate={estimate}
        onDecompose={handleDecompose}
        isDecomposing={isDecomposing}
      />

      <div className="flex gap-3">
        <Link
          to={`/estimate/${id}/vor`}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <ClipboardList className="w-4 h-4" /> Сформировать ВОР
        </Link>
      </div>
    </div>
  );
}
