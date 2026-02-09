import { apiClient } from './client';
import type { Photo } from '@/types/photo.types';

export const uploadService = {
    async uploadPhoto(photo: Photo, onProgress?: (progress: number) => void): Promise<string> {
        const formData = new FormData();
        formData.append('file', photo.compressed || photo.file);

        const response = await apiClient.post('/upload/photo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    onProgress(percentCompleted);
                }
            },
        });

        return response.data.url;
    },

    async uploadPhotos(photos: Photo[]): Promise<Array<{ id: string; url: string }>> {
        const uploadPromises = photos.map(async (photo) => {
            if (photo.url) return { id: photo.id, url: photo.url }; // Já enviado

            try {
                const url = await this.uploadPhoto(photo, (progress) => {
                    // Update local progress if needed, usually handled by component state
                    photo.uploadProgress = progress;
                });
                photo.uploaded = true;
                photo.url = url;
                return { id: photo.id, url };
            } catch (error) {
                console.error(`Error uploading photo ${photo.id}`, error);
                throw error;
            }
        });

        return Promise.all(uploadPromises);
    },
};
