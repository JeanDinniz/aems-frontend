export const EMPLOYEE_POSITIONS = [
    { value: 'Guariba',                label: 'Guariba' },
    { value: 'Higienizador',           label: 'Higienizador' },
    { value: 'Lavador',                label: 'Lavador' },
    { value: 'Polidor',                label: 'Polidor' },
    { value: 'Martelinho',             label: 'Martelinho' },
    { value: 'Instalador de Película', label: 'Instalador de Película' },
    { value: 'Manobrista',             label: 'Manobrista' },
    { value: 'Encarregado',            label: 'Encarregado' },
] as const;

/** Instalador de Película é o único cargo vinculado ao departamento film */
export const FILM_INSTALLER_POSITION = 'Instalador de Película';

/** Deriva o department (para filtro backend) a partir do cargo */
export function positionToDepartment(position?: string | null): string | undefined {
    return position === FILM_INSTALLER_POSITION ? 'film' : undefined;
}
