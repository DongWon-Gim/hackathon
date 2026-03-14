import type { Page } from '@playwright/test'

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8000 })
}

export const loginAsMember = (page: Page) =>
  loginAs(page, 'member@retrolens.app', 'member1234')

export const loginAsLeader = (page: Page) =>
  loginAs(page, 'leader@retrolens.app', 'leader1234')
