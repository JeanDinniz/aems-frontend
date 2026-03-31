import { Crown, Shield, User } from 'lucide-react';
import type { UserRole } from '@/types/user.types';

interface RoleBadgeProps {
    role: UserRole;
}

const roleConfig: Record<UserRole, { label: string; icon: typeof Crown; className: string }> = {
    owner: {
        label: 'Proprietário',
        icon: Crown,
        className: 'bg-[#F5A800]/15 text-[#8A6000] dark:text-[#F5A800] border border-[#F5A800]/40',
    },
    supervisor: {
        label: 'Supervisor',
        icon: Shield,
        className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50',
    },
    operator: {
        label: 'Operador',
        icon: User,
        className: 'bg-gray-200 dark:bg-zinc-800 text-[#444444] dark:text-zinc-400 border border-[#BDBDBD] dark:border-zinc-700',
    },
};

export function RoleBadge({ role }: RoleBadgeProps) {
    const config = roleConfig[role];
    if (!config) return null;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}
