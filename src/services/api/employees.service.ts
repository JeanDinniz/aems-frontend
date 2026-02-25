import { apiClient } from './client';
import type {
    Employee,
    CreateEmployeePayload,
    UpdateEmployeePayload,
    EmployeeFilters,
    EmployeesListResponse,
} from '@/types/employee.types';

export const employeesService = {
    async list(filters?: EmployeeFilters, page = 1, pageSize = 20): Promise<EmployeesListResponse> {
        const params = new URLSearchParams();
        if (filters?.store_id) params.append('store_id', filters.store_id.toString());
        if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.department) params.append('department', filters.department);
        params.append('skip', ((page - 1) * pageSize).toString());
        params.append('limit', pageSize.toString());

        const response = await apiClient.get<{ items: Employee[]; pagination: { total: number } }>(
            `/employees?${params.toString()}`
        );
        return {
            employees: response.data.items,
            total: response.data.pagination.total,
            page,
            pageSize,
        };
    },

    async listByStore(storeId: number): Promise<Employee[]> {
        const response = await apiClient.get<{ items: Employee[]; pagination: { total: number } }>(
            `/employees?store_id=${storeId}&is_active=true&limit=200`
        );
        return response.data.items;
    },

    async listByStoreAndDepartment(storeId: number, department?: string): Promise<Employee[]> {
        const params = new URLSearchParams();
        params.append('store_id', storeId.toString());
        params.append('is_active', 'true');
        params.append('limit', '200');
        if (department) params.append('department', department);
        const response = await apiClient.get<{ items: Employee[]; pagination: { total: number } }>(
            `/employees?${params.toString()}`
        );
        return response.data.items;
    },

    async create(payload: CreateEmployeePayload): Promise<Employee> {
        const response = await apiClient.post<Employee>('/employees', payload);
        return response.data;
    },

    async update(id: number, payload: UpdateEmployeePayload): Promise<Employee> {
        const response = await apiClient.patch<Employee>(`/employees/${id}`, payload);
        return response.data;
    },

    async deactivate(id: number): Promise<Employee> {
        const response = await apiClient.delete<Employee>(`/employees/${id}`);
        return response.data;
    },

    async activate(id: number): Promise<Employee> {
        const response = await apiClient.patch<Employee>(`/employees/${id}`, { is_active: true });
        return response.data;
    },
};
