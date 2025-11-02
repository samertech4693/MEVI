'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Smile, Paperclip, Mic } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useSession } from 'next-auth/react'

interface MessageInputProps {
  onSendMessage: (content: string, type?: string) => Promise<void>
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()
  const { startTyping, stopTyping } = useSocket()
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)

    // Handle typing indicators
    if (e.target.value.trim()) {
      if (!typingTimeoutRef.current) {
        // User just started typing
        startTyping(
          '', // We'd need the chatId here
          session?.user?.id || '',
          session?.user?.name || 'Someone'
        )
      }

      // Reset the timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        // User stopped typing
        stopTyping('', session?.user?.id || '')
        typingTimeoutRef.current = null
      }, 1000)
    } else {
      // User cleared the input
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      stopTyping('', session?.user?.id || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      await onSendMessage(message.trim(), 'TEXT')
      setMessage('')

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      stopTyping('', session?.user?.id || '')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Emoji button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Smile className="h-5 w-5" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="pr-12 bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-whatsapp-default focus:border-whatsapp-default"
            disabled={isSubmitting}
          />

          {/* Character count for long messages */}
          {message.length > 500 && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          )}
        </div>

        {/* Send/Mic button */}
        {message.trim() ? (
          <Button
            type="submit"
            size="icon"
            className="bg-whatsapp-default hover:bg-whatsapp-dark text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-whatsapp-default hover:text-whatsapp-dark"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </form>

      {/* Input toolbar hints */}
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {message.length > 0 && `${message.length}/1000 characters`}
        </div>
      </div>
    </div>
  )
}