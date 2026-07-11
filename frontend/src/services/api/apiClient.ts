import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { APP_CONFIG } from '../../config';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: APP_CONFIG.apiBaseUrl,
  timeout: APP_CONFIG.requestTimeoutMs,
  headers: {
    Accept: 'application/json',
  },
});

// Retry configurations
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
};

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry helper using exponential backoff
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let attempt = 0;
  while (attempt < config.maxAttempts) {
    try {
      return await requestFn();
    } catch (error: any) {
      attempt++;
      if (attempt >= config.maxAttempts) {
        throw error;
      }

      // Check if it's a rate limit or server error that warrants retry
      const status = error.response?.status;
      const isRetryable =
        status === 429 || // Too Many Requests
        status === 500 || // Internal Server Error
        status === 503;   // Service Unavailable

      if (!isRetryable) {
        throw error; // Fail fast for client input issues
      }

      // Exponential delay
      const delay = config.initialDelayMs * Math.pow(2, attempt - 1);
      toast.warning(`Request failed. Retrying in ${(delay / 1000).toFixed(1)}s (Attempt ${attempt}/${config.maxAttempts})...`);
      await sleep(delay);
    }
  }
  throw new Error('Retry attempts exhausted');
}

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add custom tracking headers if needed (e.g. Request ID)
    const requestId = Math.random().toString(36).substring(7);
    config.headers.set('X-Request-ID', requestId);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for standardized error mappings
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const errorData = error.response?.data as any;

    const errorDetails = {
      message: errorData?.message || 'A network error occurred. Please check your connection.',
      code: errorData?.code || 'NETWORK_FAILURE',
      status: status || 0,
      errors: errorData?.errors || null,
    };

    // Global toast notices for severe errors
    if (status === 429) {
      toast.error('Rate limit exceeded. Please wait a moment before trying again.');
    } else if (status === 413) {
      toast.error('File size exceeds the maximum limit (5MB).');
    } else if (status === 500) {
      toast.error('Internal server error occurred on backend AI pipelines.');
    }

    return Promise.reject(errorDetails);
  }
);
