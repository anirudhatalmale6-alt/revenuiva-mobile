import client from './client';

export const sendCode = (phone: string) =>
  client.post('/auth/send-code', { phone });

export const verifyCode = (phone: string, code: string) =>
  client.post('/auth/verify-code', { phone, code });

export const login = (phone: string, password: string) =>
  client.post('/auth/login', { phone, password });

export const setPassword = (password: string, password_confirmation: string) =>
  client.post('/auth/set-password', { password, password_confirmation });

export const logout = () => client.post('/auth/logout');
