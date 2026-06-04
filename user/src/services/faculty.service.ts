import { apiRequest } from './api-request';

export interface IFaculty {
  _id: string;
  name: string;
}

export interface IMajor {
  _id: string;
  name: string;
  facultyId: string;
}

class FacultyService {
  async getAllFaculties(): Promise<IFaculty[]> {
    const res = (await apiRequest.get('/faculties')) as { data: IFaculty[] };
    return res.data;
  }

  async getMajorsByFaculty(facultyId: string): Promise<IMajor[]> {
    const res = (await apiRequest.get(`/faculties/${facultyId}/majors`)) as { data: IMajor[] };
    return res.data;
  }
}

export const facultyService = new FacultyService();
