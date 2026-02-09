export interface CompressionOptions {
    maxWidth: number;
    maxHeight: number;
    quality: number; // 0-1
}

export async function compressImage(
    file: File,
    options: CompressionOptions
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                // Calcular novas dimensões mantendo aspect ratio
                if (width > options.maxWidth) {
                    height = (height * options.maxWidth) / width;
                    width = options.maxWidth;
                }
                if (height > options.maxHeight) {
                    width = (width * options.maxHeight) / height;
                    height = options.maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    file.type,
                    options.quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}
