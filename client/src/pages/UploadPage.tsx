import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import { uploadEstimate, getEstimates, deleteEstimate, type EstimateSummary } from '../api/client';

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
      // ignore — server may not be running
    }
  };

  const handleFileSelected = async (file: File) => {
    setError(null);
    setWarnings([]);
    setIsUploading(true);

    try {
      const result = await uploadEstimate(file);

      if (result.parseWarnings?.length > 0) {
        setWarnings(result.parseWarnings);
      }

      // Navigate to estimate view
      navigate(`/estimate/${result.estimateId}`);
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Загрузка сметы</h1>
        <p className="text-gray-600">
          Загрузите файл сметы ГрандСмета для формирования ВОР и списка материалов
        </p>
      </div>

      <FileUploader onFileSelected={handleFileSelected} isUploading={isUploading} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Ошибка</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Предупреждения</p>
          <ul className="text-sm list-disc list-inside mt-1">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Previously uploaded estimates */}
      {estimates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Ранее загруженные сметы</h2>
          <div className="space-y-2">
            {estimates.map(est => (
              <div
                key={est.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-blue-300 transition-colors"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => navigate(`/estimate/${est.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{est.name || est.fileName}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono uppercase">
                      {est.format}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                    <span>{est.sectionsCount} разд.</span>
                    <span>{est.itemsCount} позиций</span>
                    <span>{formatFileSize(est.fileSize)}</span>
                    <span>{new Date(est.uploadedAt).toLocaleString('ru-RU')}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(est.id); }}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Удалить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
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
