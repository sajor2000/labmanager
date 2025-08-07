import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const EventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start: z.string(),
  end: z.string(),
  allDay: z.boolean().optional(),
  type: z.enum(['deadline', 'meeting', 'milestone', 'reminder', 'other']),
  location: z.string().optional(),
  url: z.string().optional(),
  labId: z.string(),
  projectId: z.string().optional(),
  reminder: z.object({
    enabled: z.boolean(),
    minutes: z.number(),
  }).optional(),
});

// GET /api/calendar/events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const labId = searchParams.get('labId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    if (!labId) {
      return NextResponse.json(
        { error: 'Lab ID is required' },
        { status: 400 }
      );
    }

    // For now, we'll return mock data since we don't have a calendar events table yet
    // In production, you'd query your database here
    const mockEvents = [
      {
        id: '1',
        title: 'Team Meeting',
        description: 'Weekly lab meeting',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 3600000).toISOString(),
        type: 'meeting',
        location: 'Conference Room A',
        labId,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Grant Deadline',
        description: 'NIH R01 submission deadline',
        start: new Date(Date.now() + 86400000 * 7).toISOString(),
        end: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString(),
        type: 'deadline',
        labId,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Data Collection Milestone',
        description: 'Complete patient enrollment',
        start: new Date(Date.now() + 86400000 * 14).toISOString(),
        end: new Date(Date.now() + 86400000 * 14).toISOString(),
        allDay: true,
        type: 'milestone',
        labId,
        createdBy: 'user1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter by date range if provided
    let filteredEvents = mockEvents;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      filteredEvents = mockEvents.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = EventSchema.parse(body);
    
    // In production, you'd save to database here
    const newEvent = {
      id: Date.now().toString(),
      ...validatedData,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}