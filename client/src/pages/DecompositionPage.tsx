import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEstimate, decomposeEstimate } from '../api/client';
import WorkDecomposition from '../components/WorkDecomposition';

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
      // Reload estimate to get updated works
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
    return <div className="text-red-600">Смета не найдена</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={`/estimate/${id}`} className="text-blue-600 hover:text-blue-800 text-sm">&larr; К смете</Link>
      </div>

      <h1 className="text-xl font-bold text-gray-800">Декомпозиция расценок</h1>
      <p className="text-gray-600 text-sm">
        Разбор составных расценок на отдельные виды работ для формирования ВОР
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium">Декомпозиция завершена</p>
          <div className="flex gap-4 mt-1 text-xs">
            <span>Всего: {result.totalItems}</span>
            <span>Из кэша: {result.fromCache}</span>
            <span>Из AI: {result.fromAI}</span>
            <span>Из парсинга: {result.fromParsed}</span>
          </div>
          {result.warnings?.length > 0 && (
            <ul className="mt-2 text-xs list-disc list-inside text-yellow-700">
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
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          Сформировать ВОР
        </Link>
      </div>
    </div>
  );
}
