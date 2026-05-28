"use client";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { AppSettingsProvider } from "@/components/providers/app-settings-provider";
import { PresenceProvider } from "@/components/providers/presence-provider";
import { SocketProvider } from "@/components/providers/socket-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ModalProvider } from "@/components/providers/modal-provider";
import { UnreadProvider } from "@/components/providers/unread-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <AppSettingsProvider>
        <PresenceProvider>
          <SocketProvider>
            <QueryProvider>
              <TooltipProvider delayDuration={250}>
                <ModalProvider />
                <UnreadProvider />
                {children}
              </TooltipProvider>
            </QueryProvider>
          </SocketProvider>
        </PresenceProvider>
      </AppSettingsProvider>
    </AuthSessionProvider>
  );
}

