export class QueueEvent {
  constructor(
    public readonly name: string,
    public readonly data: any,
    public readonly options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
    }
  ) {}
}

