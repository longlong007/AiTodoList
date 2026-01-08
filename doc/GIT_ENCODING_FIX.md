# Git 提交消息中文乱码解决方案

**问题**: 在 Windows PowerShell 中使用 `git commit -m "中文消息"` 时，提交消息显示为乱码。

**修复日期**: 2026-01-08

---

## 📋 问题现象

```powershell
PS> git commit -m "fix: 修复数据库导入乱码"
PS> git log --oneline -1
314b633 fix: 淇鏁版嵁搴撳鍏ヤ贡鐮�  # ❌ 乱码
```

---

## 🔍 根本原因

### 问题链条

1. **PowerShell 编码设置不影响命令行参数传递**
   - `$OutputEncoding` 和 `[Console]::OutputEncoding` 只控制**输出显示**
   - 命令行参数（如 `-m "中文"`）按照**系统默认ANSI代码页**传递
   
2. **Windows 中文系统的默认代码页是 GBK (CP936)**
   - PowerShell 将中文字符串按 GBK 编码传递给 Git
   - Git 按 UTF-8 存储，导致编码错配
   
3. **结果**
   - Git 仓库中存储了错误编码的字节
   - 显示时按 UTF-8 解析 GBK 字节 → 乱码

### 技术证据

**错误的提交** (使用 `-m` 参数):
```
字节: E6 B7 87 EE 86 BC ...  (GBK 被误存为 UTF-8)
显示: 淇鏁版嵁搴撳鍏ヤ贡鐮�  (乱码)
```

**正确的提交** (使用文件方式):
```
字节: E6 B5 8B E8 AF 95 ...  (正确的 UTF-8)
显示: 测试中文编码修复  (正常)
```

---

## ✅ 解决方案

### 方案 1: 使用提供的工具脚本 (推荐)

我们提供了一个工具脚本 `Git-Commit-UTF8.ps1`，它通过文件方式正确处理中文提交消息。

**使用方法**:

```powershell
# 方法 A: 交互式输入
.\Git-Commit-UTF8.ps1
# 提示输入消息时，输入或粘贴中文提交消息

# 方法 B: 命令行参数
.\Git-Commit-UTF8.ps1 -Message "fix: 修复某个问题"
```

**工作原理**:
1. 设置 PowerShell 会话为 UTF-8 编码
2. 将提交消息写入 UTF-8 临时文件
3. 使用 `git commit -F` (文件方式) 提交
4. 自动清理临时文件

### 方案 2: 手动文件方式提交

```powershell
# 1. 设置编码
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 2. 写入提交消息到文件
"fix: 修复某个问题" | Out-File -FilePath commit-msg.txt -Encoding utf8 -NoNewline

# 3. 使用文件提交
git commit -F commit-msg.txt

# 4. 清理
Remove-Item commit-msg.txt
```

### 方案 3: 使用 Git GUI 工具

使用图形界面工具（如 VSCode、GitHub Desktop、TortoiseGit）提交，它们会正确处理编码。

---

## 🔧 永久修复（可选）

### 配置 PowerShell Profile

1. **检查 Profile 是否存在**:
   ```powershell
   Test-Path $PROFILE
   ```

2. **如果不存在，创建它**:
   ```powershell
   New-Item -Path $PROFILE -Type File -Force
   ```

3. **编辑 Profile**:
   ```powershell
   notepad $PROFILE
   ```

4. **在文件开头添加以下内容**:
   ```powershell
   # Set UTF-8 encoding for PowerShell
   $OutputEncoding = [System.Text.Encoding]::UTF8
   [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
   [Console]::InputEncoding = [System.Text.Encoding]::UTF8
   
   # Set Git alias for UTF-8 commit
   function git-commit-utf8 {
       param([string]$message)
       if ([string]::IsNullOrWhiteSpace($message)) {
           Write-Host "Usage: git-commit-utf8 'your message'" -ForegroundColor Yellow
           return
       }
       $tempFile = Join-Path $env:TEMP "git-msg-utf8.txt"
       $message | Out-File -FilePath $tempFile -Encoding utf8 -NoNewline
       git -c i18n.commitEncoding=utf-8 commit -F $tempFile
       Remove-Item $tempFile -ErrorAction SilentlyContinue
   }
   
   Set-Alias gcm git-commit-utf8
   ```

5. **重启 PowerShell** 或运行 `. $PROFILE` 使配置生效

6. **使用新的别名**:
   ```powershell
   gcm "fix: 修复问题"
   ```

### 配置 Git 全局编码

```bash
git config --global core.quotepath false
git config --global gui.encoding utf-8
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
```

---

## 🚫 不推荐的方案

### ❌ 不要使用 `git commit -m "中文"`

即使设置了 `$OutputEncoding`，PowerShell 仍会按 GBK 传递参数。

### ❌ 不要依赖控制台代码页 (chcp 65001)

`chcp 65001` 只改变**显示**编码，不改变**参数传递**编码。

---

## 📚 相关资料

- [PowerShell Encoding Issues](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding)
- [Git i18n Configuration](https://git-scm.com/docs/git-config#Documentation/git-config.txt-i18ncommitEncoding)
- [Windows Code Pages](https://docs.microsoft.com/en-us/windows/win32/intl/code-page-identifiers)

---

## 🛠️ 文件清单

| 文件 | 说明 |
|------|------|
| `Git-Commit-UTF8.ps1` | UTF-8 提交工具脚本 |
| `doc/GIT_ENCODING_FIX.md` | 本说明文档 |

---

## ✅ 验证修复

运行以下命令验证：

```powershell
# 1. 运行工具脚本
.\Git-Commit-UTF8.ps1 -Message "test: 测试中文编码"

# 2. 查看提交
git log -1 --oneline

# 3. 如果中文显示正常，说明修复成功！
```

---

**修复完成**: ✅  
**测试通过**: ✅  
**文档更新**: ✅
