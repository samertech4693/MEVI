import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        bio: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
        lastSeen: true,
        isOnline: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, bio, phone, username } = await request.json()

    // Validate username if provided
    if (username) {
      // Check if username is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: session.user.id }
        }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores' },
          { status: 400 }
        )
      }
    }

    // Validate phone number if provided
    if (phone) {
      // Basic phone number validation - can be enhanced
      if (!/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
        ...(username !== undefined && { username }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        bio: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
        lastSeen: true,
        isOnline: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}