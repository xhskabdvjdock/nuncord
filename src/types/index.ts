import { Server, Member, User, Channel, Message } from "@prisma/client";

export type ServerWithMembersWithUsers = Server & {
  members: (Member & { user: User })[];
  channels: Channel[];
};

export type ServerLiteForSidebar = Server & {
  members: (Member & {
    user: Pick<User, "id" | "name" | "imageUrl" | "status" | "statusText">;
  })[];
  channels: Channel[];
};

export type MessageWithMemberWithUser = Message & {
  member: Member & {
    user: User;
  };
};
