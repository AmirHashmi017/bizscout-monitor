import { ResponseModel } from './response.model';
import { buildPagination } from '../../utils/pagination';
import { getRollingStats, RollingStats } from '../monitoring/stats.service';
import type { ListResponsesQuery } from './response.validation';
import type { ResponseListDto } from './response.dto';

export async function listResponses(query: ListResponsesQuery): Promise<ResponseListDto> {
  const { page, limit, anomaliesOnly } = query;
  const filter = anomaliesOnly ? { isAnomaly: true } : {};

  const [items, total] = await Promise.all([
    ResponseModel.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ResponseModel.countDocuments(filter),
  ]);

  return {
    items: items as unknown as ResponseListDto['items'],
    pagination: buildPagination(page, limit, total),
  };
}

export function getStats(): Promise<RollingStats> {
  return getRollingStats();
}
