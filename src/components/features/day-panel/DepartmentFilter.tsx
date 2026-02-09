import type { Department } from '@/types/day-panel.types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepartmentFilterProps {
    currentDepartment: Department | 'all';
    onDepartmentChange: (dept: Department | 'all') => void;
    showOnlyDelayed: boolean;
    onToggleDelayed: (show: boolean) => void;
    counts?: { [key: string]: number }; // Optional counts for badges
}

export function DepartmentFilter({
    currentDepartment,
    onDepartmentChange,
    showOnlyDelayed,
    onToggleDelayed
}: DepartmentFilterProps) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-1 bg-white rounded-lg border border-gray-100 shadow-sm w-full">
            <Tabs
                value={currentDepartment}
                onValueChange={(v) => onDepartmentChange(v as Department | 'all')}
                className="w-full sm:w-auto"
            >
                <TabsList className="grid w-full grid-cols-4 sm:w-auto bg-gray-100/50">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="film">Película</TabsTrigger>
                    <TabsTrigger value="esthetics">Estética</TabsTrigger>
                    <TabsTrigger value="bodywork">Funilaria</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                    variant={showOnlyDelayed ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => onToggleDelayed(!showOnlyDelayed)}
                    className={cn(
                        "w-full sm:w-auto gap-2 transition-all",
                        showOnlyDelayed ? "shadow-md shadow-red-100" : "text-slate-600 hover:text-red-600 border-slate-200"
                    )}
                >
                    <AlertCircle className="w-4 h-4" />
                    {showOnlyDelayed ? 'Mostrando Atrasadas' : 'Apenas Atrasadas'}
                </Button>
            </div>
        </div>
    );
}
