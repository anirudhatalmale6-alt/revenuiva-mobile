import client from './client';
import type { Customer } from '../types';

export const getDashboard = () => client.get('/customer/dashboard');

export const getAppointments = (page?: number) =>
  client.get('/customer/appointments', { params: page ? { page } : undefined });

export const cancelAppointment = (id: number) =>
  client.post(`/customer/appointments/${id}/cancel`);

export const getProfile = () => client.get('/customer/profile');

export const updateProfile = (data: Partial<Customer>) =>
  client.put('/customer/profile', data);

export const updatePassword = (data: {
  current_password?: string;
  password: string;
  password_confirmation: string;
}) => client.put('/customer/profile/password', data);

export const getPackages = () => client.get('/customer/packages');

export const getMessages = () => client.get('/customer/messages');

export const sendMessage = (body: string) =>
  client.post('/customer/messages', { body });
