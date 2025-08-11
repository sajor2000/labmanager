import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { safeLocalStorage } from './browser';

// Get current user from temporary auth system
export async function getCurrentUser() {
  try {
    // Get the selected user ID from headers (set by client-side)
    const headersList = await headers();
    const selectedUserId = headersList.get('x-selected-user-id');
    
    if (!selectedUserId) {
      return null; // No user selected
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: selectedUserId },
      include: {
        labs: {
          include: {
            lab: true,
          },
        },
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

// Helper function to get selected user ID from client-side storage (SSR-safe)
export function getSelectedUserIdFromClient(): string | null {
  try {
    const stored = safeLocalStorage.getItem('labmanage_selected_user');
    if (stored) {
      const user = JSON.parse(stored);
      return user.id;
    }
  } catch (error) {
    console.error('Error reading stored user:', error);
  }
  
  return null;
}