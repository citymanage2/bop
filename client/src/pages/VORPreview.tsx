import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEstimate, getVORPreview, generateVOR } from '../api/client';
import VORTable from '../components/VORTable';

export default function VORPreview() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<any>(null);
  const [vorData, setVorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [groupBySection, setGroupBySection] = useState(true);
  const [includeSourceCode, setIncludeSourceCode] = useState(true);
  const [mergeIdenticalWorks, setMergeIdenticalWorks] = useState(false);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  useEffect(() => {
    if (id) loadPreview();
  }, [groupBySection, includeSourceCode, mergeIdenticalWorks]);

  const loadData = async (estimateId: string) => {
    try {
      const [estData, previewData] = await Promise.all([
        getEstimate(estimateId),
        getVORPreview(estimateId),
      ]);
      setEstimate(estData.estimate);
      setVorData(previewData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    if (!id) return;
    try {
      const data = await getVORPreview(id, {
        groupBySection: String(groupBySection),
        includeSourceCode: String(includeSourceCode),
        mergeIdenticalWorks: String(mergeIdenticalWorks),
      });
      setVorData(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExport = async (format: 'xlsx' | 'docx') => {
    if (!id) return;
    setExporting(true);
    try {
      const result = await generateVOR(id, {
        groupBySection,
        includeSourceCode,
        mergeIdenticalWorks,
        exportFormat: format,
      });
      // Download the file
      window.open(result.downloadUrl, '_blank');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={`/estimate/${id}`} className="text-blue-600 hover:text-blue-800 text-sm">&larr; К смете</Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ведомость объёмов работ (ВОР)</h1>
          {estimate && (
            <p className="text-gray-600 text-sm mt-0.5">{estimate.name}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('xlsx')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            Скачать XLSX
          </button>
          <button
            onClick={() => handleExport('docx')}
            disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            Скачать DOCX
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Options */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <p className="text-sm font-medium text-gray-700 mb-2">Настройки</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={groupBySection} onChange={e => setGroupBySection(e.target.checked)} />
            Группировка по разделам
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeSourceCode} onChange={e => setIncludeSourceCode(e.target.checked)} />
            Код расценки в примечании
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mergeIdenticalWorks} onChange={e => setMergeIdenticalWorks(e.target.checked)} />
            Объединять одинаковые работы
          </label>
        </div>
      </div>

      {/* Preview table */}
      {vorData && (
        <VORTable rows={vorData.rows} totalWorks={vorData.totalWorks} />
      )}
    </div>
  );
}
