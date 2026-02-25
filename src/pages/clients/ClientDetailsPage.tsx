import { useParams, Link } from 'react-router-dom';
import { useClient, useClientStats, useClientVehicles, useClientServiceHistory } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { ClientStatsCards } from '@/components/features/clients/ClientStatsCards';
import { VehiclesList } from '@/components/features/clients/VehiclesList';
import { AddVehicleDialog } from '@/components/features/clients/AddVehicleDialog';
import { Badge } from '@/components/ui/badge';

export function ClientDetailsPage() {
    const { id } = useParams();
    const clientId = Number(id);

    const { data: client, isLoading: loadingClient } = useClient(clientId);
    const { data: stats, isLoading: loadingStats } = useClientStats(clientId);
    const { data: vehicles, isLoading: loadingVehicles } = useClientVehicles(clientId);
    const { data: history, isLoading: loadingHistory } = useClientServiceHistory(clientId);

    if (loadingClient) {
        return <div className="p-8"><Skeleton className="h-[400px]" /></div>;
    }

    if (!client) {
        return <div>Cliente não encontrado</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                        <p className="text-muted-foreground">Cliente desde {new Date(client.created_at).getFullYear()}</p>
                    </div>
                </div>
                <Link to={`/clients/${client.id}/edit`}>
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Cliente
                    </Button>
                </Link>
            </div>

            <ClientStatsCards stats={stats} client={client} />

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="vehicles">Veículos</TabsTrigger>
                    <TabsTrigger value="history">Histórico de Serviços</TabsTrigger>
                    <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{client.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span>{client.email || 'Não informado'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{client.document || 'CPF/CNPJ não informado'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                        <span>
                                            {client.address && `${client.address}, `}
                                            {client.city && `${client.city} - `}
                                            {client.state}
                                            {client.zipcode && ` (${client.zipcode})`}
                                            {(!client.address && !client.city) && 'Endereço não informado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {client.notes && (
                                <div className="mt-6 pt-6 border-t">
                                    <h3 className="font-semibold mb-2">Observações Internas</h3>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="vehicles" className="space-y-4">
                    <div className="flex justify-end">
                        <AddVehicleDialog clientId={client.id} />
                    </div>
                    {loadingVehicles ? (
                        <Skeleton className="h-[200px]" />
                    ) : (
                        <VehiclesList vehicles={vehicles} clientId={client.id} />
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Ordens de Serviço</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingHistory ? (
                                <Skeleton className="h-[300px]" />
                            ) : !history || history.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground">
                                    Nenhum serviço encontrado no histórico.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>OS #</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Veículo</TableHead>
                                            <TableHead>Departamento</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.map((os: any) => (
                                            <TableRow key={os.id}>
                                                <TableCell className="font-medium">
                                                    <Link to={`/service-orders/${os.id}`} className="hover:underline">
                                                        #{os.id.toString().padStart(4, '0')}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{new Date(os.created_at).toLocaleDateString('pt-BR')}</TableCell>
                                                <TableCell>{os.vehicle_plate || os.vehicle_model || '-'}</TableCell>
                                                <TableCell className="capitalize">{{ film: 'Película', ppf: 'PPF', bodywork: 'Funilaria', vn: 'VN', vu: 'VU', workshop: 'Oficina' }[os.department] ?? os.department}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {os.status === 'waiting' ? 'Aguardando' :
                                                            os.status === 'doing' ? 'Em Andamento' :
                                                                os.status === 'done' ? 'Pronto' : os.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.total_amount || 0)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle>Estatísticas Detalhadas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="border rounded p-4">
                                    <h3 className="font-semibold mb-4">Serviços por Departamento</h3>
                                    {loadingStats ? <Skeleton className="h-[200px]" /> : (
                                        stats?.services_by_department?.map((dept) => (
                                            <div key={dept.department} className="flex justify-between items-center mb-2">
                                                <span className="capitalize">{dept.department}</span>
                                                <span className="font-bold">{dept.count} serviços ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dept.revenue)})</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="border rounded p-4">
                                    <h3 className="font-semibold mb-4">Serviços Favoritos</h3>
                                    {loadingStats ? <Skeleton className="h-[200px]" /> : (
                                        stats?.favorite_services?.map((serv) => (
                                            <div key={serv.service} className="flex justify-between items-center mb-2">
                                                <span>{serv.service}</span>
                                                <span className="font-bold">{serv.count}x</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
