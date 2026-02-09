import {
    FileText,
    MessageSquare,
    RefreshCw,
    Flag,
    UserPlus,
    Paperclip,
    CheckCircle,
    AlertCircle,
    Calendar,
    Tag
} from 'lucide-react';
import { UpdateType } from '@/types/incident.types';
import type { TimelineItemConfig } from '@/types/incident.types';

export const TIMELINE_CONFIG: Record<UpdateType, TimelineItemConfig> = {
    [UpdateType.CREATED]: {
        icon: FileText,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-300',
        label: 'Criado'
    },
    [UpdateType.COMMENT]: {
        icon: MessageSquare,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-300',
        label: 'Comentou'
    },
    [UpdateType.STATUS_CHANGE]: {
        icon: RefreshCw,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-300',
        label: 'Status alterado'
    },
    [UpdateType.PRIORITY_CHANGE]: {
        icon: Flag,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-300',
        label: 'Prioridade alterada'
    },
    [UpdateType.ASSIGNMENT]: {
        icon: UserPlus,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-300',
        label: 'Atribuído'
    },
    [UpdateType.ATTACHMENT]: {
        icon: Paperclip,
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        borderColor: 'border-teal-300',
        label: 'Anexou arquivo'
    },
    [UpdateType.RESOLVED]: {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        label: 'Resolveu'
    },
    [UpdateType.REOPENED]: {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        label: 'Reabriu'
    },
    [UpdateType.DEADLINE_CHANGE]: {
        icon: Calendar,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-300',
        label: 'Prazo alterado'
    },
    [UpdateType.CATEGORY_CHANGE]: {
        icon: Tag,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        borderColor: 'border-pink-300',
        label: 'Categoria alterada'
    }
};
