export interface ValidationError {
  type: string;
  description: string;
  rows: number[];
  count: number;
}

export interface ValidationResponse {
  isValid: boolean;
  errors?: ValidationError[];
  message: string;
}

