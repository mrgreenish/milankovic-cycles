"use client";
import type { ReactNode } from "react";
import { QuietLink } from "@/components/site/QuietLink";
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
    <QuietLink
      className={className}
      href={path(
        experience
          ? labPath(experience.parameters, experience.scale, experience.timeKyr)
          : "/lab",
      )}
    >
      {children}
    </QuietLink>
  );
}
