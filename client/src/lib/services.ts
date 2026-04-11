import { api } from './api';

export const authApi = {
  signup: (data: { username: string; email: string; phone: string; password: string }) =>
    api.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),
};

export const plaidApi = {
  createLinkToken: () => api.post('/plaid/create-link-token', {}),
  exchangePublicToken: (public_token: string) => api.post('/plaid/exchange-token', { public_token }),
  getAccounts: () => api.get('/plaid/accounts'),
  syncTransactions: () => api.post('/plaid/sync', {}),
  getTransactions: (params?: { limit?: number; offset?: number; accountId?: string; category?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.accountId) qs.set('accountId', params.accountId);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    return api.get(`/plaid/transactions?${qs.toString()}`);
  },
  getConnectedItems: () => api.get('/plaid/items'),
  removeItem: (itemId: string) => api.delete(`/plaid/items/${itemId}`),
};

export const transferApi = {
  createPaymentIntent: (data: { fromAccountId: string; toAccountId: string; amount: number; note?: string }) =>
    api.post('/transfers/create-intent', data),
  confirmTransfer: (data: { transferId: string; paymentIntentId: string }) =>
    api.post('/transfers/confirm', data),
  getTransfers: () => api.get('/transfers'),
};
