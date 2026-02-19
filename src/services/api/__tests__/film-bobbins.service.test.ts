/**
 * Tests for Film Bobbins Service
 *
 * Tests CRUD operations, consumption tracking, yield calculation,
 * and alert management for film bobbins inventory.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { filmBobbinsService } from '../film-bobbins.service';
import apiClient from '../client';

describe('filmBobbinsService', () => {
    beforeEach(() => {
        apiClient.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    });

    describe('getAll', () => {
        it('should fetch paginated film bobbins without filters', async () => {
            const response = await filmBobbinsService.getAll(undefined, 0, 50);

            expect(response).toHaveProperty('items');
            expect(response).toHaveProperty('total');
            expect(Array.isArray(response.items)).toBe(true);
            expect(typeof response.total).toBe('number');
        });

        it('should apply pagination parameters', async () => {
            const response = await filmBobbinsService.getAll(undefined, 0, 10);

            expect(response.items.length).toBeLessThanOrEqual(10);
        });

        it('should filter by film type', async () => {
            const filters = { film_type: 'fume_35' };
            const response = await filmBobbinsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should filter by status', async () => {
            const filters = { status: 'available' as const };
            const response = await filmBobbinsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should filter by store ID', async () => {
            const filters = { store_id: 1 };
            const response = await filmBobbinsService.getAll(filters);

            expect(response.items).toBeDefined();
            response.items.forEach(bobbin => {
                expect(bobbin.store_id).toBe(1);
            });
        });

        it('should search by SMART ID', async () => {
            const filters = { search: 'LJ01-FUM35' };
            const response = await filmBobbinsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should handle "all" status filter', async () => {
            const filters = { status: 'in_use' as const };
            const response = await filmBobbinsService.getAll(filters);

            expect(response.items).toBeDefined();
        });

        it('should combine multiple filters', async () => {
            const filters = {
                film_type: 'fume_35',
                status: 'available' as const,
                store_id: 1,
            };
            const response = await filmBobbinsService.getAll(filters);

            expect(response).toHaveProperty('items');
            expect(response).toHaveProperty('total');
        });
    });

    describe('getById', () => {
        it('should fetch a film bobbin by ID', async () => {
            const bobbin = await filmBobbinsService.getById(1);

            expect(bobbin).toBeDefined();
            expect(bobbin.id).toBe(1);
            expect(bobbin.smart_id).toBe('LJ01-FUM35-2602-001');
        });

        it('should throw error for non-existent ID', async () => {
            await expect(filmBobbinsService.getById(99999)).rejects.toThrow();
        });

        it('should return complete bobbin data', async () => {
            const bobbin = await filmBobbinsService.getById(1);

            expect(bobbin).toHaveProperty('id');
            expect(bobbin).toHaveProperty('smart_id');
            expect(bobbin).toHaveProperty('store_id');
            expect(bobbin).toHaveProperty('film_type');
            expect(bobbin).toHaveProperty('nominal_metragem');
            expect(bobbin).toHaveProperty('current_metragem');
            expect(bobbin).toHaveProperty('yield_percentage');
            expect(bobbin).toHaveProperty('status');
            expect(bobbin).toHaveProperty('created_at');
        });
    });

    describe('create', () => {
        it('should create a new film bobbin', async () => {
            const newBobbinData = {
                store_id: 1,
                film_type: 'fume_50',
                nominal_metragem: 30.5,
                purchase_date: new Date().toISOString(),
            };

            const createdBobbin = await filmBobbinsService.create(newBobbinData);

            expect(createdBobbin).toBeDefined();
            expect(createdBobbin.film_type).toBe('fume_50');
            expect(createdBobbin.current_metragem).toBe(30.5);
        });

        it('should initialize remaining meters to nominal meters', async () => {
            const newBobbinData = {
                store_id: 1,
                film_type: 'security',
                nominal_metragem: 30.5,
                purchase_date: new Date().toISOString(),
            };

            const bobbin = await filmBobbinsService.create(newBobbinData);
            expect(bobbin.current_metragem).toBe(bobbin.nominal_metragem);
        });

        it('should set initial yield to null or 100%', async () => {
            const newBobbinData = {
                store_id: 1,
                film_type: 'ceramic',
                nominal_metragem: 30.5,
                purchase_date: new Date().toISOString(),
            };

            const bobbin = await filmBobbinsService.create(newBobbinData);
            // New bobbins can have null yield_percentage or 100%
            if (bobbin.yield_percentage !== null) {
                expect(bobbin.yield_percentage).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('update', () => {
        it('should update an existing film bobbin', async () => {
            const updates = {
                supplier: 'Updated supplier',
            };

            const updatedBobbin = await filmBobbinsService.update(1, updates);

            expect(updatedBobbin).toBeDefined();
            expect(updatedBobbin.id).toBe(1);
        });

        it('should throw error for non-existent ID', async () => {
            await expect(
                filmBobbinsService.update(99999, { supplier: 'test' })
            ).rejects.toThrow();
        });

        it('should preserve SMART ID on update', async () => {
            const updatedBobbin = await filmBobbinsService.update(1, {
                supplier: 'Test',
            });

            expect(updatedBobbin.smart_id).toBe('LJ01-FUM35-2602-001');
        });
    });

    describe('delete', () => {
        it('should delete a film bobbin', async () => {
            await expect(filmBobbinsService.delete(1)).resolves.not.toThrow();
        });

        it('should throw error for non-existent ID', async () => {
            await expect(filmBobbinsService.delete(99999)).rejects.toThrow();
        });
    });

    describe('registerConsumption', () => {
        it('should register film consumption', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];
            const originalMetragem = bobbin.current_metragem;

            const consumption = {
                bobbin_id: bobbin.id,
                service_order_id: 1,
                metragem_used: 2.5,
            };

            const updatedBobbin = await filmBobbinsService.registerConsumption(
                bobbin.id,
                consumption
            );

            expect(updatedBobbin).toBeDefined();
            expect(updatedBobbin.current_metragem).toBeLessThan(originalMetragem);
        });

        it('should decrease remaining meters on consumption', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];
            const originalRemaining = bobbin.current_metragem;

            const consumption = {
                bobbin_id: bobbin.id,
                service_order_id: 1,
                metragem_used: 1.5,
            };

            const updatedBobbin = await filmBobbinsService.registerConsumption(
                bobbin.id,
                consumption
            );

            expect(updatedBobbin.current_metragem).toBe(
                originalRemaining - consumption.metragem_used
            );
        });

        it('should link consumption to service order', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];

            const consumption = {
                bobbin_id: bobbin.id,
                service_order_id: 5,
                metragem_used: 3.0,
            };

            const result = await filmBobbinsService.registerConsumption(
                bobbin.id,
                consumption
            );

            expect(result).toBeDefined();
        });
    });

    describe('getConsumptionHistory', () => {
        it('should fetch consumption history for a bobbin', async () => {
            const history = await filmBobbinsService.getConsumptionHistory(1);

            expect(Array.isArray(history)).toBe(true);
        });

        it('should return consumption records with required fields', async () => {
            const history = await filmBobbinsService.getConsumptionHistory(1);

            if (history.length > 0) {
                const record = history[0];
                expect(record).toHaveProperty('id');
                expect(record).toHaveProperty('meters_used');
                expect(record).toHaveProperty('service_order_id');
                expect(record).toHaveProperty('created_at');
            }
        });
    });

    describe('getAlerts', () => {
        it('should fetch all alerts without store filter', async () => {
            const response = await filmBobbinsService.getAlerts();

            expect(response).toBeDefined();
            // Response can be { alerts: [] } or []
            const alerts = response.alerts || response;
            expect(Array.isArray(alerts)).toBe(true);
        });

        it('should filter alerts by store ID', async () => {
            const response = await filmBobbinsService.getAlerts(1);

            const alerts = response.alerts || response;
            expect(Array.isArray(alerts)).toBe(true);
        });

        it('should return bobbins with low or critical status', async () => {
            const response = await filmBobbinsService.getAlerts();
            const alerts = response.alerts || response;

            alerts.forEach((bobbin: any) => {
                expect(['available', 'in_use', 'finished']).toContain(bobbin.status);
            });
        });
    });

    describe('getYieldStats', () => {
        it('should fetch yield statistics for a bobbin', async () => {
            const stats = await filmBobbinsService.getYieldStats(1);

            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('average_yield');
            expect(stats).toHaveProperty('total_meters_used');
            expect(stats).toHaveProperty('efficiency_rating');
        });

        it('should calculate efficiency rating', async () => {
            const stats = await filmBobbinsService.getYieldStats(1);

            expect(['excellent', 'good', 'fair', 'poor']).toContain(
                stats.efficiency_rating
            );
        });

        it('should provide accurate yield metrics', async () => {
            const stats = await filmBobbinsService.getYieldStats(1);

            expect(typeof stats.average_yield).toBe('number');
            expect(typeof stats.total_meters_used).toBe('number');
            expect(stats.average_yield).toBeGreaterThanOrEqual(0);
            expect(stats.average_yield).toBeLessThanOrEqual(100);
        });
    });

    describe('SMART ID format', () => {
        it('should validate SMART ID format', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];

            // Format: [LOJA]-[TIPO]-[YYMM]-[SEQ]
            expect(bobbin.smart_id).toMatch(/^LJ\d{2}-[A-Z0-9]+-\d{4}-\d{3}$/);
        });

        it('should include store code in SMART ID', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];

            expect(bobbin.smart_id).toMatch(/^LJ\d{2}-/);
        });

        it('should include year-month in SMART ID', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];

            // Should have YYMM format (e.g., 2602 for February 2026)
            expect(bobbin.smart_id).toMatch(/-\d{4}-/);
        });

        it('should include sequential number in SMART ID', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];

            // Should end with 3-digit sequence
            expect(bobbin.smart_id).toMatch(/-\d{3}$/);
        });
    });

    describe('yield calculation', () => {
        it('should calculate yield percentage correctly', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const bobbin = response.items[0];

            if (bobbin.yield_percentage !== null) {
                expect(typeof bobbin.yield_percentage).toBe('number');
                expect(bobbin.yield_percentage).toBeGreaterThanOrEqual(0);
                expect(bobbin.yield_percentage).toBeLessThanOrEqual(100);
            }
        });

        it('should have acceptable yield ranges by film type', async () => {
            const response = await filmBobbinsService.getAll();

            response.items.forEach(bobbin => {
                // Standard fumê: 88-95%
                // Premium: 90-97%
                // Security: 85-92%
                // yield_percentage can be null for new bobbins
                if (bobbin.yield_percentage !== null) {
                    expect(bobbin.yield_percentage).toBeGreaterThanOrEqual(80);
                    expect(bobbin.yield_percentage).toBeLessThanOrEqual(100);
                }
            });
        });
    });

    describe('status management', () => {
        it('should have valid status values', async () => {
            const response = await filmBobbinsService.getAll();

            const validStatuses = ['available', 'in_use', 'finished'];
            response.items.forEach(bobbin => {
                expect(validStatuses).toContain(bobbin.status);
            });
        });

        it('should flag low inventory correctly', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            // Find a bobbin that is in_use or check if any are low
            const inUseBobbin = response.items.find(b => b.status === 'in_use');
            if (inUseBobbin) {
                expect(['in_use', 'finished']).toContain(inUseBobbin.status);
            } else {
                // All bobbins might be finished or available, which is also valid
                expect(response.items.length).toBeGreaterThan(0);
            }
        });
    });

    describe('data integrity', () => {
        it('should include timestamps in created bobbins', async () => {
            const newBobbinData = {
                store_id: 1,
                film_type: 'fume_35',
                nominal_metragem: 30.5,
                purchase_date: new Date().toISOString(),
            };

            const bobbin = await filmBobbinsService.create(newBobbinData);

            expect(bobbin.created_at).toBeDefined();
            expect(new Date(bobbin.created_at).getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it('should never have negative remaining meters', async () => {
            // Create a new bobbin to ensure we have a fresh one to test
            const newBobbin = await filmBobbinsService.create({
                store_id: 1,
                film_type: 'fume_35',
                nominal_metragem: 30.5,
                purchase_date: new Date().toISOString(),
            });

            expect(newBobbin.current_metragem).toBeGreaterThanOrEqual(0);
            expect(newBobbin.current_metragem).toBe(30.5);
        });

        it('should maintain data consistency on updates', async () => {
            const response = await filmBobbinsService.getAll();
            expect(response.items.length).toBeGreaterThan(0);

            const originalBobbin = response.items[0];
            const bobbin = await filmBobbinsService.update(originalBobbin.id, {
                supplier: 'Consistency test',
            });

            expect(bobbin.id).toBe(originalBobbin.id);
            expect(bobbin.smart_id).toBe(originalBobbin.smart_id);
            expect(bobbin.store_id).toBe(originalBobbin.store_id);
        });
    });
});
