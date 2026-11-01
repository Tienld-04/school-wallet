import type { QrVerifyResponse } from '../types';

let pendingQr: QrVerifyResponse | null = null;

export const setPendingQr = (data: QrVerifyResponse): void => {
  pendingQr = data;
};

export const consumePendingQr = (): QrVerifyResponse | null => {
  const data = pendingQr;
  pendingQr = null;
  return data;
};
