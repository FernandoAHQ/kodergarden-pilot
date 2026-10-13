import { FloatingNavigation } from "../navigation/FloatingNavigation.js";
import type { ReactNode } from "react";

export function StudentHeader({ section, onBack, backLabel, controls }: { readonly section: string; readonly onBack: () => void; readonly backLabel: string; readonly controls?: ReactNode }) {
  void section;
  return <FloatingNavigation onBack={onBack} backLabel={backLabel} controls={controls}/>;
}

export function ProgressIndicator({ value, total, label }: { readonly value: number; readonly total: number; readonly label: string }) {
  const percent = total > 0 ? Math.min(100, Math.round(value / total * 100)) : 0;
  return <div className="student-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
    <span><strong>{label}</strong><b>{value} / {total}</b></span>
    <i aria-hidden="true"><i style={{ width: `${percent}%` }}/></i>
  </div>;
}
