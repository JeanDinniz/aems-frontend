import { IncidentUpdate } from '@/types/incident.types';
import { TIMELINE_CONFIG } from '@/constants/timeline.constants';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { IncidentPriorityBadge } from './IncidentPriorityBadge';
import { MoreVertical, Edit2, Trash2, Download } from 'lucide-react';
import { useState } from 'react';

interface Props {
    update: IncidentUpdate;
    isLast: boolean;
    canEdit: boolean;
    canDelete: boolean;
    onEdit?: (updateId: string, content: string) => void;
    onDelete?: (updateId: string) => void;
}

export function TimelineItem({
    update,
    isLast,
    canEdit,
    canDelete,
    onEdit,
    onDelete
}: Props) {
    const config = TIMELINE_CONFIG[update.update_type] || TIMELINE_CONFIG['created']; // Fallback
    const Icon = config.icon;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(update.content);
    const [showMenu, setShowMenu] = useState(false);

    const handleSaveEdit = () => {
        if (onEdit && editContent.trim()) {
            onEdit(update.id, editContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditContent(update.content);
        setIsEditing(false);
    };

    const renderContent = () => {
        switch (update.update_type) {
            case 'status_change':
                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span>Status alterado de</span>
                        <IncidentStatusBadge status={update.old_value as any} />
                        <span>para</span>
                        <IncidentStatusBadge status={update.new_value as any} />
                    </div>
                );

            case 'priority_change':
                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span>Prioridade alterada de</span>
                        <IncidentPriorityBadge priority={update.old_value as any} />
                        <span>para</span>
                        <IncidentPriorityBadge priority={update.new_value as any} />
                    </div>
                );

            case 'assignment':
                return (
                    <div>
                        <span>Atribuído para </span>
                        <span className="font-semibold">{update.new_value}</span>
                    </div>
                );

            case 'resolved':
                return (
                    <div>
                        <p className="mb-2">Incidente marcado como resolvido</p>
                        {update.content && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                                <p className="text-sm text-green-900 font-medium mb-1">Resolução:</p>
                                <p className="text-sm text-green-800">{update.content}</p>
                            </div>
                        )}
                    </div>
                );

            case 'attachment':
                return (
                    <div>
                        <p className="mb-2">Anexou {update.attachments?.length || 1} arquivo(s)</p>
                        {update.attachments && update.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {update.attachments.map(attachment => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                                    >
                                        {attachment.file_type.startsWith('image/') ? (
                                            <img
                                                src={attachment.file_url}
                                                alt={attachment.file_name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        ) : (
                                            <Download className="w-4 h-4 text-gray-600" />
                                        )}
                                        <span className="text-gray-700">{attachment.file_name}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'comment':
                return isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                                Salvar
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{update.content}</p>
                );

            default:
                return <p className="text-gray-700">{update.content}</p>;
        }
    };

    return (
        <div className="relative flex gap-4 pb-6">
            {/* Linha vertical */}
            {!isLast && (
                <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200" />
            )}

            {/* Ícone */}
            <div className={`
        relative z-10 flex items-center justify-center
        w-10 h-10 rounded-full border-2
        ${config.bgColor} ${config.borderColor}
      `}>
                <Icon className={`w-5 h-5 ${config.color}`} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                                {update.user_name}
                            </span>
                            <span className={`text-sm ${config.color}`}>
                                {config.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(update.created_at), {
                                addSuffix: true,
                                locale: ptBR
                            })}
                        </p>
                    </div>

                    {/* Menu de ações (apenas para comentários) */}
                    {update.update_type === 'comment' && (canEdit || canDelete) && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                    {canEdit && (
                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setShowMenu(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Editar
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => {
                                                if (onDelete) onDelete(update.id);
                                                setShowMenu(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Conteúdo do update */}
                <div className="mt-2">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
