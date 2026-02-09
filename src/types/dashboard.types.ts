export interface DashboardKPIs {
    // O.S.
    totalOrdersToday: number;
    completedOrdersToday: number;
    inProgressOrdersToday: number;
    delayedOrders: number;

    // Financeiro
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueGrowth: number;         // %

    // Produtividade
    averageCompletionTime: number; // minutos
    productivity: number;          // %
    nps: number;                   // -100 a 100
}

export interface RevenueData {
    month: string;                 // "Jan", "Fev", etc
    revenue: number;
    target?: number;               // Meta
}

export interface DepartmentData {
    department: string;            // "Película", "Estética", etc
    count: number;
    revenue: number;
}

export interface StorePerformance {
    storeId: number;
    storeName: string;
    ordersCompleted: number;
    revenue: number;
    averageTime: number;
    productivity: number;
}

export interface TopInstaller {
    id: number;
    name: string;
    ordersCompleted: number;
    averageRating: number;
    totalRevenue: number;
}

export interface TopService {
    id: number;
    name: string;
    timesOrdered: number;
    revenue: number;
}

export interface DashboardAlert {
    id: string;
    type: 'delayed_orders' | 'low_stock' | 'pending_approvals';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    count: number;
    link?: string;
}

export interface DashboardData {
    kpis: DashboardKPIs;
    revenueData: RevenueData[];
    departmentData: DepartmentData[];
    storePerformance: StorePerformance[];
    topInstallers: TopInstaller[];
    topServices: TopService[];
    alerts: DashboardAlert[];
}

export interface DashboardFilters {
    period: 'today' | 'week' | 'month' | 'year';
    storeId?: number;
    department?: string;
}
