import { Columns3 } from "lucide-react";

interface BrandProps {
  compact?: boolean;
  inverted?: boolean;
}

export const Brand = ({ compact = false, inverted = false }: BrandProps) => (
  <div className="flex items-center gap-3" aria-label="FlowBoard">
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/20">
      <Columns3 aria-hidden="true" size={21} strokeWidth={2.25} />
    </span>
    {!compact && (
      <span className={`text-xl font-bold tracking-tight ${inverted ? "text-white" : "text-slate-950"}`}>
        Flow<span className="text-brand-600">Board</span>
      </span>
    )}
  </div>
);
