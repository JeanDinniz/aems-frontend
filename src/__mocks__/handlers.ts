/**
 * MSW Handlers - Mock API responses for testing
 *
 * Provides mock responses for all AEMS backend API endpoints.
 * Based on the actual FastAPI backend specification.
 */

import { http, HttpResponse } from 'msw';
import type { LoginResponse, User } from '@/types/auth.types';
import type { ServiceOrder, ServiceOrderStatus } from '@/types/service-order.types';
import type { ServiceOrderCard } from '@/types/day-panel.types';
import type { FilmBobbin } from '@/types/inventory.types';
import type { PurchaseRequest } from '@/types/purchase-requests.types';

const API_URL = 'http://127.0.0.1:8000/api/v1';

// Mock Data
export const mockUser: User = {
    id: 1,
    full_name: 'Test User',
    email: 'test@example.com',
    role: 'operator',
    is_active: true,
    must_change_password: false,
    store_id: 1,
    store_name: 'Toyota Botafogo',
    supervised_store_ids: [],
    phone: '11999999999',
    last_login: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

export const mockSupervisor: User = {
    ...mockUser,
    id: 2,
    full_name: 'Supervisor User',
    email: 'supervisor@example.com',
    role: 'supervisor',
    supervised_store_ids: [1, 2],
};

export const mockOwner: User = {
    ...mockUser,
    id: 3,
    full_name: 'Owner User',
    email: 'owner@example.com',
    role: 'owner',
    store_id: undefined,
    supervised_store_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 28800, // 8 hours
};

export const mockLoginResponse: LoginResponse = {
    user: mockUser,
    tokens: mockTokens,
    must_change_password: false,
};

export const mockServiceOrders: ServiceOrder[] = [
    {
        id: 1,
        order_number: 'OS-2602-001',
        plate: 'ABC1D23',
        client_name: 'João Silva',
        client_phone: '11987654321',
        vehicle_model: 'Corolla XEi',
        vehicle_color: 'Prata',
        department: 'film',
        service_type: 'Instalação Película',
        service_description: 'Instalação de película fumê 35% nos vidros laterais e traseiro',
        status: 'waiting',
        entry_time: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        delivered_at: null,
        technician_id: null,
        technician_name: null,
        consultant_id: 1,
        consultant_name: 'Carlos Vendedor',
        workers: [],
        photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg'],
        damage_map: null,
        invoice_number: null,
        location_id: 1,
        location_name: 'Toyota Botafogo',
        dealership_id: 1,
        dealership_name: 'Toyota Centro',
        total_value: 450.00,
        notes: null,
        semaphore_color: 'white',
        elapsed_minutes: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        order_number: 'OS-2602-002',
        plate: 'XYZ9W87',
        client_name: 'Maria Santos',
        client_phone: '11976543210',
        vehicle_model: 'Civic EXL',
        vehicle_color: 'Preto',
        department: 'workshop',
        service_type: 'Estética Completa',
        service_description: 'Lavagem completa + polimento + cristalização',
        status: 'doing',
        entry_time: new Date(Date.now() - 3600000).toISOString(),
        started_at: new Date(Date.now() - 1800000).toISOString(),
        completed_at: null,
        delivered_at: null,
        technician_id: 1,
        technician_name: 'José Técnico',
        consultant_id: 2,
        consultant_name: 'Ana Vendedora',
        workers: [
            { id: 1, name: 'José Técnico', isPrimary: true },
            { id: 2, name: 'Pedro Auxiliar', isPrimary: false },
        ],
        photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg'],
        damage_map: null,
        invoice_number: null,
        location_id: 1,
        location_name: 'Toyota Botafogo',
        dealership_id: 1,
        dealership_name: 'Toyota Centro',
        total_value: 350.00,
        notes: 'Cliente pediu atenção especial no polimento',
        semaphore_color: 'yellow',
        elapsed_minutes: 60,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const mockFilmBobbins: FilmBobbin[] = [
    {
        id: 1,
        smart_id: 'LJ01-FUM35-2602-001',
        store_id: 1,
        store_name: 'Toyota Botafogo',
        film_type: 'fume_35',
        nominal_metragem: 30.5,
        current_metragem: 25.3,
        supplier: '3M',
        batch_number: 'BATCH-2024-001',
        yield_percentage: 92.5,
        status: 'in_use',
        purchase_date: new Date(Date.now() - 86400000 * 10).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        finished_at: null,
    },
    {
        id: 2,
        smart_id: 'LJ01-FUM70-2602-002',
        store_id: 1,
        store_name: 'Toyota Botafogo',
        film_type: 'fume_70',
        nominal_metragem: 30.5,
        current_metragem: 5.2,
        supplier: 'Insulfilm',
        batch_number: 'BATCH-2024-002',
        yield_percentage: 88.1,
        status: 'in_use',
        purchase_date: new Date(Date.now() - 86400000 * 20).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
        finished_at: null,
    },
    {
        id: 3,
        smart_id: 'LJ01-CERA-2602-003',
        store_id: 1,
        store_name: 'Toyota Botafogo',
        film_type: 'ceramic',
        nominal_metragem: 30.5,
        current_metragem: 30.5,
        supplier: null,
        batch_number: null,
        yield_percentage: null,
        status: 'available',
        purchase_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        finished_at: null,
    },
];

export const mockPurchaseRequests: PurchaseRequest[] = [
    {
        id: 1,
        request_number: 'PR-2602-001',
        store_id: 1,
        store_name: 'Toyota Botafogo',
        requester_id: 1,
        requester_name: 'Test User',
        category: 'film',
        urgency: 'normal',
        items: [
            {
                id: 1,
                product_name: 'Bobina Fumê 35%',
                quantity: 5,
                unit: 'un',
                estimated_price: 450.00,
                supplier: '3M',
                notes: 'Preferência por 3M',
            },
        ],
        total_estimated: 2250.00,
        justification: 'Necessário reposição de estoque para atender demanda do mês',
        status: 'awaiting_supervisor',
        supervisor_approval_id: null,
        supervisor_approval_name: null,
        supervisor_approval_date: null,
        supervisor_notes: null,
        owner_approval_id: null,
        owner_approval_name: null,
        owner_approval_date: null,
        owner_notes: null,
        rejection_reason: null,
        supplier_name: null,
        order_date: null,
        expected_delivery: null,
        payment_terms: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
    },
    {
        id: 2,
        request_number: 'PR-2602-002',
        store_id: 1,
        store_name: 'Toyota Botafogo',
        requester_id: 1,
        requester_name: 'Test User',
        category: 'workshop',
        urgency: 'urgent',
        items: [
            {
                id: 2,
                product_name: 'Cera de Carnaúba',
                quantity: 10,
                unit: 'lata',
                estimated_price: 85.00,
                supplier: 'Vonixx',
                notes: undefined,
            },
        ],
        total_estimated: 850.00,
        justification: 'Reposição mensal - estoque crítico',
        status: 'approved',
        supervisor_approval_id: 2,
        supervisor_approval_name: 'Supervisor User',
        supervisor_approval_date: new Date(Date.now() - 86400000).toISOString(),
        supervisor_notes: 'Aprovado conforme solicitado',
        owner_approval_id: 3,
        owner_approval_name: 'Owner User',
        owner_approval_date: new Date(Date.now() - 43200000).toISOString(),
        owner_notes: 'OK',
        rejection_reason: null,
        supplier_name: 'Vonixx',
        order_date: null,
        expected_delivery: null,
        payment_terms: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: null,
    },
];

export const mockServiceOrderCards: ServiceOrderCard[] = [
    {
        id: 1,
        orderNumber: 'OS-2602-001',
        plate: 'ABC1D23',
        model: 'Corolla XEi 2023 Prata',
        status: 'waiting',
        department: 'film',
        semaphoreColor: 'white',
        entryTime: new Date().toISOString(),
        services: [{ id: 1, name: 'Instalação Película' }],
        consultantName: 'Carlos Vendedor',
        dealershipName: 'Toyota Centro',
        assignedWorkers: [],
        storeId: 1,
        storeName: 'Toyota Botafogo',
    },
    {
        id: 2,
        orderNumber: 'OS-2602-002',
        plate: 'XYZ9W87',
        model: 'Civic EXL 2024 Preto',
        status: 'in_progress',
        department: 'workshop',
        semaphoreColor: 'yellow',
        entryTime: new Date(Date.now() - 3600000).toISOString(),
        services: [{ id: 2, name: 'Estética Completa' }],
        consultantName: 'Ana Vendedora',
        dealershipName: 'Toyota Centro',
        assignedWorkers: [
            { id: 1, name: 'José Técnico' },
            { id: 2, name: 'Pedro Auxiliar' },
        ],
        storeId: 1,
        storeName: 'Toyota Botafogo',
    },
];

// Handlers
export const handlers = [
    // ============ AUTH ============
    http.post(`${API_URL}/auth/login`, async ({ request }) => {
        const formData = await request.formData();
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        if (username === 'test@example.com' && password === 'password123') {
            return HttpResponse.json({
                access_token: mockTokens.accessToken,
                refresh_token: mockTokens.refreshToken,
                expires_in: mockTokens.expiresIn,
                must_change_password: false,
            });
        }

        if (username === 'supervisor@example.com' && password === 'password123') {
            return HttpResponse.json({
                access_token: 'supervisor-token',
                refresh_token: 'supervisor-refresh',
                expires_in: 28800,
                must_change_password: false,
            });
        }

        return HttpResponse.json(
            { detail: 'Invalid credentials' },
            { status: 401 }
        );
    }),

    http.get(`${API_URL}/auth/me`, ({ request }) => {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
        }

        if (authHeader.includes('supervisor-token')) {
            return HttpResponse.json(mockSupervisor);
        }

        return HttpResponse.json(mockUser);
    }),

    http.post(`${API_URL}/auth/logout`, () => {
        return HttpResponse.json({ message: 'Logged out successfully' });
    }),

    http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
        const body = await request.json() as { refreshToken: string };

        if (body.refreshToken === mockTokens.refreshToken) {
            return HttpResponse.json({
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                expires_in: 28800,
                must_change_password: false,
            });
        }

        return HttpResponse.json(
            { detail: 'Invalid refresh token' },
            { status: 401 }
        );
    }),

    http.post(`${API_URL}/auth/forgot-password`, () => {
        return HttpResponse.json({ message: 'Password reset email sent' });
    }),

    http.post(`${API_URL}/auth/reset-password`, () => {
        return HttpResponse.json({ message: 'Password reset successful' });
    }),

    http.post(`${API_URL}/auth/change-password`, () => {
        return HttpResponse.json({ message: 'Password changed successfully' });
    }),

    http.patch(`${API_URL}/auth/profile`, async ({ request }) => {
        const body = await request.json() as Partial<User>;
        return HttpResponse.json({ ...mockUser, ...body });
    }),

    // ============ SERVICE ORDERS ============
    http.get(`${API_URL}/service-orders/day-panel`, ({ request }) => {
        const url = new URL(request.url);
        const storeId = url.searchParams.get('store_id');

        if (storeId) {
            return HttpResponse.json(
                mockServiceOrderCards.filter(o => o.storeId === parseInt(storeId))
            );
        }

        return HttpResponse.json(mockServiceOrderCards);
    }),

    http.get(`${API_URL}/service-orders`, ({ request }) => {
        const url = new URL(request.url);
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        return HttpResponse.json({
            items: mockServiceOrders.slice(skip, skip + limit),
            total: mockServiceOrders.length,
        });
    }),

    http.get(`${API_URL}/service-orders/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const order = mockServiceOrders.find(o => o.id === id);

        if (!order) {
            return HttpResponse.json(
                { detail: 'Service order not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(order);
    }),

    http.post(`${API_URL}/service-orders`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        const newOrder: ServiceOrder = {
            id: mockServiceOrders.length + 1,
            order_number: `OS-2602-${String(mockServiceOrders.length + 1).padStart(3, '0')}`,
            plate: body.plate as string,
            client_name: body.client_name as string,
            client_phone: body.client_phone as string,
            vehicle_model: body.vehicle_model as string || '',
            vehicle_color: body.vehicle_color as string || '',
            department: body.department as ServiceOrder['department'],
            service_type: body.service_type as string || '',
            service_description: body.service_description as string || '',
            items: (body.items as any[])?.map(item => ({
                service_id: item.service_id,
                quantity: item.quantity,
                notes: item.notes
            })) || [],
            status: 'waiting',
            entry_time: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            delivered_at: null,
            technician_id: body.technician_id as number || null,
            technician_name: null,
            consultant_id: body.consultant_id as number || null,
            consultant_name: null,
            workers: [],
            photos: body.photos as string[] || [],
            damage_map: body.damage_map as string || null,
            invoice_number: body.invoice_number as string || null,
            location_id: body.location_id as number,
            location_name: 'Toyota Botafogo',
            dealership_id: body.dealership_id as number,
            dealership_name: 'Concessionária',
            destination_store_id: body.destination_store_id as number || undefined,
            destination_store_name: body.destination_store_id ? 'Store Name' : undefined,
            total_value: body.total_value as number || 0,
            notes: body.notes as string || null,
            semaphore_color: 'white',
            elapsed_minutes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        mockServiceOrders.push(newOrder);
        return HttpResponse.json(newOrder, { status: 201 });
    }),

    http.put(`${API_URL}/service-orders/:id`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as Partial<ServiceOrder>;
        const index = mockServiceOrders.findIndex(o => o.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Service order not found' },
                { status: 404 }
            );
        }

        mockServiceOrders[index] = {
            ...mockServiceOrders[index],
            ...body,
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockServiceOrders[index]);
    }),

    http.patch(`${API_URL}/service-orders/:id/status`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as { status: ServiceOrderStatus; worker_ids?: number[]; primary_worker_id?: number };
        const index = mockServiceOrders.findIndex(o => o.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Service order not found' },
                { status: 404 }
            );
        }

        // Convert worker_ids to workers array if provided
        const workers = body.worker_ids?.map(workerId => ({
            id: workerId,
            name: `Worker ${workerId}`,
            isPrimary: workerId === body.primary_worker_id,
        }));

        mockServiceOrders[index] = {
            ...mockServiceOrders[index],
            status: body.status,
            workers: workers || mockServiceOrders[index].workers,
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockServiceOrders[index]);
    }),

    http.delete(`${API_URL}/service-orders/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const index = mockServiceOrders.findIndex(o => o.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Service order not found' },
                { status: 404 }
            );
        }

        mockServiceOrders.splice(index, 1);
        return HttpResponse.json(null, { status: 204 });
    }),

    // ============ FILM BOBBINS ============
    // Alerts endpoint must come BEFORE :id routes to match properly
    http.get(`${API_URL}/film-bobbins/alerts`, () => {
        // Filter bobbins with low metragem (less than 20% remaining)
        const alerts = mockFilmBobbins.filter(b => {
            const percentageRemaining = (b.current_metragem / b.nominal_metragem) * 100;
            return percentageRemaining < 20 && b.status !== 'finished';
        });

        return HttpResponse.json({
            alerts,
        });
    }),

    http.get(`${API_URL}/film-bobbins`, ({ request }) => {
        const url = new URL(request.url);
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '50');

        return HttpResponse.json({
            items: mockFilmBobbins.slice(skip, skip + limit),
            total: mockFilmBobbins.length,
        });
    }),

    http.get(`${API_URL}/film-bobbins/:id/consumption-history`, () => {
        return HttpResponse.json([
            {
                id: 1,
                meters_used: 2.5,
                service_order_id: 1,
                created_at: new Date().toISOString(),
            },
        ]);
    }),

    http.get(`${API_URL}/film-bobbins/:id/yield-stats`, () => {
        return HttpResponse.json({
            average_yield: 91.3,
            total_meters_used: 20.2,
            efficiency_rating: 'good',
        });
    }),

    http.get(`${API_URL}/film-bobbins/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const bobbin = mockFilmBobbins.find(b => b.id === id);

        if (!bobbin) {
            return HttpResponse.json(
                { detail: 'Film bobbin not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(bobbin);
    }),

    http.post(`${API_URL}/film-bobbins`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        const newBobbin: FilmBobbin = {
            id: mockFilmBobbins.length + 1,
            smart_id: body.smart_id as string || `LJ01-TYPE-2602-${String(mockFilmBobbins.length + 1).padStart(3, '0')}`,
            store_id: body.store_id as number,
            store_name: 'Toyota Botafogo',
            film_type: body.film_type as string,
            nominal_metragem: body.nominal_metragem as number,
            current_metragem: body.nominal_metragem as number,
            supplier: body.supplier as string || null,
            batch_number: body.batch_number as string || null,
            yield_percentage: null,
            status: 'available',
            purchase_date: body.purchase_date as string || new Date().toISOString(),
            created_at: new Date().toISOString(),
            finished_at: null,
        };

        mockFilmBobbins.push(newBobbin);
        return HttpResponse.json(newBobbin, { status: 201 });
    }),

    http.put(`${API_URL}/film-bobbins/:id`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as Partial<FilmBobbin>;
        const index = mockFilmBobbins.findIndex(b => b.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Film bobbin not found' },
                { status: 404 }
            );
        }

        mockFilmBobbins[index] = {
            ...mockFilmBobbins[index],
            ...body,
        };

        return HttpResponse.json(mockFilmBobbins[index]);
    }),

    http.delete(`${API_URL}/film-bobbins/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const index = mockFilmBobbins.findIndex(b => b.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Film bobbin not found' },
                { status: 404 }
            );
        }

        mockFilmBobbins.splice(index, 1);
        return HttpResponse.json(null, { status: 204 });
    }),

    http.post(`${API_URL}/film-bobbins/:id/consume`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as { bobbin_id?: number; service_order_id?: number; metragem_used: number };
        const index = mockFilmBobbins.findIndex(b => b.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Film bobbin not found' },
                { status: 404 }
            );
        }

        const newMetragem = mockFilmBobbins[index].current_metragem - body.metragem_used;

        mockFilmBobbins[index] = {
            ...mockFilmBobbins[index],
            current_metragem: newMetragem,
            status: newMetragem <= 0 ? 'finished' : mockFilmBobbins[index].status,
            finished_at: newMetragem <= 0 ? new Date().toISOString() : mockFilmBobbins[index].finished_at,
        };

        return HttpResponse.json(mockFilmBobbins[index]);
    }),

    // ============ PURCHASE REQUESTS ============
    // Stats endpoint must come BEFORE :id routes to match properly
    http.get(`${API_URL}/purchase-requests/stats`, () => {
        return HttpResponse.json({
            total: mockPurchaseRequests.length,
            pending: mockPurchaseRequests.filter(r => r.status === 'awaiting_supervisor').length,
            approved: mockPurchaseRequests.filter(r => r.status === 'approved').length,
            rejected: mockPurchaseRequests.filter(r => r.status === 'rejected').length,
        });
    }),

    http.get(`${API_URL}/purchase-requests`, ({ request }) => {
        const url = new URL(request.url);
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '50');

        return HttpResponse.json({
            items: mockPurchaseRequests.slice(skip, skip + limit),
            total: mockPurchaseRequests.length,
        });
    }),

    http.get(`${API_URL}/purchase-requests/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const request = mockPurchaseRequests.find(r => r.id === id);

        if (!request) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(request);
    }),

    http.post(`${API_URL}/purchase-requests`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        const items = body.items as PurchaseRequest['items'] || [];

        // Calculate total_estimated from items if not provided
        const total_estimated = body.total_estimated as number ||
            items.reduce((sum, item) => sum + (item.quantity * item.estimated_price), 0);

        const newRequest: PurchaseRequest = {
            id: mockPurchaseRequests.length + 1,
            request_number: `PR-2602-${String(mockPurchaseRequests.length + 1).padStart(3, '0')}`,
            store_id: body.store_id as number || 1,
            store_name: 'Toyota Botafogo',
            requester_id: body.requester_id as number || 1,
            requester_name: body.requester_name as string || 'Test User',
            category: body.category as PurchaseRequest['category'],
            urgency: body.urgency as PurchaseRequest['urgency'],
            items,
            total_estimated,
            justification: body.justification as string || '',
            status: 'awaiting_supervisor',
            supervisor_approval_id: null,
            supervisor_approval_name: null,
            supervisor_approval_date: null,
            supervisor_notes: null,
            owner_approval_id: null,
            owner_approval_name: null,
            owner_approval_date: null,
            owner_notes: null,
            rejection_reason: null,
            supplier_name: null,
            order_date: null,
            expected_delivery: null,
            payment_terms: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            completed_at: null,
        };

        mockPurchaseRequests.push(newRequest);
        return HttpResponse.json(newRequest, { status: 201 });
    }),

    http.post(`${API_URL}/purchase-requests/:id/supervisor-approval`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as { approved: boolean; notes?: string };
        const index = mockPurchaseRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        mockPurchaseRequests[index] = {
            ...mockPurchaseRequests[index],
            status: body.approved ? 'awaiting_owner' : 'rejected',
            supervisor_approval_id: 2,
            supervisor_approval_name: 'Supervisor User',
            supervisor_approval_date: new Date().toISOString(),
            supervisor_notes: body.notes || null,
            rejection_reason: body.approved ? null : (body.notes ?? null),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockPurchaseRequests[index]);
    }),

    http.post(`${API_URL}/purchase-requests/:id/owner-approval`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as { approved: boolean; notes?: string };
        const index = mockPurchaseRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        mockPurchaseRequests[index] = {
            ...mockPurchaseRequests[index],
            status: body.approved ? 'approved' : 'rejected',
            owner_approval_id: 3,
            owner_approval_name: 'Owner User',
            owner_approval_date: new Date().toISOString(),
            owner_notes: body.notes || null,
            rejection_reason: body.approved ? null : (body.notes ?? null),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockPurchaseRequests[index]);
    }),

    http.post(`${API_URL}/purchase-requests/:id/order`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as Record<string, unknown>;
        const index = mockPurchaseRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        mockPurchaseRequests[index] = {
            ...mockPurchaseRequests[index],
            status: 'ordered',
            order_date: new Date().toISOString(),
            supplier_name: body.supplier_name as string || null,
            expected_delivery: body.expected_delivery as string || null,
            payment_terms: body.payment_terms as string || null,
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockPurchaseRequests[index]);
    }),

    http.post(`${API_URL}/purchase-requests/:id/receive`, async ({ params }) => {
        const id = parseInt(params.id as string);
        const index = mockPurchaseRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        mockPurchaseRequests[index] = {
            ...mockPurchaseRequests[index],
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockPurchaseRequests[index]);
    }),

    http.post(`${API_URL}/purchase-requests/:id/complete`, async ({ params }) => {
        const id = parseInt(params.id as string);
        const index = mockPurchaseRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        mockPurchaseRequests[index] = {
            ...mockPurchaseRequests[index],
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockPurchaseRequests[index]);
    }),

    http.delete(`${API_URL}/purchase-requests/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const index = mockPurchaseRequests.findIndex(r => r.id === id);

        if (index === -1) {
            return HttpResponse.json(
                { detail: 'Purchase request not found' },
                { status: 404 }
            );
        }

        mockPurchaseRequests.splice(index, 1);
        return HttpResponse.json(null, { status: 204 });
    }),

    // ============ CONSULTANTS ============
    http.get(`${API_URL}/consultants`, ({ request }) => {
        const url = new URL(request.url);
        const skip = parseInt(url.searchParams.get('skip') || '0');
        const limit = parseInt(url.searchParams.get('limit') || '20');

        const mockConsultants = [
            {
                id: 1,
                name: 'Carlos Vendedor',
                store_id: 1,
                store_name: 'Toyota Botafogo',
                dealership_id: 1,
                dealership_name: 'Toyota Centro',
                phone: '11987654321',
                email: 'carlos@toyota.com',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 2,
                name: 'Ana Vendedora',
                store_id: 1,
                store_name: 'Toyota Botafogo',
                dealership_id: 1,
                dealership_name: 'Toyota Centro',
                phone: '11976543210',
                email: 'ana@toyota.com',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: 3,
                name: 'Pedro Consultor',
                store_id: 2,
                store_name: 'Toyota Caxias',
                dealership_id: 2,
                dealership_name: 'Toyota Zona Norte',
                phone: '11965432100',
                email: 'pedro@toyota.com',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        return HttpResponse.json({
            items: mockConsultants.slice(skip, skip + limit),
            total: mockConsultants.length,
        });
    }),

    http.get(`${API_URL}/consultants/:id`, ({ params }) => {
        const id = parseInt(params.id as string);

        const mockConsultant = {
            id,
            name: 'Carlos Vendedor',
            store_id: 1,
            store_name: 'Toyota Botafogo',
            dealership_id: 1,
            dealership_name: 'Toyota Centro',
            phone: '11987654321',
            email: 'carlos@toyota.com',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockConsultant);
    }),

    http.post(`${API_URL}/consultants`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;

        const newConsultant = {
            id: 999,
            name: body.name as string,
            store_id: body.store_id as number,
            store_name: 'Toyota Botafogo',
            dealership_id: body.dealership_id as number,
            dealership_name: 'Toyota Centro',
            phone: body.phone as string || null,
            email: body.email as string || null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(newConsultant, { status: 201 });
    }),

    http.patch(`${API_URL}/consultants/:id`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as Record<string, unknown>;

        const updated = {
            id,
            name: body.name as string || 'Carlos Vendedor',
            store_id: body.store_id as number || 1,
            store_name: 'Toyota Botafogo',
            dealership_id: 1,
            dealership_name: 'Toyota Centro',
            phone: body.phone as string || null,
            email: body.email as string || null,
            is_active: body.is_active !== undefined ? body.is_active as boolean : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(updated);
    }),

    http.delete(`${API_URL}/consultants/:id`, () => {
        return HttpResponse.json(null, { status: 204 });
    }),

    // ============ DEALERSHIPS ============
    http.get(`${API_URL}/dealerships`, ({ request }) => {
        const url = new URL(request.url);
        const storeId = url.searchParams.get('store_id');

        const allDealerships = [
            { id: 1, name: 'Toyota Centro', brand: 'Toyota', store_id: 1, store_name: 'Toyota Botafogo', is_active: true, created_at: new Date().toISOString() },
            { id: 2, name: 'Toyota Zona Norte', brand: 'Toyota', store_id: 2, store_name: 'Toyota Caxias', is_active: true, created_at: new Date().toISOString() },
            { id: 3, name: 'BYD Premium', brand: 'BYD', store_id: 4, store_name: 'BYD Botafogo', is_active: true, created_at: new Date().toISOString() },
            { id: 4, name: 'Hyundai Nova Iguaçu', brand: 'Hyundai', store_id: 9, store_name: 'Hyundai Campo Grande', is_active: true, created_at: new Date().toISOString() },
        ];

        const filtered = storeId
            ? allDealerships.filter(d => d.store_id === parseInt(storeId))
            : allDealerships;

        return HttpResponse.json({
            items: filtered,
            total: filtered.length,
        });
    }),

    // ============ USERS ============
    http.get(`${API_URL}/users`, () => {
        return HttpResponse.json({
            items: [mockUser, mockSupervisor, mockOwner],
            total: 3,
        });
    }),

    http.get(`${API_URL}/users/:id`, ({ params }) => {
        const id = parseInt(params.id as string);
        const users = [mockUser, mockSupervisor, mockOwner];
        const user = users.find(u => u.id === id);

        if (!user) {
            return HttpResponse.json(
                { detail: 'User not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json(user);
    }),

    http.post(`${API_URL}/users`, async ({ request }) => {
        const body = await request.json() as Partial<User>;
        const newUser: User = {
            id: 4,
            full_name: body.full_name || '',
            email: body.email || '',
            role: body.role || 'operator',
            is_active: true,
            must_change_password: true,
            store_id: body.store_id || null,
            store_name: body.store_name || null,
            supervised_store_ids: body.supervised_store_ids || [],
            phone: body.phone || null,
            last_login: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(newUser, { status: 201 });
    }),

    http.patch(`${API_URL}/users/:id`, async ({ params, request }) => {
        const id = parseInt(params.id as string);
        const body = await request.json() as Partial<User>;

        return HttpResponse.json({
            ...mockUser,
            id,
            ...body,
            updated_at: new Date().toISOString(),
        });
    }),

    http.delete(`${API_URL}/users/:id`, () => {
        return HttpResponse.json(null, { status: 204 });
    }),

    http.post(`${API_URL}/users/:id/activate`, ({ params }) => {
        const id = parseInt(params.id as string);
        return HttpResponse.json({
            ...mockUser,
            id,
            is_active: true,
            updated_at: new Date().toISOString(),
        });
    }),

    http.post(`${API_URL}/users/:id/reset-password`, () => {
        return HttpResponse.json({
            temporary_password: 'Temp123!@#',
        });
    }),

    // ============ STORES ============
    http.get(`${API_URL}/stores`, () => {
        return HttpResponse.json({
            items: [
                { id: 1, code: 'LJ01', name: 'Toyota Botafogo', is_active: true, store_type: 'dealership', dealership_id: 1 },
                { id: 2, code: 'LJ02', name: 'Toyota Caxias', is_active: true, store_type: 'dealership', dealership_id: 2 },
                { id: 3, code: 'LJ03', name: 'Toyota São João de Meriti', is_active: true, store_type: 'dealership', dealership_id: 1 },
                { id: 4, code: 'LJ04', name: 'BYD Botafogo', is_active: true, store_type: 'dealership', dealership_id: 3 },
                { id: 5, code: 'LJ05', name: 'BYD Barra', is_active: true, store_type: 'dealership', dealership_id: 3 },
                { id: 6, code: 'LJ06', name: 'BYD São Conrado', is_active: true, store_type: 'dealership', dealership_id: 3 },
                { id: 7, code: 'LJ07', name: 'BYD Recreio', is_active: true, store_type: 'dealership', dealership_id: 3 },
                { id: 8, code: 'LJ08', name: 'BYD Nova Iguaçu', is_active: true, store_type: 'dealership', dealership_id: 3 },
                { id: 9, code: 'LJ09', name: 'Hyundai Campo Grande', is_active: true, store_type: 'dealership', dealership_id: 4 },
                { id: 10, code: 'LJ10', name: 'Hyundai Caxias', is_active: true, store_type: 'dealership', dealership_id: 4 },
                { id: 11, code: 'LJ11', name: 'Fiat Nova Iguaçu', is_active: true, store_type: 'dealership', dealership_id: 1 },
                { id: 12, code: 'LJ12', name: 'Fiat Campo Grande', is_active: true, store_type: 'dealership', dealership_id: 1 },
                { id: 13, code: 'WC01', name: 'Wash Center', is_active: true, store_type: 'direct_sales', dealership_id: null },
                { id: 14, code: 'GP01', name: 'Galpão', is_active: true, store_type: 'warehouse', dealership_id: null },
            ],
            total: 14,
        });
    }),
];
