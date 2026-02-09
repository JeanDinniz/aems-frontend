export type PurchaseRequestStatus =
    | 'pending'              // Aguardando supervisor
    | 'awaiting_supervisor'  // Aguardando aprovação supervisor
    | 'awaiting_owner'       // Aguardando aprovação owner
    | 'approved'             // Aprovado
    | 'ordered'              // Pedido Realizado
    | 'rejected'             // Rejeitado
    | 'completed';           // Compra realizada e recebida

export type PurchaseCategory =
    | 'film'        // Película
    | 'aesthetic'   // Estética
    | 'equipment'   // Máquinas
    | 'uniforms'    // Uniformes
    | 'other';      // Outros

export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

export interface PurchaseRequestItem {
    id?: number;
    product_name: string;
    quantity: number;
    unit: string;
    estimated_price: number;
    supplier?: string;
    notes?: string;
    quantity_approved?: number;
    quantity_received?: number;
}

export interface ReceiveGoodsData {
    items: Array<{
        item_id: number;
        quantity_received: number;
        notes?: string;
    }>;
    received_by_notes?: string;
    invoice_number?: string;
}

export interface PurchaseRequest {
    id: number;
    request_number: string;

    // Solicitante
    requester_id: number;
    requester_name: string;
    store_id: number;
    store_name: string;

    // Detalhes
    category: PurchaseCategory;
    urgency: UrgencyLevel;
    items: PurchaseRequestItem[];
    total_estimated: number;
    justification: string;

    // Workflow
    status: PurchaseRequestStatus;
    supervisor_approval_id: number | null;
    supervisor_approval_name: string | null;
    supervisor_approval_date: string | null;
    supervisor_notes: string | null;

    owner_approval_id: number | null;
    owner_approval_name: string | null;
    owner_approval_date: string | null;
    owner_notes: string | null;

    rejection_reason: string | null;

    // Dados do pedido formalizado
    supplier_name: string | null;
    order_date: string | null;
    expected_delivery: string | null;
    payment_terms: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

export interface CreatePurchaseRequestData {
    category: PurchaseCategory;
    urgency: UrgencyLevel;
    items: Omit<PurchaseRequestItem, 'id'>[];
    justification: string;
    store_id?: number;
}

export interface ApprovalAction {
    approved: boolean;
    notes?: string;
    rejection_reason?: string;
}

export interface PurchaseRequestFilters {
    status?: PurchaseRequestStatus;
    category?: PurchaseCategory;
    urgency?: UrgencyLevel;
    store_id?: number;
    requester_id?: number;
    start_date?: string;
    end_date?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'partial';

export interface Approval {
    id: number;
    purchaseRequestId: number;
    approvedBy: string;
    approvedAt: string;
    status: ApprovalStatus;
    notes?: string;
    approvedItems?: number[];
}

export interface ApprovalStats {
    totalPending: number;
    totalValue: number;
    urgentCount: number;
    approvalRate: number;
}

export interface PendingApprovalFilters {
    storeId?: number;
    urgency?: 'normal' | 'urgent' | 'critical';
    category?: string;
    dateFrom?: string;
    dateTo?: string;
}

export const CATEGORY_LABELS = {
    film: 'Película',
    aesthetic: 'Estética',
    equipment: 'Máquinas e Equipamentos',
    uniforms: 'Uniformes e EPIs',
    other: 'Outros'
} as const;

export const URGENCY_LABELS = {
    normal: 'Normal',
    urgent: 'Urgente',
    critical: 'Crítico'
} as const;

export const STATUS_LABELS = {
    pending: 'Pendente',
    awaiting_supervisor: 'Aguardando Supervisor',
    awaiting_owner: 'Aguardando Owner',
    approved: 'Aprovado',
    ordered: 'Pedido Realizado',
    rejected: 'Rejeitado',
    completed: 'Concluído'
} as const;
