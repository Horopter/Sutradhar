export default defineNuxtRouteMiddleware(async (to, from) => {
  const { isAuthenticated, ensureGuestSession } = useAuth()
  
  // Auto-login as guest if not authenticated (instead of redirecting to login)
  if (!isAuthenticated.value) {
    await ensureGuestSession()
    // If still not authenticated after attempting guest login, allow access anyway
    // This ensures the app works even if guest login fails
  }
})
