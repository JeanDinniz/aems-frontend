import { Badge } from '@/components/ui/badge';

interface ConsultantStatusBadgeProps {
    isActive: boolean;
}

export function ConsultantStatusBadge({ isActive }: ConsultantStatusBadgeProps) {
    return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Ativo' : 'Inativo'}
        </Badge>
    );
}
