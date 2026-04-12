import { useState } from 'react';
import { Plus, Edit, Eye, Trash2, ShieldCheck, Building2, Users, MoreHorizontal } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessProfileDialog } from '@/components/features/access-profiles/AccessProfileDialog';
import { useAccessProfiles, useUpdateAccessProfile, useDeleteAccessProfile } from '@/hooks/useAccessProfiles';
import type { AccessProfile } from '@/types/accessProfile.types';

export function AccessProfilesPage() {
    const [createOpen, setCreateOpen] = useState(false);
    const [editProfile, setEditProfile] = useState<AccessProfile | null>(null);
    const [deleteProfile, setDeleteProfile] = useState<AccessProfile | null>(null);

    const { profiles, total, isLoading } = useAccessProfiles();
    const updateMutation = useUpdateAccessProfile();
    const deleteMutation = useDeleteAccessProfile();

    const handleToggleActive = (profile: AccessProfile) => {
        updateMutation.mutate({
            id: profile.id,
            data: { is_active: !profile.is_active },
        });
    };

    const handleDelete = () => {
        if (!deleteProfile) return;
        deleteMutation.mutate(deleteProfile.id, {
            onSuccess: () => setDeleteProfile(null),
        });
    };

    const getModuleBadges = (profile: AccessProfile) => {
        const hasAdm = profile.permissions.some((p) => p.module_group === 'ADM' && p.can_view);
        const hasOp = profile.permissions.some((p) => p.module_group === 'OPERACIONAL' && p.can_view);
        return { hasAdm, hasOp };
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1
                        className="text-2xl font-bold text-[#111111] dark:text-white"
                        style={{ fontFamily: 'Barlow, Barlow Semi Condensed, sans-serif' }}
                    >
                        Perfis de Acesso
                    </h1>
                    <p className="text-[#666666] dark:text-zinc-400 text-sm">
                        {total} perfil{total !== 1 ? 'is' : ''} cadastrado{total !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold disabled:opacity-60"
                    style={{ backgroundColor: '#F5A800', color: '#1A1A1A' }}
                >
                    <Plus className="h-4 w-4" />
                    Novo Perfil
                </button>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                    ))}
                </div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Módulos</TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1">
                                        <Building2 className="h-3.5 w-3.5" />
                                        Lojas
                                    </span>
                                </TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5" />
                                        Usuários
                                    </span>
                                </TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right w-16">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-[#666666] dark:text-zinc-500 py-12"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <ShieldCheck className="h-8 w-8 text-muted-foreground/40" />
                                            <p>Nenhum perfil de acesso cadastrado</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCreateOpen(true)}
                                            >
                                                Criar primeiro perfil
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                profiles.map((profile) => {
                                    const { hasAdm, hasOp } = getModuleBadges(profile);
                                    return (
                                        <TableRow key={profile.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="font-medium">{profile.name}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-sm text-muted-foreground line-clamp-1">
                                                    {profile.description || '—'}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    {hasAdm && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            ADM
                                                        </Badge>
                                                    )}
                                                    {hasOp && (
                                                        <Badge variant="outline" className="text-xs">
                                                            Operacional
                                                        </Badge>
                                                    )}
                                                    {!hasAdm && !hasOp && (
                                                        <span className="text-xs text-muted-foreground">Sem permissões</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-sm">
                                                    {profile.store_ids.length > 0
                                                        ? `${profile.store_ids.length} loja${profile.store_ids.length !== 1 ? 's' : ''}`
                                                        : <span className="text-muted-foreground">—</span>}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-sm">
                                                    {profile.user_ids.length > 0
                                                        ? `${profile.user_ids.length} usuário${profile.user_ids.length !== 1 ? 's' : ''}`
                                                        : <span className="text-muted-foreground">—</span>}
                                                </span>
                                            </TableCell>

                                            <TableCell>
                                                {profile.is_active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50">
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-zinc-800 text-[#444444] dark:text-zinc-400 border border-[#BDBDBD] dark:border-zinc-700">
                                                        Inativo
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-[#F5A800]">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setEditProfile(profile)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        {profile.is_active ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleToggleActive(profile)}
                                                                className="ring-1 ring-[#F5A800] ring-inset rounded-sm"
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Desativar
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleToggleActive(profile)}>
                                                                <Eye className="h-4 w-4 mr-2 text-green-600" />
                                                                <span className="text-green-600">Ativar</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteProfile(profile)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Create Dialog */}
            <AccessProfileDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {/* Edit Dialog */}
            <AccessProfileDialog
                open={editProfile !== null}
                onOpenChange={(open) => { if (!open) setEditProfile(null); }}
                profile={editProfile}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={deleteProfile !== null}
                onOpenChange={(open) => { if (!open) setDeleteProfile(null); }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir perfil de acesso?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O perfil{' '}
                            <span className="font-semibold">{deleteProfile?.name}</span>{' '}
                            será excluído permanentemente. Os usuários vinculados perderão as permissões associadas.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
