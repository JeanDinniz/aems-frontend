import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
    files: File[];
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
    maxSize?: number; // bytes
    accept?: Record<string, string[]>;
    disabled?: boolean;
}

export function FileUpload({
    files,
    onFilesChange,
    maxFiles = 5,
    maxSize = 5 * 1024 * 1024, // 5MB
    accept = {
        'image/*': ['.png', '.jpg', '.jpeg'],
        'application/pdf': ['.pdf'],
    },
    disabled = false,
}: Props) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
            onFilesChange(newFiles);
        },
        [files, maxFiles, onFilesChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        maxSize,
        maxFiles: maxFiles - files.length,
        disabled: disabled || files.length >= maxFiles,
    });

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            {files.length < maxFiles && (
                <div
                    {...getRootProps()}
                    className={cn(
                        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                        isDragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-300 hover:border-primary',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    {isDragActive ? (
                        <p className="text-sm text-primary">Solte os arquivos aqui...</p>
                    ) : (
                        <div>
                            <p className="text-sm font-medium mb-1">
                                Clique ou arraste arquivos aqui
                            </p>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, PDF até {formatFileSize(maxSize)} ({maxFiles - files.length}{' '}
                                restantes)
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Lista de Arquivos */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium">
                        Arquivos ({files.length}/{maxFiles})
                    </p>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                                disabled={disabled}
                                aria-label={`Remover ${file.name}`}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
