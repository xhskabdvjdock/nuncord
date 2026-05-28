"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { ServerPermission } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, { message: "Server name is required." }),
  imageUrl: z.string().min(0),
});

const ROLE_FORM_SCHEMA = z.object({
  name: z.string().min(1).max(40),
  color: z.string().optional(),
});

const PERMISSION_LABELS: Record<ServerPermission, string> = {
  MANAGE_SERVER: "Manage server",
  MANAGE_CHANNELS: "Manage channels",
  MANAGE_MESSAGES: "Manage messages",
  MANAGE_MEMBERS: "Manage members",
  MENTION_EVERYONE: "Mention @everyone/@here",
  PIN_MESSAGES: "Pin messages",
  SEND_MESSAGES: "Send messages",
};

type RoleItem = {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  position: number;
  permissions: ServerPermission[];
};

type ChannelItem = {
  id: string;
  name: string;
  type: string;
};

export const EditServerModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const router = useRouter();
  const isModalOpen = isOpen && type === "editServer";
  const { server } = data;
  const [tab, setTab] = useState<"overview" | "roles" | "permissions" | "audit">(
    "overview"
  );
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [serverChannels, setServerChannels] = useState<ChannelItem[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [overwriteAllow, setOverwriteAllow] = useState<ServerPermission[]>([]);
  const [overwriteDeny, setOverwriteDeny] = useState<ServerPermission[]>([]);
  const [isSavingOverwrite, setIsSavingOverwrite] = useState(false);
  const [newRolePerms, setNewRolePerms] = useState<ServerPermission[]>([
    "SEND_MESSAGES",
  ]);
  const [editingRoleId, setEditingRoleId] = useState<string>("");
  const [editingRolePerms, setEditingRolePerms] = useState<ServerPermission[]>([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
    },
  });

  const roleForm = useForm<z.infer<typeof ROLE_FORM_SCHEMA>>({
    resolver: zodResolver(ROLE_FORM_SCHEMA),
    defaultValues: { name: "", color: "" },
  });

  useEffect(() => {
    if (server) {
      form.setValue("name", server.name);
      form.setValue("imageUrl", server.imageUrl);
    }
  }, [server, form]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!server?.inviteCode) return "";
    return `${window.location.origin}/invite/${server.inviteCode}`;
  }, [server?.inviteCode]);

  const isLoading = form.formState.isSubmitting;

  const loadRoles = async () => {
    if (!server?.id) return;
    setIsLoadingRoles(true);
    try {
      const res = await axios.get(`/api/servers/${server.id}/roles`);
      setRoles(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch {
      setRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const loadServerChannels = async () => {
    if (!server?.id) return;
    try {
      const res = await axios.get(`/api/servers/${server.id}`);
      const ch = Array.isArray(res.data?.channels) ? res.data.channels : [];
      setServerChannels(ch);
      if (!selectedChannelId && ch[0]?.id) setSelectedChannelId(ch[0].id);
    } catch {
      setServerChannels([]);
    }
  };

  const loadAudit = async () => {
    if (!server?.id) return;
    setIsLoadingAudit(true);
    try {
      const res = await axios.get(`/api/servers/${server.id}/audit-logs?limit=50`);
      setAuditItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch {
      setAuditItems([]);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen || !server?.id) return;
    setTab("overview");
    void loadRoles();
    void loadServerChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, server?.id]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (tab === "audit") void loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isModalOpen]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/servers/${server?.id}`, values);
      form.reset();
      router.refresh();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const onCreateRole = async (values: z.infer<typeof ROLE_FORM_SCHEMA>) => {
    if (!server?.id) return;
    try {
      await axios.post(`/api/servers/${server.id}/roles`, {
        name: values.name,
        color: values.color?.trim() ? values.color.trim() : null,
        permissions: newRolePerms,
      });
      roleForm.reset({ name: "", color: "" });
      setNewRolePerms(["SEND_MESSAGES"]);
      await loadRoles();
    } catch (error) {
      console.log(error);
    }
  };

  const startEditRole = (role: RoleItem) => {
    setEditingRoleId(role.id);
    roleForm.reset({ name: role.name, color: role.color || "" });
    setEditingRolePerms(role.permissions || []);
  };

  const saveRoleEdit = async () => {
    if (!server?.id || !editingRoleId) return;
    const values = roleForm.getValues();
    try {
      await axios.patch(`/api/servers/${server.id}/roles/${editingRoleId}`, {
        name: values.name,
        color: values.color?.trim() ? values.color.trim() : null,
        permissions: editingRolePerms,
      });
      setEditingRoleId("");
      roleForm.reset({ name: "", color: "" });
      setEditingRolePerms([]);
      await loadRoles();
    } catch (error) {
      console.log(error);
    }
  };

  const deleteRole = async (role: RoleItem) => {
    if (!server?.id) return;
    if (role.isDefault) return;
    try {
      await axios.delete(`/api/servers/${server.id}/roles/${role.id}`);
      await loadRoles();
    } catch (error) {
      console.log(error);
    }
  };

  const togglePerm = (
    list: ServerPermission[],
    perm: ServerPermission,
    setList: (v: ServerPermission[]) => void
  ) => {
    setList(list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]);
  };

  const loadOverwrite = async (channelId: string, roleId: string) => {
    if (!server?.id || !channelId || !roleId) return;
    try {
      const res = await axios.get(
        `/api/channels/${channelId}/permissions?serverId=${server.id}`
      );
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      const match = items.find((o: any) => o.roleId === roleId);
      setOverwriteAllow(match?.allow || []);
      setOverwriteDeny(match?.deny || []);
    } catch {
      setOverwriteAllow([]);
      setOverwriteDeny([]);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    if (tab !== "permissions") return;
    if (!selectedRoleId && roles[0]?.id) setSelectedRoleId(roles[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isModalOpen, roles]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (tab !== "permissions") return;
    if (!selectedChannelId || !selectedRoleId) return;
    void loadOverwrite(selectedChannelId, selectedRoleId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, selectedRoleId, tab, isModalOpen]);

  const saveOverwrite = async () => {
    if (!server?.id || !selectedChannelId || !selectedRoleId) return;
    setIsSavingOverwrite(true);
    try {
      await axios.put(
        `/api/channels/${selectedChannelId}/permissions?serverId=${server.id}`,
        { roleId: selectedRoleId, allow: overwriteAllow, deny: overwriteDeny }
      );
    } catch (error) {
      console.log(error);
    } finally {
      setIsSavingOverwrite(false);
    }
  };

  const regenInvite = async () => {
    if (!server?.id) return;
    try {
      const res = await axios.patch(`/api/servers/${server.id}/invite-code`);
      router.refresh();
      form.setValue("name", res.data?.name ?? form.getValues("name"));
      // just close and reopen to refresh modal data from server sidebar on next open
    } catch (error) {
      console.log(error);
    }
  };

  const copyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    form.reset();
    roleForm.reset({ name: "", color: "" });
    setEditingRoleId("");
    setEditingRolePerms([]);
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900/70 text-white p-0 overflow-hidden max-w-4xl border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] min-h-[520px]">
          <div className="border-b md:border-b-0 md:border-r border-zinc-800/80 bg-zinc-950/25">
            <div className="px-4 pt-5 pb-3">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {server?.name || "Server settings"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">Manage your server.</p>
            </div>
            <div className="px-2 pb-3 space-y-1">
              {(
                [
                  ["overview", "Overview"],
                  ["roles", "Roles"],
                  ["permissions", "Channel permissions"],
                  ["audit", "Audit log"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition",
                    tab === key
                      ? "bg-zinc-800/60 text-zinc-100 border border-zinc-700/70"
                      : "text-zinc-300 hover:bg-zinc-800/35"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <DialogHeader className="pt-6 px-6 pb-3">
              <DialogTitle className="text-xl font-bold text-zinc-100">
                Server Settings
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Configure your server, roles, permissions and logs.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[420px] px-6 pb-6">
              {tab === "overview" ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Server profile</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Update name and icon.
                    </p>
                    <div className="mt-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Server icon URL</FormLabel>
                                <FormControl>
                                  <Input
                                    disabled={isLoading}
                                    placeholder="https://..."
                                    className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Server name</FormLabel>
                                <FormControl>
                                  <Input
                                    disabled={isLoading}
                                    placeholder="Server name"
                                    className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button type="submit" disabled={isLoading} className="bg-indigo-500 hover:bg-indigo-600">
                              Save
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>

                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Invite</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Share or regenerate your invite link.
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Input
                        value={inviteUrl || "Open this modal from inside a server to see invite link."}
                        readOnly
                        className="bg-zinc-950/30 border-zinc-800 text-zinc-200"
                      />
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={copyInvite}>
                          Copy invite
                        </Button>
                        <Button type="button" variant="outline" onClick={regenInvite}>
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "roles" ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Create role</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Roles control permissions across the server.
                    </p>
                    <Form {...roleForm}>
                      <form
                        onSubmit={roleForm.handleSubmit(onCreateRole)}
                        className="mt-4 space-y-4"
                      >
                        <FormField
                          control={roleForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300">Role name</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={roleForm.formState.isSubmitting}
                                  placeholder="e.g. Moderator"
                                  className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roleForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300">Color (optional)</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={roleForm.formState.isSubmitting}
                                  placeholder="#5865F2"
                                  className="bg-zinc-950/30 border-zinc-800 focus-visible:ring-0"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3">
                          <p className="text-xs uppercase tracking-wide text-zinc-500">
                            Permissions
                          </p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.values(ServerPermission).map((perm) => (
                              <label
                                key={perm}
                                className="flex items-center gap-2 rounded-md border border-zinc-800/70 bg-zinc-900/30 px-3 py-2 hover:bg-zinc-800/25 transition cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={newRolePerms.includes(perm)}
                                  onChange={() => togglePerm(newRolePerms, perm, setNewRolePerms)}
                                />
                                <span className="text-sm text-zinc-200">
                                  {PERMISSION_LABELS[perm]}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-end">
                          <Button
                            type="submit"
                            disabled={roleForm.formState.isSubmitting}
                            className="bg-indigo-500 hover:bg-indigo-600"
                          >
                            Create role
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>

                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">Roles</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Edit permissions or delete roles.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={loadRoles} disabled={isLoadingRoles}>
                        Refresh
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {roles.map((r) => (
                        <div
                          key={r.id}
                          className={cn(
                            "rounded-lg border border-zinc-800/80 bg-zinc-900/25 p-3",
                            editingRoleId === r.id && "bg-zinc-900/40"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-zinc-700"
                              style={{ background: r.color || "#3f3f46" }}
                            />
                            <p className="text-sm font-semibold text-zinc-100 truncate">
                              {r.name}
                            </p>
                            <span className="ml-auto flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startEditRole(r)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={r.isDefault}
                                onClick={() => deleteRole(r)}
                              >
                                Delete
                              </Button>
                            </span>
                          </div>

                          {editingRoleId === r.id ? (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-zinc-400 mb-1">Name</p>
                                  <Input
                                    value={roleForm.watch("name")}
                                    onChange={(e) => roleForm.setValue("name", e.target.value)}
                                    className="bg-zinc-950/30 border-zinc-800"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-zinc-400 mb-1">Color</p>
                                  <Input
                                    value={roleForm.watch("color")}
                                    onChange={(e) => roleForm.setValue("color", e.target.value)}
                                    className="bg-zinc-950/30 border-zinc-800"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Object.values(ServerPermission).map((perm) => (
                                  <label
                                    key={perm}
                                    className="flex items-center gap-2 rounded-md border border-zinc-800/70 bg-zinc-900/30 px-3 py-2 hover:bg-zinc-800/25 transition cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={editingRolePerms.includes(perm)}
                                      onChange={() =>
                                        togglePerm(editingRolePerms, perm, setEditingRolePerms)
                                      }
                                    />
                                    <span className="text-sm text-zinc-200">
                                      {PERMISSION_LABELS[perm]}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingRoleId("");
                                    setEditingRolePerms([]);
                                    roleForm.reset({ name: "", color: "" });
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button type="button" onClick={saveRoleEdit} className="bg-indigo-500 hover:bg-indigo-600">
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                      {roles.length === 0 ? (
                        <p className="text-xs text-zinc-500">No roles yet.</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "permissions" ? (
                <div className="space-y-5">
                  <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
                    <p className="text-sm font-semibold text-zinc-100">Channel permissions</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Configure permission overwrites per role, per channel.
                    </p>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Channel</p>
                        <select
                          value={selectedChannelId}
                          onChange={(e) => setSelectedChannelId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-0"
                        >
                          {serverChannels.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.type === "TEXT" ? "#" : c.type === "AUDIO" ? "🔊" : "🎥"}{" "}
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 mb-1">Role</p>
                        <select
                          value={selectedRoleId}
                          onChange={(e) => setSelectedRoleId(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950/30 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-0"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Allow</p>
                        <div className="mt-2 space-y-2">
                          {Object.values(ServerPermission).map((perm) => (
                            <label key={perm} className="flex items-center gap-2 text-sm text-zinc-200">
                              <input
                                type="checkbox"
                                checked={overwriteAllow.includes(perm)}
                                onChange={() =>
                                  togglePerm(overwriteAllow, perm, setOverwriteAllow)
                                }
                              />
                              {PERMISSION_LABELS[perm]}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Deny</p>
                        <div className="mt-2 space-y-2">
                          {Object.values(ServerPermission).map((perm) => (
                            <label key={perm} className="flex items-center gap-2 text-sm text-zinc-200">
                              <input
                                type="checkbox"
                                checked={overwriteDeny.includes(perm)}
                                onChange={() => togglePerm(overwriteDeny, perm, setOverwriteDeny)}
                              />
                              {PERMISSION_LABELS[perm]}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOverwriteAllow([]);
                          setOverwriteDeny([]);
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        onClick={saveOverwrite}
                        disabled={isSavingOverwrite}
                        className="bg-indigo-500 hover:bg-indigo-600"
                      >
                        Save overwrites
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "audit" ? (
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Audit log</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Recent moderation & configuration actions.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={loadAudit} disabled={isLoadingAudit}>
                      Refresh
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {auditItems.map((it) => (
                      <div
                        key={it.id}
                        className="rounded-md border border-zinc-800/80 bg-zinc-900/25 px-3 py-2"
                      >
                        <p className="text-sm text-zinc-200">
                          <span className="font-semibold">{it.action}</span>{" "}
                          <span className="text-zinc-400">
                            {it.actor?.name ? `by ${it.actor.name}` : ""}
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {new Date(it.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {auditItems.length === 0 ? (
                      <p className="text-xs text-zinc-500">No audit events yet.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </ScrollArea>

            <DialogFooter className="border-t border-zinc-800/80 bg-zinc-950/20 px-6 py-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
