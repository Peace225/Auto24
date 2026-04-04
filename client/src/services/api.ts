import { axiosInstance } from '../lib/axios';

export const api = {
  get: (url: string, params?: any) => axiosInstance.get(url, { params }),
  post: (url: string, data: any) => axiosInstance.post(url, data),
  put: (url: string, data: any) => axiosInstance.put(url, data),
  delete: (url: string) => axiosInstance.delete(url),
};