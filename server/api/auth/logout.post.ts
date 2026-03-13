export default defineEventHandler((event) => {
  deleteCookie(event, 'auth_token')
  return { ok: true }
})
