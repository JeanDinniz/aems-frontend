/**
 * Constantes para o módulo de Ocorrências
 */

// OCCURRENCE TYPE COLORS (baseado nos labels traduzidos)
export const OCCURRENCE_TYPE_COLORS = {
    'Falta': 'bg-red-100 text-red-800 border-red-300',
    'Atraso': 'bg-orange-100 text-orange-800 border-orange-300',
    'Advertência': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Suspensão': 'bg-purple-100 text-purple-800 border-purple-300',
    'Outro': 'bg-gray-100 text-gray-800 border-gray-300'
};

// SEVERITY COLORS
export const SEVERITY_COLORS = {
    'Baixa': 'bg-gray-100 text-gray-700 border-gray-300',
    'Média': 'bg-blue-100 text-blue-700 border-blue-300',
    'Alta': 'bg-orange-100 text-orange-700 border-orange-300',
    'Crítica': 'bg-red-100 text-red-700 border-red-300'
};

// ACKNOWLEDGED STATUS COLORS
export const ACKNOWLEDGED_COLORS = {
    true: 'bg-green-100 text-green-800 border-green-300',
    false: 'bg-yellow-100 text-yellow-800 border-yellow-300'
};
