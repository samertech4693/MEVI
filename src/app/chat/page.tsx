'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatWindow } from '@/components/chat/chat-window'
import { useSocket } from '@/hooks/useSocket'

export default function ChatPage() {
  const { data: session } = useSession()
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const { socket, isConnected, joinUser } = useSocket()

  useEffect(() => {
    if (session?.user?.id && socket) {
      joinUser(session.user.id)
    }
  }, [session, socket, joinUser])

  return (
    <div className="flex h-full bg-whatsapp-container">
      {/* Left Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700">
        <ChatSidebar
          selectedChat={selectedChat}
          onChatSelect={setSelectedChat}
          currentUserId={session?.user?.id || ''}
        />
      </div>

      {/* Right - Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <ChatWindow
            chatId={selectedChat}
            currentUserId={session?.user?.id || ''}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Welcome to MEVI
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}