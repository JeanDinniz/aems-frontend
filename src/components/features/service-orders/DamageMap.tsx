import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2 } from 'lucide-react';
import { VehicleDiagram } from './VehicleDiagram';
import { DamageDialog } from './DamageDialog';
import type { DamagePoint, VehicleView, DamageType } from '@/types/damage.types';

interface DamageMapProps {
    damages: DamagePoint[];
    onDamagesChange: (damages: DamagePoint[]) => void;
}

const viewLabels: Record<VehicleView, string> = {
    front: 'Frontal',
    back: 'Traseira',
    left: 'Lateral Esq.',
    right: 'Lateral Dir.',
};

const damageTypeLabels: Record<DamageType, string> = {
    scratch: 'Arranhão',
    dent: 'Amassado',
    broken: 'Quebrado',
    crack: 'Trincado',
    rust: 'Ferrugem',
    paint_chip: 'Lasca de Tinta',
    other: 'Outro',
};

const severityColors = {
    low: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    medium: 'bg-orange-100 text-orange-800 border-orange-300',
    high: 'bg-red-100 text-red-800 border-red-300',
};

export function DamageMap({ damages, onDamagesChange }: DamageMapProps) {
    const [activeView, setActiveView] = useState<VehicleView>('front');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(
        null
    );

    const handleDiagramClick = (x: number, y: number) => {
        setSelectedPosition({ x, y });
        setDialogOpen(true);
    };

    const handleAddDamage = (damage: Omit<DamagePoint, 'id' | 'createdAt' | 'view' | 'x' | 'y'>) => {
        if (!selectedPosition) return;

        const newDamage: DamagePoint = {
            id: crypto.randomUUID(),
            view: activeView,
            x: selectedPosition.x,
            y: selectedPosition.y,
            ...damage,
            createdAt: new Date().toISOString(),
        };

        onDamagesChange([...damages, newDamage]);
        setDialogOpen(false);
        setSelectedPosition(null);
    };

    const handleRemoveDamage = (id: string) => {
        onDamagesChange(damages.filter((d) => d.id !== id));
    };

    const damagesInCurrentView = damages.filter((d) => d.view === activeView);
    const criticalDamages = damages.filter((d) => d.severity === 'high').length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mapa de Avarias</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{damages.length} avarias</Badge>
                        {criticalDamages > 0 && (
                            <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {criticalDamages} críticas
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        💡 Clique no diagrama do veículo para marcar pontos de avaria. Registre
                        todos os danos pré-existentes para evitar problemas futuros.
                    </p>
                </div>

                {/* Tabs por Vista */}
                <Tabs value={activeView} onValueChange={(v) => setActiveView(v as VehicleView)}>
                    <TabsList className="grid w-full grid-cols-4">
                        {(Object.keys(viewLabels) as VehicleView[]).map((view) => {
                            const count = damages.filter((d) => d.view === view).length;
                            return (
                                <TabsTrigger key={view} value={view} className="text-xs sm:text-sm">
                                    {viewLabels[view]}
                                    {count > 0 && (
                                        <Badge variant="secondary" className="ml-1 sm:ml-2 px-1 py-0 h-5">
                                            {count}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {(Object.keys(viewLabels) as VehicleView[]).map((view) => (
                        <TabsContent key={view} value={view} className="space-y-4">
                            {/* Diagrama */}
                            <VehicleDiagram
                                view={view}
                                damages={damagesInCurrentView}
                                onDiagramClick={handleDiagramClick}
                                onMarkerClick={(id) => {
                                    // Opcional: abrir dialog de edição ou apenas destacar
                                    console.log('Marker clicked:', id);
                                }}
                            />

                            {/* Lista de Avarias */}
                            {damagesInCurrentView.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Avarias nesta vista:</h4>
                                    {damagesInCurrentView.map((damage) => (
                                        <Card key={damage.id} className={`${severityColors[damage.severity]} border`}>
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <Badge variant="outline" className="bg-white/50">
                                                                {damageTypeLabels[damage.type]}
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    damage.severity === 'high'
                                                                        ? 'destructive'
                                                                        : 'secondary'
                                                                }
                                                                className="bg-white/50"
                                                            >
                                                                {damage.severity === 'high'
                                                                    ? 'Alta'
                                                                    : damage.severity === 'medium'
                                                                        ? 'Média'
                                                                        : 'Baixa'}
                                                            </Badge>
                                                        </div>
                                                        {damage.description && (
                                                            <p className="text-sm">{damage.description}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleRemoveDamage(damage.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Dialog para Adicionar Avaria */}
                <DamageDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSubmit={handleAddDamage}
                />
            </CardContent>
        </Card>
    );
}
