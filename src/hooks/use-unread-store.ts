import { create } from "zustand";
import type { UnreadBadge } from "@/lib/unread";

type DmUnread = UnreadBadge & { conversationId?: string };

type UnreadStore = {
  channels: Record<string, UnreadBadge>;
  dms: Record<string, DmUnread>;
  setChannels: (channels: Record<string, UnreadBadge>) => void;
  setDms: (dms: Record<string, DmUnread>) => void;
  bumpChannel: (
    channelId: string,
    opts?: { mention?: boolean; force?: boolean }
  ) => void;
  bumpDm: (
    memberId: string,
    opts?: { mention?: boolean; conversationId?: string }
  ) => void;
  clearChannel: (channelId: string) => void;
  clearDm: (memberId: string) => void;
};

export const useUnreadStore = create<UnreadStore>((set) => ({
  channels: {},
  dms: {},
  setChannels: (channels) => set({ channels }),
  setDms: (dms) => set({ dms }),
  bumpChannel: (channelId, opts) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: {
          unread: opts?.force !== false ? true : state.channels[channelId]?.unread ?? true,
          mention:
            opts?.mention === true ||
            state.channels[channelId]?.mention === true,
        },
      },
    })),
  bumpDm: (memberId, opts) =>
    set((state) => ({
      dms: {
        ...state.dms,
        [memberId]: {
          unread: true,
          mention:
            opts?.mention === true || state.dms[memberId]?.mention === true,
          conversationId:
            opts?.conversationId ?? state.dms[memberId]?.conversationId,
        },
      },
    })),
  clearChannel: (channelId) =>
    set((state) => ({
      channels: {
        ...state.channels,
        [channelId]: { unread: false, mention: false },
      },
    })),
  clearDm: (memberId) =>
    set((state) => ({
      dms: {
        ...state.dms,
        [memberId]: {
          ...state.dms[memberId],
          unread: false,
          mention: false,
        },
      },
    })),
}));
