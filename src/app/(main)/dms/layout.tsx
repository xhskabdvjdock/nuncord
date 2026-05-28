import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { DmSidebar } from "@/components/dm/dm-sidebar";

const DmsLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="h-full">
      <div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0 left-[72px]">
        <DmSidebar userId={user.id} />
      </div>
      <main className="h-full md:pl-60">{children}</main>
    </div>
  );
};

export default DmsLayout;
