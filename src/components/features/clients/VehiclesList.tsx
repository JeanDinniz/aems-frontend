import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Vehicle } from '@/types/client.types';
import { useDeleteVehicle } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

interface VehiclesListProps {
    vehicles?: Vehicle[];
    clientId: number;
}

export function VehiclesList({ vehicles }: VehiclesListProps) {
    const deleteVehicle = useDeleteVehicle();
    const { toast } = useToast();

    const handleDelete = (id: number) => {
        if (confirm('Tem certeza que deseja remover este veículo?')) {
            deleteVehicle.mutate(id, {
                onSuccess: () => {
                    toast({
                        title: 'Veículo removido',
                        description: 'O veículo foi removido com sucesso.',
                    });
                },
                onError: () => {
                    toast({
                        variant: 'destructive',
                        title: 'Erro',
                        description: 'Erro ao remover veículo.',
                    });
                }
            });
        }
    };

    if (!vehicles || vehicles.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground border rounded-md">
                Nenhum veículo cadastrado.
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Ano</TableHead>
                        <TableHead>Cor</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.plate}</TableCell>
                            <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                            <TableCell>{vehicle.year || '-'}</TableCell>
                            <TableCell>{vehicle.color || '-'}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(vehicle.id)}
                                    disabled={deleteVehicle.isPending}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
