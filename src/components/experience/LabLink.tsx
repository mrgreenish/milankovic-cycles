"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLocalePath } from "@/i18n/LocaleProvider";
import { labPath } from "@/lib/orbital/query";
import { useOptionalExperience } from "./ExperienceProvider";

export function LabLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const experience = useOptionalExperience();
  const path = useLocalePath();
  return (
    <Link
      className={className}
      href={path(
        experience
          ? labPath(experience.parameters, experience.scale, experience.timeKyr)
          : "/lab",
      )}
    >
      {children}
    </Link>
  );
}
