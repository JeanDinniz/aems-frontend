/**
 * Tests for Purchase Requests Service
 *
 * Tests CRUD operations, approval workflows, receiving goods,
 * and filtering for purchase requests.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { purchaseRequestsService } from '../purchase-requests.service';
import apiClient from '../client';

describe('purchaseRequestsService', () => {
    beforeEach(() => {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    });

    describe('getAll', () => {
        it('should fetch paginated purchase requests without filters', async () => {
            const response = await purchaseRequestsService.getAll(undefined, 0, 50);

            expect(response).toHaveProperty('items');
            expect(response).toHaveProperty('total');
            expect(Array.isArray(response.items)).toBe(true);
            expect(typeof response.total).toBe('number');
        });

        it('should apply pagination parameters', async () => {
            const response = await purchaseRequestsService.getAll(undefined, 0, 10);

            expect(response.items.length).toBeLessThanOrEqual(10);
        });

        it('should filter by status', async () => {
            const filters = { status: 'awaiting_supervisor' as const };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should filter by category', async () => {
            const filters = { category: 'film' as const };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should filter by urgency', async () => {
            const filters = { urgency: 'urgent' as const };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should filter by store ID', async () => {
            const filters = { store_id: 1 };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response.items).toBeDefined();
            response.items.forEach(request => {
                expect(request.store_id).toBe(1);
            });
        });

        it('should filter by requester ID', async () => {
            const filters = { requester_id: 1 };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should filter by date range', async () => {
            const filters = {
                start_date: '2026-02-01',
                end_date: '2026-02-11',
            };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response.items).toBeDefined();
            expect(response.total).toBeGreaterThanOrEqual(0);
        });

        it('should combine multiple filters', async () => {
            const filters = {
                status: 'awaiting_supervisor' as const,
                category: 'film' as const,
                urgency: 'normal' as const,
                store_id: 1,
            };
            const response = await purchaseRequestsService.getAll(filters);

            expect(response).toHaveProperty('items');
            expect(response).toHaveProperty('total');
        });
    });

    describe('getById', () => {
        it('should fetch a purchase request by ID', async () => {
            const request = await purchaseRequestsService.getById(1);

            expect(request).toBeDefined();
            expect(request.id).toBe(1);
            expect(request.request_number).toBe('PR-2602-001');
        });

        it('should throw error for non-existent ID', async () => {
            await expect(purchaseRequestsService.getById(99999)).rejects.toThrow();
        });

        it('should return complete purchase request data', async () => {
            const request = await purchaseRequestsService.getById(1);

            expect(request).toHaveProperty('id');
            expect(request).toHaveProperty('store_id');
            expect(request).toHaveProperty('requester_id');
            expect(request).toHaveProperty('category');
            expect(request).toHaveProperty('items');
            expect(request).toHaveProperty('justification');
            expect(request).toHaveProperty('total_estimated');
            expect(request).toHaveProperty('urgency');
            expect(request).toHaveProperty('status');
            expect(request).toHaveProperty('created_at');
        });
    });

    describe('create', () => {
        it('should create a new purchase request', async () => {
            const newRequestData = {
                store_id: 1,
                category: 'workshop' as const,
                items: [
                    {
                        product_name: 'Cera Premium',
                        quantity: 5,
                        unit: 'un',
                        estimated_price: 100,
                    },
                ],
                justification: 'Necessário para serviços de estética',
                urgency: 'normal' as const,
            };

            const createdRequest = await purchaseRequestsService.create(
                newRequestData
            );

            expect(createdRequest).toBeDefined();
            expect(createdRequest.category).toBe('aesthetic');
            expect(createdRequest.status).toBe('awaiting_supervisor');
        });

        it('should set initial status to awaiting_supervisor', async () => {
            const newRequestData = {
                store_id: 1,
                category: 'uniforms' as const,
                items: [
                    {
                        product_name: 'Uniformes',
                        quantity: 10,
                        unit: 'pc',
                        estimated_price: 50,
                    },
                ],
                justification: 'Novos uniformes para equipe',
                urgency: 'normal' as const,
            };

            const request = await purchaseRequestsService.create(newRequestData);
            expect(request.status).toBe('awaiting_supervisor');
        });

        it('should accept all urgency levels', async () => {
            const urgencyLevels: Array<'normal' | 'urgent' | 'critical'> = [
                'normal',
                'urgent',
                'critical',
            ];

            for (const urgency of urgencyLevels) {
                const newRequestData = {
                    store_id: 1,
                    category: 'film' as const,
                    items: [
                        {
                            product_name: `Test ${urgency}`,
                            quantity: 1,
                            unit: 'un',
                            estimated_price: 10,
                        },
                    ],
                    justification: 'Test',
                    urgency,
                };

                const request = await purchaseRequestsService.create(newRequestData);
                expect(request.urgency).toBe(urgency);
            }
        });
    });

    describe('supervisorApproval', () => {
        it('should approve a purchase request', async () => {
            const action = {
                approved: true,
                notes: 'Aprovado',
            };

            const updatedRequest = await purchaseRequestsService.supervisorApproval(
                1,
                action
            );

            expect(updatedRequest).toBeDefined();
            expect(updatedRequest.status).toBe('awaiting_owner');
            expect(updatedRequest.supervisor_approval_date).toBeDefined();
            expect(updatedRequest.supervisor_approval_id).toBe(2);
        });

        it('should reject a purchase request', async () => {
            const action = {
                approved: false,
                notes: 'Não é necessário no momento',
            };

            const updatedRequest = await purchaseRequestsService.supervisorApproval(
                1,
                action
            );

            expect(updatedRequest.status).toBe('rejected');
            expect(updatedRequest.rejection_reason).toBe(
                'Não é necessário no momento'
            );
        });

        it('should record approval timestamp and approver', async () => {
            const action = {
                approved: true,
                notes: 'OK',
            };

            const updatedRequest = await purchaseRequestsService.supervisorApproval(
                1,
                action
            );

            expect(updatedRequest.supervisor_approval_date).toBeDefined();
            expect(updatedRequest.supervisor_approval_id).toBeDefined();
            expect(typeof updatedRequest.supervisor_approval_id).toBe('number');
        });

        it('should throw error for non-existent ID', async () => {
            await expect(
                purchaseRequestsService.supervisorApproval(99999, {
                    approved: true,
                })
            ).rejects.toThrow();
        });
    });

    describe('ownerApproval', () => {
        it('should approve a purchase request as owner', async () => {
            const action = {
                approved: true,
                notes: 'Aprovado pelo proprietário',
            };

            const updatedRequest = await purchaseRequestsService.ownerApproval(
                2,
                action
            );

            expect(updatedRequest).toBeDefined();
            expect(updatedRequest.status).toBe('approved');
            expect(updatedRequest.owner_approval_date).toBeDefined();
            expect(updatedRequest.owner_approval_id).toBe(3);
        });

        it('should reject a purchase request as owner', async () => {
            const action = {
                approved: false,
                notes: 'Valor muito alto',
            };

            const updatedRequest = await purchaseRequestsService.ownerApproval(
                2,
                action
            );

            expect(updatedRequest.status).toBe('rejected');
            expect(updatedRequest.rejection_reason).toBe('Valor muito alto');
        });

        it('should record owner approval data', async () => {
            const action = {
                approved: true,
            };

            const updatedRequest = await purchaseRequestsService.ownerApproval(
                2,
                action
            );

            expect(updatedRequest.owner_approval_date).toBeDefined();
            expect(updatedRequest.owner_approval_id).toBe(3);
        });
    });

    describe('markOrdered', () => {
        it('should mark request as ordered with supplier info', async () => {
            const orderData = {
                supplier_name: 'Fornecedor ABC',
                expected_delivery: '2026-02-20',
                order_date: '2026-02-11',
                payment_terms: '30 dias',
            };

            const updatedRequest = await purchaseRequestsService.markOrdered(
                2,
                orderData
            );

            expect(updatedRequest).toBeDefined();
            expect(updatedRequest.status).toBe('ordered');
            expect(updatedRequest.order_date).toBeDefined();
        });

        it('should accept minimum required fields', async () => {
            const orderData = {
                supplier_name: 'Fornecedor XYZ',
                expected_delivery: '2026-02-25',
            };

            const updatedRequest = await purchaseRequestsService.markOrdered(
                2,
                orderData
            );

            expect(updatedRequest.status).toBe('ordered');
        });

        it('should throw error for non-existent ID', async () => {
            await expect(
                purchaseRequestsService.markOrdered(99999, {
                    supplier_name: 'Test',
                    expected_delivery: '2026-03-01',
                })
            ).rejects.toThrow();
        });
    });

    describe('receiveGoods', () => {
        it('should mark goods as received', async () => {
            const receiveData = {
                items: [
                    {
                        item_id: 1,
                        quantity_received: 5,
                        notes: 'Recebido em perfeito estado',
                    },
                ],
            };

            const updatedRequest = await purchaseRequestsService.receiveGoods(
                2,
                receiveData
            );

            expect(updatedRequest).toBeDefined();
            expect(updatedRequest.status).toBe('completed');
        });

        it('should record receive timestamp', async () => {
            const receiveData = {
                items: [
                    {
                        item_id: 1,
                        quantity_received: 10,
                    },
                ],
            };

            const updatedRequest = await purchaseRequestsService.receiveGoods(
                2,
                receiveData
            );

            expect(updatedRequest.completed_at).toBeDefined();
            if (updatedRequest.completed_at) {
                expect(new Date(updatedRequest.completed_at).getTime()).toBeLessThanOrEqual(
                    Date.now()
                );
            }
        });
    });

    describe('markCompleted', () => {
        it('should mark request as completed', async () => {
            const updatedRequest = await purchaseRequestsService.markCompleted(2);

            expect(updatedRequest).toBeDefined();
            expect(updatedRequest.status).toBe('completed');
            expect(updatedRequest.completed_at).toBeDefined();
        });

        it('should accept optional completion notes', async () => {
            const notes = 'Processo concluído com sucesso';
            const updatedRequest = await purchaseRequestsService.markCompleted(
                2,
                notes
            );

            expect(updatedRequest.status).toBe('completed');
        });

        it('should record completion timestamp', async () => {
            const updatedRequest = await purchaseRequestsService.markCompleted(2);

            expect(updatedRequest.completed_at).toBeDefined();
            if (updatedRequest.completed_at) {
                expect(new Date(updatedRequest.completed_at).getTime()).toBeLessThanOrEqual(
                    Date.now()
                );
            }
        });
    });

    describe('delete', () => {
        it('should delete a purchase request', async () => {
            await expect(purchaseRequestsService.delete(1)).resolves.not.toThrow();
        });

        it('should throw error for non-existent ID', async () => {
            await expect(purchaseRequestsService.delete(99999)).rejects.toThrow();
        });
    });

    describe('getStats', () => {
        it('should fetch purchase request statistics', async () => {
            const stats = await purchaseRequestsService.getStats();

            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('pending');
            expect(stats).toHaveProperty('approved');
            expect(stats).toHaveProperty('rejected');
        });

        it('should return numeric statistics', async () => {
            const stats = await purchaseRequestsService.getStats();

            expect(typeof stats.total).toBe('number');
            expect(typeof stats.pending).toBe('number');
            expect(typeof stats.approved).toBe('number');
            expect(typeof stats.rejected).toBe('number');
        });

        it('should have consistent statistics', async () => {
            const stats = await purchaseRequestsService.getStats();

            expect(stats.total).toBeGreaterThanOrEqual(0);
            expect(stats.pending).toBeGreaterThanOrEqual(0);
            expect(stats.approved).toBeGreaterThanOrEqual(0);
            expect(stats.rejected).toBeGreaterThanOrEqual(0);
        });
    });

    describe('approval workflow', () => {
        it('should follow correct status progression', async () => {
            // Create -> awaiting_supervisor
            const newRequest = await purchaseRequestsService.create({
                store_id: 1,
                category: 'film' as const,
                items: [
                    {
                        product_name: 'Test',
                        quantity: 1,
                        unit: 'un',
                        estimated_price: 10,
                    },
                ],
                justification: 'Test',
                urgency: 'normal' as const,
            });
            expect(newRequest.status).toBe('awaiting_supervisor');

            // Supervisor approves -> awaiting_owner
            const supervisorApproved =
                await purchaseRequestsService.supervisorApproval(newRequest.id, {
                    approved: true,
                });
            expect(supervisorApproved.status).toBe('awaiting_owner');

            // Owner approves -> approved
            const ownerApproved = await purchaseRequestsService.ownerApproval(
                newRequest.id,
                { approved: true }
            );
            expect(ownerApproved.status).toBe('approved');

            // Mark ordered -> ordered
            const ordered = await purchaseRequestsService.markOrdered(
                newRequest.id,
                {
                    supplier_name: 'Supplier',
                    expected_delivery: '2026-03-01',
                }
            );
            expect(ordered.status).toBe('ordered');

            // Receive goods -> completed
            const received = await purchaseRequestsService.receiveGoods(
                newRequest.id,
                {
                    items: [
                        {
                            item_id: 1,
                            quantity_received: 1,
                        },
                    ],
                }
            );
            expect(received.status).toBe('completed');

            // Complete -> completed
            const completed = await purchaseRequestsService.markCompleted(
                newRequest.id
            );
            expect(completed.status).toBe('completed');
        });

        it('should handle rejection at supervisor level', async () => {
            const newRequest = await purchaseRequestsService.create({
                store_id: 1,
                category: 'workshop' as const,
                items: [
                    {
                        product_name: 'Test Rejection',
                        quantity: 1,
                        unit: 'un',
                        estimated_price: 10,
                    },
                ],
                justification: 'Test',
                urgency: 'normal' as const,
            });

            const rejected = await purchaseRequestsService.supervisorApproval(
                newRequest.id,
                {
                    approved: false,
                    notes: 'Not needed',
                }
            );

            expect(rejected.status).toBe('rejected');
        });

        it('should handle rejection at owner level', async () => {
            const approved = await purchaseRequestsService.supervisorApproval(2, {
                approved: true,
            });

            const rejected = await purchaseRequestsService.ownerApproval(
                approved.id,
                {
                    approved: false,
                    notes: 'Budget constraints',
                }
            );

            expect(rejected.status).toBe('rejected');
        });
    });

    describe('business rules', () => {
        it('should have valid category values', async () => {
            const response = await purchaseRequestsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const request = response.items[0];

            expect(['film', 'aesthetic', 'equipment', 'uniforms', 'other']).toContain(
                request.category
            );
        });

        it('should have valid urgency values', async () => {
            const response = await purchaseRequestsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const request = response.items[0];

            expect(['normal', 'urgent', 'critical']).toContain(request.urgency);
        });

        it('should have valid status values', async () => {
            const response = await purchaseRequestsService.getAll();

            const validStatuses = [
                'pending',
                'awaiting_supervisor',
                'awaiting_owner',
                'approved',
                'ordered',
                'rejected',
                'completed',
            ];

            response.items.forEach(request => {
                expect(validStatuses).toContain(request.status);
            });
        });

        it('should require positive quantity', async () => {
            const newRequest = await purchaseRequestsService.create({
                store_id: 1,
                category: 'film' as const,
                items: [
                    {
                        product_name: 'Test',
                        quantity: 5,
                        unit: 'un',
                        estimated_price: 10,
                    },
                ],
                justification: 'Test',
                urgency: 'normal' as const,
            });

            expect(newRequest.total_estimated).toBeGreaterThan(0);
        });
    });

    describe('data integrity', () => {
        it('should include timestamps in created requests', async () => {
            const newRequest = await purchaseRequestsService.create({
                store_id: 1,
                category: 'film' as const,
                items: [
                    {
                        product_name: 'Test Request',
                        quantity: 1,
                        unit: 'un',
                        estimated_price: 10,
                    },
                ],
                justification: 'Test',
                urgency: 'normal' as const,
            });

            expect(newRequest.created_at).toBeDefined();
            expect(newRequest.updated_at).toBeDefined();
            expect(new Date(newRequest.created_at).getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it('should preserve requester information', async () => {
            const response = await purchaseRequestsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const request = response.items[0];

            expect(request.requester_id).toBeDefined();
            expect(request.requester_name).toBeDefined();
            expect(typeof request.requester_id).toBe('number');
            expect(typeof request.requester_name).toBe('string');
        });

        it('should maintain store association', async () => {
            const response = await purchaseRequestsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const request = response.items[0];

            expect(request.store_id).toBeDefined();
            expect(request.store_name).toBeDefined();
            expect(typeof request.store_id).toBe('number');
            expect(typeof request.store_name).toBe('string');
        });
    });
});
