import nodemailer from 'nodemailer'

const APP_URL = process.env.APP_URL || 'http://localhost:3000'

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

// Verify transporter on startup
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter.verify((error) => {
        if (error) {
            console.error('Email transporter verification failed:', error)
        } else {
            console.log('✅ Email server is ready to send messages')
        }
    })
}

export async function sendVerificationEmail(
    email: string,
    name: string,
    token: string
) {
    const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"StudyBuddy" <noreply@studybuddy.com>',
        to: email,
        subject: 'Verify Your Email - StudyBuddy',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea !important; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to StudyBuddy! 🎓</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for signing up! Please verify your email address to get started.</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button" style="color: white;">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 StudyBuddy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log('✅ Verification email sent to:', email)
    } catch (error) {
        console.error('❌ Failed to send verification email:', error)
        throw error
    }
}

export async function sendPasswordResetEmail(
    email: string,
    name: string,
    token: string
) {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"StudyBuddy" <noreply@studybuddy.com>',
        to: email,
        subject: 'Reset Your Password - StudyBuddy',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #f5576c !important; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© 2024 StudyBuddy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log('✅ Password reset email sent to:', email)
    } catch (error) {
        console.error('❌ Failed to send reset email:', error)
        throw error
    }
}
