export interface ISetting {
  _id: string;
  key: string;
  value: any;
  name: string;
  description?: string;
  type: string;
  group?: string;
  ordering?: number;
  visible?: boolean;
  editable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ISettingUpdatePayload {
  key: string;
  value: any;
}
