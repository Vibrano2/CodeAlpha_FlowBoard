import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "./brand";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  description: string;
}

const benefits = [
  "Keep every project organized",
  "Assign work with clear ownership",
  "Discuss tasks where work happens",
];

export const AuthShell = ({ children, title, description }: AuthShellProps) => (
  <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(360px,0.85fr)_minmax(520px,1.15fr)]">
    <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
      <Brand inverted />
      <div className="my-auto max-w-lg py-16">
        <p className="text-sm font-semibold text-indigo-300">Simple team collaboration</p>
        <h2 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
          Move work forward without the noise.
        </h2>
        <p className="mt-5 text-base leading-7 text-slate-300">
          FlowBoard gives small teams one focused workspace for projects, tasks, and the
          conversations that keep delivery on track.
        </p>
        <ul className="mt-9 space-y-4">
          {benefits.map((benefit) => (
            <li className="flex items-center gap-3 text-sm text-slate-200" key={benefit}>
              <CheckCircle2 className="text-indigo-300" aria-hidden="true" size={19} />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-slate-500">Built for CodeAlpha Full Stack Development Task 3</p>
    </section>

    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
      <div className="w-full max-w-md">
        <div className="mb-10 lg:hidden"><Brand /></div>
        <p className="text-sm font-semibold text-brand-600">Welcome to FlowBoard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  </main>
);
