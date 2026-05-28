import { NavigationSidebar } from "@/components/navigation/navigation-sidebar";
import { AppUserFooter } from "@/components/app-user-footer";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-screen relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),_transparent_40%)]" />
      <div className="hidden md:flex h-full w-[72px] z-30 flex-col fixed inset-y-0 pb-[52px]">
        <NavigationSidebar />
      </div>
      <AppUserFooter />
      <main className="md:pl-[72px] h-full relative">{children}</main>
    </div>
  );
};

export default MainLayout;
