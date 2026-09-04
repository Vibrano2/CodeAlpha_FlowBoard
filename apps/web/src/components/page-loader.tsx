import { Brand } from "./brand";

export const PageLoader = () => (
  <div className="grid min-h-screen place-items-center bg-slate-50 px-4" role="status">
    <div className="flex flex-col items-center gap-5">
      <Brand />
      <span className="size-7 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      <span className="sr-only">Loading your workspace</span>
    </div>
  </div>
);
