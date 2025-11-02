'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MoreVertical, MessageCirclePlus } from 'lucide-react'
import { ChatWithParticipants } from '@/types'
import { NewChatDialog } from './new-chat-dialog'

interface ChatSidebarProps {
  selectedChat: string | null
  onChatSelect: (chatId: string) => void
  currentUserId: string
}

export function ChatSidebar({ selectedChat, onChatSelect, currentUserId }: ChatSidebarProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [chats, setChats] = useState<ChatWithParticipants[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats')
      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredChats = chats.filter(chat => {
    if (chat.type === 'DIRECT') {
      const otherUser = chat.participants.find(p => p.user.id !== currentUserId)
      return otherUser?.user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    } else {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    }
  })

  const getChatDisplayName = (chat: ChatWithParticipants) => {
    if (chat.type === 'DIRECT') {
      const otherUser = chat.participants.find(p => p.user.id !== currentUserId)
      return otherUser?.user.name || 'Unknown User'
    }
    return chat.name || 'Group Chat'
  }

  const getChatAvatar = (chat: ChatWithParticipants) => {
    if (chat.type === 'DIRECT') {
      const otherUser = chat.participants.find(p => p.user.id !== currentUserId)
      return otherUser?.user.image
    }
    return chat.picture
  }

  const getLastMessagePreview = (chat: ChatWithParticipants) => {
    // This would typically come from the API with the last message
    return 'No messages yet'
  }

  const getOnlineStatus = (chat: ChatWithParticipants) => {
    if (chat.type === 'DIRECT') {
      const otherUser = chat.participants.find(p => p.user.id !== currentUserId)
      return otherUser?.user.isOnline || false
    }
    return false
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-whatsapp-default flex items-center justify-center">
            <span className="text-white font-medium">
              {session?.user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {session?.user?.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <NewChatDialog />
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-whatsapp-default"></div>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCirclePlus className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm">
              {searchQuery ? 'No chats found' : 'No chats yet. Start a conversation!'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat.id)}
                className={`flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedChat === chat.id ? 'bg-whatsapp-light dark:bg-gray-700' : ''
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                    {getChatAvatar(chat) ? (
                      <img
                        src={getChatAvatar(chat)}
                        alt={getChatDisplayName(chat)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {getChatDisplayName(chat).charAt(0)}
                      </span>
                    )}
                  </div>
                  {getOnlineStatus(chat) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {getChatDisplayName(chat)}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {/* This would show the last message time */}
                      now
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {getLastMessagePreview(chat)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}