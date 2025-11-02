'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Reaction {
  id: string
  emoji: string
  userId: string
}

interface MessageReactionsProps {
  reactions: Reaction[]
  currentUserId: string
  messageId: string
  onAddReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
}

export function MessageReactions({
  reactions,
  currentUserId,
  messageId,
  onAddReaction,
  onRemoveReaction
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Group reactions by emoji and count them
  const groupedReactions: { [emoji: string]: { count: number; users: string[]; hasReacted: boolean } } = {}

  reactions.forEach(reaction => {
    if (!groupedReactions[reaction.emoji]) {
      groupedReactions[reaction.emoji] = {
        count: 0,
        users: [],
        hasReacted: false
      }
    }
    groupedReactions[reaction.emoji].count++
    groupedReactions[reaction.emoji].users.push(reaction.userId)
    if (reaction.userId === currentUserId) {
      groupedReactions[reaction.emoji].hasReacted = true
    }
  })

  const defaultEmojis = ['😂', '❤️', '👍', '😮', '😢', '👎']

  const handleReactionClick = (emoji: string) => {
    const reaction = groupedReactions[emoji]
    if (reaction?.hasReacted) {
      onRemoveReaction(messageId, emoji)
    } else {
      onAddReaction(messageId, emoji)
    }
    setShowEmojiPicker(false)
  }

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setShowEmojiPicker(true)
  }

  return (
    <div className="relative">
      {/* Displayed reactions */}
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(groupedReactions).map(([emoji, reaction]) => (
          <Button
            key={emoji}
            variant="outline"
            size="sm"
            className={cn(
              'h-6 px-2 py-0 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
              reaction.hasReacted && 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
            )}
            onClick={() => handleReactionClick(emoji)}
            onContextMenu={handleLongPress}
            onTouchStart={(e) => {
              // Show emoji picker on long press for mobile
              const timer = setTimeout(() => {
                setShowEmojiPicker(true)
              }, 500)
              e.currentTarget.addEventListener('touchend', () => clearTimeout(timer), { once: true })
            }}
          >
            <span className="mr-1">{emoji}</span>
            <span>{reaction.count}</span>
          </Button>
        ))}

        {/* Add reaction button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 py-0 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          + Add reaction
        </Button>
      </div>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
          <div className="grid grid-cols-6 gap-1">
            {defaultEmojis.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleReactionClick(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-1">
            Click to react
          </div>
        </div>
      )}

      {/* Overlay to close emoji picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}