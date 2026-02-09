import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    IncidentCategory,
    IncidentPriority,
    ImpactLevel,
    Department,
} from '@/types/incident.types';
import type { CreateIncidentDTO } from '@/types/incident.types';
import { incidentsService } from '@/services/incidents.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';

const schema = z.object({
    title: z.string().min(10, 'Título deve ter no mínimo 10 caracteres'),
    description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
    category: z.nativeEnum(IncidentCategory),
    priority: z.nativeEnum(IncidentPriority),
    impact_level: z.nativeEnum(ImpactLevel),
    store_id: z.string().min(1, 'Selecione uma loja'),
    department: z.nativeEnum(Department).optional(),
    deadline: z.string().optional(), // Date input returns string
});

export default function CreateIncident() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateIncidentDTO>({
        resolver: zodResolver(schema),
        defaultValues: {
            priority: IncidentPriority.MEDIUM,
            impact_level: ImpactLevel.LOW,
            store_id: '1', // Default store or fetch from context
        }
    });

    const onSubmit = async (data: CreateIncidentDTO) => {
        try {
            setLoading(true);
            await incidentsService.create(data);
            toast({
                title: 'Incidente criado com sucesso!'
            });
            navigate('/incidents');
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: 'Erro ao criar incidente'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate('/incidents')}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Novo Incidente</h1>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações Básicas</h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="title">Título do Incidente</Label>
                                <Input id="title" {...register('title')} placeholder="Resumo do problema" />
                                {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description">Descrição Detalhada</Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Descreva o que aconteceu, onde e quando..."
                                    className="min-h-[100px]"
                                />
                                {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select onValueChange={(val) => setValue('category', val as IncidentCategory)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(IncidentCategory).map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && <span className="text-red-500 text-sm">Selecione uma categoria</span>}
                            </div>

                            <div className="space-y-2">
                                <Label>Prioridade</Label>
                                <Select
                                    defaultValue={IncidentPriority.MEDIUM}
                                    onValueChange={(val) => setValue('priority', val as IncidentPriority)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(IncidentPriority).map((p) => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Impacto e Localização</h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Nível de Impacto</Label>
                                <Select
                                    defaultValue={ImpactLevel.LOW}
                                    onValueChange={(val) => setValue('impact_level', val as ImpactLevel)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ImpactLevel.LOW}>Baixo</SelectItem>
                                        <SelectItem value={ImpactLevel.MEDIUM}>Médio</SelectItem>
                                        <SelectItem value={ImpactLevel.HIGH}>Alto</SelectItem>
                                        <SelectItem value={ImpactLevel.CRITICAL}>Crítico</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Departamento (Opcional)</Label>
                                <Select onValueChange={(val) => setValue('department', val as Department)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(Department).map((dept) => (
                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Prazo Esperado (Opcional)</Label>
                                <Input type="date" {...register('deadline')} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Button type="button" variant="outline" onClick={() => navigate('/incidents')}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="min-w-[120px]">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Salvando
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Criar Incidente
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
