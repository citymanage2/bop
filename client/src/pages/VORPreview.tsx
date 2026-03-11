import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEstimate, getVORPreview, generateVOR } from '../api/client';
import VORTable from '../components/VORTable';
import { ArrowLeft, Download, ClipboardList } from 'lucide-react';

export default function VORPreview() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<any>(null);
  const [vorData, setVorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        groupBySection, includeSourceCode, mergeIdenticalWorks, exportFormat: format,
      });
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
      <Link to={`/estimate/${id}`} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> К смете
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-400" />
            Ведомость объёмов работ (ВОР)
          </h1>
          {estimate && <p className="text-gray-400 text-sm mt-0.5">{estimate.name}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('xlsx')} disabled={exporting}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> XLSX
          </button>
          <button onClick={() => handleExport('docx')} disabled={exporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition-colors">
            <Download className="w-4 h-4" /> DOCX
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Options */}
      <div className="bg-[#1F2023] border border-[#333] rounded-xl px-4 py-3">
        <p className="text-sm font-medium text-gray-300 mb-2">Настройки</p>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={groupBySection} onChange={e => setGroupBySection(e.target.checked)}
              className="rounded border-[#555] bg-[#2E3033] text-blue-500" />
            Группировка по разделам
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={includeSourceCode} onChange={e => setIncludeSourceCode(e.target.checked)}
              className="rounded border-[#555] bg-[#2E3033] text-blue-500" />
            Код расценки в примечании
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={mergeIdenticalWorks} onChange={e => setMergeIdenticalWorks(e.target.checked)}
              className="rounded border-[#555] bg-[#2E3033] text-blue-500" />
            Объединять одинаковые работы
          </label>
        </div>
      </div>

      {vorData && <VORTable rows={vorData.rows} totalWorks={vorData.totalWorks} />}
    </div>
  );
}
