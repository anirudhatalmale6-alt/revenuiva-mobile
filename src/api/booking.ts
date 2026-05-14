import client from './client';

export const getServices = () => client.get('/booking/services');

export const getStaff = () => client.get('/booking/staff');

export const getSlots = (params: {
  date: string;
  service_id: number;
  staff_member_id: number;
}) => client.get('/booking/slots', { params });

export const book = (data: {
  service_id: number;
  staff_member_id: number;
  date: string;
  time: string;
  notes?: string;
}) => client.post('/booking/book', data);

export const confirmDeposit = (data: {
  appointment_id: number;
  payment_method_id?: string;
}) => client.post('/booking/confirm-deposit', data);
