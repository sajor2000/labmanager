'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { safeLocalStorage, safeWindow } from '@/lib/utils/browser';

interface Lab {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  color?: string;
  icon?: string;
  isAdmin?: boolean;
  memberRole?: string;
}

interface LabContextType {
  currentLab: Lab | null;
  availableLabs: Lab[];
  userLabs: Lab[];
  allLabsMode: boolean;
  setCurrentLab: (lab: Lab | null) => void;
  setAllLabsMode: (enabled: boolean) => void;
  isLoading: boolean;
  hasMultipleLabs: boolean;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export function LabProvider({ children }: { children: ReactNode }) {
  const [currentLab, setCurrentLab] = useState<Lab | null>(null);
  const [availableLabs, setAvailableLabs] = useState<Lab[]>([]);
  const [userLabs, setUserLabs] = useState<Lab[]>([]);
  const [allLabsMode, setAllLabsMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMultipleLabs, setHasMultipleLabs] = useState(false);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // Fetch current user with their lab memberships
        const userResponse = await fetch('/api/users/current');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // Set user's labs from their memberships
          if (userData.labs && userData.labs.length > 0) {
            setUserLabs(userData.labs);
            setHasMultipleLabs(userData.labs.length > 1);
            
            // Get stored lab preference from safeLocalStorage (SSR-safe)
            const storedLabId = safeLocalStorage.getItem('selectedLabId');
            const storedAllLabsMode = safeLocalStorage.getItem('allLabsMode') === 'true';
            
            if (storedAllLabsMode && userData.labs.length > 1) {
              // If all labs mode was selected and user has multiple labs
              setAllLabsMode(true);
              setCurrentLab(null);
            } else if (storedLabId) {
              // Try to find the stored lab in user's labs
              const storedLab = userData.labs.find((lab: Lab) => lab.id === storedLabId);
              if (storedLab) {
                setCurrentLab(storedLab);
                setAllLabsMode(false);
              } else {
                // Default to first user lab if stored lab not found
                setCurrentLab(userData.labs[0]);
                setAllLabsMode(false);
                safeLocalStorage.setItem('selectedLabId', userData.labs[0].id);
              }
            } else {
              // Default to first user lab
              setCurrentLab(userData.labs[0]);
              setAllLabsMode(false);
              safeLocalStorage.setItem('selectedLabId', userData.labs[0].id);
            }
          }
        }
        
        // Also fetch all labs for admin purposes
        const labsResponse = await fetch('/api/labs');
        if (labsResponse.ok) {
          const labs = await labsResponse.json();
          setAvailableLabs(labs);
        }
      } catch (error) {
        console.error('Failed to fetch labs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabs();
  }, []);

  const handleSetCurrentLab = (lab: Lab | null) => {
    setCurrentLab(lab);
    if (lab) {
      safeLocalStorage.setItem('selectedLabId', lab.id);
      safeLocalStorage.removeItem('allLabsMode');
      setAllLabsMode(false);
    } else {
      safeLocalStorage.removeItem('selectedLabId');
      safeLocalStorage.setItem('allLabsMode', 'true');
      setAllLabsMode(true);
    }
    // Trigger a custom event so other components can react
    safeWindow.dispatchEvent(new CustomEvent('labChanged', { detail: lab }));
  };

  const handleSetAllLabsMode = (enabled: boolean) => {
    setAllLabsMode(enabled);
    if (enabled) {
      setCurrentLab(null);
      safeLocalStorage.removeItem('selectedLabId');
      safeLocalStorage.setItem('allLabsMode', 'true');
      safeWindow.dispatchEvent(new CustomEvent('labChanged', { detail: null }));
    } else if (userLabs.length > 0) {
      // When disabling all labs mode, select the first user lab
      setCurrentLab(userLabs[0]);
      safeLocalStorage.setItem('selectedLabId', userLabs[0].id);
      safeLocalStorage.removeItem('allLabsMode');
      safeWindow.dispatchEvent(new CustomEvent('labChanged', { detail: userLabs[0] }));
    }
  };

  return (
    <LabContext.Provider 
      value={{ 
        currentLab, 
        availableLabs, 
        userLabs,
        allLabsMode,
        setCurrentLab: handleSetCurrentLab,
        setAllLabsMode: handleSetAllLabsMode,
        isLoading,
        hasMultipleLabs 
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