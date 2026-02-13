import React from "react";
import type { SiteData } from "../types.js";

export function HoursTable({ data }: { data: SiteData }) {
  return (
    <table className="mt-5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-sm shadow-sm">
      <tbody>
        {data.business.hours.map((hours) => (
          <tr key={hours.day} className="border-b border-slate-100 last:border-0">
            <th className="px-4 py-3 text-left font-semibold text-slate-800">{hours.day}</th>
            <td className="px-4 py-3 text-slate-700">
              {hours.open} - {hours.close}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
