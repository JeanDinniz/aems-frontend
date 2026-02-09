import { Badge } from '@/components/ui/badge';
import type { PurchaseRequestStatus } from '@/types/purchase-requests.types';
import { STATUS_LABELS } from '@/types/purchase-requests.types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: PurchaseRequestStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    // Explicit coloring classes since standard badge might not have all variants
    const getColorClass = (status: PurchaseRequestStatus) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200';
            case 'completed':
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200';
            case 'rejected':
                return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
            case 'ordered':
                return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
            case 'pending':
                return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100'; // Adjusted pending to be lighter blue to differentiate from ordered
            case 'awaiting_supervisor':
            case 'awaiting_owner':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200';
            default:
                return '';
        }
    };

    return (
        <Badge
            variant="outline"
            className={cn(getColorClass(status), className)}
        >
            {STATUS_LABELS[status]}
        </Badge>
    );
}
