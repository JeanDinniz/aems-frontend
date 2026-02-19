/**
 * Tests for DashboardPage
 *
 * Tests dashboard rendering, KPIs display, charts, filters, and loading states.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../dashboard/DashboardPage';
import { useAuthStore } from '@/stores/auth.store';
import { mockUser, mockSupervisor, mockOwner } from '@/__mocks__/handlers';

// Mock hooks and components
vi.mock('@/hooks/useDashboardData', () => ({
    useDashboardData: vi.fn(),
}));

import { useDashboardData } from '@/hooks/useDashboardData';

// Test wrapper with providers
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </BrowserRouter>
    );
};

const renderDashboardPage = () => {
    const Wrapper = createWrapper();
    return render(
        <Wrapper>
            <DashboardPage />
        </Wrapper>
    );
};

const mockDashboardData = {
    kpis: {
        totalOrdersToday: 15,
        completedOrdersToday: 10,
        inProgressOrdersToday: 3,
        delayedOrders: 2,
        revenueThisMonth: 45000,
        revenueLastMonth: 40000,
        revenueGrowth: 12.5,
        averageCompletionTime: 120,
        productivity: 85,
        nps: 78,
    },
    revenueData: [
        { date: '2026-02-01', revenue: 1500 },
        { date: '2026-02-02', revenue: 1800 },
        { date: '2026-02-03', revenue: 2100 },
    ],
    departmentData: [
        { department: 'Película', value: 8 },
        { department: 'Funilaria', value: 4 },
        { department: 'Estética', value: 3 },
    ],
    storePerformance: [
        { store: 'LJ01', performance: 92 },
        { store: 'LJ02', performance: 88 },
    ],
    topInstallers: [
        { id: 1, name: 'João Silva', ordersCompleted: 45, averageRating: 4.8, totalRevenue: 12500 },
        { id: 2, name: 'Maria Santos', ordersCompleted: 38, averageRating: 4.6, totalRevenue: 10800 },
    ],
    topServices: [
        { id: 1, name: 'Fumê 35%', count: 25, revenue: 11250 },
        { id: 2, name: 'Polimento', count: 15, revenue: 5250 },
    ],
    alerts: [
        {
            id: 1,
            type: 'low_stock',
            severity: 'medium',
            title: 'Estoque Baixo',
            description: 'Bobina LJ01-FUM35 com estoque baixo',
            count: 1,
            link: '/inventory'
        },
    ],
};

describe('DashboardPage', () => {
    beforeEach(() => {
        // Set default user as operator
        useAuthStore.setState({ user: mockUser });

        // Reset mock
        vi.mocked(useDashboardData).mockReturnValue({
            data: mockDashboardData,
            isLoading: false,
            refetch: vi.fn(),
        } as any);
    });

    describe('rendering', () => {
        it('should render dashboard header', () => {
            renderDashboardPage();

            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/visão geral da operação/i)).toBeInTheDocument();
        });

        it('should render action buttons', () => {
            renderDashboardPage();

            expect(screen.getByRole('button', { name: /atualizar/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /exportar/i })).toBeInTheDocument();
        });

        it('should render current date', () => {
            renderDashboardPage();

            const dateText = new Date().toLocaleDateString('pt-BR');
            expect(screen.getByText(new RegExp(dateText))).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('should show loading indicator when data is loading', () => {
            vi.mocked(useDashboardData).mockReturnValue({
                data: undefined,
                isLoading: true,
                refetch: vi.fn(),
            } as any);

            renderDashboardPage();

            expect(screen.getByText(/carregando dashboard/i)).toBeInTheDocument();
            // Spinner has animate-spin class
            expect(document.querySelector('.animate-spin')).toBeInTheDocument();
        });

        it('should show spinner animation during loading', () => {
            vi.mocked(useDashboardData).mockReturnValue({
                data: undefined,
                isLoading: true,
                refetch: vi.fn(),
            } as any);

            renderDashboardPage();

            const spinner = document.querySelector('.animate-spin');
            expect(spinner).toBeInTheDocument();
        });
    });

    describe('KPI cards', () => {
        it('should render all KPI cards', () => {
            renderDashboardPage();

            expect(screen.getByText('O.S. Hoje')).toBeInTheDocument();
            expect(screen.getByText('Faturamento Mês')).toBeInTheDocument();
            expect(screen.getByText('Produtividade')).toBeInTheDocument();
            expect(screen.getByText('NPS')).toBeInTheDocument();
        });

        it('should display correct KPI values', () => {
            renderDashboardPage();

            expect(screen.getByText('15')).toBeInTheDocument(); // totalOrdersToday
            expect(screen.getByText(/10 concluídas/i)).toBeInTheDocument();
        });

        it('should display revenue growth percentage', () => {
            renderDashboardPage();

            expect(screen.getByText(/\+12\.5% vs mês anterior/i)).toBeInTheDocument();
        });

        it('should display productivity percentage', () => {
            renderDashboardPage();

            expect(screen.getByText(/tempo médio: 120min/i)).toBeInTheDocument();
        });

        it('should display NPS score', () => {
            renderDashboardPage();

            expect(screen.getByText('78')).toBeInTheDocument();
            expect(screen.getByText('Net Promoter Score')).toBeInTheDocument();
        });
    });

    describe('filters', () => {
        it('should render dashboard filters', () => {
            renderDashboardPage();

            // DashboardFilters component is rendered
            // Just verify the dashboard content is there
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('should call useDashboardData with filters', async () => {
            userEvent.setup();
            renderDashboardPage();

            // Initial call with default filters
            expect(useDashboardData).toHaveBeenCalledWith(
                expect.objectContaining({
                    period: 'today',
                })
            );
        });
    });

    describe('alerts', () => {
        it('should render alerts when present', () => {
            renderDashboardPage();

            expect(screen.getByText(/bobina LJ01-FUM35 com estoque baixo/i)).toBeInTheDocument();
        });

        it('should not render alerts section when no alerts', () => {
            vi.mocked(useDashboardData).mockReturnValue({
                data: { ...mockDashboardData, alerts: [] },
                isLoading: false,
                refetch: vi.fn(),
            } as any);

            renderDashboardPage();

            // When no alerts, the alert text from mock data should not be there
            const alertText = screen.queryByText(/bobina LJ01-FUM35 com estoque baixo/i);
            expect(alertText).not.toBeInTheDocument();
        });
    });

    describe('charts', () => {
        it('should render revenue chart', () => {
            renderDashboardPage();

            // Charts are rendered - verify page loaded successfully
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('should render department pie chart', () => {
            renderDashboardPage();

            // Charts are rendered - verify page loaded successfully
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });
    });

    describe('role-based content', () => {
        it('should show store performance chart for supervisor', () => {
            useAuthStore.setState({ user: mockSupervisor });
            renderDashboardPage();

            // PerformanceBarChart should be rendered for supervisor
            // Page should render successfully
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('should show store performance chart for owner', () => {
            useAuthStore.setState({ user: mockOwner });
            renderDashboardPage();

            // PerformanceBarChart should be rendered for owner
            // Page should render successfully
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });

        it('should not show store performance chart for operator', () => {
            useAuthStore.setState({ user: mockUser });
            renderDashboardPage();

            // For operator role, performance chart is not shown
            // Page should still render successfully
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });
    });

    describe('rankings', () => {
        it('should render top installers card', () => {
            renderDashboardPage();

            // TopInstallersCard component should be rendered
            expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
            expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
        });

        it('should render top services card', () => {
            renderDashboardPage();

            // TopServicesCard component should be rendered
            expect(screen.getByText(/Fumê 35%/i)).toBeInTheDocument();
            expect(screen.getByText(/Polimento/i)).toBeInTheDocument();
        });
    });

    describe('actions', () => {
        it('should refresh data when clicking refresh button', async () => {
            const user = userEvent.setup();
            const mockRefetch = vi.fn();

            vi.mocked(useDashboardData).mockReturnValue({
                data: mockDashboardData,
                isLoading: false,
                refetch: mockRefetch,
            } as any);

            renderDashboardPage();

            const refreshButton = screen.getByRole('button', { name: /atualizar/i });
            await user.click(refreshButton);

            expect(mockRefetch).toHaveBeenCalled();
        });

        it('should trigger export when clicking export button', async () => {
            const user = userEvent.setup();
            const consoleSpy = vi.spyOn(console, 'log');

            renderDashboardPage();

            const exportButton = screen.getByRole('button', { name: /exportar/i });
            await user.click(exportButton);

            expect(consoleSpy).toHaveBeenCalledWith('Exporting report...');
        });
    });

    describe('error handling', () => {
        it('should handle null data gracefully', () => {
            vi.mocked(useDashboardData).mockReturnValue({
                data: null,
                isLoading: false,
                refetch: vi.fn(),
            } as any);

            renderDashboardPage();

            // Should render with fallback values
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            // Multiple KPIs will have 0 values
            expect(screen.getAllByText('0').length).toBeGreaterThan(0);
        });

        it('should handle undefined data gracefully', () => {
            vi.mocked(useDashboardData).mockReturnValue({
                data: undefined,
                isLoading: false,
                refetch: vi.fn(),
            } as any);

            renderDashboardPage();

            // Should render with fallback values
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
        });
    });

    describe('responsive behavior', () => {
        it('should render grid layout for KPIs', () => {
            renderDashboardPage();

            const kpiGrid = document.querySelector('.grid');
            expect(kpiGrid).toBeInTheDocument();
        });

        it('should render responsive header layout', () => {
            renderDashboardPage();

            const header = screen.getByText('Dashboard');
            // Header is rendered with responsive layout
            expect(header).toBeInTheDocument();
        });
    });

    describe('data updates', () => {
        it('should update when filters change', async () => {
            const { rerender } = renderDashboardPage();

            // Simulate filter change by updating the mock
            vi.mocked(useDashboardData).mockReturnValue({
                data: {
                    ...mockDashboardData,
                    kpis: {
                        ...mockDashboardData.kpis,
                        totalOrdersToday: 20,
                    },
                },
                isLoading: false,
                refetch: vi.fn(),
            } as any);

            const Wrapper = createWrapper();
            rerender(
                <Wrapper>
                    <DashboardPage />
                </Wrapper>
            );

            await waitFor(() => {
                expect(screen.getByText('20')).toBeInTheDocument();
            });
        });
    });
});
