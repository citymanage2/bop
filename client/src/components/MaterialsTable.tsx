interface MaterialsTableProps {
  rows: any[];
  totalCost: number;
  uniqueMaterials: number;
  unaccountedMaterials: number;
}

export default function MaterialsTable({ rows, totalCost, uniqueMaterials, unaccountedMaterials }: MaterialsTableProps) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#333]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1F2023]">
              <th className="border-b border-[#333] px-2 py-2.5 text-center w-12 text-gray-400 font-medium">N</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-left text-gray-400 font-medium">Наименование</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-left w-28 text-gray-400 font-medium">Код</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-center w-20 text-gray-400 font-medium">Ед. изм.</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-right w-20 text-gray-400 font-medium">Кол-во</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-right w-24 text-gray-400 font-medium">Цена</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-right w-28 text-gray-400 font-medium">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, idx: number) => {
              if (row.isSection) {
                return (
                  <tr key={`section-${idx}`} className="bg-emerald-500/10">
                    <td colSpan={7} className="border-b border-[#333] px-3 py-2 font-semibold text-emerald-400">{row.name}</td>
                  </tr>
                );
              }
              return (
                <tr
                  key={`row-${idx}`}
                  className={`hover:bg-[#2E3033] transition-colors ${row.type === 'unaccounted' ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-center text-gray-500">{row.number}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-gray-200">{row.name}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 font-mono text-xs text-gray-500">{row.code}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-center text-gray-400">{row.unit}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right text-gray-300">
                    {row.quantity?.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right text-gray-300">
                    {formatCurrency(row.priceBase)}
                  </td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right font-medium text-gray-100">
                    {formatCurrency(row.totalBase)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#1F2023]">
              <td colSpan={6} className="border-t border-[#333] px-3 py-2.5 text-right font-bold text-gray-300">ИТОГО:</td>
              <td className="border-t border-[#333] px-2 py-2.5 text-right font-bold text-gray-100">{formatCurrency(totalCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex gap-4 text-sm text-gray-500 mt-2">
        <span>Всего материалов: <span className="font-semibold text-gray-300">{uniqueMaterials}</span></span>
        {unaccountedMaterials > 0 && (
          <span className="text-amber-400">
            В т.ч. неучтённых: <span className="font-semibold">{unaccountedMaterials}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function formatCurrency(n: number): string {
  if (!n) return '';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
