import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/auth-shell";
import { useLogin } from "../hooks/use-auth";

interface LocationState {
  from?: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          const destination = (location.state as LocationState | null)?.from ?? "/dashboard";
          navigate(destination, { replace: true });
        },
      },
    );
  };

  return (
    <AuthShell
      title="Sign in to your workspace"
      description="Enter your details to continue to your projects and tasks."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {login.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {login.error.message}
          </div>
        ) : null}

        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email address</label>
          <input autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="password">Password</label>
          <input autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>

        <button className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={login.isPending || !email || !password}>
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        New to FlowBoard?{" "}
        <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/register">Create an account</Link>
      </p>
    </AuthShell>
  );
};
