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

    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
        isBlocked: false
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            image: true,
            isOnline: true,
            lastSeen: true,
            username: true
          }
        }
      },
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactId, nickname } = await request.json()

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    // Check if contact exists and is not the current user
    const contactUser = await prisma.user.findUnique({
      where: { id: contactId }
    })

    if (!contactUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (contactUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot add yourself as a contact' },
        { status: 400 }
      )
    }

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId: session.user.id,
          contactId
        }
      }
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        contactId,
        nickname: nickname || null
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            image: true,
            isOnline: true,
            lastSeen: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to add contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactId } = await request.json()

    if (!contactId) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    const deletedContact = await prisma.contact.delete({
      where: {
        userId_contactId: {
          userId: session.user.id,
          contactId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove contact:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}