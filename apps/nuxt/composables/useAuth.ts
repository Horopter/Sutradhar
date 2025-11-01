export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const sessionId = useState<string | null>('sessionId', () => null)

  const { post } = useApi()

  const loginAsGuest = async () => {
    try {
      const result = await post<{ ok: boolean; user: User; sessionId: string }>('/auth/guest', {})
      if (result.ok) {
        user.value = result.user
        sessionId.value = result.sessionId
        return { ok: true, user: result.user }
      }
      return { ok: false, error: 'Failed to create guest session' }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  }

  const sendMagicLink = async (email: string) => {
    try {
      const result = await post<{ ok: boolean; message?: string }>('/auth/magic', { email })
      return result
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  }

  const verifyToken = async (token: string) => {
    try {
      const result = await post<{ ok: boolean; user: User; sessionId: string }>('/auth/verify', { token })
      if (result.ok) {
        user.value = result.user
        sessionId.value = result.sessionId
        return { ok: true, user: result.user }
      }
      return { ok: false, error: 'Invalid token' }
    } catch (error: any) {
      return { ok: false, error: error.message }
    }
  }

  const logout = () => {
    user.value = null
    sessionId.value = null
  }

  const isAuthenticated = computed(() => !!user.value)
  const isGuest = computed(() => user.value?.role === 'guest')

  return {
    user,
    sessionId,
    loginAsGuest,
    sendMagicLink,
    verifyToken,
    logout,
    isAuthenticated,
    isGuest
  }
}

interface User {
  id: string
  email?: string
  name: string
  role: 'user' | 'guest' | 'admin'
  createdAt: number
  lastLoginAt?: number
  streak?: number
  badges?: string[]
}

