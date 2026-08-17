import { DISCLAIMER_FULL } from "@/lib/disclaimer";

export function Disclaimer({ note }: { note?: string }) {
  return (
    <aside className="mt-16 border-t border-slate-200 pt-6 dark:border-slate-800">
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-500">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Disclaimer. </span>
        {DISCLAIMER_FULL}
      </p>
      {note && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-500">{note}</p>
      )}
    </aside>
  );
}
