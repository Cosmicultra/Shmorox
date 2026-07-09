"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const SESSION_KEY = "shmorox-session-active";

/** Send users to home on the first load of each browser tab/session. */
export function HomeRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;

    sessionStorage.setItem(SESSION_KEY, "1");
    if (pathname !== "/") {
      router.replace("/");
    }
  }, [pathname, router]);

  return null;
}
