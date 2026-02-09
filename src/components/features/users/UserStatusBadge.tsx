import { Badge } from '@/components/ui/badge';
import type { UserStatus } from '@/types/user.types';

interface UserStatusBadgeProps {
    status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
    return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            {status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
    );
}
