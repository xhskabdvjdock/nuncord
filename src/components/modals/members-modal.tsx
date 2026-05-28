"use client";

import qs from "query-string";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Gavel,
  Loader2,
  MicOff,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  TimerOff,
  UserX,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/hooks/use-modal-store";
import { ServerWithMembersWithUsers } from "@/types";
import { MemberRole } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type RoleLite = {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
};

const roleIconMap = {
  GUEST: null,
  MODERATOR: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

export const MembersModal = () => {
  const router = useRouter();
  const { onOpen, isOpen, onClose, type, data } = useModal();
  const [loadingId, setLoadingId] = useState("");
  const [roles, setRoles] = useState<RoleLite[]>([]);

  const isModalOpen = isOpen && type === "members";
  const { server } = data as { server: ServerWithMembersWithUsers };

  useEffect(() => {
    if (!isModalOpen || !server?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(`/api/servers/${server.id}/roles`);
        if (!cancelled && Array.isArray(res.data?.items)) {
          setRoles(res.data.items);
        }
      } catch {
        if (!cancelled) setRoles([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, server?.id]);

  const roleById = useMemo(() => {
    const map = new Map<string, RoleLite>();
    for (const r of roles) map.set(r.id, r);
    return map;
  }, [roles]);

  const onKick = async (memberId: string) => {
    try {
      setLoadingId(memberId);
      const url = qs.stringifyUrl({
        url: `/api/members/${memberId}`,
        query: { serverId: server?.id },
      });
      const response = await axios.delete(url);
      router.refresh();
      onOpen("members", { server: response.data });
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingId("");
    }
  };

  const onRoleChange = async (memberId: string, role: MemberRole) => {
    try {
      setLoadingId(memberId);
      const url = qs.stringifyUrl({
        url: `/api/members/${memberId}`,
        query: { serverId: server?.id },
      });
      const response = await axios.patch(url, { role });
      router.refresh();
      onOpen("members", { server: response.data });
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingId("");
    }
  };

  const onModerate = async (
    memberId: string,
    action: "mute" | "unmute" | "timeout" | "ban" | "unban"
  ) => {
    try {
      setLoadingId(memberId);
      const url = qs.stringifyUrl({
        url: `/api/members/${memberId}/moderation`,
        query: { serverId: server?.id },
      });
      await axios.patch(url, {
        action,
        minutes: action === "timeout" ? 15 : action === "mute" ? 60 : undefined,
      });
      router.refresh();
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingId("");
    }
  };

  const toggleAssignedRole = async (memberId: string, roleId: string, isAssigned: boolean) => {
    if (!server?.id) return;
    try {
      setLoadingId(memberId);
      if (isAssigned) {
        const url = qs.stringifyUrl({
          url: `/api/members/${memberId}/roles`,
          query: { serverId: server.id, roleId },
        });
        await axios.delete(url);
      } else {
        const url = qs.stringifyUrl({
          url: `/api/members/${memberId}/roles`,
          query: { serverId: server.id },
        });
        await axios.post(url, { roleId });
      }
      router.refresh();
      // Best effort: reload members modal with fresh server data
      const url = qs.stringifyUrl({
        url: `/api/members/${memberId}`,
        query: { serverId: server.id },
      });
      const response = await axios.get(url).catch(() => undefined);
      if (response?.data) {
        onOpen("members", { server: response.data });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingId("");
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#313338] text-white overflow-hidden">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold text-zinc-100">
            Manage Members
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            {server?.members?.length} Members
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-8 max-h-[420px] pr-6">
          {(server?.members ?? []).filter((m) => !!m?.user).map((member) => (
            <div key={member.id} className="flex items-center gap-x-2 mb-6">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.user?.imageUrl || ""} />
                <AvatarFallback>
                  {member.user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-y-1">
                <div className="text-xs font-semibold flex items-center gap-x-1 text-zinc-200">
                  {member.user?.name ?? "Unknown user"}
                  {roleIconMap[member.role]}
                </div>
                <p className="text-xs text-zinc-400">{member.user?.email ?? ""}</p>
                {(member as any)?.assignedRoles?.length ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(member as any).assignedRoles
                      .map((l: any) => l?.roleId)
                      .filter(Boolean)
                      .map((roleId: string) => {
                        const r = roleById.get(roleId);
                        if (!r) return null;
                        return (
                          <span
                            key={roleId}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-800/60 text-zinc-200"
                            style={r.color ? { borderColor: r.color, color: r.color } : undefined}
                          >
                            {r.name}
                          </span>
                        );
                      })}
                  </div>
                ) : null}
              </div>
              {server.userId !== member.userId && loadingId !== member.id && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className="h-4 w-4 text-zinc-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="left">
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center">
                          <ShieldQuestion className="w-4 h-4 mr-2" />
                          <span>Role</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem
                              onClick={() => onRoleChange(member.id, "GUEST")}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Guest
                              {member.role === "GUEST" && (
                                <Check className="h-4 w-4 ml-auto" />
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                onRoleChange(member.id, "MODERATOR")
                              }
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Moderator
                              {member.role === "MODERATOR" && (
                                <Check className="h-4 w-4 ml-auto" />
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          <span>Roles</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="max-h-72 overflow-auto">
                            {roles.map((r) => {
                              const assignedIds = new Set<string>(
                                ((member as any)?.assignedRoles || [])
                                  .map((l: any) => l?.roleId)
                                  .filter(Boolean)
                              );
                              const isAssigned = assignedIds.has(r.id);
                              return (
                                <DropdownMenuItem
                                  key={r.id}
                                  onClick={() => toggleAssignedRole(member.id, r.id, isAssigned)}
                                >
                                  <span
                                    className="h-2.5 w-2.5 rounded-full border border-zinc-700 mr-2"
                                    style={{ background: r.color || "#3f3f46" }}
                                  />
                                  {r.name}
                                  {isAssigned ? <Check className="h-4 w-4 ml-auto" /> : null}
                                </DropdownMenuItem>
                              );
                            })}
                            {roles.length === 0 ? (
                              <DropdownMenuItem disabled>No roles yet</DropdownMenuItem>
                            ) : null}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onModerate(member.id, "timeout")}>
                        <TimerOff className="h-4 w-4 mr-2" />
                        Timeout 15m
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onModerate(member.id, "mute")}>
                        <MicOff className="h-4 w-4 mr-2" />
                        Mute 1h
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onModerate(member.id, "unmute")}>
                        <Check className="h-4 w-4 mr-2" />
                        Unmute
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onModerate(member.id, "ban")}
                        className="text-rose-400"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Ban
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onModerate(member.id, "unban")}>
                        <Check className="h-4 w-4 mr-2" />
                        Unban
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onKick(member.id)}
                        className="text-rose-500"
                      >
                        <Gavel className="h-4 w-4 mr-2" />
                        Kick
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              {loadingId === member.id && (
                <Loader2 className="animate-spin text-zinc-400 ml-auto w-4 h-4" />
              )}
            </div>
          ))}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
