import { getDmFriends } from "@/lib/dm-friends";
import { DmSidebarClient } from "./dm-sidebar-client";

interface DmSidebarProps {
  userId: string;
}

export const DmSidebar = async ({ userId }: DmSidebarProps) => {
  const friends = await getDmFriends(userId);

  const items = friends.map((friend) => ({
    memberId: friend.memberId,
    userName: friend.userName,
    imageUrl: friend.imageUrl,
    status: friend.status,
    statusText: friend.statusText,
    sharedServerName: friend.sharedServerName,
    conversationId: friend.conversationId,
    lastMessageAt: friend.lastMessageAt,
    lastMessagePreview: friend.lastMessagePreview,
  }));

  return <DmSidebarClient items={items} />;
};
