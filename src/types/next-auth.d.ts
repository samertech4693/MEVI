import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      phone?: string
      phoneVerified?: boolean
      username?: string
    } & DefaultSession['user']
  }

  interface User {
    phone?: string
    phoneVerified?: boolean
    username?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    phone?: string
    phoneVerified?: boolean
    username?: string
  }
}