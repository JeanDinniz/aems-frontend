import { useDayPanel } from '@/hooks/useDayPanel';
import { StatusColumn } from '@/components/features/day-panel/StatusColumn';
import { DepartmentFilter } from '@/components/features/day-panel/DepartmentFilter';
import { WebSocketIndicator } from '@/components/features/day-panel/WebSocketIndicator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DayPanelPage() {
    const navigate = useNavigate();
    const {
        columns,
        stats,
        filters: {
            department,
            setDepartment,
            onlyDelayed,
            setOnlyDelayed
        }
    } = useDayPanel();

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
            {/* Top Bar: Header & Stats */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Painel do Dia</h1>
                        <div className="hidden md:block h-6 w-px bg-gray-200" />
                        <WebSocketIndicator />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Simple Stats Cards */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:mr-4">
                            <div className="flex flex-col items-center px-3 sm:px-4 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-xs text-slate-500 font-semibold uppercase">Total</span>
                                <span className="text-lg font-bold text-slate-700">{stats.total}</span>
                            </div>
                            <div className="flex flex-col items-center px-3 sm:px-4 py-1 bg-orange-50 rounded-lg border border-orange-100">
                                <span className="text-xs text-orange-600 font-semibold uppercase">Atrasadas</span>
                                <span className="text-lg font-bold text-orange-700">{stats.delayed}</span>
                            </div>
                            <div className="flex flex-col items-center px-3 sm:px-4 py-1 bg-red-50 rounded-lg border border-red-100 animate-pulse">
                                <span className="text-xs text-red-600 font-semibold uppercase">Críticas</span>
                                <span className="text-lg font-bold text-red-700">{stats.critical}</span>
                            </div>
                        </div>

                        <Button onClick={() => navigate('/service-orders/new')} className="gap-2 shadow-sm w-full sm:w-auto">
                            <Plus className="w-4 h-4" />
                            Nova O.S.
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center">
                    <DepartmentFilter
                        currentDepartment={department}
                        onDepartmentChange={setDepartment}
                        showOnlyDelayed={onlyDelayed}
                        onToggleDelayed={setOnlyDelayed}
                    />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
                <div className="flex gap-3 sm:gap-4 h-full pb-4">
                    <div className="flex-shrink-0 w-72 sm:w-80 lg:flex-1 lg:min-w-[280px]">
                        <StatusColumn
                            status="waiting"
                            title="Aguardando"
                            cards={columns.waiting}
                            colorClass="bg-gray-100 border-gray-200"
                        />
                    </div>
                    <div className="flex-shrink-0 w-72 sm:w-80 lg:flex-1 lg:min-w-[280px]">
                        <StatusColumn
                            status="in_progress"
                            title="Fazendo"
                            cards={columns.in_progress}
                            colorClass="bg-blue-100 border-blue-200"
                        />
                    </div>
                    <div className="flex-shrink-0 w-72 sm:w-80 lg:flex-1 lg:min-w-[280px]">
                        <StatusColumn
                            status="inspection"
                            title="Inspeção"
                            cards={columns.inspection}
                            colorClass="bg-purple-100 border-purple-200"
                        />
                    </div>
                    <div className="flex-shrink-0 w-72 sm:w-80 lg:flex-1 lg:min-w-[280px]">
                        <StatusColumn
                            status="ready"
                            title="Pronto"
                            cards={columns.ready}
                            colorClass="bg-green-100 border-green-200"
                        />
                    </div>
                    <div className="flex-shrink-0 w-72 sm:w-80 lg:flex-1 lg:min-w-[280px]">
                        <StatusColumn
                            status="delivered"
                            title="Entregue"
                            cards={columns.delivered}
                            colorClass="bg-slate-100 border-slate-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
