/**
 * 生成大量测试待办事项的SQL语句
 * 运行: cd backend && node scripts/generate-todos.js
 */

const fs = require('fs');
const path = require('path');

// 待办事项模板数据
const todoTemplates = {
  work: [
    { title: '完成项目需求文档', desc: '整理和编写详细的需求规格说明书' },
    { title: '代码审查', desc: '审查团队成员提交的代码' },
    { title: '修复Bug', desc: '处理用户反馈的问题' },
    { title: '性能优化', desc: '优化系统响应速度和资源占用' },
    { title: '编写单元测试', desc: '为核心功能编写测试用例' },
    { title: '数据库优化', desc: '优化SQL查询和索引' },
    { title: '接口文档更新', desc: '更新API文档和示例代码' },
    { title: '技术方案评审', desc: '参与新功能的技术方案讨论' },
    { title: '系统部署', desc: '部署新版本到生产环境' },
    { title: '用户需求沟通', desc: '与产品经理讨论需求细节' },
    { title: '团队周会', desc: '参加团队周例会，汇报工作进展' },
    { title: '日志分析', desc: '分析系统日志，排查潜在问题' },
    { title: '安全漏洞修复', desc: '修复安全扫描发现的漏洞' },
    { title: '重构历史代码', desc: '优化老旧代码结构和逻辑' },
    { title: '新功能开发', desc: '开发产品路线图中的新功能' },
  ],
  study: [
    { title: '学习新技术框架', desc: '掌握最新的开发框架和工具' },
    { title: '阅读技术博客', desc: '学习业界最佳实践' },
    { title: '观看在线课程', desc: '完成专业技能提升课程' },
    { title: '练习算法题', desc: 'LeetCode每日一题' },
    { title: '阅读技术书籍', desc: '深入理解计算机系统' },
    { title: '写技术总结', desc: '整理学习笔记和心得' },
    { title: '参加技术沙龙', desc: '参与线下技术交流活动' },
    { title: '学习设计模式', desc: '掌握常用的软件设计模式' },
    { title: '英语学习', desc: '提高技术英语阅读能力' },
    { title: '开源项目贡献', desc: '为开源社区贡献代码' },
  ],
  life: [
    { title: '健身锻炼', desc: '保持每周3次以上运动' },
    { title: '体检预约', desc: '安排年度健康体检' },
    { title: '购买生活用品', desc: '采购日常必需品' },
    { title: '整理房间', desc: '清理和整理居住空间' },
    { title: '缴纳水电费', desc: '按时缴纳各项费用' },
    { title: '家人聚餐', desc: '安排周末家庭聚会' },
    { title: '理发', desc: '预约理发店' },
    { title: '牙齿检查', desc: '定期口腔检查' },
    { title: '车辆保养', desc: '汽车定期维护保养' },
    { title: '读书', desc: '每月至少阅读一本书' },
    { title: '看电影', desc: '放松娱乐，观看新上映的电影' },
    { title: '旅行计划', desc: '规划下一次旅行目的地' },
  ],
  project: [
    { title: '项目立项', desc: '准备项目立项材料和计划' },
    { title: '需求调研', desc: '收集和分析用户需求' },
    { title: '技术选型', desc: '评估和选择技术栈' },
    { title: '架构设计', desc: '设计系统整体架构' },
    { title: '数据库设计', desc: '设计数据模型和表结构' },
    { title: '原型设计', desc: '制作产品原型和交互设计' },
    { title: 'UI设计评审', desc: '评审设计稿和视觉效果' },
    { title: '开发环境搭建', desc: '配置开发和测试环境' },
    { title: 'Sprint计划', desc: '制定迭代开发计划' },
    { title: '测试用例编写', desc: '编写详细的测试用例' },
    { title: '用户验收测试', desc: '组织UAT测试' },
    { title: '上线准备', desc: '准备生产环境发布' },
  ],
};

const importances = ['A', 'B', 'C', 'D'];
const urgencies = [1, 2, 3, 4, 5];
const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];

// 随机选择数组元素
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成随机日期偏移（天数）
function randomDays(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成待办事项
function generateTodo(userId, index, category) {
  const templates = Object.values(todoTemplates).flat();
  const template = templates[index % templates.length];
  
  const importance = randomChoice(importances);
  const urgency = randomChoice(urgencies);
  const status = randomChoice(statuses);
  
  // 根据状态决定日期
  let dueDateSQL = 'NULL';
  let completedAtSQL = 'NULL';
  let createdDaysAgo = randomDays(1, 90);
  
  if (status === 'completed') {
    const completedDaysAgo = randomDays(0, createdDaysAgo);
    completedAtSQL = `NOW() - INTERVAL '${completedDaysAgo} days'`;
    dueDateSQL = `NOW() - INTERVAL '${completedDaysAgo + randomDays(1, 10)} days'`;
  } else if (status === 'cancelled') {
    dueDateSQL = 'NULL';
  } else {
    // pending 或 in_progress
    const futureDays = randomDays(-5, 30); // 可能已过期或未来
    dueDateSQL = `NOW() + INTERVAL '${futureDays} days'`;
  }
  
  const title = `${template.title} #${index + 1}`;
  const description = template.desc;
  
  return `('todo-${userId.substring(0, 8)}-${index}', '${title}', '${description}', '${importance}', ${urgency}, '${status}', ${dueDateSQL}, ${completedAtSQL}, '${userId}', NOW() - INTERVAL '${createdDaysAgo} days', NOW())`;
}

// 生成批量数据
function generateBulkTodos(userId, nickname, count) {
  let output = `-- ${nickname}的待办事项（${count}条）\n`;
  output += `INSERT INTO "todos"\n`;
  output += `("id", "title", "description", "importance", "urgency", "status", "dueDate", "completedAt", "userId", "createdAt", "updatedAt")\n`;
  output += `VALUES\n`;
  
  const todos = [];
  for (let i = 0; i < count; i++) {
    todos.push(generateTodo(userId, i, i % 4));
  }
  
  output += todos.join(',\n');
  output += ';\n\n';
  return output;
}

// 生成所有用户的待办事项
let sqlContent = '-- ============================================\n';
sqlContent += '-- 批量待办事项数据\n';
sqlContent += '-- ============================================\n\n';

// 用户1：免费用户（30条）
sqlContent += generateBulkTodos('11111111-1111-1111-1111-111111111111', '免费用户小明', 30);

// 用户2：Pro用户（120条）
sqlContent += generateBulkTodos('22222222-2222-2222-2222-222222222222', 'Pro会员小红', 120);

// 用户3：Pro用户（80条）
sqlContent += generateBulkTodos('33333333-3333-3333-3333-333333333333', 'Pro会员小李', 80);

// 用户4：过期Pro用户（40条）
sqlContent += generateBulkTodos('44444444-4444-4444-4444-444444444444', '过期会员小王', 40);

// 用户5：微信用户（20条）
sqlContent += generateBulkTodos('55555555-5555-5555-5555-555555555555', '微信用户张三', 20);

sqlContent += '-- 数据生成完成！\n';
sqlContent += '-- 总计: 290 条待办事项\n';

// 写入文件
const outputPath = path.join(__dirname, '../../database/todos-bulk.sql');
fs.writeFileSync(outputPath, sqlContent, 'utf8');

console.log('✅ SQL文件生成成功！');
console.log(`📁 文件位置: ${outputPath}`);
console.log('📊 数据统计:');
console.log('  - 免费用户小明: 30条');
console.log('  - Pro会员小红: 120条');
console.log('  - Pro会员小李: 80条');
console.log('  - 过期会员小王: 40条');
console.log('  - 微信用户张三: 20条');
console.log('  - 总计: 290条待办事项');

