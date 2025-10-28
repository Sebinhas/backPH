import { IsNotEmpty, IsNumber } from 'class-validator';

export class ValidateCsvDto {
  @IsNotEmpty()
  @IsNumber()
  fincaId: number;
}

