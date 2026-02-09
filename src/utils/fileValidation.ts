const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Validar tipo
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Formato não suportado. Use JPG, PNG ou WebP.',
        };
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Arquivo muito grande. Máximo: 5MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        };
    }

    return { valid: true };
}
