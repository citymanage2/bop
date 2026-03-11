import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEstimate, getMaterialsPreview, generateMaterials } from '../api/client';
import MaterialsTable from '../components/MaterialsTable';
import { ArrowLeft, Download, Package } from 'lucide-react';

export default function MaterialsPreview() {
  const { id } = useParams<{ id: string }>();
  const [estimate, setEstimate] = useState<any>(null);
  const [materialsData, setMaterialsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupBy, setGroupBy] = useState<'flat' | 'section' | 'type'>('flat');
  const [mergeIdentical, setMergeIdentical] = useState(true);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  useEffect(() => {
    if (id) loadPreview();
  }, [groupBy, mergeIdentical]);

  const loadData = async (estimateId: string) => {
    try {
      const [estData, previewData] = await Promise.all([
        getEstimate(estimateId),
        getMaterialsPreview(estimateId),
      ]);
      setEstimate(estData.estimate);
      setMaterialsData(previewData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    if (!id) return;
    try {
      const data = await getMaterialsPreview(id, { groupBy, mergeIdentical: String(mergeIdentical) });
      setMaterialsData(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExport = async (format: 'xlsx' | 'docx') => {
    if (!id) return;
    setExporting(true);
    try {
      const result = await generateMaterials(id, { groupBy, mergeIdentical, exportFormat: format });
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
            <Package className="w-5 h-5 text-amber-400" />
            Список материалов
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
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            Группировка:
            <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)}
              className="bg-[#2E3033] border border-[#555] rounded-lg px-2 py-1 text-sm text-gray-200">
              <option value="flat">Без группировки</option>
              <option value="section">По разделам</option>
              <option value="type">По типу</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={mergeIdentical} onChange={e => setMergeIdentical(e.target.checked)}
              className="rounded border-[#555] bg-[#2E3033] text-blue-500" />
            Объединять одинаковые
          </label>
        </div>
      </div>

      {materialsData && (
        <MaterialsTable
          rows={materialsData.rows}
          totalCost={materialsData.totalCost}
          uniqueMaterials={materialsData.uniqueMaterials}
          unaccountedMaterials={materialsData.unaccountedMaterials}
        />
      )}
    </div>
  );
}
