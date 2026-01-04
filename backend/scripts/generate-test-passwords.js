/**
 * 生成测试用户的密码哈希
 * 运行: cd backend && node scripts/generate-test-passwords.js
 */

const bcrypt = require('bcryptjs');

const testPassword = 'test123456';
const saltRounds = 10;

async function generatePasswords() {
  console.log('正在生成测试用户密码哈希...\n');
  console.log(`明文密码: ${testPassword}`);
  console.log('='.repeat(60));
  
  const hashes = [];
  for (let i = 1; i <= 4; i++) {
    const hash = await bcrypt.hash(testPassword, saltRounds);
    hashes.push(hash);
    console.log(`\n用户${i}的密码哈希:`);
    console.log(hash);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n将以下SQL复制到 database/seed.sql 文件中：\n');
  
  hashes.forEach((hash, index) => {
    const userId = index + 1;
    console.log(`-- 用户${userId}`);
    console.log(`-- 替换: $2b$10$YourHashedPasswordHere${userId}`);
    console.log(`-- 新值: ${hash}\n`);
  });
  
  console.log('提示：直接复制粘贴上面的哈希值到seed.sql中即可');
}

generatePasswords().catch(console.error);

