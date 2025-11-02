import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface Params {
  params: Promise<{ chatId: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params

    // Check if user is a participant in this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: session.user.id
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get messages with sender info and reactions
    const messages = await prisma.message.findMany({
      where: {
        chatId,
        isDeleted: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Update last read timestamp for this user
    await prisma.chatParticipant.update({
      where: {
        chatId_userId: {
          chatId,
          userId: session.user.id
        }
      },
      data: {
        lastRead: new Date()
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const { content, type, replyToId, mediaUrl, mediaType } = await request.json()

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Check if user is a participant in this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId: session.user.id
        }
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        type: type || 'TEXT',
        senderId: session.user.id,
        chatId,
        replyToId: replyToId || null,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Update chat's last message timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date()
      }
    })

    // Get all participants for real-time updates
    const chatParticipants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: {
          not: session.user.id
        }
      },
      select: {
        userId: true
      }
    })

    return NextResponse.json({
      ...message,
      recipientIds: chatParticipants.map(p => p.userId)
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}