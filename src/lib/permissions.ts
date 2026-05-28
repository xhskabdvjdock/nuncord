import { MemberRole, ServerPermission } from "@prisma/client";
import { db } from "@/lib/db";

const rolePermissionMap: Record<MemberRole, ServerPermission[]> = {
  // Base member role is intentionally limited.
  // Elevated permissions should be granted through custom server roles.
  ADMIN: ["SEND_MESSAGES"],
  MODERATOR: ["SEND_MESSAGES"],
  GUEST: ["SEND_MESSAGES"],
};

export async function getMemberServerPermissions(memberId: string, channelId?: string) {
  const member = await db.member.findUnique({
    where: { id: memberId },
    include: {
      assignedRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!member) return new Set<ServerPermission>();

  const merged = new Set<ServerPermission>(rolePermissionMap[member.role] ?? []);

  // Server owner always has full permissions.
  const server = await db.server.findUnique({
    where: { id: member.serverId },
    select: { userId: true },
  });
  if (server?.userId === member.userId) {
    for (const p of Object.values(ServerPermission)) {
      merged.add(p);
    }
  }

  for (const assigned of member.assignedRoles) {
    for (const permission of assigned.role.permissions) {
      merged.add(permission);
    }
  }

  if (channelId) {
    const overwrites = await db.permissionOverwrite.findMany({
      where: {
        channelId,
        roleId: { in: member.assignedRoles.map((r) => r.roleId) },
      },
      select: { allow: true, deny: true },
    });

    for (const overwrite of overwrites) {
      for (const denied of overwrite.deny) merged.delete(denied);
      for (const allowed of overwrite.allow) merged.add(allowed);
    }
  }

  return merged;
}

export function hasPermission(
  permissions: Set<ServerPermission>,
  permission: ServerPermission
) {
  return permissions.has(permission);
}

