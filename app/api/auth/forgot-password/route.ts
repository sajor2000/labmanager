import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = ForgotPasswordSchema.parse(body);
    
    // Always return success for security (don't reveal if email exists)
    const successResponse = NextResponse.json(
      { 
        message: 'If an account exists with this email, you will receive a password reset link shortly.' 
      },
      { status: 200 }
    );
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { 
        email: validatedData.email.toLowerCase(),
        isActive: true,
      },
    });
    
    if (!user) {
      // Return success anyway for security
      return successResponse;
    }
    
    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });
    
    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        email: user.email,
        expiresAt,
      },
    });
    
    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Send email
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'LabSync <noreply@labsync.com>',
        to: user.email,
        subject: 'Reset your LabSync password',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Reset your password</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .container {
                  background: #ffffff;
                  border-radius: 10px;
                  padding: 30px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                }
                .logo {
                  display: inline-block;
                  background: #8B5CF6;
                  color: white;
                  width: 60px;
                  height: 60px;
                  line-height: 60px;
                  border-radius: 12px;
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                h1 {
                  color: #1a1a1a;
                  font-size: 24px;
                  margin: 10px 0;
                }
                .button {
                  display: inline-block;
                  background: #8B5CF6;
                  color: white !important;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 500;
                  margin: 20px 0;
                }
                .button:hover {
                  background: #7C3AED;
                }
                .footer {
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #e5e5e5;
                  font-size: 14px;
                  color: #666;
                  text-align: center;
                }
                .warning {
                  background: #FEF3C7;
                  border: 1px solid #F59E0B;
                  padding: 10px;
                  border-radius: 6px;
                  margin: 20px 0;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">🧪</div>
                  <h1>Reset your password</h1>
                </div>
                
                <p>Hi ${user.firstName || user.name},</p>
                
                <p>We received a request to reset your password for your LabSync account. Click the button below to create a new password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <div class="warning">
                  ⚠️ This link will expire in 1 hour for security reasons.
                </div>
                
                <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 12px; color: #666;">
                  ${resetUrl}
                </p>
                
                <div class="footer">
                  <p>© 2025 LabSync Research Platform</p>
                  <p>Rush University Medical Center</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: `
          Reset your password
          
          Hi ${user.firstName || user.name},
          
          We received a request to reset your password for your LabSync account.
          
          Click this link to reset your password:
          ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request this password reset, you can safely ignore this email.
          
          © 2025 LabSync Research Platform
        `,
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Still return success for security
    }
    
    return successResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}