import axios from 'axios';

// Default to standard local FastAPI port 8000
const API_BASE_URL = 'http://127.0.0.1:8000';

export const uploadData = async (file, text) => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (text) {
    formData.append('text', text);
  }

  const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data; // { job_id, file_name, file_type, text_input, status }
};

export const analyzeData = async (jobId) => {
  const response = await axios.get(`${API_BASE_URL}/analyze`, {
    params: { job_id: jobId },
  });
  
  return response.data; // { final_output, debug }
};
