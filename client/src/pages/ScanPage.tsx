import { useState, useCallback } from 'react';
import { recognizeScan, type ScanRecognizeResult } from '../api/client';

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

    // Preview для изображений
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
      case 'high': return { text: 'Высокая', color: 'text-green-700 bg-green-100' };
      case 'medium': return { text: 'Средняя', color: 'text-yellow-700 bg-yellow-100' };
      case 'low': return { text: 'Низкая', color: 'text-red-700 bg-red-100' };
      default: return { text: c, color: 'text-gray-700 bg-gray-100' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Распознавание скана сметы</h1>
        <p className="text-gray-600">
          Загрузите скан сметы (PDF, JPG, PNG) для распознавания и перевода в Excel
        </p>
      </div>

      {/* Область загрузки */}
      {!result && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
            ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {!file ? (
            <>
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600 mb-2">Перетащите файл сюда или нажмите для выбора</p>
              <p className="text-gray-400 text-sm mb-4">PDF, JPG, PNG (до 50 МБ)</p>
              <label className="inline-block cursor-pointer bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Выбрать файл
                <input
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          ) : (
            <div className="space-y-4">
              {/* Превью */}
              {preview && (
                <div className="max-h-64 overflow-hidden rounded-lg border border-gray-200 mx-auto" style={{ maxWidth: 500 }}>
                  <img src={preview} alt="Превью скана" className="w-full object-contain" />
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-gray-800">{file.name}</span>
                <span className="text-gray-400 text-sm">({formatSize(file.size)})</span>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRecognize}
                  disabled={isProcessing}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Распознавание...
                    </>
                  ) : (
                    'Распознать'
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="text-gray-600 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Отмена
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

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Ошибка</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Результат */}
      {result && (
        <div className="space-y-4">
          {/* Карточка результата */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Результат распознавания</h2>
                {result.summary.estimateName && (
                  <p className="text-gray-600 mt-1">{result.summary.estimateName}</p>
                )}
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${confidenceLabel(result.summary.confidence).color}`}>
                Точность: {confidenceLabel(result.summary.confidence).text}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{result.summary.totalPositions}</div>
                <div className="text-xs text-gray-500">Позиций</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{result.summary.totalSections}</div>
                <div className="text-xs text-gray-500">Разделов</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-blue-600 truncate">{result.summary.totalAmount || '-'}</div>
                <div className="text-xs text-gray-500">Итого по смете</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-sm font-medium text-gray-700">{result.summary.normBase || '-'}</div>
                <div className="text-xs text-gray-500">Норм. база</div>
              </div>
            </div>

            {result.summary.estimateNumber && (
              <p className="text-sm text-gray-500">
                Номер сметы: <span className="font-mono">{result.summary.estimateNumber}</span>
                {result.summary.estimateType && ` (${result.summary.estimateType})`}
              </p>
            )}

            {result.summary.unreadableRows > 0 && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm">
                Нечитаемых строк: {result.summary.unreadableRows}. Рекомендуется проверить отмеченные строки в Excel-файле.
              </div>
            )}
          </div>

          {/* Предупреждения */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              <p className="font-medium text-sm mb-1">Предупреждения</p>
              <ul className="text-sm list-disc list-inside space-y-0.5">
                {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-3">
            <a
              href={result.downloadUrl}
              download
              className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Скачать Excel
            </a>
            <button
              onClick={handleReset}
              className="text-gray-600 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Загрузить другой файл
            </button>
          </div>
        </div>
      )}

      {/* Инструкция */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-700 mb-2">Как это работает</h3>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Загрузите скан сметы (PDF, JPG или PNG)</li>
          <li>AI проанализирует документ и определит тип сметы, структуру и все позиции</li>
          <li>Данные будут извлечены и перенесены в Excel с сохранением структуры</li>
          <li>Скачайте готовый .xlsx файл для дальнейшей работы</li>
        </ol>
        <div className="mt-3 text-xs text-gray-400">
          Поддерживаемые типы смет: локальная, объектная, сводная, КС-2, КС-3.
          Нормативные базы: ФЕР, ТЕР, ГЭСН, авторские сметы.
        </div>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
}
