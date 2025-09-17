"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  LogOut
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { logout } from "@/lib/actions/logout";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const UserAvatar = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src="/userlogo.jpeg" alt="userlogo" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <LoggedUserMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LoggedUserMenu = () => {

  const { removeItem } = useLocalStorage("accessToken");

  return (
    <>
      {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}

      {/* <DropdownMenuGroup>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span><Link href="/settings"> Settings</Link></span>

        </DropdownMenuItem>
      </DropdownMenuGroup> */}
      {/* <DropdownMenuSeparator /> */}

      <DropdownMenuItem>
        <Button variant={"ghost"} onClick={() => {
          removeItem();
          logout();
        }}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </Button>
      </DropdownMenuItem>
    </>
  );
};

export default UserAvatar;
