"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api/resources";
import { markOnboardingPending } from "@/features/onboarding/progress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useQueryParam } from "@/hooks/useQueryParam";
import { AuthLayout } from "@/features/auth/AuthLayout";
import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { homeRoute } from "@/features/auth/homeRoute";
import { EntryCurtain, markEntry } from "@/components/brand/EntryCurtain";

type Mode = "login" | "register";

/** The first name for the greeting, if the API answers fast; the curtain never waits longer. */
async function firstNameQuickly(): Promise<string | null> {
  const timeout = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 700));
  try {
    const me = await Promise.race([authApi.me(), timeout]);
    return me?.full_name?.trim().split(/\s+/)[0] ?? null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const reduced = useReducedMotion();
  // «Crear cuenta» on the public page (bria-landing) links here with ?modo=registro.
  const asked = useQueryParam("modo");
  const [mode, setMode] = useState<Mode>(asked === "registro" ? "register" : "login");
  const [entering, setEntering] = useState<{ name: string | null; to: string } | null>(null);

  const enter = async () => {
    const to = homeRoute();
    if (reduced) {
      router.replace(to);
      return;
    }
    router.prefetch(to);
    setEntering({ name: await firstNameQuickly(), to });
  };

  return (
    <AuthLayout>
      <div key={mode} className="animate-fade-in">
        {mode === "login" ? (
          <LoginForm onSignedIn={() => void enter()} onCreateAccount={() => setMode("register")} />
        ) : (
          <RegisterForm
            onRegistered={() => {
              markOnboardingPending();
              router.replace("/welcome");
            }}
            onSignIn={() => setMode("login")}
          />
        )}
      </div>
      {entering && (
        <EntryCurtain
          phase="in"
          name={entering.name}
          onDone={() => {
            markEntry(entering.name);
            router.replace(entering.to);
          }}
        />
      )}
    </AuthLayout>
  );
}
