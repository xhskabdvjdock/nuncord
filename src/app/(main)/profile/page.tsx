import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { ProfileForm } from "@/components/profile/profile-form";
import { UserAvatar } from "@/components/user-avatar";

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="h-full p-6 md:p-10 surface-chat">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center gap-4">
          <UserAvatar
            src={user.imageUrl || ""}
            name={user.name}
            className="w-12 h-12"
            status={user.status}
          />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
              Profile
            </h1>
            <p className="text-zinc-400 text-sm truncate">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-2xl backdrop-blur-xl p-5 md:p-6">
            <ProfileForm user={user} />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/45 shadow-xl backdrop-blur-xl overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-indigo-500/65 via-fuchsia-500/45 to-cyan-500/35 relative">
              {user.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.bannerUrl}
                  alt="Profile banner"
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
            </div>
            <div className="p-5">
              <div className="-mt-10 mb-3">
                <UserAvatar
                  src={user.imageUrl || ""}
                  name={user.name}
                  status={user.status}
                  className="h-16 w-16 border-4 border-zinc-900 shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                />
              </div>
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {user.name}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {user.statusText?.trim() || user.status}
              </p>
              <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-3">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  Preview
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  This is how others will see your profile card.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
