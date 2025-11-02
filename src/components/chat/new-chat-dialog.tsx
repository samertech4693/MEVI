'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCirclePlus, Search, UserPlus } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface User {
  id: string
  name: string | null
  image: string | null
  username: string | null
  isOnline: boolean
  lastSeen: Date
}

export function NewChatDialog() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { sendMessage } = useSocket()

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (response.ok) {
        const users = await response.json()
        setSearchResults(users)
      }
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startDirectChat = async (userId: string) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [userId]
        })
      })

      if (response.ok) {
        const chat = await response.json()
        // Close dialog and navigate to new chat
        setIsOpen(false)
        window.location.href = `/chat?chatId=${chat.id}`
      }
    } catch (error) {
      console.error('Failed to start chat:', error)
    }
  }

  const addUserAsContact = async (userId: string) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId: userId
        })
      })

      if (response.ok) {
        // Optionally show success message
        setSearchResults(prev => prev.filter(user => user.id !== userId))
      }
    } catch (error) {
      console.error('Failed to add contact:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <MessageCirclePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-whatsapp-default"></div>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Enter at least 2 characters to search for users
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No users found matching "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        )}
                      </div>
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user.name}
                      </h4>
                      {user.username && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addUserAsContact(user.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                      <Button
                        variant="whatsapp"
                        size="sm"
                        onClick={() => startDirectChat(user.id)}
                      >
                        <MessageCirclePlus className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Find friends by their name, username, or email address
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}