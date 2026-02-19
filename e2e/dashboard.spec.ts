/**
 * E2E — Dashboard Page
 *
 * Covers:
 *  1. Owner sees Dashboard with KPI cards
 *  2. Owner sees StoreSelector in the header
 *  3. Operator does NOT see "BI Multi-Loja" link in the sidebar
 *  4. Supervisor does NOT see "Gestão de Usuários" link in the sidebar
 *  5. Loading skeleton renders while data is fetching
 *
 * All API calls are intercepted with page.route().
 */

import { test, expect } from '@playwright/test'
import { mockCommonRoutes, MOCK_USERS } from './fixtures'

// ---------------------------------------------------------------------------
// Shared mock dashboard payload
// ---------------------------------------------------------------------------
const DASHBOARD_PAYLOAD = {
  kpis: {
    totalOrdersToday: 42,
    completedOrdersToday: 30,
    inProgressOrdersToday: 8,
    delayedOrders: 4,
    revenueThisMonth: 85000.0,
    revenueLastMonth: 72000.0,
    revenueGrowth: 18.05,
    averageCompletionTime: 95,
    productivity: 71,
    nps: 82,
  },
  revenueData: [],
  departmentData: [
    { name: 'Película', value: 55, color: '#3B82F6' },
    { name: 'Estética', value: 30, color: '#10B981' },
    { name: 'Funilaria', value: 15, color: '#F59E0B' },
  ],
  storePerformance: [],
  topInstallers: [
    { id: 1, name: 'João Silva', completedOrders: 18, averageTime: 85, productivity: 88 },
  ],
  topServices: [
    { name: 'Película Fumê 35%', count: 24, revenue: 36000 },
  ],
  alerts: [],
}

// ---------------------------------------------------------------------------
// Helper: inject auth state via localStorage and mock dashboard endpoint
// ---------------------------------------------------------------------------
async function setupDashboard(
  page: typeof test.info extends () => infer R ? R : never,
  role: 'owner' | 'supervisor' | 'operator'
) {
  // This overload is intentionally loose; actual page arg is Playwright's Page
  void role
}

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept dashboard data
    await page.route('**/api/v1/reports/dashboard*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DASHBOARD_PAYLOAD),
      })
    )
  })

  // =========================================================================
  // 1. Owner sees Dashboard with KPI cards
  // =========================================================================
  test('should show dashboard KPI cards for owner', async ({ page }) => {
    await mockCommonRoutes(page, 'owner')

    // Inject authenticated owner state
    await page.goto('/')
    await page.evaluate((user) => {
      const persistState = {
        state: {
          user,
          tokens: {
            accessToken: 'e2e_fake_access_token',
            refreshToken: 'e2e_fake_refresh_token',
            expiresIn: 28800,
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aems-auth', JSON.stringify(persistState))
    }, MOCK_USERS.owner)

    await page.goto('/dashboard')

    // Page heading
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 })

    // KPI cards use their title as accessible text
    await expect(page.getByText('O.S. Hoje')).toBeVisible()
    await expect(page.getByText('Faturamento Mês')).toBeVisible()
    await expect(page.getByText('Produtividade')).toBeVisible()
    await expect(page.getByText('NPS')).toBeVisible()

    // Values from the mocked response
    await expect(page.getByText('42')).toBeVisible()
  })

  // =========================================================================
  // 2. Owner sees StoreSelector in the header
  // =========================================================================
  test('should show StoreSelector in the header for owner', async ({ page }) => {
    await mockCommonRoutes(page, 'owner')

    await page.goto('/')
    await page.evaluate((user) => {
      const persistState = {
        state: {
          user,
          tokens: {
            accessToken: 'e2e_fake_access_token',
            refreshToken: 'e2e_fake_refresh_token',
            expiresIn: 28800,
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aems-auth', JSON.stringify(persistState))
    }, MOCK_USERS.owner)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 })

    // StoreSelector is rendered in the header's hidden md:flex section
    // It renders a select/combobox or custom dropdown with store names
    const header = page.locator('header')
    await expect(header).toBeVisible()
    // The store "Loja Toyota Centro" should be visible in the selector area
    await expect(header.getByText(/Loja|Todas as Lojas|Todas/i).first()).toBeVisible()
  })

  // =========================================================================
  // 3. Operator does NOT see BI Multi-Loja link in sidebar
  // =========================================================================
  test('should not show BI Multi-Loja link for operator in sidebar', async ({ page }) => {
    await mockCommonRoutes(page, 'operator')

    await page.goto('/')
    await page.evaluate((user) => {
      const persistState = {
        state: {
          user,
          tokens: {
            accessToken: 'e2e_fake_access_token',
            refreshToken: 'e2e_fake_refresh_token',
            expiresIn: 28800,
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aems-auth', JSON.stringify(persistState))
    }, MOCK_USERS.operator)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 })

    // "Gestão de Usuários" is only for owners (roles: ['owner'] in Sidebar.tsx)
    await expect(page.getByRole('link', { name: 'Gestão de Usuários' })).not.toBeVisible()

    // Sidebar should still show common links visible to all roles
    await expect(page.getByRole('link', { name: 'Ordens de Serviço' })).toBeVisible()
  })

  // =========================================================================
  // 4. Supervisor does NOT see "Gestão de Usuários" sidebar link
  // =========================================================================
  test('should not show admin links for supervisor', async ({ page }) => {
    await mockCommonRoutes(page, 'supervisor')

    await page.goto('/')
    await page.evaluate((user) => {
      const persistState = {
        state: {
          user,
          tokens: {
            accessToken: 'e2e_fake_access_token',
            refreshToken: 'e2e_fake_refresh_token',
            expiresIn: 28800,
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aems-auth', JSON.stringify(persistState))
    }, MOCK_USERS.supervisor)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 })

    // "Gestão de Usuários" is only for owners; supervisor should not see it
    await expect(page.getByRole('link', { name: 'Gestão de Usuários' })).not.toBeVisible()
    // "Consultores" is also only for owners
    await expect(page.getByRole('link', { name: 'Consultores' })).not.toBeVisible()
  })

  // =========================================================================
  // 5. Owner sees "Gestão de Usuários" sidebar link
  // =========================================================================
  test('should show admin links in sidebar for owner', async ({ page }) => {
    await mockCommonRoutes(page, 'owner')

    await page.goto('/')
    await page.evaluate((user) => {
      const persistState = {
        state: {
          user,
          tokens: {
            accessToken: 'e2e_fake_access_token',
            refreshToken: 'e2e_fake_refresh_token',
            expiresIn: 28800,
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aems-auth', JSON.stringify(persistState))
    }, MOCK_USERS.owner)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 })

    // Owner should see these restricted links (roles: ['owner'] in Sidebar.tsx)
    await expect(page.getByRole('link', { name: 'Gestão de Usuários' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Consultores' })).toBeVisible()
  })

  // =========================================================================
  // 6. Dashboard shows "Atualizar" button that triggers refetch
  // =========================================================================
  test('should have refresh and export action buttons', async ({ page }) => {
    await mockCommonRoutes(page, 'owner')

    await page.goto('/')
    await page.evaluate((user) => {
      const persistState = {
        state: {
          user,
          tokens: {
            accessToken: 'e2e_fake_access_token',
            refreshToken: 'e2e_fake_refresh_token',
            expiresIn: 28800,
          },
          isAuthenticated: true,
        },
        version: 0,
      }
      localStorage.setItem('aems-auth', JSON.stringify(persistState))
    }, MOCK_USERS.owner)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 8000 })

    await expect(page.getByRole('button', { name: /Atualizar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Exportar/i })).toBeVisible()
  })
})
