import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { getDmFriends } from "@/lib/dm-friends";
import { FriendsHome } from "@/components/dm/friends-home";

const DmsHomePage = async () => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const friends = await getDmFriends(user.id);

  return (
    <div className="surface-chat h-full">
      <FriendsHome friends={friends} />
    </div>
  );
};

export default DmsHomePage;
