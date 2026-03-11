interface VORTableProps {
  rows: any[];
  totalWorks: number;
}

export default function VORTable({ rows, totalWorks }: VORTableProps) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#333]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1F2023]">
              <th className="border-b border-[#333] px-2 py-2.5 text-center w-12 text-gray-400 font-medium">N</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-left text-gray-400 font-medium">Наименование работ</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-center w-24 text-gray-400 font-medium">Ед. изм.</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-right w-24 text-gray-400 font-medium">Объём</th>
              <th className="border-b border-[#333] px-2 py-2.5 text-left w-40 text-gray-400 font-medium">Примечание</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, idx: number) => {
              if (row.isSection) {
                return (
                  <tr key={`section-${idx}`} className="bg-emerald-500/10">
                    <td colSpan={5} className="border-b border-[#333] px-3 py-2 font-semibold text-emerald-400">{row.name}</td>
                  </tr>
                );
              }
              return (
                <tr key={`row-${idx}`} className="hover:bg-[#2E3033] transition-colors">
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-center text-gray-500">{row.number}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-gray-200">{row.name}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-center text-gray-400">{row.unit}</td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-right text-gray-300">
                    {row.quantity?.toLocaleString('ru-RU', { maximumFractionDigits: 4 })}
                  </td>
                  <td className="border-b border-[#2A2A2D] px-2 py-1.5 text-xs text-gray-500 font-mono">
                    {row.sourceCode}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Всего видов работ: <span className="font-semibold text-gray-300">{totalWorks}</span>
      </p>
    </div>
  );
}
