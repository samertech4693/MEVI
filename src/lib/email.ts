import { Resend } from 'resend'
import crypto from 'crypto'
import { prisma } from './db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function generateVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  })

  return token
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}&email=${email}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [email],
      subject: 'Verify your MEVI account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #128C7E;">Welcome to MEVI!</h2>
          <p>Thank you for signing up. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background-color: #128C7E; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you didn't create an account,
            you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verifyUrl}" style="color: #128C7E;">${verifyUrl}</a>
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Error sending verification email:', error)
      throw new Error('Failed to send verification email')
    }

    return data
  } catch (error) {
    console.error('Email service error:', error)
    throw new Error('Failed to send verification email')
  }
}

export async function verifyEmail(token: string, email: string): Promise<boolean> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      token_identifier: {
        token,
        identifier: email
      }
    }
  })

  if (!verificationToken) {
    return false
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id }
    })
    return false
  }

  // Update user email verification status
  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() }
  })

  // Delete the verification token
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id }
  })

  return true
}