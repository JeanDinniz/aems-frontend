import { useAuthStore } from '@/stores/auth.store';
import type { Photo } from '@/types/photo.types';
import { logger } from '@/lib/logger';

const getBaseUrl = () =>
    import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/v1`
        : 'http://localhost:8000/api/v1';

export const uploadService = {
    async uploadPhoto(photo: Photo): Promise<string> {
        const { tokens } = useAuthStore.getState();

        const formData = new FormData();
        const blob = photo.compressed || photo.file;
        const ext = photo.file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const fileToUpload =
            blob instanceof File ? blob : new File([blob], `photo.${ext}`, { type: photo.file.type });
        formData.append('file', fileToUpload);

        // Use fetch directly to avoid Axios default Content-Type header
        // overriding the multipart boundary set by the browser
        const response = await fetch(`${getBaseUrl()}/upload/photo`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tokens?.accessToken ?? ''}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail?.detail ?? `Upload falhou com status ${response.status}`);
        }

        const data = await response.json();
        return data.url as string;
    },

    async uploadPhotos(photos: Photo[]): Promise<Array<{ id: string; url: string }>> {
        const uploadPromises = photos.map(async (photo) => {
            if (photo.url) return { id: photo.id, url: photo.url };

            try {
                const url = await this.uploadPhoto(photo);
                photo.uploaded = true;
                photo.url = url;
                return { id: photo.id, url };
            } catch (error) {
                logger.error(`Error uploading photo ${photo.id}`, error);
                throw error;
            }
        });

        return Promise.all(uploadPromises);
    },
};
