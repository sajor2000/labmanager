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
  LayoutGrid,
  Lightbulb,
  Clock,
  Users,
  Mic,
  Calendar,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Labs", href: "/labs", icon: FlaskConical },
  { name: "Buckets", href: "/buckets", icon: FolderOpen },
  { name: "Studies", href: "/studies", icon: Beaker },
  { name: "Stacked by Bucket", href: "/stacked", icon: Grid3x3 },
  { name: "Kanban Board", href: "/kanban", icon: Kanban },
  { name: "Task Board", href: "/tasks", icon: LayoutGrid },
  { name: "Ideas Board", href: "/ideas", icon: Lightbulb },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Deadlines", href: "/deadlines", icon: Clock },
  { name: "Team Members", href: "/team", icon: Users },
  { name: "Standups", href: "/standups", icon: Mic },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sidebar-rush flex h-full w-64 flex-col">
      {/* Logo Section - Rush University Theme */}
      <div className="flex h-16 items-center justify-start px-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rush-green dark:bg-rush-green-light">
            <FlaskConical className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">LabSync</h1>
            <p className="text-xs text-muted-foreground">Research Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation - Rush/Slack Theme */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "px-3 py-2 rounded-lg flex items-center relative w-full transition-all duration-200",
                "text-foreground/70 dark:text-foreground/60",
                "hover:bg-[hsl(var(--hover-bg))] dark:hover:bg-[hsl(var(--hover-bg))]",
                "hover:text-foreground dark:hover:text-foreground",
                isActive && "bg-primary text-primary-foreground dark:bg-[hsl(var(--active-bg))] dark:text-foreground"
              )}
            >
              {/* Active indicator - left border */}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary dark:bg-rush-green-light rounded-l-md" />
              )}
              <Icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-primary-foreground dark:text-foreground"
                    : "text-muted-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-border p-4">
        <UserProfileDropdown showFullProfile={true} />
      </div>
    </div>
  );
}