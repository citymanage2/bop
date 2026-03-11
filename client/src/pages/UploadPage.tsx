import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EstimatePromptBox, type EstimateMode } from '../components/ui/ai-prompt-box';
import { uploadEstimate, recognizeScan, getEstimates, deleteEstimate, type EstimateSummary } from '../api/client';
import { FileSpreadsheet, Trash2, Clock, Layers, Hash } from 'lucide-react';

export default function UploadPage() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [estimates, setEstimates] = useState<EstimateSummary[]>([]);

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    try {
      const data = await getEstimates();
      setEstimates(data.estimates);
    } catch {
      // ignore
    }
  };

  const handleFileSelected = async (file: File, mode: EstimateMode) => {
    setError(null);
    setWarnings([]);
    setIsUploading(true);

    try {
      if (mode === 'scan') {
        const result = await recognizeScan(file);
        if (result.warnings?.length > 0) setWarnings(result.warnings);
        window.open(result.downloadUrl, '_blank');
      } else {
        const result = await uploadEstimate(file);
        if (result.parseWarnings?.length > 0) setWarnings(result.parseWarnings);
        navigate(`/estimate/${result.estimateId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEstimate(id);
      setEstimates(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Hero section */}
      <div className="w-full max-w-2xl mx-auto pt-12 pb-8 text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-3">
          Сметный парсер
        </h1>
        <p className="text-gray-400 text-sm">
          Загрузите смету ГрандСмета, скан или PDF для формирования ВОР и списка материалов
        </p>
      </div>

      {/* Prompt box */}
      <div className="w-full max-w-2xl mx-auto">
        <EstimatePromptBox
          onFileSelected={handleFileSelected}
          isLoading={isUploading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl mx-auto mt-4 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          <p className="font-medium text-sm">Ошибка</p>
          <p className="text-sm mt-0.5">{error}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mt-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl">
          <p className="font-medium text-sm">Предупреждения</p>
          <ul className="text-sm list-disc list-inside mt-1">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Previously uploaded estimates */}
      {estimates.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mt-8">
          <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Ранее загруженные</h2>
          <div className="space-y-2">
            {estimates.map(est => (
              <div
                key={est.id}
                className="flex items-center justify-between bg-[#1F2023] border border-[#333] rounded-xl px-4 py-3 hover:border-[#555] transition-colors group"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/estimate/${est.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="font-medium text-gray-200">{est.name || est.fileName}</span>
                    <span className="px-1.5 py-0.5 bg-[#2E3033] text-gray-400 text-xs rounded font-mono uppercase">
                      {est.format}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-3 ml-6">
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{est.sectionsCount} разд.</span>
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{est.itemsCount} позиций</span>
                    <span>{formatFileSize(est.fileSize)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(est.uploadedAt).toLocaleString('ru-RU')}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(est.id); }}
                  className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}
