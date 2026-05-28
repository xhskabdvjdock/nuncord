"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { LogOut, SlidersHorizontal } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal-store";
import { useAppSettings } from "@/components/providers/app-settings-provider";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/user-avatar";

const SettingRow = ({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
}) => {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-zinc-700/70 bg-zinc-900/40 p-3 cursor-pointer hover:bg-zinc-800/40 transition">
      <div>
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        <p className="text-xs text-zinc-400 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!checked)}
        className={`h-6 w-11 rounded-full relative transition ${
          checked ? "bg-indigo-500" : "bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </label>
  );
};

type ProfileFormState = {
  name: string;
  imageUrl: string;
  bannerUrl: string;
  bio: string;
  status: "ONLINE" | "IDLE" | "BUSY" | "OFFLINE";
  statusText: string;
  email: string;
};

const DEFAULT_PROFILE: ProfileFormState = {
  name: "",
  imageUrl: "",
  bannerUrl: "",
  bio: "",
  status: "ONLINE",
  statusText: "",
  email: "",
};

export const AppSettingsModal = () => {
  const { isOpen, onClose, type } = useModal();
  const { settings, setSetting, resetSettings } = useAppSettings();
  const isModalOpen = isOpen && type === "appSettings";
  const [activeTab, setActiveTab] = useState<"app" | "profile">("app");
  const [profile, setProfile] = useState<ProfileFormState>(DEFAULT_PROFILE);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const profileDirty = useMemo(
    () =>
      !!profile.name.trim() ||
      !!profile.imageUrl.trim() ||
      !!profile.bannerUrl.trim() ||
      !!profile.bio.trim() ||
      !!profile.statusText.trim(),
    [profile]
  );

  useEffect(() => {
    if (!isModalOpen) return;
    let cancelled = false;
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const res = await axios.get("/api/profile");
        if (cancelled) return;
        setProfile({
          name: res.data?.name ?? "",
          imageUrl: res.data?.imageUrl ?? "",
          bannerUrl: res.data?.bannerUrl ?? "",
          bio: res.data?.bio ?? "",
          status: res.data?.status ?? "ONLINE",
          statusText: res.data?.statusText ?? "",
          email: res.data?.email ?? "",
        });
      } catch {
        if (!cancelled) setProfile(DEFAULT_PROFILE);
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    };
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen]);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await axios.patch("/api/profile", {
        name: profile.name,
        imageUrl: profile.imageUrl,
        bannerUrl: profile.bannerUrl,
        bio: profile.bio,
        status: profile.status,
        statusText: profile.statusText,
      });
    } catch {
      // no-op
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900/70 text-white p-0 overflow-hidden max-w-3xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="pt-7 px-6 pb-3">
          <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-indigo-400" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Manage app preferences and profile from one place.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("app")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs border transition",
                activeTab === "app"
                  ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60"
              )}
            >
              App
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs border transition",
                activeTab === "profile"
                  ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                  : "border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60"
              )}
            >
              Profile
            </button>
          </div>

          {activeTab === "app" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-4">
                <p className="text-sm font-medium text-zinc-100">Theme</p>
                <p className="text-xs text-zinc-400 mt-1 mb-3">
                  Choose a visual style for the app.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["discord", "Discord"],
                      ["midnight", "Midnight"],
                      ["amoled", "AMOLED"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSetting("theme", key)}
                      className={cn(
                        "rounded-md border px-2 py-2 text-xs font-medium transition focus-visible:ring-0",
                        settings.theme === key
                          ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                          : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/60"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <SettingRow
                label="Compact mode"
                description="Reduce spacing in sidebars and chat for denser layout."
                checked={settings.compactMode}
                onToggle={(next) => setSetting("compactMode", next)}
              />
              <SettingRow
                label="Reduce motion"
                description="Disable most animations and transitions."
                checked={settings.reduceMotion}
                onToggle={(next) => setSetting("reduceMotion", next)}
              />
              <SettingRow
                label="Large text"
                description="Increase base text size for better readability."
                checked={settings.largeText}
                onToggle={(next) => setSetting("largeText", next)}
              />

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-zinc-500">Changes are applied instantly.</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={resetSettings}>
                    Reset defaults
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-300 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Log out
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === "profile" ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              <div className="space-y-3 rounded-lg border border-zinc-800/80 bg-zinc-950/30 p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Profile settings</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Update your identity and status in one place.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Display name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Avatar URL</label>
                  <Input
                    value={profile.imageUrl}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, imageUrl: e.target.value }))
                    }
                    className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Banner URL</label>
                  <Input
                    value={profile.bannerUrl}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, bannerUrl: e.target.value }))
                    }
                    className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Presence</label>
                    <select
                      value={profile.status}
                      onChange={(e) =>
                        setProfile((p) => ({
                          ...p,
                          status: e.target.value as ProfileFormState["status"],
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none"
                    >
                      <option value="ONLINE">Online</option>
                      <option value="IDLE">Idle</option>
                      <option value="BUSY">Busy</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-zinc-400">Custom status</label>
                    <Input
                      value={profile.statusText}
                      onChange={(e) =>
                        setProfile((p) => ({ ...p, statusText: e.target.value }))
                      }
                      className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Bio (Markdown supported)</label>
                  <textarea
                    rows={5}
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isSavingProfile || isLoadingProfile || !profile.name.trim()}
                  className="w-full mt-1 rounded-md bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium py-2 transition"
                >
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </button>
              </div>

              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/30 overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-indigo-500/60 via-fuchsia-500/45 to-cyan-500/35 relative">
                  {profile.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.bannerUrl}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="-mt-8 mb-2">
                    <UserAvatar
                      src={profile.imageUrl || ""}
                      name={profile.name || "User"}
                      status={profile.status}
                      className="h-16 w-16 border-4 border-zinc-900"
                    />
                  </div>
                  <p className="text-sm font-semibold text-zinc-100 truncate">
                    {profile.name || "Unnamed user"}
                  </p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{profile.email}</p>
                  <p className="text-xs text-zinc-500 mt-3">
                    {profile.statusText?.trim() || profile.status}
                  </p>
                  {!profileDirty ? (
                    <p className="text-[11px] text-zinc-500 mt-2">
                      No changes yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

