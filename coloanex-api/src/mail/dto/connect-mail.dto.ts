import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConnectMailDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  host: string;

  @IsString()
  @IsNotEmpty()
  port: string;
}
