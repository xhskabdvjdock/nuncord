import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Fast path: JWT session only (no DB round-trip). */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export const currentUser = async () => {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  return user;
};
