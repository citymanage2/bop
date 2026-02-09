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
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-blue-50">
            <th className="border px-2 py-2 text-left w-12">#</th>
            <th className="border px-2 py-2 text-left w-32">Шифр</th>
            <th className="border px-2 py-2 text-left">Наименование</th>
            <th className="border px-2 py-2 text-center w-20">Ед. изм.</th>
            <th className="border px-2 py-2 text-right w-20">Кол-во</th>
            <th className="border px-2 py-2 text-right w-28">Стоим. ед.</th>
            <th className="border px-2 py-2 text-right w-28">Стоим. всего</th>
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
      <tr className="bg-green-50 font-semibold">
        <td colSpan={7} className="border px-3 py-2">
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
      <tr className="bg-gray-50 font-medium text-xs">
        <td colSpan={5} className="border px-3 py-1 text-right">
          Итого по разделу:
        </td>
        <td className="border px-2 py-1 text-right">-</td>
        <td className="border px-2 py-1 text-right">
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
        className={`hover:bg-blue-50 cursor-pointer ${hasResources ? '' : 'cursor-default'}`}
        onClick={hasResources ? onToggle : undefined}
      >
        <td className="border px-2 py-1.5 text-center text-gray-500">{item.positionNumber}</td>
        <td className="border px-2 py-1.5 font-mono text-xs text-blue-700">{item.code}</td>
        <td className="border px-2 py-1.5">
          <div className="flex items-center gap-1">
            {hasResources && (
              <span className="text-gray-400 text-xs">{isExpanded ? '\u25BC' : '\u25B6'}</span>
            )}
            {item.name}
          </div>
        </td>
        <td className="border px-2 py-1.5 text-center text-gray-600">{item.unit}</td>
        <td className="border px-2 py-1.5 text-right">{formatNumber(item.quantity)}</td>
        <td className="border px-2 py-1.5 text-right">{formatCurrency(item.directCostUnit)}</td>
        <td className="border px-2 py-1.5 text-right font-medium">{formatCurrency(item.directCostTotal)}</td>
      </tr>

      {isExpanded && hasMaterials && item.materials.map((mat: any) => (
        <tr key={mat.id} className="bg-yellow-50 text-xs">
          <td className="border px-2 py-1"></td>
          <td className="border px-2 py-1 font-mono text-gray-500">{mat.code}</td>
          <td className="border px-2 py-1 pl-6 text-gray-700">
            <span className="text-yellow-600 mr-1">[М]</span> {mat.name}
          </td>
          <td className="border px-2 py-1 text-center text-gray-500">{mat.unit}</td>
          <td className="border px-2 py-1 text-right text-gray-600">{formatNumber(mat.quantityPerUnit)}</td>
          <td className="border px-2 py-1 text-right text-gray-600">{formatCurrency(mat.priceBase)}</td>
          <td className="border px-2 py-1 text-right text-gray-600">{formatCurrency(mat.priceTotal)}</td>
        </tr>
      ))}

      {isExpanded && hasMachines && item.machines.map((mach: any) => (
        <tr key={mach.id} className="bg-purple-50 text-xs">
          <td className="border px-2 py-1"></td>
          <td className="border px-2 py-1 font-mono text-gray-500">{mach.code}</td>
          <td className="border px-2 py-1 pl-6 text-gray-700">
            <span className="text-purple-600 mr-1">[Мех]</span> {mach.name}
          </td>
          <td className="border px-2 py-1 text-center text-gray-500">{mach.unit}</td>
          <td className="border px-2 py-1 text-right text-gray-600">{formatNumber(mach.quantityPerUnit)}</td>
          <td className="border px-2 py-1 text-right text-gray-600">{formatCurrency(mach.priceBase)}</td>
          <td className="border px-2 py-1 text-right text-gray-600">{formatCurrency(mach.priceTotal)}</td>
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
