import { type FormEvent, useState } from "react";
import type { ProjectInput } from "../types/project";

interface ProjectFormProps {
  initialValue?: ProjectInput;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  errorMessage?: string;
  onSubmit: (input: ProjectInput) => void;
  onCancel: () => void;
}

export const ProjectForm = ({ initialValue, submitLabel, pendingLabel, isPending, errorMessage, onSubmit, onCancel }: ProjectFormProps) => {
  const [name, setName] = useState(initialValue?.name ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ name, description: description || null });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errorMessage ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{errorMessage}</div> : null}
      <div>
        <label className="text-sm font-semibold text-slate-800" htmlFor="project-name">Project name</label>
        <input autoFocus autoComplete="off" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="project-name" maxLength={100} minLength={2} value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-800" htmlFor="project-description">Description</label>
          <span className="text-xs text-slate-400">Optional</span>
        </div>
        <textarea className="mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="project-description" maxLength={2000} value={description ?? ""} onChange={(event) => setDescription(event.target.value)} />
        <p className="mt-1.5 text-right text-xs text-slate-400">{description?.length ?? 0}/2000</p>
      </div>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600" type="button" onClick={onCancel}>Cancel</button>
        <button className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isPending || name.trim().length < 2}>{isPending ? pendingLabel : submitLabel}</button>
      </div>
    </form>
  );
};
