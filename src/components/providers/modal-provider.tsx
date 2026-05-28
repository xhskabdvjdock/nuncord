"use client";

import { useEffect, useState } from "react";
import { CreateServerModal } from "@/components/modals/create-server-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { EditServerModal } from "@/components/modals/edit-server-modal";
import { MembersModal } from "@/components/modals/members-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { LeaveServerModal } from "@/components/modals/leave-server-modal";
import { DeleteServerModal } from "@/components/modals/delete-server-modal";
import { DeleteChannelModal } from "@/components/modals/delete-channel-modal";
import { EditChannelModal } from "@/components/modals/edit-channel-modal";
import { MessageFileModal } from "@/components/modals/message-file-modal";
import { DeleteMessageModal } from "@/components/modals/delete-message-modal";
import { SearchUsersModal } from "@/components/modals/search-users-modal";
import { AppSettingsModal } from "@/components/modals/app-settings-modal";
import { NotificationsModal } from "@/components/modals/notifications-modal";
import { UserProfileModal } from "@/components/modals/user-profile-modal";
import { PinnedMessagesModal } from "@/components/modals/pinned-messages-modal";
import { useModal } from "@/hooks/use-modal-store";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { onOpen, isOpen } = useModal();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isOpen) return;
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen("searchUsers");
        return;
      }

      if (mod && event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        onOpen("notifications");
        return;
      }

      if (mod && event.key === ",") {
        event.preventDefault();
        onOpen("appSettings");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onOpen]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateServerModal />
      <InviteModal />
      <EditServerModal />
      <MembersModal />
      <CreateChannelModal />
      <LeaveServerModal />
      <DeleteServerModal />
      <DeleteChannelModal />
      <EditChannelModal />
      <MessageFileModal />
      <DeleteMessageModal />
      <SearchUsersModal />
      <AppSettingsModal />
      <NotificationsModal />
      <UserProfileModal />
      <PinnedMessagesModal />
    </>
  );
};
