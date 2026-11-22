# 员工活动记录与四周计划（旧站员工页面 #staff）

## 做什么

- **员工活动记录**：员工的登入、登出、每次打开员工页面（同一个分页 5 分钟内只记一次），以及在员工页面做的修改（长期目标、最新消息邮件），都会新增一行到 Google Sheet。记录只会新增，不会修改。
- **谁看得到**：网站上只有 `ACTIVITY_ADMINS` 里的电邮看得到「Staff activity」这一区（默认 `admin.eduplan@gmail.com`）。其他员工看不到。
- **四周计划**：第 1 至 4 周的任务和截止日期，加进员工页面现有的「Long-term goals」（长期目标）。员工页面会倒数到最近的截止日期，完成后打勾。

## 资料存在哪里（Google Drive）

| 内容 | 文件 | 分页 |
|---|---|---|
| 员工活动记录 | Eduplan Databases / 3. Students and visitors (private) / **Eduplan Student Portfolios** | `Staff activity`（时间、电邮、事件、详情） |
| 四周计划 | **Eduplan School Data**（Master Sheet） | `Staff goals` |

## 上线步骤（需要有 Apps Script 编辑权限的人做一次）

1. 打开 Master Sheet → **Extensions → Apps Script**。
2. 新增一个文件 `StaffActivity.gs`，把 `apps-script/StaffActivity.gs` 的全部内容贴上。
3. 把 `apps-script/Account.gs` 的全部内容贴上，覆盖原本的 `Account.gs`。
4. 按 **Save**。
5. 在上方函数选单选 **staffActivitySetup** → **Run**（建立 `Staff activity` 分页）。
6. 选 **staffPlanSeed** → **Run**（把四周计划加进 `Staff goals`；重复执行不会重复加入）。
7. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**（网址不变）。
8. （可选）**Project Settings → Script Properties** 新增 `ACTIVITY_ADMINS`，填入可以查看活动记录的电邮，用逗号分开。不填就是 `admin.eduplan@gmail.com`。

网站前端（`lab/lab.js`）已经更新。在第 7 步完成之前，员工页面不会显示「Staff activity」这一区，其他功能照常。

## 记录的事件

| 事件 | 什么时候 |
|---|---|
| `Signed in` / `Signed out` | 员工电邮登入或登出网站 |
| `Opened staff portal` | 打开员工页面 #staff |
| `Goals` | 新增、完成或删除长期目标（详情写操作和目标编号） |
| `News` | 草拟、保存、批准或放弃最新消息邮件 |

## 程序员页面（#dev）

每个程序员用自己的电邮登入网站后，会自动打开**自己的** #dev 页面（只看得到自己的资料）；员工页面最上方也有「Developer portal」的入口，`ACTIVITY_ADMINS`（默认 admin.eduplan@gmail.com）可以从下拉选单查看任何程序员。页面有三部分：

1. **薪水和奖金**：目前累计收入（= 月薪 × 已工作月数（含本月）+ 所有 Bonus 记录）、月薪、下次出粮日（倒数天数）、Bonus 合计，以及 Bonus 记录（每笔可附报告链接）。
2. **任务**：所有任务排成一张表，最新的在最上面（任务、名称、开始、截止、状态、分数、奖金）；每一行可以展开看「任务内容」和「验收报告」。管理员可以在页面上直接「新增任务」。
3. **每周报告**：程序员每周上传一次报告（选第几周、写摘要、附文件，最多 10 MB）。文件存在 Google Drive 的 `Eduplan Databases/6. Developer reports (private)/<电邮>`，并分享给该程序员查看；管理员在 Sheet 里把状态改成 `Reviewed`，并可写回馈，程序员会在页面看到。

程序员的登入、打开页面和上传报告都会记进「Staff activity」。

### 资料在哪里

都在私人的 **Eduplan Student Portfolios**。薪水只存在这里，不会出现在网站代码或 GitHub 上。

| 分页 | 一行代表 | 栏位 |
|---|---|---|
| `Developer tasks` | 一个程序员的一个任务 | 电邮、Task、名称、开始、截止、状态（Not started / In progress / Submitted / Accepted / Not accepted）、分数、奖金 RM、验收日期、验收报告、报告链接、任务内容 |
| `Developer pay` | 一个程序员 | 电邮、名字、月薪 RM、出粮日（每月 1–31 号）、备注、开始日期（空白就用最早任务的开始日期） |
| `Developer payouts` | 一笔 Bonus（Bonus 记录） | 电邮、日期、类别（Bonus / Allowance / Other）、金额 RM、备注、报告链接。薪水不用填在这里（由月薪按月份自动计算），写 Salary 的行会被忽略 |
| `Developer reports` | 一份每周报告 | 电邮、周、提交时间、摘要、文件名、文件链接、状态（Submitted / Reviewed）、回馈 |

### 设定

1. 在 Apps Script 执行 **devPortalSetup**（建立四个分页和缺少的栏位；可以重复执行）。
2. 打开 Eduplan Student Portfolios：
   - `Developer tasks`：A 栏「填 Xinyi 的电邮」改成 Xinyi 的电邮。
   - `Developer pay`：A 栏填 Xinyi 的电邮，C 栏填月薪（只填数字），D 栏填每月几号出粮。
3. 每发一笔 Bonus，就在 `Developer payouts` 加一行（日期、类别、金额、备注、报告链接）。薪水不用记，系统按月薪和开始日期自动累计。
4. 验收一个任务：在 `Developer tasks` 那一行改状态为 `Accepted`，填分数、奖金、验收日期和验收报告。新任务可以在网站上按「新增任务」，或直接在 Sheet 加一行。
5. 看完每周报告：在 `Developer reports` 把状态改成 `Reviewed`，在「回馈」写意见。
