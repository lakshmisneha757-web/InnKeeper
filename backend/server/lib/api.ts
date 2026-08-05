import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const apiClient = {
  rooms: {
    list: (params?: any) => api.get("/rooms", { params }),
    get: (id: string) => api.get(`/rooms/${id}`),
    create: (data: any) => api.post("/rooms", data),
    update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
    remove: (id: string) => api.delete(`/rooms/${id}`),
  },
  reservations: {
    list: (params?: any) => api.get("/reservations", { params }),
    create: (data: any) => api.post("/reservations", data),
    update: (id: string, data: any) => api.put(`/reservations/${id}`, data),
    remove: (id: string) => api.delete(`/reservations/${id}`),
  },
  guests: {
    list: (params?: any) => api.get("/guests", { params }),
    create: (data: any) => api.post("/guests", data),
    update: (id: string, data: any) => api.put(`/guests/${id}`, data),
    remove: (id: string) => api.delete(`/guests/${id}`),
  },
  payments: {
    list: (params?: any) => api.get("/payments", { params }),
    create: (data: any) => api.post("/payments", data),
  },
  housekeeping: {
    list: (params?: any) => api.get("/housekeeping", { params }),
    create: (data: any) => api.post("/housekeeping", data),
    update: (id: string, data: any) => api.put(`/housekeeping/${id}`, data),
  },
  maintenance: {
    list: (params?: any) => api.get("/maintenance", { params }),
    create: (data: any) => api.post("/maintenance", data),
    update: (id: string, data: any) => api.put(`/maintenance/${id}`, data),
  },
  notifications: {
    list: (params?: any) => api.get("/notifications", { params }),
    create: (data: any) => api.post("/notifications", data),
  },
  analytics: {
    get: () => api.get("/analytics"),
  },
  dashboard: {
    get: () => api.get("/dashboard"),
  },
  weather: {
    get: () => api.get("/weather"),
  },
  roomAvailability: {
    list: (params?: any) => api.get("/room-availability", { params }),
  },
};
