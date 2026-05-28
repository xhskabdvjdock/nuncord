import { create } from "zustand";
import { Channel, ChannelType, Member, Server, User } from "@prisma/client";

export type ModalType =
  | "createServer"
  | "invite"
  | "editServer"
  | "members"
  | "createChannel"
  | "leaveServer"
  | "deleteServer"
  | "deleteChannel"
  | "editChannel"
  | "messageFile"
  | "deleteMessage"
  | "searchUsers"
  | "appSettings"
  | "notifications"
  | "userProfile"
  | "pinnedMessages";

type ProfileUser = Pick<
  User,
  "id" | "name" | "imageUrl" | "status" | "statusText" | "bio" | "bannerUrl" | "createdAt"
>;

interface ModalData {
  server?: Server;
  channel?: Channel;
  channelType?: ChannelType;
  apiUrl?: string;
  query?: Record<string, string>;
  chatId?: string;
  chatType?: "channel" | "conversation";
  member?: Member;
  user?: User;
  profileUser?: ProfileUser;
  profileServerId?: string;
  profileMemberId?: string;
}

interface ModalStore {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
  onOpen: (type: ModalType, data?: ModalData) => void;
  onClose: () => void;
}

export const useModal = create<ModalStore>((set) => ({
  type: null,
  data: {},
  isOpen: false,
  onOpen: (type, data = {}) => set({ isOpen: true, type, data }),
  onClose: () => set({ type: null, isOpen: false }),
}));
