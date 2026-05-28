"use client";

import { usePathname } from "next/navigation";

export const AppUserFooterShell = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  const show =
    pathname?.startsWith("/dms") || pathname?.startsWith("/servers");

  if (!show) return null;

  return <>{children}</>;
};
