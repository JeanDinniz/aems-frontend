export interface Photo {
    id: string; // uuid temporário
    file: File; // Arquivo original
    preview: string; // URL de preview (blob)
    compressed?: Blob; // Versão comprimida
    uploaded: boolean; // Se já foi enviado ao backend
    uploadProgress: number; // 0-100
    url?: string; // URL no servidor (após upload)
    error?: string; // Erro de upload
}

export interface PhotoUploadOptions {
    maxFiles: number; // Máximo de arquivos
    minFiles: number; // Mínimo de arquivos
    maxSizePerFile: number; // MB
    acceptedTypes: string[]; // ['image/jpeg', 'image/png']
    compressionQuality: number; // 0-1
    maxWidth: number; // Largura máxima
    maxHeight: number; // Altura máxima
}
