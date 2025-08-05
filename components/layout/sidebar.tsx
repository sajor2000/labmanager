"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserProfileDropdown } from "@/components/layout/user-profile-dropdown";
import {
  BarChart3,
  FlaskConical,
  FolderOpen,
  Beaker,
  Grid3x3,
  Kanban,
  Lightbulb,
  Clock,
  Users,
  Mic,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Labs", href: "/labs", icon: FlaskConical },
  { name: "Buckets", href: "/buckets", icon: FolderOpen },
  { name: "Studies", href: "/studies", icon: Beaker },
  { name: "Stacked by Bucket", href: "/stacked", icon: Grid3x3 },
  { name: "Task Board", href: "/tasks", icon: Kanban },
  { name: "Ideas Board", href: "/ideas", icon: Lightbulb },
  { name: "Deadlines", href: "/deadlines", icon: Clock },
  { name: "Team Members", href: "/team", icon: Users },
  { name: "Standups", href: "/standups", icon: Mic },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 dark:bg-gray-950">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-start px-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Rush Labs</h1>
            <p className="text-xs text-gray-400">Research Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-800 p-4">
        <UserProfileDropdown showFullProfile={true} />
      </div>
    </div>
  );
}