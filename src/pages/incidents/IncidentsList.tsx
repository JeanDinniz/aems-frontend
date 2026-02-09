import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Loader2 } from 'lucide-react';
import { IncidentStatusBadge } from '@/components/incidents/IncidentStatusBadge';
import { IncidentPriorityBadge } from '@/components/incidents/IncidentPriorityBadge';
import type { IncidentFilters } from '@/types/incident.types';

export default function IncidentsList() {
    const navigate = useNavigate();
    // const [filters, setFilters] = useState<IncidentFilters>({});
    const [filters] = useState<IncidentFilters>({});
    const [search, setSearch] = useState('');

    // Debounce search could be implemented here, but simple state for now
    const { incidents, isLoading, error } = useIncidents(filters);

    const handleSearch = (value: string) => {
        setSearch(value);
        // Basic search filtering (could be moved to API if supported)
        // For now we might pass it to filters if API supports 'q' or similar
        // Or filter locally. Assuming API support for now or just listing.
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-red-500">Erro ao carregar incidentes</p>
                <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Incidentes</h1>
                    <p className="text-muted-foreground">
                        Gerencie os incidentes e chamados do sistema.
                    </p>
                </div>
                <Button onClick={() => navigate('/incidents/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Incidente
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Listagem</CardTitle>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar incidentes..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        {/* Add more filters here if needed */}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Prioridade</TableHead>
                                <TableHead>Atribuído a</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incidents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum incidente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                incidents.map((incident) => (
                                    <TableRow key={incident.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/incidents/${incident.id}`)}>
                                        <TableCell className="font-medium">{incident.incident_number}</TableCell>
                                        <TableCell>{incident.title}</TableCell>
                                        <TableCell>
                                            <IncidentStatusBadge status={incident.status} />
                                        </TableCell>
                                        <TableCell>
                                            <IncidentPriorityBadge priority={incident.priority} />
                                        </TableCell>
                                        <TableCell>
                                            {incident.assigned_to_user_name || 'Não atribuído'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/incidents/${incident.id}`);
                                            }}>
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
