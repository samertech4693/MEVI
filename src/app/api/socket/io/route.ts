import { NextRequest } from 'next/server'
import SocketHandler from '@/lib/socket'

const handler = (req: NextRequest) => {
  console.log('Socket API route called')
  // The SocketHandler will handle the Socket.io connection
  return SocketHandler(req as any, {
    socket: {
      server: {},
    },
  } as any)
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default handler