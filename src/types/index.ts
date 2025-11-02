// Database types that are commonly used
export type MessageWithSender = {
  id: string
  content: string
  type: string
  sender: {
    id: string
    name: string | null
    image: string | null
  }
  createdAt: Date
  replyToId: string | null
  reactions: {
    id: string
    emoji: string
    userId: string
  }[]
}

export type ChatWithParticipants = {
  id: string
  type: string
  name: string | null
  participants: {
    user: {
      id: string
      name: string | null
      image: string | null
      isOnline: boolean
      lastSeen: Date
    }
  }[]
  _count: {
    messages: number
  }
}

export type ContactWithUser = {
  id: string
  nickname: string | null
  isFavorite: boolean
  isBlocked: boolean
  contact: {
    id: string
    name: string | null
    image: string | null
    isOnline: boolean
    lastSeen: Date
  }
}