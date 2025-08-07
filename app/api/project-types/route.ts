import { NextResponse } from 'next/server';
import { PROJECT_TYPE_CATEGORIES, ALL_PROJECT_TYPES } from '@/lib/constants/project-types';

/**
 * GET /api/project-types
 * Returns all project types organized by category
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    
    // Return flat list if requested
    if (format === 'flat') {
      return NextResponse.json({
        success: true,
        data: ALL_PROJECT_TYPES
      });
    }
    
    // Return categorized by default
    return NextResponse.json({
      success: true,
      data: PROJECT_TYPE_CATEGORIES
    });
  } catch (error) {
    console.error('Error fetching project types:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch project types' 
      },
      { status: 500 }
    );
  }
}