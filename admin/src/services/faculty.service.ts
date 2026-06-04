import { apiRequest } from './api-request';

export interface IFaculty {
  _id: string;
  name: string;
  shortName?: string;
}

export interface IMajor {
  _id: string;
  name: string;
  shortName?: string;
  facultyId: string;
}

export interface IClass {
  _id: string;
  name: string;
  shortName?: string;
  majorId: string;
}

interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class FacultyService {
  // ─── Public (cho dropdown) ───
  async getAllFaculties(): Promise<IFaculty[]> {
    const res = (await apiRequest.get('/faculties')) as { data: IFaculty[] };
    return res.data;
  }

  async getMajorsByFaculty(facultyId: string): Promise<IMajor[]> {
    const res = (await apiRequest.get(`/faculties/${facultyId}/majors`)) as { data: IMajor[] };
    return res.data;
  }

  async getClassesByMajor(majorId: string): Promise<IClass[]> {
    const res = (await apiRequest.get(`/majors/${majorId}/classes`)) as { data: IClass[] };
    return res.data;
  }

  // ─── Admin CRUD ───
  async searchFaculties(params?: Record<string, any>): Promise<IPaginatedResponse<IFaculty>> {
    const res = (await apiRequest.get('/admin/faculties', { params })) as { data: IPaginatedResponse<IFaculty> };
    return res.data;
  }

  async createFaculty(payload: { name: string; shortName?: string }): Promise<IFaculty> {
    const res = (await apiRequest.post('/admin/faculties', payload)) as { data: IFaculty };
    return res.data;
  }

  async updateFaculty(id: string, payload: { name?: string; shortName?: string }): Promise<IFaculty> {
    const res = (await apiRequest.put(`/admin/faculties/${id}`, payload)) as { data: IFaculty };
    return res.data;
  }

  async deleteFaculty(id: string): Promise<void> {
    await apiRequest.delete(`/admin/faculties/${id}`);
  }

  async searchMajors(params?: Record<string, any>): Promise<IPaginatedResponse<IMajor>> {
    const res = (await apiRequest.get('/admin/majors', { params })) as { data: IPaginatedResponse<IMajor> };
    return res.data;
  }

  async createMajor(payload: { name: string; shortName?: string; facultyId: string }): Promise<IMajor> {
    const res = (await apiRequest.post('/admin/majors', payload)) as { data: IMajor };
    return res.data;
  }

  async updateMajor(id: string, payload: { name?: string; shortName?: string; facultyId?: string }): Promise<IMajor> {
    const res = (await apiRequest.put(`/admin/majors/${id}`, payload)) as { data: IMajor };
    return res.data;
  }

  async deleteMajor(id: string): Promise<void> {
    await apiRequest.delete(`/admin/majors/${id}`);
  }

  async searchClasses(params?: Record<string, any>): Promise<IPaginatedResponse<IClass>> {
    const res = (await apiRequest.get('/admin/classes', { params })) as { data: IPaginatedResponse<IClass> };
    return res.data;
  }

  async createClass(payload: { name: string; shortName?: string; majorId: string }): Promise<IClass> {
    const res = (await apiRequest.post('/admin/classes', payload)) as { data: IClass };
    return res.data;
  }

  async updateClass(id: string, payload: { name?: string; shortName?: string; majorId?: string }): Promise<IClass> {
    const res = (await apiRequest.put(`/admin/classes/${id}`, payload)) as { data: IClass };
    return res.data;
  }

  async deleteClass(id: string): Promise<void> {
    await apiRequest.delete(`/admin/classes/${id}`);
  }
}

export const facultyService = new FacultyService();
