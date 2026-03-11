import { useState, useCallback } from 'react';
import { recognizeScan, type ScanRecognizeResult } from '../api/client';
import { ScanLine, FileDown, Upload, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ACCEPTED_FORMATS = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,.bmp';

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanRecognizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setResult(null);
    setError(null);

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    setFile(dropped);
    setResult(null);
    setError(null);

    if (dropped.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(dropped);
    } else {
      setPreview(null);
    }
  }, []);

  const handleRecognize = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await recognizeScan(file);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Ошибка распознавания');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const confidenceLabel = (c: string) => {
    switch (c) {
      case 'high': return { text: 'Высокая', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'medium': return { text: 'Средняя', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
      case 'low': return { text: 'Низкая', cls: 'text-red-400 bg-red-500/10 border-red-500/30' };
      default: return { text: c, cls: 'text-gray-400 bg-gray-500/10 border-gray-500/30' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-purple-400" />
          Распознавание скана
        </h1>
        <p className="text-gray-400 text-sm">
          Загрузите скан сметы (PDF, JPG, PNG) для распознавания и перевода в Excel
        </p>
      </div>

      {/* Upload area */}
      {!result && (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all
            ${file ? 'border-purple-500/50 bg-purple-500/5' : 'border-[#444] hover:border-purple-500/40 hover:bg-[#1F2023]'}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {!file ? (
            <>
              <Upload className="w-12 h-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-300 mb-2">Перетащите файл сюда или нажмите для выбора</p>
              <p className="text-gray-500 text-sm mb-4">PDF, JPG, PNG (до 50 МБ)</p>
              <label className="inline-block cursor-pointer bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 transition-colors font-medium">
                Выбрать файл
                <input type="file" accept={ACCEPTED_FORMATS} onChange={handleFileChange} className="hidden" />
              </label>
            </>
          ) : (
            <div className="space-y-4">
              {preview && (
                <div className="max-h-64 overflow-hidden rounded-xl border border-[#333] mx-auto" style={{ maxWidth: 500 }}>
                  <img src={preview} alt="Превью скана" className="w-full object-contain" />
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <ScanLine className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-gray-200">{file.name}</span>
                <span className="text-gray-500 text-sm">({formatSize(file.size)})</span>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRecognize}
                  disabled={isProcessing}
                  className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Распознавание...
                    </>
                  ) : 'Распознать'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="text-gray-400 px-4 py-2.5 rounded-xl border border-[#444] hover:bg-[#2E3033] disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Отмена
                </button>
              </div>

              {isProcessing && (
                <p className="text-sm text-gray-500">
                  AI анализирует скан сметы. Это может занять 15-60 секунд...
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
          <p className="font-medium text-sm">Ошибка</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="bg-[#1F2023] border border-[#333] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Результат распознавания
                </h2>
                {result.summary.estimateName && (
                  <p className="text-gray-400 mt-1 text-sm">{result.summary.estimateName}</p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${confidenceLabel(result.summary.confidence).cls}`}>
                Точность: {confidenceLabel(result.summary.confidence).text}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard value={result.summary.totalPositions} label="Позиций" />
              <StatCard value={result.summary.totalSections} label="Разделов" />
              <StatCard value={result.summary.totalAmount || '-'} label="Итого по смете" />
              <StatCard value={result.summary.normBase || '-'} label="Норм. база" />
            </div>

            {result.summary.estimateNumber && (
              <p className="text-sm text-gray-500">
                Номер сметы: <span className="font-mono text-gray-400">{result.summary.estimateNumber}</span>
                {result.summary.estimateType && ` (${result.summary.estimateType})`}
              </p>
            )}

            {result.summary.unreadableRows > 0 && (
              <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Нечитаемых строк: {result.summary.unreadableRows}. Рекомендуется проверить отмеченные строки в Excel-файле.
              </div>
            )}
          </div>

          {result.warnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-xl">
              <p className="font-medium text-sm mb-1">Предупреждения</p>
              <ul className="text-sm list-disc list-inside space-y-0.5">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <a
              href={result.downloadUrl}
              download
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <FileDown className="w-5 h-5" /> Скачать Excel
            </a>
            <button
              onClick={handleReset}
              className="text-gray-400 px-4 py-2.5 rounded-xl border border-[#444] hover:bg-[#2E3033] transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Загрузить другой файл
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-[#1F2023] border border-[#333] rounded-2xl p-5">
        <h3 className="font-semibold text-gray-300 mb-2">Как это работает</h3>
        <ol className="text-sm text-gray-400 space-y-1.5 list-decimal list-inside">
          <li>Загрузите скан сметы (PDF, JPG или PNG)</li>
          <li>AI проанализирует документ и определит тип сметы, структуру и все позиции</li>
          <li>Данные будут извлечены и перенесены в Excel с сохранением структуры</li>
          <li>Скачайте готовый .xlsx файл для дальнейшей работы</li>
        </ol>
        <div className="mt-3 text-xs text-gray-600">
          Поддерживаемые типы смет: локальная, объектная, сводная, КС-2, КС-3.
          Нормативные базы: ФЕР, ТЕР, ГЭСН, авторские сметы.
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="bg-[#2E3033] rounded-xl p-3 text-center">
      <div className="text-lg font-bold text-gray-100 truncate">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}
