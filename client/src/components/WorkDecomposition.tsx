import { useState } from 'react';

interface WorkDecompositionProps {
  estimate: any;
  onDecompose: (itemIds?: string[]) => Promise<void>;
  isDecomposing: boolean;
}

export default function WorkDecomposition({ estimate, onDecompose, isDecomposing }: WorkDecompositionProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allItems = estimate.sections.flatMap((s: any) => s.items.filter((i: any) => i.type === 'work'));

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => onDecompose()}
          disabled={isDecomposing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          {isDecomposing ? 'Декомпозиция...' : 'Декомпозировать все'}
        </button>
        <span className="text-sm text-gray-500">
          {allItems.length} расценок
        </span>
      </div>

      <div className="space-y-1">
        {estimate.sections.map((section: any) => (
          <div key={section.id}>
            <div className="bg-green-50 px-3 py-2 font-semibold text-sm rounded">
              {section.name}
            </div>
            {section.items
              .filter((item: any) => item.type === 'work')
              .map((item: any) => {
                const status = getDecompStatus(item);
                const isExpanded = expandedItems.has(item.id);

                return (
                  <div key={item.id} className="border-b">
                    <div
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      onClick={() => toggleItem(item.id)}
                    >
                      <span className="text-xs text-gray-400">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                      <StatusBadge status={status} />
                      <span className="font-mono text-xs text-blue-700 w-36 flex-shrink-0">
                        {item.code}
                      </span>
                      <span className="truncate flex-1">{item.name}</span>
                      <span className="text-gray-500 text-xs">{item.unit}</span>
                      <span className="text-gray-700 w-16 text-right">{item.quantity}</span>
                    </div>

                    {isExpanded && (
                      <div className="pl-10 pr-3 pb-2">
                        {item.works.length > 0 ? (
                          <div className="space-y-1">
                            {item.works.map((work: any, wi: number) => (
                              <div key={wi} className="flex items-center gap-2 text-xs bg-gray-50 px-3 py-1.5 rounded">
                                <span className="text-gray-400 w-4">{wi + 1}.</span>
                                <span className="flex-1">{work.name}</span>
                                <span className="text-gray-500">{work.unit}</span>
                                <span className="font-medium w-16 text-right">
                                  {work.quantity?.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
                                </span>
                                <SourceBadge source={work.source} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            Не декомпозирована. Нажмите «Декомпозировать все» или используйте AI-анализ.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}

function getDecompStatus(item: any): 'parsed' | 'cache' | 'ai' | 'none' {
  if (!item.works || item.works.length === 0) return 'none';
  const source = item.works[0]?.source;
  if (source === 'parsed') return 'parsed';
  if (source === 'cache') return 'cache';
  if (source === 'ai_decomposed') return 'ai';
  return 'parsed';
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    parsed: 'bg-green-100 text-green-700',
    cache: 'bg-blue-100 text-blue-700',
    ai: 'bg-yellow-100 text-yellow-700',
    none: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = {
    parsed: 'Парсинг',
    cache: 'Кэш',
    ai: 'AI',
    none: 'Нет',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    parsed: { label: 'парсинг', cls: 'text-green-600' },
    cache: { label: 'кэш', cls: 'text-blue-600' },
    ai_decomposed: { label: 'AI', cls: 'text-yellow-600' },
    manual: { label: 'ручн.', cls: 'text-purple-600' },
  };
  const info = map[source] || { label: source, cls: 'text-gray-500' };

  return <span className={`text-xs ${info.cls}`}>[{info.label}]</span>;
}
