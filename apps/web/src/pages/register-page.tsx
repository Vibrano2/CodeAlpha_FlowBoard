import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "../components/auth-shell";
import { useRegister } from "../hooks/use-auth";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setConfirmationError("Passwords do not match.");
      return;
    }

    setConfirmationError(null);
    register.mutate(
      { name, email, password },
      { onSuccess: () => navigate("/dashboard", { replace: true }) },
    );
  };

  const errorMessage = confirmationError ?? (register.isError ? register.error.message : null);

  return (
    <AuthShell
      title="Create your account"
      description="Set up your personal workspace. You can invite teammates after creating a project."
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" id="registration-error" role="alert">{errorMessage}</div>
        ) : null}

        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="name">Full name</label>
          <input autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="name" name="name" maxLength={100} minLength={2} value={name} onChange={(event) => setName(event.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="email">Email address</label>
          <input autoComplete="email" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="password">Password</label>
          <input aria-describedby="password-help" autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="password" name="password" type="password" minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <p className="mt-1.5 text-xs leading-5 text-slate-500" id="password-help">At least 8 characters with uppercase, lowercase, and a number.</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-800" htmlFor="confirm-password">Confirm password</label>
          <input aria-describedby={confirmationError ? "registration-error" : undefined} aria-invalid={confirmationError ? true : undefined} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="confirm-password" name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
        </div>

        <button className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={register.isPending || !name || !email || !password || !confirmPassword}>
          {register.isPending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link className="font-semibold text-brand-600 hover:text-brand-700" to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
};
