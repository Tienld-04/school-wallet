import axiosClient from './axiosClient';
import type {
  MerchantBreakdown,
  MerchantEarningsOverview,
  MerchantEarningsTimeSeriesPoint,
  StatsGranularity,
} from '../types';

/**
 * API thống kê doanh thu cho user là chủ merchant.
 * Backend tự filter theo to_user_id = current user (lấy từ JWT) → user chỉ thấy data của mình.
 */
const merchantStatsApi = {
  getOverview: (from?: string, to?: string): Promise<MerchantEarningsOverview> =>
    axiosClient.get<MerchantEarningsOverview>('/transactions/merchant/revenue/overview', {
      params: { ...(from && { from }), ...(to && { to }) },
    }),

  getTimeSeries: (
    granularity: StatsGranularity,
    from?: string,
    to?: string,
  ): Promise<MerchantEarningsTimeSeriesPoint[]> =>
    axiosClient.get<MerchantEarningsTimeSeriesPoint[]>('/transactions/merchant/revenue/timeseries', {
      params: { granularity, ...(from && { from }), ...(to && { to }) },
    }),

  getByMerchant: (from?: string, to?: string): Promise<MerchantBreakdown[]> =>
    axiosClient.get<MerchantBreakdown[]>('/transactions/merchant/revenue/by-merchant', {
      params: { ...(from && { from }), ...(to && { to }) },
    }),
};

export default merchantStatsApi;
