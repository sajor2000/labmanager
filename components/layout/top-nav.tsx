"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LabSelector } from "./lab-selector";
import { UserProfileDropdown } from "./user-profile-dropdown";

export function TopNav() {
  const { theme, setTheme } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950 dark:border-gray-800">
      {/* Search Bar */}
      <div className="flex flex-1 items-center max-w-xl">
        <div
          className={cn(
            "relative flex w-full items-center rounded-lg border transition-all",
            searchFocused
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-gray-300 dark:border-gray-700"
          )}
        >
          <Search className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search studies, tasks, or documents"
            className="w-full bg-transparent py-2 pl-10 pr-12 text-sm outline-none placeholder:text-gray-400"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="absolute right-3 flex items-center space-x-1">
            <kbd className="hidden rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 sm:inline-flex items-center">
              <Command className="h-3 w-3 mr-0.5" />K
            </kbd>
          </div>
        </div>
      </div>

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