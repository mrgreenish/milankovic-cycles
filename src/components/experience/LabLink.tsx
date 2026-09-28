"use client";
import Link from "next/link";
import type { ReactNode } from "react";
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
  return (
    <Link
      className={className}
      href={
        experience ? labPath(experience.parameters, experience.scale) : "/lab"
      }
    >
      {children}
    </Link>
  );
}
