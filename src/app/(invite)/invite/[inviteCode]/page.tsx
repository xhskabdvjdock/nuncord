import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

interface InviteCodePageProps {
  params: Promise<{ inviteCode: string }>;
}

const InviteCodePage = async ({ params }: InviteCodePageProps) => {
  const user = await currentUser();
  const { inviteCode } = await params;

  if (!user) {
    return redirect("/sign-in");
  }

  if (!inviteCode) {
    return redirect("/");
  }

  // Check if user already a member
  const existingServer = await db.server.findFirst({
    where: {
      inviteCode,
      members: {
        some: { userId: user.id },
      },
    },
  });

  if (existingServer) {
    return redirect(`/servers/${existingServer.id}`);
  }

  // Join server
  const server = await db.server.update({
    where: { inviteCode },
    data: {
      members: {
        create: [{ userId: user.id }],
      },
    },
  });

  if (server) {
    return redirect(`/servers/${server.id}`);
  }

  return redirect("/");
};

export default InviteCodePage;
