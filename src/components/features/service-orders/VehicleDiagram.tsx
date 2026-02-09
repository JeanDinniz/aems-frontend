import { cn } from '@/lib/utils';
import type { DamagePoint, VehicleView } from '@/types/damage.types';
import React from 'react';

interface VehicleDiagramProps {
    view: VehicleView;
    damages: DamagePoint[];
    onDiagramClick: (x: number, y: number) => void;
    onMarkerClick: (id: string) => void;
}

const severityColors = {
    low: '#fbbf24', // yellow-400
    medium: '#fb923c', // orange-400
    high: '#ef4444', // red-500
};

export function VehicleDiagram({
    view,
    damages,
    onDiagramClick,
    onMarkerClick,
}: VehicleDiagramProps) {
    const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();

        // Calcular posição relativa (%)
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        onDiagramClick(x, y);
    };

    // SVGs simplificados por vista
    const diagrams: Record<VehicleView, React.ReactNode> = {
        front: (
            <g>
                {/* Outline do carro - vista frontal */}
                <rect x="30" y="20" width="140" height="160" rx="10" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
                {/* Capô */}
                <rect x="40" y="30" width="120" height="40" rx="5" fill="#d1d5db" />
                {/* Para-brisa */}
                <rect x="50" y="75" width="100" height="50" rx="5" fill="#93c5fd" opacity="0.5" />
                {/* Faróis */}
                <circle cx="60" cy="50" r="8" fill="#fef08a" />
                <circle cx="140" cy="50" r="8" fill="#fef08a" />
            </g>
        ),
        back: (
            <g>
                {/* Outline do carro - vista traseira */}
                <rect x="30" y="20" width="140" height="160" rx="10" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
                {/* Porta-malas */}
                <rect x="40" y="130" width="120" height="40" rx="5" fill="#d1d5db" />
                {/* Vidro traseiro */}
                <rect x="50" y="105" width="100" height="20" rx="5" fill="#93c5fd" opacity="0.5" />
                {/* Lanternas */}
                <circle cx="60" cy="150" r="8" fill="#fca5a5" />
                <circle cx="140" cy="150" r="8" fill="#fca5a5" />
            </g>
        ),
        left: (
            <g>
                {/* Outline do carro - lateral esquerda */}
                <ellipse cx="100" cy="100" rx="80" ry="40" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
                {/* Portas */}
                <rect x="40" y="80" width="40" height="40" rx="5" fill="#d1d5db" />
                <rect x="120" y="80" width="40" height="40" rx="5" fill="#d1d5db" />
                {/* Vidros */}
                <rect x="45" y="85" width="30" height="15" rx="3" fill="#93c5fd" opacity="0.5" />
                <rect x="125" y="85" width="30" height="15" rx="3" fill="#93c5fd" opacity="0.5" />
                {/* Rodas */}
                <circle cx="50" cy="140" r="15" fill="#374151" />
                <circle cx="150" cy="140" r="15" fill="#374151" />
            </g>
        ),
        right: (
            <g>
                {/* Outline do carro - lateral direita (espelhado) */}
                <ellipse cx="100" cy="100" rx="80" ry="40" fill="#e5e7eb" stroke="#374151" strokeWidth="2" />
                {/* Portas */}
                <rect x="40" y="80" width="40" height="40" rx="5" fill="#d1d5db" />
                <rect x="120" y="80" width="40" height="40" rx="5" fill="#d1d5db" />
                {/* Vidros */}
                <rect x="45" y="85" width="30" height="15" rx="3" fill="#93c5fd" opacity="0.5" />
                <rect x="125" y="85" width="30" height="15" rx="3" fill="#93c5fd" opacity="0.5" />
                {/* Rodas */}
                <circle cx="50" cy="140" r="15" fill="#374151" />
                <circle cx="150" cy="140" r="15" fill="#374151" />
            </g>
        ),
    };

    return (
        <div className="relative">
            <svg
                viewBox="0 0 200 200"
                className={cn(
                    'w-full h-auto border-2 border-gray-300 rounded-lg bg-white cursor-crosshair',
                    'hover:border-primary transition-colors'
                )}
                onClick={handleClick}
            >
                {/* Diagrama do veículo */}
                {diagrams[view]}

                {/* Marcadores de avaria */}
                {damages.map((damage) => (
                    <g key={damage.id}>
                        {/* Círculo de marcação */}
                        <circle
                            cx={(damage.x / 100) * 200}
                            cy={(damage.y / 100) * 200}
                            r="8"
                            fill={severityColors[damage.severity]}
                            stroke="#fff"
                            strokeWidth="2"
                            className="cursor-pointer hover:r-10 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkerClick(damage.id);
                            }}
                        />
                        {/* Pulso de animação para críticos */}
                        {damage.severity === 'high' && (
                            <circle
                                cx={(damage.x / 100) * 200}
                                cy={(damage.y / 100) * 200}
                                r="8"
                                fill="none"
                                stroke={severityColors.high}
                                strokeWidth="2"
                                opacity="0.6"
                                className="animate-ping"
                            />
                        )}
                    </g>
                ))}
            </svg>

            {/* Legenda */}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span>Baixa</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                    <span>Média</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Alta</span>
                </div>
            </div>
        </div>
    );
}
