import { AlertCircle } from "lucide-react";

interface SessionErrorProps {
  onRetry: () => void;
}

export const SessionError = ({ onRetry }: SessionErrorProps) => (
  <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
      <AlertCircle className="mx-auto text-red-600" aria-hidden="true" size={32} />
      <h1 className="mt-4 text-xl font-bold text-slate-950">We could not reach FlowBoard</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Check that the API is running, then try loading your session again.
      </p>
      <button
        className="mt-6 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        type="button"
        onClick={onRetry}
      >
        Try again
      </button>
    </section>
  </main>
);
