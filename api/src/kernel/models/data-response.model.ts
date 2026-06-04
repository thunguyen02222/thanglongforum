export class DataResponse<T> {
  data: T;
  message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    if (message) {
      this.message = message;
    }
  }

  static ok<T>(data: T, message?: string): DataResponse<T> {
    return new DataResponse(data, message);
  }
}

