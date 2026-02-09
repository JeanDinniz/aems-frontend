import { differenceInMinutes } from 'date-fns';
import { Circle } from 'lucide-react';
import type { Department, ServiceOrderStatus, SemaphoreColor } from '@/types/service-order.types';

interface TrafficLightStatusProps {
    entryTime: string; // Should be ISO string or date string
    department?: Department; // Make optional for backward compatibility default
    status: ServiceOrderStatus;
    showLabel?: boolean;
}

// Regras de semáforo por departamento (em minutos)
const SEMAPHORE_RULES: Record<Department, { white: number; yellow: number; orange: number }> = {
    film: { white: 45, yellow: 90, orange: 180 },      // 45min, 1h30, 3h
    aesthetic: { white: 30, yellow: 60, orange: 120 }, // 30min, 1h, 2h
    bodywork: { white: 60, yellow: 120, orange: 240 }  // 1h, 2h, 4h
};

function calculateSemaphore(
    entryTime: string,
    department: Department = 'film', // Default to film if not provided
    status: ServiceOrderStatus
): { color: SemaphoreColor; label: string; minutes: number } {
    // Não mostrar semáforo para ordens finalizadas
    if (status === 'ready' || status === 'delivered') { // removed 'completed' as it is old status
        return { color: 'white', label: 'Concluída', minutes: 0 };
    }

    const minutes = differenceInMinutes(new Date(), new Date(entryTime));
    const rules = SEMAPHORE_RULES[department] || SEMAPHORE_RULES['film'];

    let color: SemaphoreColor;
    let label: string;

    if (minutes < rules.white) {
        color = 'white';
        label = 'No prazo';
    } else if (minutes < rules.yellow) {
        color = 'yellow';
        label = 'Atenção';
    } else if (minutes < rules.orange) {
        color = 'orange';
        label = 'Urgente';
    } else {
        color = 'red';
        label = 'Atrasado';
    }

    return { color, label, minutes };
}

const COLOR_CLASSES = {
    white: 'text-gray-400 bg-gray-100',
    yellow: 'text-yellow-500 bg-yellow-50',
    orange: 'text-orange-500 bg-orange-50',
    red: 'text-red-500 bg-red-50'
};

export function TrafficLightStatus({
    entryTime,
    department = 'film',
    status,
    showLabel = true
}: TrafficLightStatusProps) {
    if (!entryTime) return null;

    // Safety check for invalid departments or legacy data
    const safeDepartment = (department && SEMAPHORE_RULES[department]) ? department : 'film';

    const { color, label, minutes } = calculateSemaphore(entryTime, safeDepartment, status);

    return (
        <div className="flex items-center gap-2">
            <div className={`p-1 rounded-full ${COLOR_CLASSES[color]}`}>
                <Circle className={`h-3 w-3 fill-current`} />
            </div>
            {showLabel && (
                <span className="text-sm">
                    {label} ({minutes}min)
                </span>
            )}
        </div>
    );
}
