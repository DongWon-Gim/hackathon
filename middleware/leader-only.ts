export default defineNuxtRouteMiddleware(() => {
  const { isLeader } = useAuth()
  if (!isLeader.value) return navigateTo('/')
})
