import { apiRequest } from './api-request';
import { ICreateReportPayload } from '@interfaces/question';

class ReportServiceFE {
  async create(payload: ICreateReportPayload): Promise<any> {
    return apiRequest.post('/reports', payload);
  }
}

export const reportService = new ReportServiceFE();
