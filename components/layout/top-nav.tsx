"use client";

import { useTheme } from "next-themes";
import {
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { LabSelector } from "./lab-selector";
import { UserProfileDropdown } from "./user-profile-dropdown";
import { GlobalSearch } from "./global-search";

export function TopNav() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950 dark:border-gray-800">
      {/* Search Bar */}
      <GlobalSearch />

      {/* Lab Selector and Actions */}
      <div className="flex items-center space-x-4 ml-6">
        {/* Lab Selector */}
        <LabSelector />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User Profile Dropdown */}
        <UserProfileDropdown showFullProfile={false} />
      </div>
    </header>
  );
}