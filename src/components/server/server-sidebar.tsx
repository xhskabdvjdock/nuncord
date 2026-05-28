import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServerHeader } from "./server-header";
import { ServerDirectory } from "./server-directory";

interface ServerSidebarProps {
  serverId: string;
}

export const ServerSidebar = async ({ serverId }: ServerSidebarProps) => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const server = await db.server.findUnique({
    where: { id: serverId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      inviteCode: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      channels: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          userId: true,
          serverId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      members: {
        where: { userId: user.id },
        select: {
          role: true,
          userId: true,
        },
      },
    },
  });

  if (!server) {
    return redirect("/");
  }

  const role = server.members[0]?.role;

  return (
    <div className="surface-server flex flex-col h-full text-primary w-full border-r border-zinc-800/70 shadow-[0_0_24px_rgba(0,0,0,0.2)]">
      <ServerHeader server={server} role={role} />
      <ScrollArea className="flex-1 px-3 pb-[52px]">
        <ServerDirectory
          server={server}
          channels={server.channels}
          role={role}
        />
      </ScrollArea>
    </div>
  );
};
