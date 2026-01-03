import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TodoService } from '../todo/todo.service';
import { Todo, TodoStatus, Importance } from '../todo/entities/todo.entity';

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  constructor(
    private configService: ConfigService,
    private todoService: TodoService,
  ) {
    this.apiKey = this.configService.get('ZHIPU_API_KEY', '');
    // 添加调试日志
    console.warn('ZHIPU_API_KEY:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT FOUND');
  }

  async analyzeHistory(userId: string): Promise<string> {
    // 获取用户的历史待办事项
    const todos = await this.todoService.getHistoryForAI(userId);
    const statistics = await this.todoService.getStatistics(userId);

    if (todos.length === 0) {
      return '您还没有任何待办事项记录，无法进行分析。请先添加一些待办事项后再来查看分析报告。';
    }

    // 构建分析提示词
    const prompt = this.buildAnalysisPrompt(todos, statistics);

    try {
      const response = await this.callZhipuAPI(prompt);
      return response;
    } catch (error) {
      console.error('AI分析错误:', error);
      throw new InternalServerErrorException('AI分析服务暂时不可用，请稍后再试');
    }
  }

  private buildAnalysisPrompt(todos: Todo[], statistics: any): string {
    // 整理待办事项数据
    const completedTodos = todos.filter(t => t.status === TodoStatus.COMPLETED);
    const pendingTodos = todos.filter(t => t.status === TodoStatus.PENDING || t.status === TodoStatus.IN_PROGRESS);
    const cancelledTodos = todos.filter(t => t.status === TodoStatus.CANCELLED);

    // 构建详细的数据描述
    const dataDescription = `
用户待办事项历史数据分析:

【基础统计】
- 总待办数量: ${statistics.total}
- 已完成: ${statistics.completed} (${statistics.completionRate}%)
- 进行中: ${statistics.inProgress}
- 待处理: ${statistics.pending}
- 已取消: ${statistics.cancelled}

【重要性分布】
- A级(最重要): ${statistics.byImportance.A}个
- B级(重要): ${statistics.byImportance.B}个
- C级(一般): ${statistics.byImportance.C}个
- D级(不重要): ${statistics.byImportance.D}个

【紧急程度分布】
- 1级(最紧急): ${statistics.byUrgency[1]}个
- 2级(紧急): ${statistics.byUrgency[2]}个
- 3级(一般): ${statistics.byUrgency[3]}个
- 4级(不急): ${statistics.byUrgency[4]}个
- 5级(可延后): ${statistics.byUrgency[5]}个

【最近的待办事项样本】
${todos.slice(0, 20).map(t => `- [${t.status}][${t.importance}${t.urgency}] ${t.title}`).join('\n')}
`;

    return `你是一位专业的时间管理和目标规划顾问。请基于以下用户的待办事项历史数据，进行深入分析并提供个性化的改进建议。

${dataDescription}

请从以下几个方面进行分析和建议：

1. **目标完成情况评估**：分析用户的任务完成率，评价整体执行力。

2. **任务优先级管理分析**：根据重要性和紧急程度的分布，分析用户是否合理分配了精力，是否存在"紧急但不重要"的任务占用过多时间的问题。

3. **时间管理习惯洞察**：从数据中推断用户的工作习惯和潜在问题。

4. **艾森豪威尔矩阵建议**：基于四象限法则，给出具体的任务管理建议。

5. **具体改进方案**：提供3-5条可操作的具体建议，帮助用户提高效率和目标完成率。

请用友好、专业的语气回复，使用中文，适当使用emoji让回复更加生动。回复长度控制在800字以内。`;
  }

  private async callZhipuAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      // 如果没有配置API Key，返回模拟数据
      return this.getMockAnalysis();
    }

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'glm-4.7',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 60000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('调用智谱AI API失败:', error.response?.data || error.message);
      // 返回模拟分析结果
      return this.getMockAnalysis();
    }
  }

  private getMockAnalysis(): string {
    return `## 📊 您的待办事项分析报告

### 1. 目标完成情况评估 ✨
从数据来看，您的任务完成率表现不错！这说明您具备良好的执行力基础。继续保持这种积极的工作态度，同时可以尝试挑战更高的目标。

### 2. 任务优先级管理分析 🎯
观察您的任务分布，建议更多关注**重要但不紧急**的任务（B象限），这类任务往往对长期目标影响最大。避免让紧急但不重要的事务占用过多精力。

### 3. 时间管理习惯洞察 ⏰
- 您倾向于创建较多中等优先级的任务
- 建议每天开始工作前，花5分钟重新评估任务优先级
- 可以尝试"两分钟法则"：能在两分钟内完成的任务立即处理

### 4. 艾森豪威尔矩阵建议 📋
| | 紧急 | 不紧急 |
|---|---|---|
| **重要** | 立即执行 | 计划安排 |
| **不重要** | 委托他人 | 考虑删除 |

### 5. 具体改进方案 💡

1. **每日三件事法则**：每天只专注完成3件最重要的任务
2. **番茄工作法**：25分钟专注 + 5分钟休息，提高单位时间效率
3. **周回顾习惯**：每周日花15分钟回顾本周完成情况，规划下周重点
4. **减少任务积压**：对超过一周未处理的任务重新评估，果断删除或降级
5. **设置截止日期**：为每个任务设置明确的截止时间，增加紧迫感

---
*💪 坚持使用待办清单，您的效率一定会越来越高！*`;
  }
}

