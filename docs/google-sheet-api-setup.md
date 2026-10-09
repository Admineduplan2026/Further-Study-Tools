# Eduplan 院校资料表 + API 设定说明

学校在 Google Sheet 填写资料 → Eduplan 审核（Published = Yes）→ 网站通过 API 自动显示。

```
学校填写 Google Sheet ──► Apps Script API (/exec) ──► Eduplan 网站
     (黄色格)          只输出 Published = Yes 的资料     Faculty 第 4 页、Scholarships
```

所需文件（都在本仓库）：

| 文件 | 用途 |
|---|---|
| `data/eduplan-school-data.xlsx` | 资料表模板，导入成 Google Sheet |
| `apps-script/Code.gs` | API 代码，贴进 Google Sheet 的 Apps Script |
| `assets/js/config.js` | 填入 API 网址，网站就会读取资料表 |

---

## 一、Google Sheet

Eduplan 的 Google Sheet「Eduplan School Data」已经建立好（分页、下拉选单、自动公式、保护范围都已设定）。
如需另建一份，可上传 `data/eduplan-school-data.xlsx` 到 Google Drive → **Open with → Google Sheets** → **File → Save as Google Sheets**。

分页名称必须完全是：`Instructions`、`Institutions`、`Programmes`、`Campus Scholarships`、`Foundation Scholarships`、`Lists`。
第 2 行（蓝色小字）是 API 读取用的代码，**不要修改或删除**。

**共享设定：** 不要使用「Anyone with the link → Editor」。请改为 **Restricted**（或 Viewer），再以 Editor 身份个别邀请学校。
受保护的范围（标题行、Published 栏、Foundation Scholarships、Lists）只有表格拥有者能修改，但其他格子任何编辑者都能改，包括已发布的资料。

## 二、部署 API（约 5 分钟）

1. 在 Google Sheet 里按 **Extensions → Apps Script**。
2. 删除编辑器里原有的内容，把 `apps-script/Code.gs` 的全部内容贴上，按 **Save**。
3. 按 **Deploy → New deployment**：
   - 左边齿轮选 **Web app**
   - Description：`Eduplan API`
   - Execute as：**Me**
   - Who has access：**Anyone**
4. 按 **Deploy**，第一次会要求授权：选择您的 Google 帐号 → **Advanced → Go to (项目名称)** → **Allow**。
5. 复制显示的 **Web app URL**（以 `/exec` 结尾）。
6. 在浏览器打开这个网址，应看到 JSON，例如 `{"version":1,"institutions":[...` 。

> "Anyone" 的意思是网站访客可以读取 API 输出的**公开资料**。资料表本身不会公开，联络人姓名与电邮也不会输出。

## 三、连接网站（约 1 分钟）

打开 `assets/js/config.js`，把网址填入：

```js
window.EDUPLAN_API_URL="https://script.google.com/macros/s/xxxxxxxx/exec";
```

提交并更新网站后，打开 **Faculty → 任一类别 → 任一课程**，已发布的课程会出现在第 4 页。
如果 API 暂时无法连接，网站会继续显示 `faculty-data.js` 和 `scholarship-data.js` 里的资料，不会出错。

## 四、邀请学校填写

1. 按右上角 **Share**，以 **Editor** 身份加入学校负责人的电邮（不要使用 "Anyone with the link can edit"）。
2. 建议保护以下范围（**Data → Protect sheets and ranges**，只允许 Eduplan 编辑）：
   - 每个分页的第 1–3 行（标题、API 代码、格式说明）
   - 每个分页的 **Published** 栏
   - `Foundation Scholarships` 和 `Lists` 整个分页
3. 请学校先阅读 `Instructions` 分页。

## 五、审核与发布流程

1. 学校填写黄色格子，`Published` 留空。
2. Eduplan 核对资料（尽量以学校官网或 MQA 资料为准）。
3. 确认无误后，把 `Published` 改为 **Yes**。
4. 顶部菜单 **Eduplan → Check data**：显示网站会看到多少笔资料，以及哪些行被略过、原因是什么（例如缺少必填项、院校编号不存在、课程类别不在清单中）。
5. 需要立即生效时按 **Eduplan → Refresh website data now**；否则 5 分钟内自动更新。

要下架某笔资料：把 `Published` 改为 **No**。

## 六、资料结构

| 分页 | 一行代表 | 网站显示位置 | 必填栏位 |
|---|---|---|---|
| Institutions | 一所院校 | 所有分页的院校名称 | institution_id, name, type |
| Programmes | 一个课程 | Faculty → 课程 → 第 4 页 | programme_id, institution_id, course, programme_name, level |
| Campus Scholarships | 一个奖学金等级（如 SPM 7A = 25%） | Scholarships → Campus Scholarship | scholarship_id, institution_id, qualification, minimum_result，以及 waiver_percent 或 fixed_amount_rm 其中一项 |
| Foundation Scholarships | 一个基金会奖学金（A、B、C…） | Scholarships → Foundation Scholarship | option_id, scholarship_name, requirements |

规则：
- `institution_id` 在所有分页必须一致（例如 `UTAR`），而且该院校本身也必须已发布。
- `course` 从下拉选单选择，对应网站的 Faculty 00–10 课程类别。
- 金额只填数字（马币），日期用 `YYYY-MM-DD`。
- 奖学金条件每行一项（在格子里按 Alt+Enter 或 Ctrl+Enter 换行）。
- Campus Scholarships 的 `applies_to` 以 `Foundation Programmes` 或 `Undergraduate Programmes` 开头时，网站第 4 页会出现「考试（SPM / O-Level / UEC / STPM / A-Level）」和「Foundation / Undergraduate」按钮来筛选。
  Foundation / Matriculation / Diploma 的 CGPA 条件，`qualification` 选 `Foundation`；SPM / O-Level 学生选 Undergraduate 时会显示这些条件。

## 七、以后修改 API 代码

修改 `Code.gs` 后：**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**。
这样网址保持不变，不需要再改 `config.js`。（如果选 New deployment 会产生新网址。）

## 八、常见问题

| 情况 | 原因与处理 |
|---|---|
| 打开 API 网址要求登入 | 部署时 Who has access 没选 **Anyone**，重新部署 |
| 网站没有显示新资料 | 检查 `Published` 是否为 Yes；用 **Eduplan → Check data** 看是否被略过；按 Refresh |
| Check data 显示 "institution_id … is not a published institution" | 该院校在 Institutions 分页尚未填写或尚未发布 |
| Check data 显示 "course … is not in the Lists sheet" | 课程栏不是从下拉选单选择的，请重新选择 |
| 网站新增了 Faculty 课程 | 请 Eduplan 重新产生资料表的 `Lists` 分页，或在 Lists 的 J–M 栏加上同样格式的一行 |

## 九、Claude artifact 同步

artifact 不能直接连接 API，所以改用「快照」：读取 Google Sheet → 用与 API 相同的规则转换 → 写入 artifact 页面。

```
node tools/sync-artifact.js <sheet-values.json> <artifact.html> <out.html>
```

`sheet-values.json` 是各分页从第 1 行开始的资料（institutions、programmes、campus、foundation、lists）。
由 Claude 用 Google Sheets 连接器读取后执行，再重新发布 artifact；可设定为每日自动执行。
