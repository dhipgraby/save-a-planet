import React from "react";
import { ThemeToggle } from "./theme-toggle";
import UserAvatar from "./user-avatar";

// main app header
const Header = () => {
  return (
    <header className="h-full border-b">
      <div className="container flex items-center justify-between p-2">
        <div className="flex space-x-1">
          {/* <BitcoinPrice /> */}
          <ThemeToggle />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
};

export default Header;
