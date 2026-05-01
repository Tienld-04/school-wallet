import axiosClient from './axiosClient';
import type { StatsOverview, TimeSeriesPoint, StatsGranularity } from '../types';

const adminStatsApi = {
  getOverview: (from?: string, to?: string): Promise<StatsOverview> =>
    axiosClient.get<StatsOverview>('/transactions/dashboard/overview', {
      params: { ...(from && { from }), ...(to && { to }) },
    }),

  getTimeSeries: (
    granularity: StatsGranularity,
    from?: string,
    to?: string,
  ): Promise<TimeSeriesPoint[]> =>
    axiosClient.get<TimeSeriesPoint[]>('/transactions/dashboard/timeseries', {
      params: { granularity, ...(from && { from }), ...(to && { to }) },
    }),
};

export default adminStatsApi;
