import { useState, useCallback, useRef } from 'react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isUploading: boolean;
}

export default function FileUploader({ onFileSelected, isUploading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelected(files[0]);
    }
  }, [onFileSelected]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
        ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.xml,.gsn"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col items-center gap-4">
        {isUploading ? (
          <>
            <svg className="animate-spin h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-lg text-gray-600">Загрузка и обработка файла...</p>
          </>
        ) : (
          <>
            <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div>
              <p className="text-lg font-medium text-gray-700">
                Перетащите файл сметы сюда
              </p>
              <p className="text-sm text-gray-500 mt-1">
                или нажмите для выбора файла
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {['PDF', 'XLSX', 'XLS', 'XML', 'GSN'].map(fmt => (
                <span key={fmt} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-mono">
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
