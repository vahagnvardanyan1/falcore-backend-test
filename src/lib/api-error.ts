export interface ApiErrorDetails {
  status: number;
  statusText: string;
  url: string;
  method: string;
  requestBody: string | null;
  responseBody: string | null;
  timestamp: string;
}

export class ApiError extends Error {
  public readonly details: ApiErrorDetails;

  constructor(details: ApiErrorDetails) {
    super(`API ${details.status} ${details.statusText}: ${details.method} ${details.url}`);
    this.name = "ApiError";
    this.details = details;
  }
}

export const extractApiError = (error: unknown): ApiErrorDetails | null => {
  if (error instanceof ApiError) {
    return error.details;
  }
  return null;
};

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return `${error.details.status} ${error.details.statusText} — ${error.details.method} ${error.details.url}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
