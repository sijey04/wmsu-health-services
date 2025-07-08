import axios from 'axios';

// Define API URLs for both backends
const EXPRESS_API_URL = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3001/api';
const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

// Create axios instance for Express backend
const expressApiClient = axios.create({
  baseURL: EXPRESS_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create axios instance for Django backend
const djangoApiClient = axios.create({
  baseURL: DJANGO_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Default API client (Express)
const apiClient = expressApiClient;

// Add request interceptor to add auth token to requests
const addAuthInterceptor = (client: any) => {
  client.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('access_token');
      console.log('API request token:', token ? `Token found: ${token.substring(0, 50)}...` : 'No token found');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
};

// Add response interceptor for error handling
const addErrorInterceptor = (client: any) => {
  client.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      // Handle 401 Unauthorized errors (expired token)
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        
        // Redirect to login page if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Add interceptors to both API clients
addAuthInterceptor(expressApiClient);
addErrorInterceptor(expressApiClient);
addAuthInterceptor(djangoApiClient);
addErrorInterceptor(djangoApiClient);

// Export API clients
export { djangoApiClient, expressApiClient };

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  register: (userData: any) => apiClient.post('/auth/register', userData),
};

// Patient APIs
export const patientsAPI = {
  getAll: () => djangoApiClient.get('/patients/'),
  getById: (id: string | number) => djangoApiClient.get(`/patients/${id}/`),
  getByUserId: (userId: string | number) => djangoApiClient.get(`/patients/`, { params: { user: userId } }),
  create: (patientData: any) => djangoApiClient.post('/patients/', patientData),
  update: (id: string | number, patientData: any) => djangoApiClient.put(`/patients/${id}/`, patientData),
  delete: (id: string | number) => djangoApiClient.delete(`/patients/${id}/`),
};

// Appointment APIs
export const appointmentsAPI = {
  getAll: (params?: any) => djangoApiClient.get('/appointments/', { params }),
  getById: (id: string | number) => djangoApiClient.get(`/appointments/${id}/`),
  create: (appointmentData: any) => djangoApiClient.post('/appointments/', appointmentData),
  update: (id: string | number, appointmentData: any) => djangoApiClient.patch(`/appointments/${id}/`, appointmentData),
  delete: (id: string | number) => djangoApiClient.delete(`/appointments/${id}/`),
  reschedule: (id: string | number, rescheduleData: any) => djangoApiClient.post(`/appointments/${id}/reschedule/`, rescheduleData),
  // Check if appointment has form data
  hasFormData: (id: string | number) => djangoApiClient.get(`/appointments/${id}/has_form_data/`),
  // View form data as PDF in browser
  viewFormData: async (id: string | number) => {
    const response = await djangoApiClient.get(`/appointments/${id}/view_form_data/`, {
      responseType: 'blob',
    });
    return response;
  },
  // Download form data as PDF
  downloadFormData: async (id: string | number) => {
    const response = await djangoApiClient.get(`/appointments/${id}/download_form_data/`, {
      responseType: 'blob',
    });
    return response;
  },
  // View medical certificate as PDF in browser
  viewMedicalCertificate: async (id: string | number) => {
    const response = await djangoApiClient.get(`/appointments/${id}/view_medical_certificate/`, {
      responseType: 'blob',
    });
    return response;
  },
  // Download medical certificate as PDF
  downloadMedicalCertificate: async (id: string | number) => {
    const response = await djangoApiClient.get(`/appointments/${id}/download_medical_certificate/`, {
      responseType: 'blob',
    });
    return response;
  },
};

export const dentalFormAPI = {
  getData: (appointmentId: string) => djangoApiClient.get(`/dental-forms/get_patient_data/?appointment_id=${appointmentId}`),
  create: (dentalFormData: any) => djangoApiClient.post('/dental-forms/', dentalFormData),
  submitAndComplete: (dentalFormData: any) => djangoApiClient.post('/dental-forms/submit_and_complete/', dentalFormData),
  getAll: () => djangoApiClient.get('/dental-forms/'),
  getById: (id: string | number) => djangoApiClient.get(`/dental-forms/${id}/`),
  getByAppointment: (appointmentId: string | number) => djangoApiClient.get(`/dental-forms/by_appointment/?appointment_id=${appointmentId}`),
  // Check if dental form exists for appointment
  checkFormExists: (appointmentId: string | number) => djangoApiClient.get('/dental-forms/', { params: { appointment_id: appointmentId } }),
};

export const medicalFormAPI = {
  getData: (appointmentId: string) => djangoApiClient.get(`/medical-forms/get_patient_data/?appointment_id=${appointmentId}`),
  create: (medicalFormData: any) => djangoApiClient.post('/medical-forms/', medicalFormData),
  getAll: () => djangoApiClient.get('/medical-forms/'),
  getById: (id: string | number) => djangoApiClient.get(`/medical-forms/${id}/`),
  // Check if medical form exists for appointment
  checkFormExists: (appointmentId: string | number) => djangoApiClient.get('/medical-form-data/', { params: { appointment_id: appointmentId } }),
};

// Medical Records APIs
export const recordsAPI = {
  getByPatientId: (patientId: string | number) => apiClient.get(`/patients/${patientId}/records`),
  create: (recordData: any) => apiClient.post('/records', recordData),
  update: (id: string | number, recordData: any) => apiClient.put(`/records/${id}`, recordData),
  delete: (id: string | number) => apiClient.delete(`/records/${id}`),
};

// Staff APIs
export const staffAPI = {
  getAll: () => apiClient.get('/staff'),
  getById: (id: string | number) => apiClient.get(`/staff/${id}`),
  create: (staffData: any) => apiClient.post('/staff', staffData),
  update: (id: string | number, staffData: any) => apiClient.put(`/staff/${id}`, staffData),
  delete: (id: string | number) => apiClient.delete(`/staff/${id}`),
};

// Inventory APIs
export const inventoryAPI = {
  getAll: () => apiClient.get('/inventory'),
  getById: (id: string | number) => apiClient.get(`/inventory/${id}`),
  create: (itemData: any) => apiClient.post('/inventory', itemData),
  update: (id: string | number, itemData: any) => apiClient.put(`/inventory/${id}`, itemData),
  delete: (id: string | number) => apiClient.delete(`/inventory/${id}`),
};

// Waiver APIs (Django backend)
export const waiversAPI = {
  create: (waiverData: any) => djangoApiClient.post('/waivers/', waiverData),
  getAll: () => djangoApiClient.get('/waivers/'),
  getById: (id: string | number) => djangoApiClient.get(`/waivers/${id}/`),
  getByPatient: (patientId: string | number) => djangoApiClient.get(`/waivers/?patient=${patientId}`),
  checkStatus: (userId: string | number) => {
    // Check if user has a waiver by looking at all waivers and filtering by user
    return djangoApiClient.get('/waivers/').then(response => {
      const waivers = Array.isArray(response.data) ? response.data : [];
      const hasWaiver = waivers.some(w => String(w.user) === String(userId));
      return { data: { hasWaiver } };
    });
  },
};

function getAuthHeaders() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Patient Profile APIs
export const patientProfileAPI = {
  get: () => djangoApiClient.get('/patients/my_profile/', {
    headers: {
      ...getAuthHeaders(),
    },
  }),
  getAllProfiles: () => djangoApiClient.get('/patients/my_profiles/', {
    headers: {
      ...getAuthHeaders(),
    },
  }),
  autofillData: () => djangoApiClient.get('/patients/autofill_data/', {
    headers: {
      ...getAuthHeaders(),
    },
  }),
  update: (formData: any) => djangoApiClient.put('/patients/update_my_profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...getAuthHeaders(),
    },
  }),
  create: (formData: any) => djangoApiClient.post('/patients/create_my_profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...getAuthHeaders(),
    },
  }),
};

export const medicalDocumentsAPI = {
  // Core CRUD operations
  getAll: (params?: any) =>
    djangoApiClient.get('/medical-documents/', {
      headers: { ...getAuthHeaders() },
      params,
    }),
  
  getById: (id: number) =>
    djangoApiClient.get(`/medical-documents/${id}/`, {
      headers: { ...getAuthHeaders() },
    }),
  
  create: (formData: FormData) =>
    djangoApiClient.post('/medical-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    }),
  
  update: (id: number, formData: FormData) =>
    djangoApiClient.put(`/medical-documents/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    }),
  
  delete: (id: number) =>
    djangoApiClient.delete(`/medical-documents/${id}/`, {
      headers: { ...getAuthHeaders() },
    }),

  // Patient-specific operations
  getMyDocuments: () =>
    djangoApiClient.get('/medical-documents/my_documents/', {
      headers: { ...getAuthHeaders() },
    }),
  
  updateMyDocuments: (formData: FormData) =>
    djangoApiClient.post('/medical-documents/update_my_documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    }),
  
  submitForReview: (id: number) =>
    djangoApiClient.post(`/medical-documents/submit_for_review/`, { id }, {
      headers: { ...getAuthHeaders() },
    }),

  // Staff review operations
  verify: (id: number) =>
    djangoApiClient.post(`/medical-documents/${id}/verify/`, {}, {
      headers: { ...getAuthHeaders() },
    }),
  
  reject: (id: number, reason: string) =>
    djangoApiClient.post(`/medical-documents/${id}/reject/`, { reason }, {
      headers: { ...getAuthHeaders() },
    }),
  
  issueCertificate: (id: number) =>
    djangoApiClient.post(`/medical-documents/${id}/issue_certificate/`, {}, {
      headers: { ...getAuthHeaders() },
    }),
  
  sendEmail: (id: number, email_type: string = 'certificate') =>
    djangoApiClient.post(`/medical-documents/${id}/send_email/`, { email_type }, {
      headers: { ...getAuthHeaders() },
    }),

  // Advise patient for consultation
  adviseForConsultation: (id: number, reason: string) =>
    djangoApiClient.post(`/medical-documents/${id}/advise_for_consultation/`, { reason }, {
      headers: { ...getAuthHeaders() },
    }),

  // View medical certificate directly
  viewCertificate: async (id: number) =>
    djangoApiClient.get(`/medical-documents/${id}/view_certificate/`, {
      responseType: 'blob',
      headers: { ...getAuthHeaders() },
    }),

  // Download medical certificate directly  
  downloadCertificate: async (id: number) =>
    djangoApiClient.get(`/medical-documents/${id}/download_certificate/`, {
      responseType: 'blob',
      headers: { ...getAuthHeaders() },
    }),

  // Cancel consultation advice - reset status back to pending
  cancelConsultationAdvice: (id: number) =>
    djangoApiClient.patch(`/medical-documents/${id}/`, { 
      status: 'pending',
      consultation_reason: '',
      advised_for_consultation_by: null,
      advised_for_consultation_at: null
    }, {
      headers: { ...getAuthHeaders() },
    }),

  // Legacy methods for backward compatibility
  upload: (formData: FormData) =>
    djangoApiClient.post('/medical-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...getAuthHeaders(),
      },
    }),
  
  getByPatient: (patientId: string | number) =>
    djangoApiClient.get(`/medical-documents/?patient_id=${patientId}`, {
      headers: { ...getAuthHeaders() },
    }),
};

// Academic School Years API
export const academicSchoolYearsAPI = {
  getAll: () =>
    djangoApiClient.get('/academic-school-years/', {
      headers: { ...getAuthHeaders() },
    }),
  
  getCurrent: () =>
    djangoApiClient.get('/academic-school-years/current/', {
      headers: { ...getAuthHeaders() },
    }),
  
  setCurrent: (id: number) =>
    djangoApiClient.post(`/academic-school-years/${id}/set_current/`, {}, {
      headers: { ...getAuthHeaders() },
    }),
};

export default apiClient;
