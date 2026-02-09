import type { PurchaseRequest } from '@/types/purchase-requests.types';
import { CheckCircle2, XCircle, Clock, CircleDot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApprovalTimelineProps {
    request: PurchaseRequest;
    className?: string;
}

export function ApprovalTimeline({ request, className }: ApprovalTimelineProps) {
    const steps = [
        {
            id: 'creation',
            label: 'Solicitação Criada',
            date: request.created_at,
            user: request.requester_name,
            status: 'completed' as const,
            notes: null
        },
        {
            id: 'supervisor',
            label: 'Aprovação do Supervisor',
            date: request.supervisor_approval_date,
            user: request.supervisor_approval_name,
            status: request.supervisor_approval_date
                ? 'completed'
                : request.rejection_reason && !request.supervisor_approval_date
                    ? 'rejected'
                    : request.status === 'awaiting_supervisor'
                        ? 'current'
                        : 'pending',
            notes: request.supervisor_notes
        },
        // Only show Owner step if it was required or happened
        ...(request.owner_approval_id || request.total_estimated > 5000 || request.status === 'awaiting_owner'
            ? [{
                id: 'owner',
                label: 'Aprovação do Owner',
                date: request.owner_approval_date,
                user: request.owner_approval_name,
                status: request.owner_approval_date
                    ? 'completed'
                    : request.rejection_reason && !request.owner_approval_date && request.status !== 'awaiting_supervisor'
                        ? 'rejected'
                        : request.status === 'awaiting_owner'
                            ? 'current'
                            : 'pending',
                notes: request.owner_notes
            }]
            : []),
        {
            id: 'completion',
            label: 'Conclusão da Compra',
            date: request.completed_at,
            user: null,
            status: request.completed_at ? 'completed' : 'pending',
            notes: null
        }
    ];

    return (
        <div className={cn("space-y-4", className)}>
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">
                Timeline de Aprovação
            </h3>

            <div className="relative">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative pl-8 pb-8 last:pb-0">
                        {/* Line connecting steps */}
                        {index !== steps.length - 1 && (
                            <div className="absolute left-3 top-3 bottom-0 w-px bg-gray-200" />
                        )}

                        {/* Icon */}
                        <div className={cn(
                            "absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white",
                            step.status === 'completed' && "bg-green-100 text-green-600",
                            step.status === 'rejected' && "bg-red-100 text-red-600",
                            step.status === 'current' && "bg-blue-100 text-blue-600",
                            step.status === 'pending' && "bg-gray-100 text-gray-400"
                        )}>
                            {step.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                            {step.status === 'rejected' && <XCircle className="w-4 h-4" />}
                            {step.status === 'current' && <Clock className="w-4 h-4" />}
                            {step.status === 'pending' && <CircleDot className="w-4 h-4" />}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col">
                            <span className={cn(
                                "font-medium text-sm",
                                step.status === 'completed' && "text-green-700",
                                step.status === 'rejected' && "text-red-700",
                                step.status === 'current' && "text-blue-700",
                                step.status === 'pending' && "text-gray-500"
                            )}>
                                {step.label}
                            </span>

                            {step.date && (
                                <span className="text-xs text-gray-500 mt-0.5">
                                    {new Date(step.date).toLocaleString('pt-BR')}
                                </span>
                            )}

                            {step.user && (
                                <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{step.user}</span>
                                </div>
                            )}

                            {step.notes && (
                                <div className="mt-2 bg-gray-50 p-2 rounded text-sm text-gray-600 border border-gray-100 italic">
                                    "{step.notes}"
                                </div>
                            )}

                            {step.id === 'supervisor' && request.rejection_reason && !request.supervisor_approval_date && (
                                <div className="mt-2 bg-red-50 p-2 rounded text-sm text-red-600 border border-red-100">
                                    Motivo: {request.rejection_reason}
                                </div>
                            )}

                            {step.id === 'owner' && request.rejection_reason && !request.owner_approval_date && request.status !== 'awaiting_supervisor' && (
                                <div className="mt-2 bg-red-50 p-2 rounded text-sm text-red-600 border border-red-100">
                                    Motivo: {request.rejection_reason}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
