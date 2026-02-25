import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { UnauthorizedPage } from '@/components/common/UnauthorizedPage';
import { Toaster } from '@/components/ui/toaster';

// Layouts
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Páginas

import LoginPage from '@/pages/auth/LoginPage';
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import DayPanelPage from '@/pages/day-panel/DayPanelPage';
import ServiceOrdersPage from '@/pages/service-orders/ServiceOrdersPage';
import CreateServiceOrderPage from '@/pages/service-orders/CreateServiceOrderPage';
import ServiceOrderDetailsPage from '@/pages/service-orders/ServiceOrderDetailsPage';
import EditServiceOrderPage from '@/pages/service-orders/EditServiceOrderPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import CreateFilmBobbinPage from '@/pages/inventory/CreateFilmBobbinPage';
import FilmBobbinDetailsPage from '@/pages/inventory/FilmBobbinDetailsPage';
import EditFilmBobbinPage from '@/pages/inventory/EditFilmBobbinPage';
import { ClientsPage } from '@/pages/clients/ClientsPage';
import { CreateClientPage } from '@/pages/clients/CreateClientPage';
import { EditClientPage } from '@/pages/clients/EditClientPage';
import { ClientDetailsPage } from '@/pages/clients/ClientDetailsPage';
import { PurchaseRequestsPage } from '@/pages/purchase-requests/PurchaseRequestsPage';
import { CreatePurchaseRequestPage } from '@/pages/purchase-requests/CreatePurchaseRequestPage';
import { PurchaseRequestDetailsPage } from '@/pages/purchase-requests/PurchaseRequestDetailsPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { ConsultantManagementPage } from '@/pages/admin/ConsultantManagementPage';
import { EmployeeManagementPage } from '@/pages/admin/EmployeeManagementPage';
import { StoreManagementPage } from '@/pages/admin/StoreManagementPage';
import { ApprovalsPage } from '@/pages/approvals/ApprovalsPage';
import { BIDashboardPage } from '@/pages/reports/BIDashboardPage';
import IncidentsList from '@/pages/incidents/IncidentsList';
import CreateIncident from '@/pages/incidents/CreateIncident';
import IncidentDetails from '@/pages/incidents/IncidentDetails';
import OccurrencesListPage from '@/pages/occurrences/OccurrencesListPage';
import CreateOccurrencePage from '@/pages/occurrences/CreateOccurrencePage';
import OccurrenceDetailsPage from '@/pages/occurrences/OccurrenceDetailsPage';
import ExecutiveDashboardPage from '@/pages/reports/ExecutiveDashboardPage';
import WorkerRankingPage from '@/pages/reports/WorkerRankingPage';
import MultiStoreBIPage from '@/pages/reports/MultiStoreBIPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import ServicesPage from '@/pages/services/ServicesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const router = createBrowserRouter([


  // Rotas públicas (Auth Layout)
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/change-password', element: <ChangePasswordPage /> },
    ],
  },

  // Rotas protegidas (autenticadas)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: (
          <WebSocketProvider>
            <MainLayout />
          </WebSocketProvider>
        ),
        children: [
          // Redirecionar raiz
          { path: '/', element: <Navigate to="/dashboard" replace /> },

          // Rotas acessíveis por todos (autenticados)
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },

          // Rotas operacionais (operator, supervisor, owner)
          {
            element: <RoleGuard allowedRoles={['operator', 'supervisor', 'owner']} />,
            children: [
              { path: '/day-panel', element: <DayPanelPage /> },
              { path: '/service-orders', element: <ServiceOrdersPage /> },
              { path: '/service-orders/new', element: <CreateServiceOrderPage /> },
              { path: '/service-orders/:id', element: <ServiceOrderDetailsPage /> },
              { path: '/service-orders/:id/edit', element: <EditServiceOrderPage /> },
              { path: '/clients', element: <ClientsPage /> },
              { path: '/clients/new', element: <CreateClientPage /> },
              { path: '/clients/:id', element: <ClientDetailsPage /> },
              { path: '/clients/:id/edit', element: <EditClientPage /> },
              { path: '/inventory', element: <InventoryPage /> },
              { path: '/inventory/new', element: <CreateFilmBobbinPage /> },
              { path: '/inventory/:id', element: <FilmBobbinDetailsPage /> },
              { path: '/inventory/:id/edit', element: <EditFilmBobbinPage /> },
              { path: '/purchase-requests/new', element: <CreatePurchaseRequestPage /> },
              { path: '/purchase-requests/:id', element: <PurchaseRequestDetailsPage /> },
              { path: '/incidents', element: <IncidentsList /> },
              { path: '/incidents/new', element: <CreateIncident /> },
              { path: '/incidents/:id', element: <IncidentDetails /> },
              { path: '/hr/occurrences', element: <OccurrencesListPage /> },
              { path: '/hr/occurrences/new', element: <CreateOccurrencePage /> },
              { path: '/hr/occurrences/:id', element: <OccurrenceDetailsPage /> },
            ],
          },

          // Rotas de aprovação e lista de compras (supervisor, owner)
          {
            element: <RoleGuard allowedRoles={['supervisor', 'owner']} />,
            children: [
              { path: '/purchase-requests', element: <PurchaseRequestsPage /> },
              { path: '/approvals', element: <ApprovalsPage /> },
            ],
          },

          // Rotas administrativas (owner only)
          {
            element: <RoleGuard allowedRoles={['owner']} />,
            children: [
              { path: '/admin/users', element: <UserManagementPage /> },
              { path: '/admin/consultants', element: <ConsultantManagementPage /> },
              { path: '/admin/employees', element: <EmployeeManagementPage /> },
              { path: '/admin/stores', element: <StoreManagementPage /> },
              { path: '/servicos', element: <ServicesPage /> },
              { path: '/reports/multi-store', element: <MultiStoreBIPage /> },
              { path: '/reports/bi', element: <BIDashboardPage /> }, // Redireciona
              { path: '/analytics', element: <AnalyticsPage /> },    // Redireciona
            ],
          },

          // Rotas de Reports (supervisor, owner)
          {
            element: <RoleGuard allowedRoles={['supervisor', 'owner']} />,
            children: [
              { path: '/reports/dashboard', element: <ExecutiveDashboardPage /> },
              { path: '/reports/ranking', element: <WorkerRankingPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Rotas de erro
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
