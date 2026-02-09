import { useState, useRef } from 'react';
import { Send, Paperclip, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
    onSubmit: (content: string, files?: File[]) => Promise<any>;
    submitting: boolean;
}

export function TimelineCommentForm({ onSubmit, submitting }: Props) {
    const [content, setContent] = useState('');
    const { toast } = useToast();
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            toast({
                variant: "destructive",
                title: 'Digite um comentário'
            });
            return;
        }

        try {
            await onSubmit(content, files.length > 0 ? files : undefined);
            setContent('');
            setFiles([]);
        } catch (error) {
            // Erro já tratado no hook
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        // Validações
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];

        const validFiles = selectedFiles.filter(file => {
            if (file.size > maxSize) {
                toast({
                    variant: "destructive",
                    title: `${file.name} é muito grande (máx 10MB)`
                });
                return false;
            }
            if (!allowedTypes.includes(file.type)) {
                toast({
                    variant: "destructive",
                    title: `${file.name} tem formato não suportado`
                });
                return false;
            }
            return true;
        });

        setFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Máx 5 arquivos
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Área de texto */}
            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Adicionar comentário..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={submitting}
                />
            </div>

            {/* Arquivos selecionados */}
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg"
                        >
                            {file.type.startsWith('image/') ? (
                                <Image className="w-4 h-4 text-gray-600" />
                            ) : (
                                <Paperclip className="w-4 h-4 text-gray-600" />
                            )}
                            <span className="text-sm text-gray-700 max-w-[150px] truncate">
                                {file.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                            >
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting || files.length >= 5}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Paperclip className="w-4 h-4" />
                        Anexar arquivo
                    </button>
                    {files.length > 0 && (
                        <span className="text-sm text-gray-500 self-center">
                            {files.length}/5 arquivos
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Enviar
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
