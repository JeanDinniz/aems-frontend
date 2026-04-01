import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { accessProfilesService } from '@/services/api/access-profiles.service';
import { useProfileUsers } from '@/hooks/useAccessProfiles';

interface UserProfilesSectionProps {
    userId: string;
}

/**
 * Displays a list of all active access profiles with checkboxes.
 * Allows linking/unlinking a user from profiles.
 * Used inside the EditUserDialog for 'user' role users.
 */
export function UserProfilesSection({ userId }: UserProfilesSectionProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['access-profiles', { is_active: true }],
        queryFn: () => accessProfilesService.list({ is_active: true }),
        staleTime: 1000 * 60 * 5,
    });

    const profiles = data?.items ?? [];

    // Compute which profiles currently include this user
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [initialSelected, setInitialSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (profiles.length > 0) {
            const linkedIds = new Set(
                profiles
                    .filter((p) => p.user_ids.includes(userId))
                    .map((p) => p.id)
            );
            setSelected(linkedIds);
            setInitialSelected(linkedIds);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profiles.length, userId]);

    const { addUsers, removeUsers } = useProfileUsers();

    const handleToggle = (profileId: string, checked: boolean) => {
        const wasInitiallyLinked = initialSelected.has(profileId);

        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) {
                next.add(profileId);
            } else {
                next.delete(profileId);
            }
            return next;
        });

        if (checked && !wasInitiallyLinked) {
            addUsers.mutate({ id: profileId, user_ids: [userId] });
        } else if (!checked && wasInitiallyLinked) {
            removeUsers.mutate({ id: profileId, user_ids: [userId] });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nenhum perfil de acesso ativo cadastrado.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
                Selecione os perfis que este usuario deve herdar.
            </p>
            <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {profiles.map((profile) => (
                    <label
                        key={profile.id}
                        htmlFor={`up-profile-${profile.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                    >
                        <Checkbox
                            id={`up-profile-${profile.id}`}
                            checked={selected.has(profile.id)}
                            onCheckedChange={(v) => handleToggle(profile.id, Boolean(v))}
                            disabled={addUsers.isPending || removeUsers.isPending}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{profile.name}</p>
                            {profile.description && (
                                <p className="text-xs text-muted-foreground truncate">{profile.description}</p>
                            )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                            {profile.allows_loja && (
                                <Badge variant="secondary" className="text-xs">Loja</Badge>
                            )}
                            {profile.allows_galpon && (
                                <Badge variant="outline" className="text-xs">Galpao</Badge>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}
