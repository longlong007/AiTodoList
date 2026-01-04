/**
 * 生成测试用户的密码哈希
 * 运行: node database/generate-passwords.js
 */

const bcrypt = require('bcrypt');

const testPassword = 'test123456';
const saltRounds = 10;

async function generatePasswords() {
  console.log('正在生成测试用户密码哈希...\n');
  console.log(`明文密码: ${testPassword}`);
  console.log('='.repeat(60));
  
  for (let i = 1; i <= 4; i++) {
    const hash = await bcrypt.hash(testPassword, saltRounds);
    console.log(`\n用户${i}的密码哈希:`);
    console.log(hash);
    console.log(`\n-- 替换到 seed.sql 中的: $2b$10$YourHashedPasswordHere${i}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n提示：将上面生成的哈希值复制到 database/seed.sql 文件中');
  console.log('替换对应的 $2b$10$YourHashedPasswordHere1, ...');
}

generatePasswords().catch(console.error);
