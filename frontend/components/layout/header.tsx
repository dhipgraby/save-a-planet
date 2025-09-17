"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import pathUrls from "@/data/pathUrl.json";
import UserAvatar from "../user-avatar";
import { ThemeToggle } from "../theme-toggle";

interface Link {
  linkText: string;
  linkHref: string;
  [key: string]: Link | string;
}

function findLinkText(
  obj: Link | string,
  pathname: string
): string | undefined {
  if (typeof obj === "string") return undefined;

  for (const key in obj) {
    if (typeof obj[key] === "object") {
      const result = findLinkText(obj[key] as Link, pathname);
      if (result) return result;
    } else if (key === "linkHref" && obj[key] === pathname) {
      return obj["linkText"];
    }
  }
}

const DashboardHeader = () => {
  const pathname = usePathname();
  const linkText = findLinkText(pathUrls as unknown as Link, pathname);

  return (
    <header className="overflow-hidden flex justify-between h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
      {linkText ? (
        <div className="w-screen">
          <h1 className="font-semibold text-lg">{linkText}</h1>
        </div>
      ) : (
        <div></div>
      )}
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <UserAvatar />
      </div>
    </header>
  );
};

export default DashboardHeader;
