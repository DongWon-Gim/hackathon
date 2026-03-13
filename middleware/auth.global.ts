const PUBLIC_ROUTES = ['/login', '/register']

export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, hasTeam, fetchMe, initialized } = useAuth()

  if (!initialized.value) {
    await fetchMe()
  }

  if (PUBLIC_ROUTES.includes(to.path)) {
    if (isLoggedIn.value) return navigateTo('/')
    return
  }

  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }

  if (to.path !== '/join' && !hasTeam.value) {
    return navigateTo('/join')
  }
})
