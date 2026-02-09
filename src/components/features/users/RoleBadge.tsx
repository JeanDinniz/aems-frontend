import { Badge } from '@/components/ui/badge';
import { Crown, Shield, User } from 'lucide-react';
import type { UserRole } from '@/types/user.types';

interface RoleBadgeProps {
    role: UserRole;
}

const roleConfig = {
    owner: { label: 'Proprietário', icon: Crown, variant: 'default' as const },
    supervisor: { label: 'Supervisor', icon: Shield, variant: 'secondary' as const },
    operator: { label: 'Operador', icon: User, variant: 'outline' as const },
};

export function RoleBadge({ role }: RoleBadgeProps) {
    const config = roleConfig[role];
    const Icon = config.icon;

    return (
        <Badge variant={config.variant}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
        </Badge>
    );
}
