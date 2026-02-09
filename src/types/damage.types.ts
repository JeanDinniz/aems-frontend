export type DamageType =
    | 'scratch' // Arranhão
    | 'dent' // Amassado
    | 'broken' // Quebrado
    | 'crack' // Trincado
    | 'rust' // Ferrugem
    | 'paint_chip' // Lasca de tinta
    | 'other'; // Outro

export type VehicleView = 'front' | 'back' | 'left' | 'right';

export interface DamagePoint {
    id: string; // uuid
    view: VehicleView; // Vista do veículo
    x: number; // Posição X (%)
    y: number; // Posição Y (%)
    type: DamageType;
    severity: 'low' | 'medium' | 'high';
    description?: string;
    createdAt: string;
}

export interface DamageMapData {
    points: DamagePoint[];
    totalDamages: number;
    hasCriticalDamage: boolean;
}
