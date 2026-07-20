/**
 * Axios API client — uses httpOnly cookies automatically.
 * All requests go through Next.js rewrites → backend.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalReq = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalReq._retry) {
      originalReq._retry = true;
      try {
        await api.post("/auth/refresh");
        return api(originalReq);
      } catch {
        // Refresh failed — redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    phone?: string;
    license_number?: string;
    specialization?: string;
  }) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
  listChildren: () => api.get("/auth/children"),
  createChild: (data: {
    name: string;
    age: number;
    gender?: string;
    avatar_color?: string;
    diagnosis_notes?: string;
    therapist_id?: string;
  }) => api.post("/auth/children", data),
  updateChild: (id: string, data: Partial<{ name: string; age: number; gender: string; avatar_color: string; diagnosis_notes: string }>) =>
    api.put(`/auth/children/${id}`, data),
  deleteChild: (id: string) => api.delete(`/auth/children/${id}`),
};

// ── Content ───────────────────────────────────────────────────────────────────
export const contentApi = {
  listModules: (publishedOnly = false) =>
    api.get(`/content/modules?published_only=${publishedOnly}`),
  getModule: (id: string) => api.get(`/content/modules/${id}`),
  createModule: (data: { name: string; description?: string; difficulty_level?: string }) =>
    api.post("/content/modules", data),
  updateModule: (id: string, data: object) => api.patch(`/content/modules/${id}`, data),
  publishModule: (id: string) => api.post(`/content/modules/${id}/publish`),
  addItem: (moduleId: string, data: {
    tamil_word: string;
    transliteration: string;
    english_translation: string;
    order_index: number;
    phoneme_breakdown?: object;
  }) => api.post(`/content/modules/${moduleId}/items`, data),
  updateItem: (moduleId: string, itemId: string, data: object) =>
    api.put(`/content/modules/${moduleId}/items/${itemId}`, data),
  deleteItem: (moduleId: string, itemId: string) =>
    api.delete(`/content/modules/${moduleId}/items/${itemId}`),
};

// ── Sessions ──────────────────────────────────────────────────────────────────
export const sessionsApi = {
  create: (childId: string, programId: string) =>
    api.post("/sessions", { child_id: childId, program_id: programId }),
  get: (sessionId: string) => api.get(`/sessions/${sessionId}`),
  complete: (sessionId: string) => api.post(`/sessions/${sessionId}/complete`),
  abandon: (sessionId: string) => api.post(`/sessions/${sessionId}/abandon`),
  submitAttempt: (sessionId: string, formData: FormData) =>
    api.post(`/sessions/${sessionId}/attempts`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAttemptStatus: (sessionId: string, attemptId: string) =>
    api.get(`/sessions/${sessionId}/attempts/${attemptId}/status`),
  listAttempts: (sessionId: string) =>
    api.get(`/sessions/${sessionId}/attempts`),
};

// ── Progress ──────────────────────────────────────────────────────────────────
export const progressApi = {
  summary: (childId: string) => api.get(`/progress/child/${childId}/summary`),
  timeseries: (childId: string, days = 30) =>
    api.get(`/progress/child/${childId}/timeseries?days=${days}`),
  byModule: (childId: string, moduleId?: string) =>
    api.get(`/progress/child/${childId}/by-module${moduleId ? `?module_id=${moduleId}` : ""}`),
  streaks: (childId: string) => api.get(`/progress/child/${childId}/streaks`),
};

// ── Parent ────────────────────────────────────────────────────────────────────
export const parentApi = {
  dashboard: () => api.get("/parent/dashboard"),
  programs: (childId: string) => api.get(`/parent/children/${childId}/programs`),
  progress: (childId: string) => api.get(`/parent/children/${childId}/progress`),
};

// ── Therapist ─────────────────────────────────────────────────────────────────
export const therapistApi = {
  dashboard: () => api.get("/therapist/dashboard"),
  children: () => api.get("/therapist/children"),
  createNote: (data: { child_id: string; content: string; note_type?: string }) =>
    api.post("/therapist/notes", data),
  getNotes: (childId: string) => api.get(`/therapist/notes/${childId}`),
  assignProgram: (data: { child_id: string; module_id: string; target_sessions_per_week?: number }) =>
    api.post("/therapist/assign-program", data),
};

// ── TTS ───────────────────────────────────────────────────────────────────────
export const ttsApi = {
  speak: (text: string) => `/api/tts/speak?text=${encodeURIComponent(text)}&lang=ta`,
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get("/admin/stats"),
  users: (params?: { role?: string; is_active?: boolean }) =>
    api.get("/admin/users", { params }),
  updateUser: (id: string, data: object) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  seed: () => api.post("/admin/seed"),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (unreadOnly = false) =>
    api.get(`/notifications?unread_only=${unreadOnly}`),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
  unreadCount: () => api.get("/notifications/unread-count"),
};

export default api;
