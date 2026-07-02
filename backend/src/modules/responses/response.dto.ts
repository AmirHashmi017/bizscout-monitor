import type { Pagination } from '../../utils/pagination';

export interface ResponseDto {
  _id: string;
  timestamp: string;
  url: string;
  method: string;
  statusCode: number;
  success: boolean;
  responseTimeMs: number;
  responseSizeBytes: number;
  isAnomaly: boolean;
  error?: string;
  requestPayload?: unknown;
  responseBody?: unknown;
}

export interface ResponseListDto {
  items: ResponseDto[];
  pagination: Pagination;
}
