import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { PurchaseRequestItem } from '@/types/purchase-requests.types';
import { formatCurrency } from '@/lib/utils';

interface ItemsTableProps {
    items: PurchaseRequestItem[];
    showTotal?: boolean;
}

export function ItemsTable({ items, showTotal = true }: ItemsTableProps) {
    const total = items.reduce((acc, item) => acc + (item.quantity * item.estimated_price), 0);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produto / Serviço</TableHead>
                        <TableHead className="w-[100px] text-center">Qtd</TableHead>
                        <TableHead className="w-[100px]">Unidade</TableHead>
                        <TableHead className="w-[120px] text-right">Preço Est.</TableHead>
                        <TableHead className="w-[120px] text-right">Subtotal</TableHead>
                        <TableHead className="hidden md:table-cell">Fornecedor Sugerido</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow key={item.id || index}>
                            <TableCell className="font-medium">
                                {item.product_name}
                                {item.notes && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                                )}
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.estimated_price)}</TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(item.quantity * item.estimated_price)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                {item.supplier || '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                    {items.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                Nenhum item adicionado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {showTotal && items.length > 0 && (
                <div className="flex justify-end p-4 bg-muted/20 border-t">
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-muted-foreground">Total Estimado:</span>
                        <span className="text-lg font-bold">{formatCurrency(total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
