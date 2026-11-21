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
