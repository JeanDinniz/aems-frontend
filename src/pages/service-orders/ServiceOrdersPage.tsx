import { useState } from 'react';
import { useServiceOrders } from '@/hooks/useServiceOrders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TrafficLightStatus } from '@/components/features/service-orders/TrafficLightStatus';
import type { ServiceOrderStatus, Department } from '@/types/service-order.types';

export default function ServiceOrdersPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const [statusFilter, setStatusFilter] = useState<ServiceOrderStatus | 'all'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<Department | 'all'>('all');
    const [search, setSearch] = useState('');

    const { data, isLoading, isError } = useServiceOrders(
        {
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: search || undefined,
            // Add department filter to hook/service if backend supports it. For now assume hook passes extra params or ignores.
        },
        page * pageSize,
        pageSize
    );

    const STATUS_LABELS: Record<string, string> = {
        waiting: 'Aguardando',
        doing: 'Fazendo',
        inspection: 'Inspeção',
        ready: 'Pronto',
        delivered: 'Entregue',
    };

    const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        waiting: 'secondary',
        doing: 'default',
        inspection: 'destructive',
        ready: 'outline',
        delivered: 'secondary',
    };

    const DEPARTMENTS: Record<string, string> = {
        film: 'Película',
        bodywork: 'Funilaria',
        aesthetic: 'Estética'
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
                    <p className="text-muted-foreground">
                        Gerencie todas as ordens de serviço do sistema.
                    </p>
                </div>
                <Button onClick={() => navigate('/service-orders/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova OS
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-background/95 p-4 rounded-lg border">
                <div className="flex flex-1 items-center gap-2 w-full flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente, veículo ou OS..."
                            className="pl-8"
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="waiting">Aguardando</SelectItem>
                            <SelectItem value="doing">Fazendo</SelectItem>
                            <SelectItem value="inspection">Inspeção</SelectItem>
                            <SelectItem value="ready">Pronto</SelectItem>
                            <SelectItem value="delivered">Entregue</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val as any)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Departamento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Depts</SelectItem>
                            <SelectItem value="film">Película</SelectItem>
                            <SelectItem value="bodywork">Funilaria</SelectItem>
                            <SelectItem value="aesthetic">Estética</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nº OS</TableHead>
                            <TableHead>Placa</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Veículo</TableHead>
                            <TableHead>Departamento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Semáforo</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                    Carregando...
                                </TableCell>
                            </TableRow>
                        ) : isError ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-red-500">
                                    Erro ao carregar ordens de serviço.
                                </TableCell>
                            </TableRow>
                        ) : data?.items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    Nenhuma ordem de serviço encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.items.map((os) => (
                                <TableRow key={os.id}>
                                    <TableCell className="font-medium">{os.order_number}</TableCell>
                                    <TableCell className="font-mono text-xs">{os.plate}</TableCell>
                                    <TableCell>{os.client_name}</TableCell>
                                    <TableCell>{os.client_vehicle}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal">
                                            {DEPARTMENTS[os.department] || os.department}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANTS[os.status] || 'default'}>
                                            {STATUS_LABELS[os.status] || os.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <TrafficLightStatus
                                            entryTime={os.entry_time || os.created_at}
                                            department={os.department}
                                            status={os.status}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link to={`/service-orders/${os.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => Math.max(0, old - 1))}
                    disabled={page === 0 || isLoading}
                >
                    Anterior
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => old + 1)}
                    disabled={!data || data.items.length < pageSize || isLoading}
                >
                    Próximo
                </Button>
            </div>
        </div>
    );
}
