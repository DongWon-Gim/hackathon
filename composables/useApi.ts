export function useApi() {
  const toast = useToast()
  const router = useRouter()

  async function request<T>(url: string, options?: Parameters<typeof $fetch>[1]): Promise<T> {
    try {
      return await $fetch<T>(url, options) as T
    } catch (error: unknown) {
      const err = error as { data?: { data?: { code?: string; message?: string } } }
      const code = err?.data?.data?.code || 'INTERNAL_ERROR'
      const message = err?.data?.data?.message || '오류가 발생했습니다'

      if (code === 'UNAUTHORIZED') {
        await router.push('/login')
        return undefined as T
      }

      toast.error(message)
      throw error
    }
  }

  return { request }
}
