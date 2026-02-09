import { useIncidentUpdates } from '@/hooks/useIncidentUpdates';
import { TimelineItem } from './TimelineItem';
import { TimelineCommentForm } from './TimelineCommentForm';
import { RefreshCw, MessageSquare } from 'lucide-react';

interface Props {
    incidentId: string;
    currentUserId: string;
    userRole: string; // Adjusted to generic string to avoid strict enum issues here for now
}

export function IncidentTimeline({ incidentId, currentUserId, userRole }: Props) {
    const {
        updates,
        loading,
        submitting,
        addComment,
        deleteComment,
        editComment,
        refresh
    } = useIncidentUpdates(incidentId);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Histórico
                    </h3>
                    <span className="text-sm text-gray-500">
                        ({updates.length} {updates.length === 1 ? 'atualização' : 'atualizações'})
                    </span>
                </div>

                <button
                    onClick={refresh}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Atualizar"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Timeline */}
            {updates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Nenhuma atualização ainda
                </div>
            ) : (
                <div className="space-y-0">
                    {updates.map((update, index) => {
                        const canEdit = update.user_id === currentUserId && update.update_type === 'comment';
                        // Allow admin/manager to delete any comment, or user to delete own comment
                        const canDelete = (
                            update.user_id === currentUserId ||
                            userRole === 'admin' ||
                            userRole === 'manager' ||
                            userRole === 'owner' // Adding owner as per typical AEMS roles
                        ) && update.update_type === 'comment';

                        return (
                            <TimelineItem
                                key={update.id}
                                update={update}
                                isLast={index === updates.length - 1}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onEdit={editComment}
                                onDelete={deleteComment}
                            />
                        );
                    })}
                </div>
            )}

            {/* Formulário de novo comentário */}
            <div className="pt-4 border-t border-gray-200">
                <TimelineCommentForm
                    onSubmit={addComment}
                    submitting={submitting}
                />
            </div>
        </div>
    );
}
