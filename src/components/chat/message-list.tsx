'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MessageWithSender } from '@/types'
import { MessageReactions } from './message-reactions'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: MessageWithSender[]
  currentUserId: string
  onMessageReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
}

export function MessageList({
  messages,
  currentUserId,
  onMessageReaction,
  onRemoveReaction
}: MessageListProps) {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

  const formatMessageTime = (date: Date) => {
    return format(new Date(date), 'HH:mm')
  }

  const groupMessagesByDate = (messages: MessageWithSender[]) => {
    const groups: { [date: string]: MessageWithSender[] } = {}

    messages.forEach(message => {
      const date = format(new Date(message.createdAt), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  const formatGroupDate = (date: string) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

    if (date === today) return 'Today'
    if (date === yesterday) return 'Yesterday'

    return format(new Date(date), 'MMMM d, yyyy')
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="space-y-4">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date} className="space-y-3">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {formatGroupDate(date)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isOwn = message.sender.id === currentUserId
              const showAvatar = !isOwn && (
                index === 0 ||
                dateMessages[index - 1].sender.id !== message.sender.id
              )
              const showSenderName = !isOwn && (
                index === 0 ||
                dateMessages[index - 1].sender.id !== message.sender.id
              )

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-end space-x-2',
                    isOwn && 'flex-row-reverse space-x-reverse'
                  )}
                >
                  {/* Avatar for other users' messages */}
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {message.sender.image ? (
                        <img
                          src={message.sender.image}
                          alt={message.sender.name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                          {message.sender.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message container */}
                  <div
                    className={cn(
                      'max-w-xs lg:max-w-md whatsapp-message',
                      isOwn ? 'whatsapp-message-outgoing' : 'whatsapp-message-incoming',
                      !showAvatar && !isOwn && 'ml-10'
                    )}
                  >
                    {/* Sender name for group chats */}
                    {showSenderName && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1">
                        {message.sender.name}
                      </div>
                    )}

                    {/* Message content */}
                    <div className="px-4 py-2">
                      {message.type === 'TEXT' && (
                        <p className="text-sm break-words">{message.content}</p>
                      )}

                      {/* Add other message types here (image, video, etc.) */}
                    </div>

                    {/* Message time and reactions */}
                    <div className={cn(
                      'flex items-center justify-between px-1 pb-1',
                      isOwn ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>

                      {/* Message status indicators for own messages */}
                      {isOwn && (
                        <div className="flex items-center space-x-1 ml-2">
                          {/* Add read receipts here */}
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <MessageReactions
                        reactions={message.reactions}
                        currentUserId={currentUserId}
                        messageId={message.id}
                        onAddReaction={onMessageReaction}
                        onRemoveReaction={onRemoveReaction}
                      />
                    )}
                  </div>

                  {/* Spacer for alignment when not showing avatar */}
                  {!showAvatar && !isOwn && (
                    <div className="w-8 flex-shrink-0"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}