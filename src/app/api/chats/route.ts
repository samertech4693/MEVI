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

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(chats)
  } catch (error) {
    console.error('Failed to fetch chats:', error)
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

    const { type, participantIds, name, description } = await request.json()

    if (!type || !participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure current user is included in participants
    const allParticipants = Array.from(new Set([session.user.id, ...participantIds]))

    // Check if direct chat already exists between these users
    if (type === 'DIRECT' && participantIds.length === 1) {
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [session.user.id, participantIds[0]]
              }
            }
          }
        },
        include: {
          participants: true
        }
      })

      if (existingChat) {
        return NextResponse.json(existingChat)
      }
    }

    const chat = await prisma.chat.create({
      data: {
        type,
        name: type === 'GROUP' ? name : null,
        description: type === 'GROUP' ? description : null,
        participants: {
          create: allParticipants.map(userId => ({
            userId,
            role: type === 'GROUP' && userId === session.user.id ? 'ADMIN' : 'PARTICIPANT'
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(chat)
  } catch (error) {
    console.error('Failed to create chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}