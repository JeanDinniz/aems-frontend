import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStores } from '@/hooks/useStores';
import {
    Plus,
    Search,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/features/purchase-requests/StatusBadge';
import { UrgencyBadge } from '@/components/features/purchase-requests/UrgencyBadge';
import { usePurchaseRequests } from '@/hooks/usePurchaseRequests';
import type {
    PurchaseCategory,
    PurchaseRequestStatus,
    UrgencyLevel,
    PurchaseRequest
} from '@/types/purchase-requests.types';
import { CATEGORY_LABELS } from '@/types/purchase-requests.types';
import { formatCurrency } from '@/lib/utils';

export function PurchaseRequestsPage() {
    const navigate = useNavigate();
    const { selectedStoreId } = useStores();

    const [filters, setFilters] = useState({
        status: 'all' as PurchaseRequestStatus | 'all',
        category: 'all' as PurchaseCategory | 'all',
        urgency: 'all' as UrgencyLevel | 'all',
    });

    const { data, isLoading } = usePurchaseRequests(
        {
            store_id: selectedStoreId || undefined,
            status: filters.status === 'all' ? undefined : filters.status,
            category: filters.category === 'all' ? undefined : filters.category,
            urgency: filters.urgency === 'all' ? undefined : filters.urgency,
        }
    );

    const stats = [
        {
            title: 'Aguardando Aprovação',
            value: data?.items.filter((i: PurchaseRequest) => i.status === 'awaiting_supervisor' || i.status === 'awaiting_owner').length || 0,
            icon: Clock,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100'
        },
        {
            title: 'Aprovadas (Mês)',
            value: data?.items.filter((i: PurchaseRequest) => i.status === 'approved').length || 0,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            title: 'Críticas',
            value: data?.items.filter((i: PurchaseRequest) => i.urgency === 'critical').length || 0,
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
        {
            title: 'Total Solicitado',
            value: formatCurrency(data?.items.reduce((acc: number, i: PurchaseRequest) => acc + i.total_estimated, 0) || 0),
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Solicitações de Compra</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie aquisições de material e suprimentos.
                    </p>
                </div>
                <Button onClick={() => navigate('/purchase-requests/new')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Solicitação
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${stat.bg}`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por número, solicitante..."
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <Select
                            value={filters.status}
                            onValueChange={(v: PurchaseRequestStatus | 'all') => setFilters({ ...filters, status: v })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="awaiting_supervisor">Aguard. Supervisor</SelectItem>
                                <SelectItem value="awaiting_owner">Aguard. Owner</SelectItem>
                                <SelectItem value="approved">Aprovado</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                                <SelectItem value="completed">Concluído</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.urgency}
                            onValueChange={(v: UrgencyLevel | 'all') => setFilters({ ...filters, urgency: v })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Urgência" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Urgências</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="urgent">Urgente</SelectItem>
                                <SelectItem value="critical">Crítico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Número</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Solicitante</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Urgência</TableHead>
                                <TableHead className="text-right">Valor Est.</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Carregando solicitações...
                                    </TableCell>
                                </TableRow>
                            ) : data?.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        Nenhuma solicitação encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.items.map((request: PurchaseRequest) => (
                                    <TableRow
                                        key={request.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/purchase-requests/${request.id}`)}
                                    >
                                        <TableCell className="font-medium">{request.request_number}</TableCell>
                                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{request.requester_name}</span>
                                                <span className="text-xs text-muted-foreground">{request.store_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{CATEGORY_LABELS[request.category]}</TableCell>
                                        <TableCell>
                                            <UrgencyBadge urgency={request.urgency} />
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(request.total_estimated)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={request.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                Ver Detalhes
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
