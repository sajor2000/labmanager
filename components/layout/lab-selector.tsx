"use client";

import { useState, useRef, useEffect } from "react";
import { Building, Check, ChevronDown, Loader2, Users, Crown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLab } from "@/lib/contexts/lab-context";

export function LabSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    currentLab, 
    userLabs, 
    allLabsMode,
    setCurrentLab, 
    setAllLabsMode,
    isLoading,
    hasMultipleLabs 
  } = useLab();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-900">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span>Loading labs...</span>
      </div>
    );
  }

  if (!allLabsMode && !currentLab && userLabs.length === 0) {
    return null;
  }

  // Helper to get role icon
  const getRoleIcon = (lab: any) => {
    if (lab.memberRole === 'LAB_ADMIN' || lab.isAdmin) {
      return <Shield className="h-3 w-3 text-blue-500" />;
    }
    if (lab.role === 'PRINCIPAL_INVESTIGATOR' || lab.role === 'CO_PRINCIPAL_INVESTIGATOR') {
      return <Crown className="h-3 w-3 text-amber-500" />;
    }
    return null;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {allLabsMode ? (
          <>
            <Users className="h-4 w-4 text-gray-500" />
            <span className="font-medium">All My Labs</span>
          </>
        ) : (
          <>
            <Building className="h-4 w-4 text-gray-500" />
            <span className="max-w-[200px] truncate" title={currentLab?.name}>
              {currentLab?.shortName}
            </span>
          </>
        )}
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="p-2">
            <div className="mb-2 px-3 py-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {hasMultipleLabs ? 'YOUR LABS' : 'SELECT LAB'}
              </p>
            </div>
            
            {/* Show "All My Labs" option if user has multiple labs */}
            {hasMultipleLabs && (
              <button
                onClick={() => {
                  setAllLabsMode(true);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-start space-x-3 rounded-lg px-3 py-3 text-left transition-colors mb-2",
                  allLabsMode
                    ? "bg-purple-50 dark:bg-purple-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                  <Users className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        All My Labs
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        View content from all your labs
                      </p>
                    </div>
                    {allLabsMode && (
                      <Check className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {userLabs.length} labs: {userLabs.map(l => l.shortName).join(', ')}
                  </p>
                </div>
              </button>
            )}
            
            {/* Divider if showing all labs option */}
            {hasMultipleLabs && (
              <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
            )}
            
            {/* User's labs */}
            {userLabs.map((lab) => (
              <button
                key={lab.id}
                onClick={() => {
                  setCurrentLab(lab);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-start space-x-3 rounded-lg px-3 py-3 text-left transition-colors",
                  currentLab?.id === lab.id && !allLabsMode
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: lab.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  <Building className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {lab.shortName}
                      </p>
                      {getRoleIcon(lab)}
                    </div>
                    {currentLab?.id === lab.id && !allLabsMode && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                    {lab.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {lab.memberRole === 'LAB_ADMIN' || lab.isAdmin ? 'Lab Admin' : 
                       lab.role === 'PRINCIPAL_INVESTIGATOR' ? 'Principal Investigator' :
                       lab.role === 'CO_PRINCIPAL_INVESTIGATOR' ? 'Co-PI' : 'Member'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}