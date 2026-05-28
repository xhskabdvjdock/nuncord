"use client";

import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { ServerPermission, UserStatus } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { useModal } from "@/hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusLabelMap: Record<UserStatus, string> = {
  ONLINE: "Online",
  IDLE: "Idle",
  BUSY: "Busy",
  OFFLINE: "Offline",
};

type RoleLite = {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
};

export const UserProfileModal = () => {
  const router = useRouter();
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "userProfile";
  const profileUser = data.profileUser;
  const profileServerId = data.profileServerId;
  const profileMemberId = data.profileMemberId;

  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [canManageRoles, setCanManageRoles] = useState(false);
  const [loadingRoleId, setLoadingRoleId] = useState<string>("");
  const hasProfileUser = !!profileUser;

  const isServerContext = !!profileServerId && !!profileMemberId;

  const roleById = useMemo(() => {
    const map = new Map<string, RoleLite>();
    for (const r of roles) map.set(r.id, r);
    return map;
  }, [roles]);

  const assignedRoles = useMemo(
    () => assignedRoleIds.map((id) => roleById.get(id)).filter(Boolean) as RoleLite[],
    [assignedRoleIds, roleById]
  );

  useEffect(() => {
    if (!isModalOpen || !isServerContext || !hasProfileUser) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [rolesRes, memberRes, permsRes] = await Promise.all([
          axios.get(`/api/servers/${profileServerId}/roles`),
          axios.get(`/api/members/${profileMemberId}?serverId=${profileServerId}`),
          axios.get(`/api/servers/${profileServerId}/me/permissions`),
        ]);

        if (cancelled) return;

        const roleItems = Array.isArray(rolesRes.data?.items) ? rolesRes.data.items : [];
        setRoles(roleItems);

        const links = Array.isArray(memberRes.data?.assignedRoles)
          ? memberRes.data.assignedRoles
          : [];
        setAssignedRoleIds(
          links.map((l: any) => l?.roleId).filter(Boolean)
        );

        const mePerms = Array.isArray(permsRes.data?.items) ? permsRes.data.items : [];
        setCanManageRoles(mePerms.includes("MANAGE_MEMBERS"));
      } catch {
        if (!cancelled) {
          setRoles([]);
          setAssignedRoleIds([]);
          setCanManageRoles(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, isServerContext, profileServerId, profileMemberId, hasProfileUser]);

  const toggleRole = async (roleId: string) => {
    if (!isServerContext) return;
    const isAssigned = assignedRoleIds.includes(roleId);
    setLoadingRoleId(roleId);
    try {
      if (isAssigned) {
        await axios.delete(
          `/api/members/${profileMemberId}/roles?serverId=${profileServerId}&roleId=${roleId}`
        );
        setAssignedRoleIds((prev) => prev.filter((id) => id !== roleId));
      } else {
        await axios.post(
          `/api/members/${profileMemberId}/roles?serverId=${profileServerId}`,
          { roleId }
        );
        setAssignedRoleIds((prev) => (prev.includes(roleId) ? prev : [...prev, roleId]));
      }
    } catch {
      // ignore; API enforces MANAGE_MEMBERS anyway
    } finally {
      setLoadingRoleId("");
    }
  };

  const openDm = () => {
    if (!profileMemberId) return;
    onClose();
    router.push(`/dms/${profileMemberId}`);
  };

  if (!profileUser) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-zinc-900/70 text-white p-0 overflow-hidden border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="h-32 bg-gradient-to-r from-indigo-500/65 via-fuchsia-500/45 to-cyan-500/40 relative">
          {profileUser.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileUser.bannerUrl}
              alt={`${profileUser.name} banner`}
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent" />
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-11 mb-4">
            <UserAvatar
              src={profileUser.imageUrl || ""}
              name={profileUser.name}
              status={profileUser.status}
              className="h-20 w-20 border-4 border-zinc-900 shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
            />
          </div>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {profileUser.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {statusLabelMap[profileUser.status]}
              {profileUser.statusText?.trim() ? ` • ${profileUser.statusText}` : ""}
            </DialogDescription>
          </DialogHeader>

          {isServerContext ? (
            <div className="mb-4">
              <Button
                type="button"
                onClick={openDm}
                className="h-8 px-3 bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Message
              </Button>
            </div>
          ) : null}

          {isServerContext && assignedRoles.length ? (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {assignedRoles.map((r) => (
                <span
                  key={r.id}
                  className="text-[10px] px-2 py-1 rounded-md border border-zinc-800 bg-zinc-950/25"
                  style={r.color ? { borderColor: r.color, color: r.color } : undefined}
                >
                  {r.name}
                </span>
              ))}
            </div>
          ) : null}

          {isServerContext && canManageRoles ? (
            <div className="mb-4 rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Server roles
                </p>
                <p className="text-[11px] text-zinc-500">
                  Visible only in this server
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {roles.map((r) => {
                  const isAssigned = assignedRoleIds.includes(r.id);
                  const isBusy = loadingRoleId === r.id;
                  return (
                    <Button
                      key={r.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canManageRoles || isBusy}
                      onClick={() => toggleRole(r.id)}
                      className={cn(
                        "h-8 px-3 border-zinc-800 bg-zinc-950/15 hover:bg-zinc-900/40",
                        isAssigned && "border-indigo-500/40 bg-indigo-500/10"
                      )}
                      style={r.color ? { borderColor: r.color } : undefined}
                      title={
                        isAssigned ? "Remove role from member" : "Assign role to member"
                      }
                    >
                      {r.name}
                    </Button>
                  );
                })}
                {roles.length === 0 ? (
                  <p className="text-sm text-zinc-500">No roles in this server yet.</p>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">
                Requires {ServerPermission.MANAGE_MEMBERS} permission to change roles.
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">About me</p>
            {profileUser.bio?.trim() ? (
              <div className="text-sm text-zinc-200 space-y-2 [&_a]:text-indigo-300 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {profileUser.bio}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No bio yet.</p>
            )}
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Member since {format(new Date(profileUser.createdAt), "PPP")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

