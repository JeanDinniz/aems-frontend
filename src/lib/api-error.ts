import { AxiosError } from 'axios';

/**
 * FastAPI validation error item shape.
 */
interface ValidationErrorItem {
    loc: (string | number)[];
    msg: string;
    type: string;
}

/**
 * Possible shapes of FastAPI error responses.
 */
interface ApiErrorData {
    detail?: string | ValidationErrorItem[];
    message?: string;
}

/**
 * Extract a human-readable error message from an Axios/API error.
 * Handles both FastAPI string details and validation error arrays.
 */
export function getApiErrorMessage(error: Error, fallback = 'Tente novamente.'): string {
    if (!isAxiosError(error)) return error.message || fallback;

    const data = error.response?.data as ApiErrorData | undefined;
    if (!data) return fallback;

    if (typeof data.detail === 'string') return data.detail;

    if (Array.isArray(data.detail)) {
        return data.detail.map((e) => e.msg).join('; ');
    }

    if (typeof data.message === 'string') return data.message;

    return fallback;
}

function isAxiosError(error: unknown): error is AxiosError {
    return error instanceof Error && 'isAxiosError' in error;
}
