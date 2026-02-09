import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOccurrences } from '@/hooks/useOccurrences';
import { useAuth } from '@/hooks/useAuth';
import { useStoreStore } from '@/stores/store.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import {
    OccurrenceType,
    OccurrenceSeverity,
    type CreateOccurrenceDTO
} from '@/types/occurrence.types';
import { FileUpload } from '@/components/occurrences/FileUpload';

const schema = z.object({
    employee_id: z.coerce.number().min(1, 'Selecione um funcionário'),
    occurrence_type: z.nativeEnum(OccurrenceType),
    severity: z.nativeEnum(OccurrenceSeverity),
    occurrence_date: z.string().min(1, 'Selecione a data da ocorrência'),
    description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateOccurrencePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedStoreId } = useStoreStore();
    const { createOccurrence, isCreating } = useOccurrences();

    const { register, handleSubmit, control, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            severity: OccurrenceSeverity.LOW,
            occurrence_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        }
    });

    const [attachments, setAttachments] = useState<File[]>([]);

    const onSubmit = async (data: FormData) => {
        try {
            const payload: CreateOccurrenceDTO = {
                ...data,
                store_id: selectedStoreId || user?.store_id || 1, // Fallback
                occurrence_date: new Date(data.occurrence_date).toISOString(),
            };

            const createdOccurrence = await createOccurrence(payload);

            // Mock Upload de anexos
            if (attachments.length > 0 && createdOccurrence?.id) {
                // TODO: Implementar upload quando backend estiver pronto
                console.log('Anexos a enviar:', attachments);
            }

            navigate('/hr/occurrences');
        } catch (error) {
            console.error('Erro ao criar ocorrência:', error);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/hr/occurrences')}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Nova Ocorrência de RH</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informações da Ocorrência</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Employee ID */}
                        <div className="space-y-2">
                            <Label htmlFor="employee_id">
                                ID do Funcionário <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="employee_id"
                                type="number"
                                placeholder="Digite o ID do funcionário"
                                {...register('employee_id')}
                                disabled={isCreating}
                            />
                            {errors.employee_id && (
                                <p className="text-sm text-red-500">{errors.employee_id.message}</p>
                            )}
                        </div>

                        {/* Occurrence Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Ocorrência <span className="text-red-500">*</span></Label>
                            <Controller
                                name="occurrence_type"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange} disabled={isCreating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={OccurrenceType.ABSENCE}>Falta</SelectItem>
                                            <SelectItem value={OccurrenceType.LATE_ARRIVAL}>Atraso</SelectItem>
                                            <SelectItem value={OccurrenceType.WARNING}>Advertência</SelectItem>
                                            <SelectItem value={OccurrenceType.SUSPENSION}>Suspensão</SelectItem>
                                            <SelectItem value={OccurrenceType.OTHER}>Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.occurrence_type && (
                                <p className="text-sm text-red-500">{errors.occurrence_type.message}</p>
                            )}
                        </div>

                        {/* Severity */}
                        <div className="space-y-2">
                            <Label>Severidade <span className="text-red-500">*</span></Label>
                            <Controller
                                name="severity"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange} disabled={isCreating}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a severidade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={OccurrenceSeverity.LOW}>Baixa</SelectItem>
                                            <SelectItem value={OccurrenceSeverity.MEDIUM}>Média</SelectItem>
                                            <SelectItem value={OccurrenceSeverity.HIGH}>Alta</SelectItem>
                                            <SelectItem value={OccurrenceSeverity.CRITICAL}>Crítica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.severity && (
                                <p className="text-sm text-red-500">{errors.severity.message}</p>
                            )}
                        </div>

                        {/* Occurrence Date */}
                        <div className="space-y-2">
                            <Label htmlFor="occurrence_date">
                                Data da Ocorrência <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="occurrence_date"
                                type="date"
                                {...register('occurrence_date')}
                                disabled={isCreating}
                            />
                            {errors.occurrence_date && (
                                <p className="text-sm text-red-500">{errors.occurrence_date.message}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Descrição <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Descreva a ocorrência detalhadamente..."
                                rows={6}
                                {...register('description')}
                                disabled={isCreating}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                        </div>

                        {/* Upload de Anexos */}
                        <div className="space-y-2">
                            <Label>Anexos (Opcional)</Label>
                            <FileUpload
                                files={attachments}
                                onFilesChange={setAttachments}
                                maxFiles={5}
                                disabled={isCreating}
                            />
                            <p className="text-sm text-gray-500">
                                Adicione fotos ou documentos relacionados à ocorrência
                            </p>
                        </div>

                        {/* Notes (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações (opcional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Informações adicionais..."
                                rows={3}
                                {...register('notes')}
                                disabled={isCreating}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/hr/occurrences')}
                        disabled={isCreating}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Registrar Ocorrência
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
