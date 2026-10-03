import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

// Semesters API
export const semestersApi = {
  getAll: async () => {
    const { data } = await api.get("/semesters");
    return data.semesters || [];
  },
  create: async (payload) => {
    const { data } = await api.post("/semesters", payload);
    return data.semester;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/semesters/${id}`, payload);
    return data.semester;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/semesters/${id}`);
    return data;
  },
};

// Subjects API
export const subjectsApi = {
  getAll: async (semesterId) => {
    const url = semesterId ? `/subjects?semester=${semesterId}` : "/subjects";
    const { data } = await api.get(url);
    return data.subjects || [];
  },
  create: async (payload) => {
    const { data } = await api.post("/subjects", payload);
    return data.subject;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/subjects/${id}`, payload);
    return data.subject;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/subjects/${id}`);
    return data;
  },
};

// Experiments API
export const experimentsApi = {
  getAll: async (subjectId) => {
    const url = subjectId ? `/experiments?subject=${subjectId}` : "/experiments";
    const { data } = await api.get(url);
    return data.experiments || [];
  },
  getById: async (id) => {
    const { data } = await api.get(`/experiments/${id}`);
    return data.experiment;
  },
  create: async (payload) => {
    const { data } = await api.post("/experiments", payload);
    return data.experiment;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/experiments/${id}`, payload);
    return data.experiment;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/experiments/${id}`);
    return data;
  },
};

// Students API (Admin only)
export const studentsApi = {
  getAll: async () => {
    const { data } = await api.get("/auth/students");
    return data.students || [];
  },
  create: async (payload) => {
    const { data } = await api.post("/auth/students", payload);
    return data.user;
  },
};

// Documents API (Student only)
export const documentsApi = {
  getMyDocuments: async () => {
    const { data } = await api.get("/documents");
    return data.documents || [];
  },
  upload: async (formData) => {
    const { data } = await api.post("/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data.document;
  },
  viewBlob: async (id) => {
    const response = await api.get(`/documents/${id}`, {
      responseType: "blob",
    });
    return response.data;
  },
  delete: async (id) => {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },
};

// Print History API (Student only)
export const printHistoryApi = {
  log: async (documentId) => {
    const { data } = await api.post("/print-history", { documentId });
    return data;
  },
  getMy: async () => {
    const { data } = await api.get("/print-history");
    return data.history || [];
  },
  getAdminStats: async () => {
    const { data } = await api.get("/print-history/admin/stats");
    return data.stats;
  },
};

// Account / preferences API (any authenticated user)
export const accountApi = {
  updateProfile: async (payload) => {
    const { data } = await api.patch("/auth/me", payload);
    return data;
  },
  changePassword: async (payload) => {
    const { data } = await api.patch("/auth/me/password", payload);
    return data;
  },
  updatePreferences: async (payload) => {
    const { data } = await api.patch("/auth/me/preferences", payload);
    return data;
  },
  saveFcmToken: async (token) => {
    const { data } = await api.post("/auth/me/fcm-token", { token });
    return data;
  },
  removeFcmToken: async (token) => {
    const { data } = await api.delete("/auth/me/fcm-token", { data: { token } });
    return data;
  },
};

export default api;
