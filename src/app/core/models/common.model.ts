export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

type ApiResponseLike<T> = Partial<ApiResponse<T>> & { data?: T };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return isObject(value) && 'data' in value;
}

export function unwrapApiResponse<T>(value: ApiResponse<T> | T): T {
  return isApiResponse<T>(value) ? value.data : value;
}

export function normalizeApiResponse<T>(
  value: ApiResponseLike<T> | T,
  fallbackMessage = 'OK',
  fallbackStatusCode = 200,
): ApiResponse<T> {
  if (isApiResponse<T>(value)) {
    return {
      statusCode: value.statusCode ?? fallbackStatusCode,
      message: value.message ?? fallbackMessage,
      data: value.data,
      timestamp: value.timestamp ?? new Date().toISOString(),
    };
  }

  return {
    statusCode: fallbackStatusCode,
    message: fallbackMessage,
    data: value as T,
    timestamp: new Date().toISOString(),
  };
}

export interface PaginatedResponse<T> {
  statusCode: number;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
}
