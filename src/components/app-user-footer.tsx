import { currentUser } from "@/lib/current-user";
import { ServerUserPanel } from "@/components/server/server-user-panel";
import { AppUserFooterShell } from "@/components/app-user-footer-shell";

export const AppUserFooter = async () => {
  const user = await currentUser();
  if (!user) return null;

  return (
    <AppUserFooterShell>
      <div className="hidden md:flex fixed bottom-0 left-0 z-40 h-[52px] w-[312px]">
        <ServerUserPanel user={user} className="w-full" />
      </div>
    </AppUserFooterShell>
  );
};
