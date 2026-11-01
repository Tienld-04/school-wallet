const TOKEN_KEY = 'school_wallet_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);

export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);
