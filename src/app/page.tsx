"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/services/auth";
import { homeRoute } from "@/features/auth/homeRoute";

/** «/» has no screen of its own: each person lands on their home (signed out → sign in). */
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(isAuthenticated() ? homeRoute() : "/login");
  }, [router]);
  return <div aria-hidden className="min-h-screen bg-background" />;
}
