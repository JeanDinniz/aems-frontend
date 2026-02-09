export type UserRole = 'owner' | 'supervisor' | 'operator';

export type UserStatus = 'active' | 'inactive';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    phone?: string;
    avatar?: string;

    // Lojas
    storeId?: number;              // Loja principal (operator)
    storeName?: string;
    supervisedStoreIds?: number[]; // Lojas supervisionadas (supervisor)
    supervisedStoreNames?: string[];

    // Metadados
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    createdBy?: string;            // Nome do owner que criou

    // Flags
    active: boolean;
    mustChangePassword: boolean;   // Primeira senha temporária
}

export interface CreateUserPayload {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    storeId?: number;              // Para operator
    supervisedStoreIds?: number[]; // Para supervisor
    sendWelcomeEmail?: boolean;
}

export interface UpdateUserPayload {
    name?: string;
    phone?: string;
    role?: UserRole;
    status?: UserStatus;
    storeId?: number;
    supervisedStoreIds?: number[];
}

export interface UserFilters {
    role?: UserRole;
    status?: UserStatus;
    storeId?: number;
    search?: string;               // Nome ou email
}

export interface UsersListResponse {
    users: User[];
    total: number;
    page: number;
    pageSize: number;
}
