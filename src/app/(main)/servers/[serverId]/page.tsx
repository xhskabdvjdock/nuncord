import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

interface ServerPageProps {
  params: Promise<{ serverId: string }>;
}

const ServerPage = async ({ params }: ServerPageProps) => {
  const user = await currentUser();
  const { serverId } = await params;

  if (!user) {
    return redirect("/sign-in");
  }

  const server = await db.server.findUnique({
    where: {
      id: serverId,
      members: {
        some: { userId: user.id },
      },
    },
    include: {
      channels: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!server) {
    return redirect("/");
  }

  const initialChannel =
    server.channels.find((c) => c.type === "TEXT") || server.channels[0];

  if (!initialChannel) {
    return redirect("/");
  }

  return redirect(`/servers/${serverId}/channels/${initialChannel.id}`);
};

export default ServerPage;
