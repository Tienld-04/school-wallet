import axiosClient from './axiosClient';
import type {
  MerchantRevenue,
  RevenueOverview,
  RevenueTimeSeriesPoint,
  StatsGranularity,
} from '../types';

const adminStatsApi = {
  getRevenueOverview: (from?: string, to?: string): Promise<RevenueOverview> =>
    axiosClient.get<RevenueOverview>('/transactions/dashboard/revenue/overview', {
      params: { ...(from && { from }), ...(to && { to }) },
    }),

  getRevenueTimeSeries: (
    granularity: StatsGranularity,
    from?: string,
    to?: string,
  ): Promise<RevenueTimeSeriesPoint[]> =>
    axiosClient.get<RevenueTimeSeriesPoint[]>('/transactions/dashboard/revenue/timeseries', {
      params: { granularity, ...(from && { from }), ...(to && { to }) },
    }),

  getRevenueByMerchant: (from?: string, to?: string): Promise<MerchantRevenue[]> =>
    axiosClient.get<MerchantRevenue[]>('/transactions/dashboard/revenue/by-merchant', {
      params: { ...(from && { from }), ...(to && { to }) },
    }),
};

export default adminStatsApi;
