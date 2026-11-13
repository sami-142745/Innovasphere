import { api } from '../api/client';
import type { UserProfileDto, UserUpdateRequest, StudentProfileDto, StudentProfileUpdateRequest, FacultyProfileDto, FacultyProfileUpdateRequest } from '../types';

export const profileService = {
  getOwn(): Promise<UserProfileDto> {
    return api.get('/api/users/me').then((r) => r.data);
  },

  updateUser(payload: UserUpdateRequest): Promise<UserProfileDto> {
    return api.put('/api/users/me', payload).then((r) => r.data);
  },

  updateStudentProfile(payload: StudentProfileUpdateRequest): Promise<StudentProfileDto> {
    return api.put('/api/users/me/student-profile', payload).then((r) => r.data);
  },

  updateFacultyProfile(payload: FacultyProfileUpdateRequest): Promise<FacultyProfileDto> {
    return api.put('/api/users/me/faculty-profile', payload).then((r) => r.data);
  },

  getById(id: string): Promise<UserProfileDto> {
    return api.get(`/api/users/${id}`).then((r) => r.data);
  }
};
