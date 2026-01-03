import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TodoService } from './todo.service';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodoController {
  constructor(private todoService: TodoService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateTodoDto) {
    return this.todoService.create(req.user.userId, dto);
  }

  @Get()
  async findAll(@Request() req, @Query() query: QueryTodoDto) {
    return this.todoService.findAll(req.user.userId, query);
  }

  @Get('statistics')
  async getStatistics(@Request() req) {
    return this.todoService.getStatistics(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.todoService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todoService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    await this.todoService.remove(id, req.user.userId);
    return { message: '删除成功' };
  }
}

