import { NextRequest } from 'next/server'
import SocketHandler from '@/lib/socket'

export const runtime = 'nodejs'

const handler = (req: NextRequest) => {
  console.log('Socket API route called')
  // The SocketHandler will handle the Socket.io connection
  return SocketHandler(req as any, {
    socket: {
      server: {},
    },
  } as any)
}

export { handler as GET, handler as POST }