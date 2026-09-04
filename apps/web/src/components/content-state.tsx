import { AlertCircle } from "lucide-react";

export const ContentLoader = () => (
  <div className="grid min-h-52 place-items-center rounded-2xl border border-slate-200 bg-white" role="status">
    <span className="size-7 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
    <span className="sr-only">Loading content</span>
  </div>
);

export const ContentError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-7 text-center" role="alert">
    <AlertCircle className="mx-auto text-red-600" aria-hidden="true" size={28} />
    <p className="mt-3 font-semibold text-red-900">We could not load this content.</p>
    <button className="mt-4 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600" type="button" onClick={onRetry}>Try again</button>
  </div>
);
