import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  allDay: z.boolean().optional(),
  type: z.enum(['deadline', 'meeting', 'milestone', 'reminder', 'other']).optional(),
  location: z.string().optional(),
  url: z.string().optional(),
  reminder: z.object({
    enabled: z.boolean(),
    minutes: z.number(),
  }).optional(),
});

// PUT /api/calendar/events/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = UpdateEventSchema.parse(body);
    
    // In production, you'd update the database here
    const updatedEvent = {
      id,
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid event data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // In production, you'd delete from database here using the id
    
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}