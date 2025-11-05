/**
 * Authentication Composable
 * Handles user authentication state and session management
 */

export interface User {
  userId: string
  sessionId: string
  email?: string
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const sessionId = useState<string | null>('sessionId', () => null)
  const guestLoginInitiated = useState<boolean>('guest-login-initiated', () => false)

  const api = useApi()

  // Auto-login as guest if not authenticated
  const ensureGuestSession = async () => {
    if (process.client && !user.value && !guestLoginInitiated.value) {
      guestLoginInitiated.value = true
      try {
        const response = await api.auth.guest()
        // Handle both formats: userId from response or from user.id
        const userId = response.userId || response.user?.id || response.user?.userId
        const sessionIdValue = response.sessionId
        
        if (response.ok && sessionIdValue && userId) {
          user.value = {
            userId: userId,
            sessionId: sessionIdValue,
          }
          sessionId.value = sessionIdValue
        } else if (response.ok && sessionIdValue) {
          // If no userId but we have sessionId, use sessionId as userId (GUEST format)
          user.value = {
            userId: sessionIdValue,
            sessionId: sessionIdValue,
          }
          sessionId.value = sessionIdValue
        }
      } catch (error) {
        if (process.dev) {
          console.warn('Failed to auto-login as guest:', error)
        }
        // Create a client-side fallback guest session
        const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const guestId = `GUEST_${nonce}`
        user.value = {
          userId: guestId,
          sessionId: guestId,
        }
        sessionId.value = guestId
      }
    }
  }

  const loginAsGuest = async () => {
    try {
      const response = await api.auth.guest()
      // Handle both formats: userId from response or from user.id
      const userId = response.userId || response.user?.id || response.user?.userId
      const sessionIdValue = response.sessionId
      
      if (response.ok && sessionIdValue && userId) {
        user.value = {
          userId: userId,
          sessionId: sessionIdValue,
        }
        sessionId.value = sessionIdValue
        return { ok: true }
      } else if (response.ok && sessionIdValue) {
        // If no userId but we have sessionId, use sessionId as userId (GUEST format)
        user.value = {
          userId: sessionIdValue,
          sessionId: sessionIdValue,
        }
        sessionId.value = sessionIdValue
        return { ok: true }
      }
      return { ok: false, error: response.error || 'Login failed' }
    } catch (error: any) {
      // Create a client-side fallback guest session
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const guestId = `GUEST_${nonce}`
      user.value = {
        userId: guestId,
        sessionId: guestId,
      }
      sessionId.value = guestId
      return { ok: true }
    }
  }

  const loginWithMagicLink = async (email: string) => {
    const response = await api.auth.magicLink(email)
    return response
  }

  const verifyMagicLink = async (token: string) => {
    const response = await api.auth.verify(token)
    if (response.ok && response.sessionId && response.userId) {
      user.value = {
        userId: response.userId,
        sessionId: response.sessionId,
        email: response.email,
      }
      sessionId.value = response.sessionId
      return { ok: true }
    }
    return { ok: false, error: response.error || 'Verification failed' }
  }

  const logout = () => {
    user.value = null
    sessionId.value = null
  }

  const isAuthenticated = computed(() => user.value !== null)
  const isGuest = computed(() => user.value !== null && !user.value.email)

  // Initialize guest session on client-side only (not during SSR)
  // Use nextTick to ensure it runs after component mount
  if (process.client) {
    nextTick(() => {
      ensureGuestSession()
    })
  }

  return {
    user: readonly(user),
    sessionId: readonly(sessionId),
    isAuthenticated,
    isGuest,
    loginAsGuest,
    loginWithMagicLink,
    verifyMagicLink,
    logout,
    ensureGuestSession,
  }
}