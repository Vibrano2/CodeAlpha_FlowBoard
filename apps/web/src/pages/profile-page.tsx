import { CalendarDays, Mail, UserRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { WorkspaceShell } from "../components/workspace-shell";
import { useToast } from "../components/toast";
import { useUpdateProfile } from "../hooks/use-auth";
import type { User } from "../types/auth";

const initials = (name: string) => name
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join("")
  .toUpperCase();

const ProfileForm = ({ user }: { user: User }) => {
  const updateProfile = useUpdateProfile();
  const { showToast } = useToast();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl.trim() || null,
      },
      {
        onSuccess: () => showToast({ title: "Profile updated" }),
      },
    );
  };

  return (
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="profile-details-heading">
        <h2 className="text-lg font-bold text-slate-950" id="profile-details-heading">Profile details</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Keep your name, email address, and optional avatar current.</p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          {updateProfile.isError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {updateProfile.error.message}
            </p>
          ) : null}
          <div>
            <label className="text-sm font-semibold text-slate-800" htmlFor="profile-name">Display name</label>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="profile-name" autoComplete="name" minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-800" htmlFor="profile-email">Email address</label>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="profile-email" autoComplete="email" type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-slate-800" htmlFor="profile-avatar">Avatar URL</label>
              <span className="text-xs text-slate-400">Optional</span>
            </div>
            <input className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-brand-600 focus:ring-3 focus:ring-brand-100" id="profile-avatar" inputMode="url" type="url" maxLength={2048} placeholder="https://example.com/avatar.jpg" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} />
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Use an HTTPS image URL. Leave this blank to show your initials.</p>
          </div>
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60 sm:w-auto" type="submit" disabled={updateProfile.isPending || name.trim().length < 2 || !email.trim()}>
              {updateProfile.isPending ? "Saving profile..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        {avatarUrl.trim() ? (
          <img className="mx-auto size-24 rounded-full border border-slate-200 object-cover" src={avatarUrl.trim()} alt={`${name || user.name} avatar`} referrerPolicy="no-referrer" />
        ) : (
          <span className="mx-auto grid size-24 place-items-center rounded-full bg-brand-50 text-2xl font-bold text-brand-700" aria-hidden="true">{initials(name || user.name)}</span>
        )}
        <h2 className="mt-4 text-lg font-bold text-slate-950">{name || user.name}</h2>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500"><Mail aria-hidden="true" size={15} />{email || user.email}</p>
        <p className="mt-5 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-5 text-xs text-slate-500"><CalendarDays aria-hidden="true" size={15} />Member since {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(user.createdAt))}</p>
      </aside>
    </div>
  );
};

export const ProfilePage = () => (
  <WorkspaceShell>
    {(user) => (
      <>
        <header>
          <p className="text-sm font-semibold text-brand-600">Account</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserRound aria-hidden="true" size={20} /></span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Your profile</h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">Manage the identity teammates see across FlowBoard.</p>
            </div>
          </div>
        </header>
        <ProfileForm key={user.updatedAt} user={user} />
      </>
    )}
  </WorkspaceShell>
);
