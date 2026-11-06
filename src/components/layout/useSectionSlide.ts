"use client";

import { useCallback, useMemo, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSectionMotion } from "@/hooks/useDevicePref";
import { activeItem, navFor } from "./navigation";
import { useSectionSwipe } from "./useSectionSwipe";

type Direction = 1 | -1;

/**
 * «Deslizar de lado»: each section arrives from the side it sits on in the menu (forward from the
 * right, back from the left), and sideways swipes on `scroller` move to the next or previous one.
 * `slide` is false with «Subir» or reduced motion; `dir` is where the current screen came from.
 */
export function useSectionSlide(pathname: string, scroller: RefObject<HTMLElement | null>): { slide: boolean; dir: Direction } {
  const router = useRouter();
  const { isSeller } = useRole();
  const [sectionMotion] = useSectionMotion();
  const reducedMotion = useReducedMotion();
  const slide = sectionMotion === "deslizar" && !reducedMotion;

  const sections = useMemo(() => {
    const { main, footer } = navFor(isSeller);
    return [...main, ...footer];
  }, [isSeller]);
  const sectionIndex = useCallback(
    (path: string) => {
      const item = activeItem(path, sections);
      return item ? sections.indexOf(item) : -1;
    },
    [sections],
  );

  // Adjusting state while rendering (not in an effect) so the new screen mounts with its direction.
  const [visit, setVisit] = useState<{ path: string; dir: Direction }>({ path: pathname, dir: 1 });
  if (visit.path !== pathname) {
    setVisit({ path: pathname, dir: sectionIndex(pathname) >= sectionIndex(visit.path) ? 1 : -1 });
  }

  const goSection = useCallback(
    (dir: Direction) => {
      const next = sections[sectionIndex(pathname) + dir];
      if (next) router.push(next.href);
    },
    [sections, sectionIndex, pathname, router],
  );
  useSectionSwipe(scroller, slide, goSection);

  return { slide, dir: visit.dir };
}
