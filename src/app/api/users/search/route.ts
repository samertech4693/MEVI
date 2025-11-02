import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                name: {
                  contains: query.trim(),
                  mode: 'insensitive'
                }
              },
              {
                username: {
                  contains: query.trim(),
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query.trim(),
                  mode: 'insensitive'
                }
              }
            ]
          },
          {
            id: {
              not: session.user.id
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        isOnline: true,
        lastSeen: true
      },
      take: 20
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to search users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}