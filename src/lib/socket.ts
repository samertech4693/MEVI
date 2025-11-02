import { Server as NetServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'

export const config = {
  api: {
    bodyParser: false,
  },
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse & { socket: any }) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const httpServer: NetServer = res.socket.server as any
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      // Join user to their personal room for private messages
      socket.on('join-user', (userId: string) => {
        socket.join(userId)
        console.log(`User ${userId} joined their room`)
      })

      // Join chat room
      socket.on('join-chat', (chatId: string) => {
        socket.join(chatId)
        console.log(`User ${socket.id} joined chat ${chatId}`)
      })

      // Leave chat room
      socket.on('leave-chat', (chatId: string) => {
        socket.leave(chatId)
        console.log(`User ${socket.id} left chat ${chatId}`)
      })

      // Send message
      socket.on('send-message', (data: {
        chatId: string
        message: any
        recipientIds: string[]
      }) => {
        const { chatId, message, recipientIds } = data

        // Send to all participants in the chat
        io.to(chatId).emit('new-message', message)

        // Also send to specific user rooms for direct notifications
        recipientIds.forEach(userId => {
          io.to(userId).emit('message-notification', message)
        })

        console.log(`Message sent to chat ${chatId}`)
      })

      // Mark message as read
      socket.on('mark-read', (data: {
        messageId: string
        chatId: string
        userId: string
      }) => {
        // Notify other participants that message was read
        socket.to(data.chatId).emit('message-read', {
          messageId: data.messageId,
          userId: data.userId
        })
      })

      // Add reaction
      socket.on('add-reaction', (data: {
        messageId: string
        chatId: string
        reaction: any
      }) => {
        // Broadcast reaction to all chat participants
        io.to(data.chatId).emit('reaction-added', {
          messageId: data.messageId,
          reaction: data.reaction
        })
      })

      // Remove reaction
      socket.on('remove-reaction', (data: {
        messageId: string
        chatId: string
        reaction: any
      }) => {
        // Broadcast reaction removal to all chat participants
        io.to(data.chatId).emit('reaction-removed', {
          messageId: data.messageId,
          reaction: data.reaction
        })
      })

      // User typing indicator
      socket.on('typing', (data: {
        chatId: string
        userId: string
        userName: string
      }) => {
        socket.to(data.chatId).emit('user-typing', {
          userId: data.userId,
          userName: data.userName
        })
      })

      // User stopped typing
      socket.on('stop-typing', (data: {
        chatId: string
        userId: string
      }) => {
        socket.to(data.chatId).emit('user-stop-typing', {
          userId: data.userId
        })
      })

      // Update user online status
      socket.on('update-status', (data: {
        userId: string
        isOnline: boolean
      }) => {
        socket.broadcast.emit('user-status-changed', {
          userId: data.userId,
          isOnline: data.isOnline
        })
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        // Notify other users that this user went offline
        socket.broadcast.emit('user-status-changed', {
          userId: socket.id,
          isOnline: false
        })
      })
    })

    res.socket.server.io = io
  }
  res.end()
}

export default SocketHandler