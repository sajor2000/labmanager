"use client";

import { useState, useRef, useEffect } from "react";
import { Building, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const labs = [
  {
    id: "rhedas",
    name: "Rush Health Equity Data Analytics Studio",
    abbreviation: "RHEDAS",
    description: "Health equity research and data analytics",
    memberCount: 12,
    activeStudies: 8,
  },
  {
    id: "riccc",
    name: "Rush Interdisciplinary Consortium for Critical Care Trials and Data Science",
    abbreviation: "RICCC",
    description: "Critical care trials and data science research",
    memberCount: 18,
    activeStudies: 15,
  },
];

export function LabSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(labs[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building className="h-4 w-4 text-gray-500" />
        <span className="max-w-[200px] truncate" title={selectedLab.name}>
          {selectedLab.abbreviation}
        </span>
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
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">SELECT LAB</p>
            </div>
            
            {labs.map((lab) => (
              <button
                key={lab.id}
                onClick={() => {
                  setSelectedLab(lab);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-start space-x-3 rounded-lg px-3 py-3 text-left transition-colors",
                  selectedLab.id === lab.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Building className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {lab.abbreviation}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {lab.name}
                      </p>
                    </div>
                    {selectedLab.id === lab.id && (
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {lab.description}
                  </p>
                  <div className="mt-2 flex space-x-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>{lab.memberCount} members</span>
                    <span>{lab.activeStudies} active studies</span>
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