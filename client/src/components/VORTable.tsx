interface VORTableProps {
  rows: any[];
  totalWorks: number;
}

export default function VORTable({ rows, totalWorks }: VORTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-blue-50">
            <th className="border px-2 py-2 text-center w-12">N</th>
            <th className="border px-2 py-2 text-left">Наименование работ</th>
            <th className="border px-2 py-2 text-center w-24">Ед. изм.</th>
            <th className="border px-2 py-2 text-right w-24">Объём</th>
            <th className="border px-2 py-2 text-left w-40">Примечание</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any, idx: number) => {
            if (row.isSection) {
              return (
                <tr key={`section-${idx}`} className="bg-green-50 font-semibold">
                  <td colSpan={5} className="border px-3 py-2">{row.name}</td>
                </tr>
              );
            }
            return (
              <tr key={`row-${idx}`} className="hover:bg-gray-50">
                <td className="border px-2 py-1.5 text-center text-gray-500">{row.number}</td>
                <td className="border px-2 py-1.5">{row.name}</td>
                <td className="border px-2 py-1.5 text-center text-gray-600">{row.unit}</td>
                <td className="border px-2 py-1.5 text-right">
                  {row.quantity?.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
                </td>
                <td className="border px-2 py-1.5 text-xs text-gray-500 font-mono">
                  {row.sourceCode}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-gray-500 mt-2">
        Всего видов работ: <span className="font-semibold">{totalWorks}</span>
      </p>
    </div>
  );
}
