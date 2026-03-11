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
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {isDecomposing ? 'Декомпозиция...' : 'Декомпозировать все'}
        </button>
        <span className="text-sm text-gray-500">
          {allItems.length} расценок
        </span>
      </div>

      <div className="space-y-0 rounded-xl border border-[#333] overflow-hidden">
        {estimate.sections.map((section: any) => (
          <div key={section.id}>
            <div className="bg-emerald-500/10 px-3 py-2 font-semibold text-sm text-emerald-400">
              {section.name}
            </div>
            {section.items
              .filter((item: any) => item.type === 'work')
              .map((item: any) => {
                const status = getDecompStatus(item);
                const isExpanded = expandedItems.has(item.id);

                return (
                  <div key={item.id} className="border-b border-[#2A2A2D]">
                    <div
                      className="flex items-center gap-2 px-3 py-2 hover:bg-[#2E3033] cursor-pointer text-sm transition-colors"
                      onClick={() => toggleItem(item.id)}
                    >
                      <span className="text-xs text-gray-500">{isExpanded ? '\u25BC' : '\u25B6'}</span>
                      <StatusBadge status={status} />
                      <span className="font-mono text-xs text-blue-400 w-36 flex-shrink-0">
                        {item.code}
                      </span>
                      <span className="truncate flex-1 text-gray-200">{item.name}</span>
                      <span className="text-gray-500 text-xs">{item.unit}</span>
                      <span className="text-gray-300 w-16 text-right">{item.quantity}</span>
                    </div>

                    {isExpanded && (
                      <div className="pl-10 pr-3 pb-2">
                        {item.works.length > 0 ? (
                          <div className="space-y-1">
                            {item.works.map((work: any, wi: number) => (
                              <div key={wi} className="flex items-center gap-2 text-xs bg-[#2E3033] px-3 py-1.5 rounded-lg">
                                <span className="text-gray-500 w-4">{wi + 1}.</span>
                                <span className="flex-1 text-gray-300">{work.name}</span>
                                <span className="text-gray-500">{work.unit}</span>
                                <span className="font-medium w-16 text-right text-gray-200">
                                  {work.quantity?.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
                                </span>
                                <SourceBadge source={work.source} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">
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
    parsed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cache: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ai: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    none: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const labels: Record<string, string> = {
    parsed: 'Парсинг',
    cache: 'Кэш',
    ai: 'AI',
    none: 'Нет',
  };

  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    parsed: { label: 'парсинг', cls: 'text-emerald-400' },
    cache: { label: 'кэш', cls: 'text-blue-400' },
    ai_decomposed: { label: 'AI', cls: 'text-amber-400' },
    manual: { label: 'ручн.', cls: 'text-purple-400' },
  };
  const info = map[source] || { label: source, cls: 'text-gray-500' };

  return <span className={`text-xs ${info.cls}`}>[{info.label}]</span>;
}
