import { UserStatus } from "@prisma/client";

export const statusLabelMap: Record<UserStatus, string> = {
  ONLINE: "Online",
  IDLE: "Idle",
  BUSY: "Do Not Disturb",
  OFFLINE: "Offline",
};

export function getStatusLabel(
  status: UserStatus,
  statusText?: string | null
): string {
  const custom = statusText?.trim();
  if (custom) return custom;
  return statusLabelMap[status];
}

export const statusSortOrder: Record<UserStatus, number> = {
  ONLINE: 0,
  IDLE: 1,
  BUSY: 2,
  OFFLINE: 3,
};
