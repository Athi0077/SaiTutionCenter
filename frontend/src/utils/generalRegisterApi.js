import api from './api';

export const getStudents = async () => {
  const response = await api.get('/general-register/students');
  return response.data;
};

export const registerStudent = async (studentData) => {
  const response = await api.post('/general-register/students', studentData);
  return response.data;
};

export const updateStudent = async (id, data) => {
  const response = await api.put(`/general-register/students/${id}`, data);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/general-register/students/${id}`);
  return response.data;
};
