'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Lab {
  id: string;
  name: string;
  shortName: string;
  description?: string;
}

interface LabContextType {
  currentLab: Lab | null;
  availableLabs: Lab[];
  setCurrentLab: (lab: Lab) => void;
  isLoading: boolean;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export function LabProvider({ children }: { children: ReactNode }) {
  const [currentLab, setCurrentLab] = useState<Lab | null>(null);
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // Fetch available labs
        const labsResponse = await fetch('/api/labs');
        if (labsResponse.ok) {
          const labs = await labsResponse.json();
          setAvailableLabs(labs);
          
          // Get stored lab preference from localStorage
          const storedLabId = localStorage.getItem('selectedLabId');
          
          if (storedLabId) {
            const storedLab = labs.find((lab: Lab) => lab.id === storedLabId);
            if (storedLab) {
              setCurrentLab(storedLab);
            } else {
              // Default to first lab if stored lab not found
              setCurrentLab(labs[0] || null);
            }
          } else {
            // Try to get user's lab from their profile
            const userResponse = await fetch('/api/users/current');
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.labs && userData.labs.length > 0) {
                const userLab = labs.find((lab: Lab) => lab.id === userData.labs[0].labId);
                if (userLab) {
                  setCurrentLab(userLab);
                  localStorage.setItem('selectedLabId', userLab.id);
                }
              }
            }
            
            // If still no lab, default to first available
            if (!currentLab && labs.length > 0) {
              setCurrentLab(labs[0]);
              localStorage.setItem('selectedLabId', labs[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch labs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabs();
  }, []);

  const handleSetCurrentLab = (lab: Lab) => {
    setCurrentLab(lab);
    localStorage.setItem('selectedLabId', lab.id);
    // Trigger a custom event so other components can react
    window.dispatchEvent(new CustomEvent('labChanged', { detail: lab }));
  };

  return (
    <LabContext.Provider 
      value={{ 
        currentLab, 
        availableLabs, 
        setCurrentLab: handleSetCurrentLab,
        isLoading 
      }}
    >
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  const context = useContext(LabContext);
  if (context === undefined) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
}