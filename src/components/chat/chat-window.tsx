'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, MoreVertical, Phone, Video, Search } from 'lucide-react'
import { MessageWithSender } from '@/types'
import { MessageList } from './message-list'
import { MessageInput } from './message-input'

interface ChatWindowProps {
  chatId: string
  currentUserId: string
}

export function ChatWindow({ chatId, currentUserId }: ChatWindowProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInfo, setChatInfo] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChatData()
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatData = async () => {
    try {
      setIsLoading(true)
      const [chatResponse, messagesResponse] = await Promise.all([
        fetch(`/api/chats/${chatId}`),
        fetch(`/api/chats/${chatId}/messages`)
      ])

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        setChatInfo(chatData)
      }

      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData)
      }
    } catch (error) {
      console.error('Failed to fetch chat data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChatDisplayName = () => {
    if (!chatInfo) return 'Loading...'

    if (chatInfo.type === 'DIRECT') {
      const otherUser = chatInfo.participants.find((p: any) => p.user.id !== currentUserId)
      return otherUser?.user.name || 'Unknown User'
    }
    return chatInfo.name || 'Group Chat'
  }

  const getChatAvatar = () => {
    if (!chatInfo) return null

    if (chatInfo.type === 'DIRECT') {
      const otherUser = chatInfo.participants.find((p: any) => p.user.id !== currentUserId)
      return otherUser?.user.image
    }
    return chatInfo.picture
  }

  const getOnlineStatus = () => {
    if (!chatInfo) return false

    if (chatInfo.type === 'DIRECT') {
      const otherUser = chatInfo.participants.find((p: any) => p.user.id !== currentUserId)
      return otherUser?.user.isOnline || false
    }
    return null
  }

  const getParticipantCount = () => {
    if (!chatInfo) return 0
    return chatInfo.participants.length
  }

  const handleSendMessage = async (content: string, type: string = 'TEXT') => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages(prev => [...prev, newMessage])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleMessageReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      })

      if (response.ok) {
        const updatedMessage = await response.json()
        setMessages(prev =>
          prev.map(msg => msg.id === messageId ? updatedMessage : msg)
        )
      }
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      })

      if (response.ok) {
        const updatedMessage = await response.json()
        setMessages(prev =>
          prev.map(msg => msg.id === messageId ? updatedMessage : msg)
        )
      }
    } catch (error) {
      console.error('Failed to remove reaction:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-default"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-whatsapp-incoming dark:bg-gray-800">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
              {getChatAvatar() ? (
                <img
                  src={getChatAvatar()}
                  alt={getChatDisplayName()}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {getChatDisplayName().charAt(0)}
                </span>
              )}
            </div>
            {getOnlineStatus() !== null && (
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                getOnlineStatus() ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {getChatDisplayName()}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getOnlineStatus() === true ? 'Online' :
               getOnlineStatus() === false ? 'Offline' :
               `${getParticipantCount()} participants`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          onMessageReaction={handleMessageReaction}
          onRemoveReaction={handleRemoveReaction}
        />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` :
               typingUsers.length === 2 ? `${typingUsers[0]} and ${typingUsers[1]} are typing...` :
               'Several people are typing...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}