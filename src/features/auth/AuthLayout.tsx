"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { LOGIN_SCENES, pickLoginScene, rememberLoginScene } from "./scenes/loginScenes";

/** bria.'s public page (its own repo, bria-landing): the logo here leads back to it. */
const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL ?? "/login";

/** Two-column sign-in frame: one of three living scenes on the left (a new one each visit), the form on the right. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [index] = useState(pickLoginScene);
  useEffect(() => rememberLoginScene(index), [index]);
  const scene = LOGIN_SCENES[index];

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.08fr_1fr]">
      <aside className="ink-scope relative hidden overflow-hidden bg-strong text-strong-foreground lg:flex lg:flex-col lg:justify-between lg:gap-10 lg:p-12">
        <a href={LANDING_URL} aria-label="bria., página de inicio" className="self-start rounded-lg">
          <Wordmark tone="onStrong" className="text-[34px]" />
        </a>
        <div key={scene.id} className="scene-in flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[46px] font-bold leading-[1.02] tracking-[-0.035em]">{scene.title}</h1>
            <p className="max-w-md text-[18px] font-medium leading-relaxed text-strong-foreground/65">{scene.text}</p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {scene.points.map((p) => (
              <li key={p} className="rounded-full border border-strong-foreground/15 px-3 py-1 text-[13px] font-medium text-strong-foreground/75">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="scene-in pb-10 [animation-delay:120ms]">
          <scene.Visual />
        </div>
        <p className="text-[13px] text-strong-foreground/45">Hecho en Lima para las MYPE del Perú.</p>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10">
          <a href={LANDING_URL} aria-label="bria., página de inicio" className="rounded-lg lg:invisible">
            <Wordmark className="text-[26px]" />
          </a>
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
