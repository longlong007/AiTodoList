import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { Importance, TodoStatus } from '../entities/todo.entity';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Importance, { message: '重要性必须是 A, B, C, D 之一' })
  @IsOptional()
  importance?: Importance;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  urgency?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Importance, { message: '重要性必须是 A, B, C, D 之一' })
  @IsOptional()
  importance?: Importance;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  urgency?: number;

  @IsEnum(TodoStatus, { message: '状态不正确' })
  @IsOptional()
  status?: TodoStatus;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class QueryTodoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsEnum(TodoStatus)
  @IsOptional()
  status?: TodoStatus;

  @IsEnum(Importance)
  @IsOptional()
  importance?: Importance;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  urgency?: number;

  @IsString()
  @IsOptional()
  sortBy?: 'priority' | 'createdAt' | 'dueDate';
}

