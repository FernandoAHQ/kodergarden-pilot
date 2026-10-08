import { FloatingNavigation } from "../navigation/FloatingNavigation.js";

export function StudentHeader({ section, onBack, backLabel }: { readonly section: string; readonly onBack: () => void; readonly backLabel: string }) {
  void section;
  return <FloatingNavigation onBack={onBack} backLabel={backLabel}/>;
}

export function ProgressIndicator({ value, total, label }: { readonly value: number; readonly total: number; readonly label: string }) {
  const percent = total > 0 ? Math.min(100, Math.round(value / total * 100)) : 0;
  return <div className="student-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
    <span><strong>{label}</strong><b>{value} / {total}</b></span>
    <i aria-hidden="true"><i style={{ width: `${percent}%` }}/></i>
  </div>;
}
