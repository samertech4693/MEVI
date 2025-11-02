'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socket/io',
      addTrailingSlash: false,
    })

    socketRef.current = socketInstance

    socketInstance.on('connect', () => {
      console.log('Connected to socket server')
      setIsConnected(true)
      setSocket(socketInstance)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server')
      setIsConnected(false)
      setSocket(null)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinUser = (userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-user', userId)
    }
  }

  const joinChat = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-chat', chatId)
    }
  }

  const leaveChat = (chatId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-chat', chatId)
    }
  }

  const sendMessage = (chatId: string, message: any, recipientIds: string[]) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        chatId,
        message,
        recipientIds,
      })
    }
  }

  const markAsRead = (messageId: string, chatId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('mark-read', {
        messageId,
        chatId,
        userId,
      })
    }
  }

  const addReaction = (messageId: string, chatId: string, reaction: any) => {
    if (socketRef.current) {
      socketRef.current.emit('add-reaction', {
        messageId,
        chatId,
        reaction,
      })
    }
  }

  const removeReaction = (messageId: string, chatId: string, reaction: any) => {
    if (socketRef.current) {
      socketRef.current.emit('remove-reaction', {
        messageId,
        chatId,
        reaction,
      })
    }
  }

  const startTyping = (chatId: string, userId: string, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        chatId,
        userId,
        userName,
      })
    }
  }

  const stopTyping = (chatId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('stop-typing', {
        chatId,
        userId,
      })
    }
  }

  const updateStatus = (userId: string, isOnline: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('update-status', {
        userId,
        isOnline,
      })
    }
  }

  return {
    socket,
    isConnected,
    joinUser,
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    updateStatus,
  }
}