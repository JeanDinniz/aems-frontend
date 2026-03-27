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
