interface MaterialsTableProps {
  rows: any[];
  totalCost: number;
  uniqueMaterials: number;
  unaccountedMaterials: number;
}

export default function MaterialsTable({ rows, totalCost, uniqueMaterials, unaccountedMaterials }: MaterialsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-blue-50">
            <th className="border px-2 py-2 text-center w-12">N</th>
            <th className="border px-2 py-2 text-left">Наименование</th>
            <th className="border px-2 py-2 text-left w-28">Код</th>
            <th className="border px-2 py-2 text-center w-20">Ед. изм.</th>
            <th className="border px-2 py-2 text-right w-20">Кол-во</th>
            <th className="border px-2 py-2 text-right w-24">Цена</th>
            <th className="border px-2 py-2 text-right w-28">Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, idx: number) => {
            if (row.isSection) {
              return (
                <tr key={`section-${idx}`} className="bg-green-50 font-semibold">
                  <td colSpan={7} className="border px-3 py-2">{row.name}</td>
                </tr>
              );
            }
            return (
              <tr
                key={`row-${idx}`}
                className={`hover:bg-gray-50 ${row.type === 'unaccounted' ? 'bg-yellow-50' : ''}`}
              >
                <td className="border px-2 py-1.5 text-center text-gray-500">{row.number}</td>
                <td className="border px-2 py-1.5">{row.name}</td>
                <td className="border px-2 py-1.5 font-mono text-xs text-gray-500">{row.code}</td>
                <td className="border px-2 py-1.5 text-center text-gray-600">{row.unit}</td>
                <td className="border px-2 py-1.5 text-right">
                  {row.quantity?.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
                </td>
                <td className="border px-2 py-1.5 text-right">
                  {formatCurrency(row.priceBase)}
                </td>
                <td className="border px-2 py-1.5 text-right font-medium">
                  {formatCurrency(row.totalBase)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={6} className="border px-3 py-2 text-right">ИТОГО:</td>
            <td className="border px-2 py-2 text-right">{formatCurrency(totalCost)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="flex gap-4 text-sm text-gray-500 mt-2">
        <span>Всего материалов: <span className="font-semibold">{uniqueMaterials}</span></span>
        {unaccountedMaterials > 0 && (
          <span className="text-yellow-600">
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
