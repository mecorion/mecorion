export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function assertFound<T>(value: T | null | undefined, code: string, message: string): T {
  if (value === null || value === undefined) {
    throw new ApiError(404, code, message);
  }

  return value;
}
