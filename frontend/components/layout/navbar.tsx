"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import pathUrls from "@/data/pathUrl.json";
import IconController from "../icon-controller";
import Image from "next/image";
import useMediaQuery from "@/hooks/useMediaQuery";
import { ThemeToggle } from "../theme-toggle";
import UserAvatar from "../user-avatar";
import { Gamepad2 } from "lucide-react";

const linksStyle =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50";
const selectedLinkStyle =
  "flex items-center gap-3 rounded-lg bg-gray-200 px-3 py-2 text-gray-900  transition-all hover:text-gray-900 dark:bg-gray-800 dark:text-gray-50";

const DashboardNavBar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={`border-b-2 bg-gray-100/40 lg:border-r lg:bg-gray-100/40 dark:bg-gray-800/40 ${isDesktop ? "lg:block h-full" : "lg:hidden h-fit"}`}>
      <div className={`flex justify-between items-center px-6 h-[60px] ${isDesktop ? "lg:hidden" : "lg:block"}`}>

        {isDesktop ? (
          <nav className="grid items-start px-4 text-sm font-medium">
            <Link
              className="flex items-center gap-2 font-semibold"
              href={pathUrls.dashboard.linkHref}
            >
              <Image src={"/kenlogo.png"} alt="logo" width={33} height={25} />
              <span className="">Users app</span>
            </Link>
            <Link
              className={
                pathname === pathUrls.dashboard.linkHref
                  ? selectedLinkStyle
                  : linksStyle
              }
              href={pathUrls.dashboard.linkHref}
            >
              <IconController icon="home" />
              {pathUrls.dashboard.linkText}
            </Link>
            <Link
              className={
                pathname === pathUrls.game.linkHref
                  ? selectedLinkStyle
                  : linksStyle
              }
              href={pathUrls.game.linkHref}
            >
              <Gamepad2 />
              {pathUrls.game.linkText}
            </Link>
          </nav>
        ) : (
          <div className="flex place-content-between w-full">
            <button
              className="text-gray-500 dark:text-gray-400"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <IconController icon="X" />
              ) : (
                <IconController icon="menu" />
              )}
            </button>
            <div className="flex items-center space-x-2">
              {/* <BitcoinPrice /> */}
              <ThemeToggle />
              <UserAvatar />
            </div>
          </div>
        )}
      </div>
      {isDesktop && (
        <nav className="px-4 py-2 text-sm font-medium">
          <div className="flex h-[60px] items-center px-6">
            <Link
              className="flex items-center gap-2"
              href={pathUrls.dashboard.linkHref}
            >
              <Image src={"/kenlogo.png"} alt="logo" width={33} height={25} />
              <span className="text-base">Save a Planet</span>
            </Link>
          </div>
          <Link
            className={
              pathname === pathUrls.dashboard.linkHref
                ? selectedLinkStyle
                : linksStyle
            }
            href={pathUrls.dashboard.linkHref}
          >
            <IconController icon="home" />
            {pathUrls.dashboard.linkText}
          </Link>
          <Link
            className={
              pathname === pathUrls.game.linkHref
                ? selectedLinkStyle
                : linksStyle
            }
            href={pathUrls.game.linkHref}
          >
            <Gamepad2 />
            {pathUrls.game.linkText}
          </Link>
        </nav>
      )}
      {!isDesktop && mobileMenuOpen && (
        <nav className="px-4 py-2 bg-gray-100 dark:bg-gray-800/40 text-sm font-semibold">
          <Link
            onClick={() => setMobileMenuOpen(false)}
            className={
              pathname === pathUrls.dashboard.linkHref
                ? selectedLinkStyle
                : linksStyle
            }
            href={pathUrls.dashboard.linkHref}
          >
            <IconController icon="home" />
            {pathUrls.dashboard.linkText}
          </Link>
        </nav>
      )}
    </div>
  );
};

export default DashboardNavBar;
