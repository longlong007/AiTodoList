import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo, Importance, TodoStatus } from './entities/todo.entity';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async create(userId: string, dto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create({
      ...dto,
      userId,
    });
    return this.todoRepository.save(todo);
  }

  async findAll(userId: string, query: QueryTodoDto): Promise<{ data: Todo[]; total: number }> {
    const { page = 1, limit = 20, status, importance, urgency, sortBy = 'priority' } = query;
    
    const qb = this.todoRepository.createQueryBuilder('todo')
      .where('todo.userId = :userId', { userId });

    // 筛选条件
    if (status) {
      qb.andWhere('todo.status = :status', { status });
    }
    if (importance) {
      qb.andWhere('todo.importance = :importance', { importance });
    }
    if (urgency) {
      qb.andWhere('todo.urgency = :urgency', { urgency });
    }

    // 排序：先按重要性（A>B>C>D），再按紧急程度（1>2>3>4>5）
    if (sortBy === 'priority') {
      qb.orderBy('todo.importance', 'ASC')
        .addOrderBy('todo.urgency', 'ASC');
    } else if (sortBy === 'createdAt') {
      qb.orderBy('todo.createdAt', 'DESC');
    } else if (sortBy === 'dueDate') {
      qb.orderBy('todo.dueDate', 'ASC');
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException('待办事项不存在');
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException('无权访问此待办事项');
    }

    return todo;
  }

  async update(id: string, userId: string, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id, userId);
    
    // 如果状态改为完成，记录完成时间
    if (dto.status === TodoStatus.COMPLETED && todo.status !== TodoStatus.COMPLETED) {
      dto['completedAt'] = new Date();
    }

    Object.assign(todo, dto);
    return this.todoRepository.save(todo);
  }

  async remove(id: string, userId: string): Promise<void> {
    const todo = await this.findOne(id, userId);
    await this.todoRepository.remove(todo);
  }

  async getStatistics(userId: string): Promise<any> {
    const todos = await this.todoRepository.find({
      where: { userId },
    });

    const total = todos.length;
    const completed = todos.filter(t => t.status === TodoStatus.COMPLETED).length;
    const pending = todos.filter(t => t.status === TodoStatus.PENDING).length;
    const inProgress = todos.filter(t => t.status === TodoStatus.IN_PROGRESS).length;
    const cancelled = todos.filter(t => t.status === TodoStatus.CANCELLED).length;

    // 按重要性统计
    const byImportance = {
      A: todos.filter(t => t.importance === Importance.A).length,
      B: todos.filter(t => t.importance === Importance.B).length,
      C: todos.filter(t => t.importance === Importance.C).length,
      D: todos.filter(t => t.importance === Importance.D).length,
    };

    // 按紧急程度统计
    const byUrgency = {
      1: todos.filter(t => t.urgency === 1).length,
      2: todos.filter(t => t.urgency === 2).length,
      3: todos.filter(t => t.urgency === 3).length,
      4: todos.filter(t => t.urgency === 4).length,
      5: todos.filter(t => t.urgency === 5).length,
    };

    // 完成率
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 按时完成统计
    const completedOnTime = todos.filter(t => 
      t.status === TodoStatus.COMPLETED && 
      t.dueDate && 
      t.completedAt && 
      new Date(t.completedAt) <= new Date(t.dueDate)
    ).length;

    return {
      total,
      completed,
      pending,
      inProgress,
      cancelled,
      completionRate,
      completedOnTime,
      byImportance,
      byUrgency,
      recentTodos: todos.slice(0, 10),
    };
  }

  async getHistoryForAI(userId: string): Promise<Todo[]> {
    return this.todoRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100, // 最多取100条历史记录用于分析
    });
  }
}

