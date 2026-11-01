import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'school_wallet_token';

export const getToken = (): Promise<string | null> => SecureStore.getItemAsync(TOKEN_KEY);

export const setToken = (token: string): Promise<void> => SecureStore.setItemAsync(TOKEN_KEY, token);

export const removeToken = (): Promise<void> => SecureStore.deleteItemAsync(TOKEN_KEY);
