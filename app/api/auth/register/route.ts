import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum([
    'PRINCIPAL_INVESTIGATOR',
    'CO_PRINCIPAL_INVESTIGATOR',
    'DATA_SCIENTIST',
    'DATA_ANALYST',
    'CLINICAL_RESEARCH_COORDINATOR',
    'REGULATORY_COORDINATOR',
    'STAFF_COORDINATOR',
    'FELLOW',
    'MEDICAL_STUDENT',
    'VOLUNTEER_RESEARCH_ASSISTANT',
    'RESEARCH_ASSISTANT',
    'LAB_ADMINISTRATOR',
    'EXTERNAL_COLLABORATOR'
  ]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = RegisterSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // Generate initials
    const initials = `${validatedData.firstName.charAt(0)}${validatedData.lastName.charAt(0)}`.toUpperCase();
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role || 'VOLUNTEER_RESEARCH_ASSISTANT',
        initials,
        avatar: `bg-${['blue', 'green', 'purple', 'orange', 'indigo', 'pink'][Math.floor(Math.random() * 6)]}-500`,
        capacity: 40,
        expertise: [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        initials: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { 
        message: 'User registered successfully', 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}