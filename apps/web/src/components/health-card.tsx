import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, LoaderCircle, Server } from "lucide-react";
import { getApiHealth } from "../lib/api";

export const HealthCard = () => {
  const healthQuery = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
    retry: 1,
    refetchInterval: 30_000,
  });

  const isConnected = healthQuery.data?.data.status === "ok";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            System status
          </p>
          <h2 className="mt-2 text-lg font-bold text-slate-950">Workspace connection</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <Server aria-hidden="true" size={20} />
        </span>
      </div>

      <div
        className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        role="status"
        aria-live="polite"
      >
        {healthQuery.isPending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin text-brand-600" size={20} />
        ) : isConnected ? (
          <CircleCheck aria-hidden="true" className="text-emerald-600" size={20} />
        ) : (
          <CircleX aria-hidden="true" className="text-red-600" size={20} />
        )}
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {healthQuery.isPending
              ? "Checking API"
              : isConnected
                ? "API and database connected"
                : "Connection unavailable"}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {healthQuery.isPending
              ? "Confirming the local services are ready."
              : isConnected
                ? "The FlowBoard foundation is ready."
                : "Start the API and PostgreSQL, then try again."}
          </p>
        </div>
      </div>
    </section>
  );
};
