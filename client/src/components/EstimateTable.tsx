import { useState } from 'react';

interface EstimateTableProps {
  estimate: any;
}

export default function EstimateTable({ estimate }: EstimateTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#333]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1F2023]">
            <th className="border-b border-[#333] px-2 py-2.5 text-left w-12 text-gray-400 font-medium">#</th>
            <th className="border-b border-[#333] px-2 py-2.5 text-left w-32 text-gray-400 font-medium">Шифр</th>
            <th className="border-b border-[#333] px-2 py-2.5 text-left text-gray-400 font-medium">Наименование</th>
            <th className="border-b border-[#333] px-2 py-2.5 text-center w-20 text-gray-400 font-medium">Ед. изм.</th>
            <th className="border-b border-[#333] px-2 py-2.5 text-right w-20 text-gray-400 font-medium">Кол-во</th>
            <th className="border-b border-[#333] px-2 py-2.5 text-right w-28 text-gray-400 font-medium">Стоим. ед.</th>
            <th className="border-b border-[#333] px-2 py-2.5 text-right w-28 text-gray-400 font-medium">Стоим. всего</th>
          </tr>
        </thead>
        <tbody>
          {estimate.sections.map((section: any) => (
            <SectionBlock
              key={section.id}
              section={section}
              expandedItems={expandedItems}
              onToggle={toggleItem}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({ section, expandedItems, onToggle }: {
  section: any;
  expandedItems: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <tr className="bg-emerald-500/10">
        <td colSpan={7} className="border-b border-[#333] px-3 py-2 font-semibold text-emerald-400">
          {section.name}
        </td>
      </tr>
      {section.items.map((item: any) => (
        <ItemRow
          key={item.id}
          item={item}
          isExpanded={expandedItems.has(item.id)}
          onToggle={() => onToggle(item.id)}
        />
      ))}
      <tr className="bg-[#1F2023]">
        <td colSpan={5} className="border-b border-[#333] px-3 py-1.5 text-right text-xs text-gray-400 font-medium">
          Итого по разделу:
        </td>
        <td className="border-b border-[#333] px-2 py-1.5 text-right text-xs text-gray-500">-</td>
        <td className="border-b border-[#333] px-2 py-1.5 text-right text-xs text-gray-200 font-medium">
          {formatCurrency(section.sectionTotal.total)}
        </td>
      </tr>
    </>
  );
}

function ItemRow({ item, isExpanded, onToggle }: {
  item: any;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasMaterials = item.materials && item.materials.length > 0;
  const hasMachines = item.machines && item.machines.length > 0;
  const hasResources = hasMaterials || hasMachines;

  return (
    <>
      <tr
        className={`hover:bg-[#2E3033] transition-colors ${hasResources ? 'cursor-pointer' : ''}`}
        onClick={hasResources ? onToggle : undefined}
      >
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-center text-gray-500">{item.positionNumber}</td>
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 font-mono text-xs text-blue-400">{item.code}</td>
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-gray-200">
          <div className="flex items-center gap-1">
            {hasResources && (
              <span className="text-gray-500 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</span>
            )}
            {item.name}
          </div>
        </td>
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-center text-gray-400">{item.unit}</td>
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right text-gray-300">{formatNumber(item.quantity)}</td>
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right text-gray-300">{formatCurrency(item.directCostUnit)}</td>
        <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right font-medium text-gray-100">{formatCurrency(item.directCostTotal)}</td>
      </tr>

      {isExpanded && hasMaterials && item.materials.map((mat: any) => (
        <tr key={mat.id} className="bg-amber-500/5 text-xs">
          <td className="border-b border-[#2A2A2D] px-2 py-1"></td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 font-mono text-gray-500">{mat.code}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 pl-6 text-gray-300">
            <span className="text-amber-400 mr-1">[М]</span> {mat.name}
          </td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-center text-gray-500">{mat.unit}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-right text-gray-400">{formatNumber(mat.quantityPerUnit)}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-right text-gray-400">{formatCurrency(mat.priceBase)}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-right text-gray-400">{formatCurrency(mat.priceTotal)}</td>
        </tr>
      ))}

      {isExpanded && hasMachines && item.machines.map((mach: any) => (
        <tr key={mach.id} className="bg-purple-500/5 text-xs">
          <td className="border-b border-[#2A2A2D] px-2 py-1"></td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 font-mono text-gray-500">{mach.code}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 pl-6 text-gray-300">
            <span className="text-purple-400 mr-1">[Мех]</span> {mach.name}
          </td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-center text-gray-500">{mach.unit}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-right text-gray-400">{formatNumber(mach.quantityPerUnit)}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-right text-gray-400">{formatCurrency(mach.priceBase)}</td>
          <td className="border-b border-[#2A2A2D] px-2 py-1 text-right text-gray-400">{formatCurrency(mach.priceTotal)}</td>
        </tr>
      ))}
    </>
  );
}

function formatNumber(n: number): string {
  if (!n && n !== 0) return '';
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
}

function formatCurrency(n: number): string {
  if (!n) return '';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
