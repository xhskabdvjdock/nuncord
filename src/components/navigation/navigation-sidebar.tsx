import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NavigationAction } from "./navigation-action";
import { NavigationItem } from "./navigation-item";
import { NavigationHomeItem } from "./navigation-home-item";

export const NavigationSidebar = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const servers = await db.server.findMany({
    where: {
      members: {
        some: { userId: user.id },
      },
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  return (
    <div className="surface-nav space-y-4 flex flex-col items-center h-full w-full py-3 border-r border-zinc-800/70 shadow-[0_0_24px_rgba(0,0,0,0.32)]">
      <NavigationHomeItem />
      <NavigationAction />
      <Separator className="h-[2px] bg-zinc-700 rounded-md w-10 mx-auto" />
      <ScrollArea className="flex-1 w-full">
        {servers.map((server) => (
          <div key={server.id} className="mb-4">
            <NavigationItem
              id={server.id}
              name={server.name}
              imageUrl={server.imageUrl}
            />
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
