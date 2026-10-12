# Eduplan 院校资料表 + API 设定说明

每所院校一个文件夹，里面放该校的 Google Sheet 和一个 `application` 文件夹。学校填写 → Eduplan 审核（Published = Yes）→ 网站通过 API 自动显示；学生在网站报名后，报名 PDF 和文件会自动存进该校的 `application` 文件夹。

```
Google Drive 文件夹「Eduplan School Data」
├── Repository/
│   ├── 00 Master（Eduplan 专用，捷径）  Foundation Scholarships、FAQ、Lists、API 代码
│   └── _Template（新增学校时复制）       名称以 _ 开头的文件不会被读取
├── TARUMT/  ┐  每校一个文件夹：
├── UCSI/    │    <学校> Sheet（Institutions、Programmes、Campus Scholarships）
├── UTAR/    │    application/  学生报名（每人一个子文件夹：报名 PDF + 上传文件）
└── XMUM/    ┘
        │
        ▼
Apps Script API (/exec) ──► 网站（约 1 分钟内更新）
每日 5:47 同步 ──────────► Claude artifact
```

所需文件（都在本仓库）：

| 文件 | 用途 |
|---|---|
| `apps-script/Code.gs` | API 代码，贴进 Master Sheet 的 Apps Script |
| `assets/js/config.js` | API 网址 |
| `tools/sync-artifact.js` | 把资料快照写进 Claude artifact |
| `data/eduplan-school-data.xlsx` | 最初的单一资料表模板（已改为每校一份，仅作备份） |

---

## 一、Google Drive 结构

- 文件夹：**Eduplan School Data**（ID `1YlVGAe04L2BTQo7bzoLzG6wQl3mhaaoS`，写在 `Code.gs` 的 `SCHOOL_FOLDER_ID`）。
- **每校一个文件夹和一份 Sheet，文件夹名和文件名 = institution_id**（例如 `UTAR/UTAR`）。API 会读取各校文件夹里的 Sheet（也兼容直接放在主文件夹的 Sheet），略过 `Repository` 和以 `_` 开头的文件夹／文件。该文件只能发布这个 institution_id 的资料；
  在别校文件里填写的资料会被略过，Check data 会显示原因。
- 每份学校 Sheet 有：`Instructions`、`Institutions`、`Programmes`、`Campus Scholarships`，以及隐藏的 `Lists`（下拉选单用）。
- **Master Sheet**（Eduplan 专用）：`Foundation Scholarships`、`Lists`，以及 API 代码。课程类别对照以 Master 的 `Lists` 为准。
- 受保护（只有 Eduplan 帐号能改）：标题行、Published 栏、Faculty (auto) 公式栏、Instructions、Lists。

**新增一所学校：** 在 Eduplan School Data 新增文件夹，命名为该校的 institution_id（例如 `SEGI`）；在 `Repository` 里右键 `_Template` → **Make a copy** → 把副本移到该文件夹并改名为同一个 institution_id，
在 Institutions 第 4 行填写 institution_id（与文件名相同）、全名和类型，再以 Editor 身份分享给该校负责人。

**共享：** 每份学校 Sheet 只分享给该校负责人（Editor）。**只分享 Sheet，不要分享学校文件夹**，因为文件夹里的 `application` 有学生的个人资料。不要使用「Anyone with the link」。`application` 文件夹会在第一份报名时自动建立（目前四校已建好）。

## 二、部署 API（约 5 分钟）

1. 在 **Master Sheet** 里按 **Extensions → Apps Script**。
2. 删除编辑器里原有的内容，把 `apps-script/Code.gs` 的全部内容贴上，按 **Save**。
   部署的帐号必须能打开「Eduplan School Data」文件夹（第一次执行会要求 Google Drive 权限）。
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
5. 网站约 1 分钟内自动更新（API 每 30 秒检查一次各文件的最后修改时间）；需要立即生效时按 **Eduplan → Refresh website data now**。

要下架某笔资料：把 `Published` 改为 **No**。

## 六、资料结构

| 分页 | 一行代表 | 网站显示位置 | 必填栏位 |
|---|---|---|---|
| Institutions | 一所院校 | Universities 页面（Published = Yes 的院校自动列出） | institution_id, name, type |
| Programmes | 一个课程 | Faculty → 课程 → 第 4 页；Universities → 院校 → 阶段 | programme_id, institution_id, course, programme_name, level |
| Campus Scholarships | 一个奖学金等级（如 SPM 7A = 25%） | Scholarships → Campus Scholarship | scholarship_id, institution_id, qualification, minimum_result，以及 waiver_percent 或 fixed_amount_rm 其中一项 |
| Foundation Scholarships | 一个基金会奖学金（A、B、C…） | Scholarships → Foundation Scholarship | option_id, scholarship_name, requirements |

规则：
- `institution_id` 在所有分页必须一致（例如 `UTAR`），而且该院校本身也必须已发布。
- `course` 从下拉选单选择，对应网站的 Faculty 00–10 课程类别。
- 金额只填数字（马币），日期用 `YYYY-MM-DD`。
- 奖学金条件每行一项（在格子里按 Alt+Enter 或 Ctrl+Enter 换行）。
- Programmes 的入学条件分开填写：`entry_spm`、`entry_uec`、`entry_olevel`、`entry_stpm`，其他资格（A-Level、文凭等）及附加条件填 `entry_other`。
  没有列出的资格请留空，网站会显示 "Not listed by the institution"。学费留空时显示 "To be confirmed"。
- Institutions 的 `virtual_tour_url`（选填）：院校的 3D 校园导览网址（必须以 https:// 开头），Universities 页面该校会出现导览横幅，按钮在新分页打开导览（导览网站通常不允许嵌入其他网页）。
- 一个课程可同时列在多个课程类别：在 `also_in_courses` 栏填写其他类别（与下拉选单完全相同，每行一个）。例如 XMUM 的 Foundation in Science 同时列在 00 预科和 09 传统医学。
- 课程页面会**自动**列出同一院校、同一阶段可申请的 Campus Scholarships（依 `level` 对应 `applies_to` 的 Foundation / Undergraduate / Postgraduate；`applies_to` 留空的奖学金适用所有阶段）。
- Campus Scholarships 的 `applies_to` 以 `Foundation Programmes` 或 `Undergraduate Programmes` 开头时，网站第 4 页会出现「考试（SPM / IGCSE / O-Level / UEC / STPM / A-Level）」和「Foundation / Undergraduate」按钮来筛选。
  Foundation / Matriculation / Diploma 的 CGPA 条件，`qualification` 选 `Foundation`、`Matriculation` 或 `Diploma`；SPM / IGCSE / O-Level 学生选 Undergraduate 时会显示这些条件。
- `qualification` 下拉选项（Lists 表 F 栏）：SPM、IGCSE、O-Level、UEC、STPM、A-Level、Matriculation、Foundation、Diploma、Other。`minimum_result` 写 A 的数量（例如 `7As`）或 CGPA（例如 `CGPA 3.70 and above`）。Eduplan Lab 的奖学金导向按「考试种类 + A 的数量（或 CGPA）」自动配对：只配对同一考试种类，IGCSE 与 O-Level 分开计算。

## 七、以后修改 API 代码

修改 `Code.gs` 后：**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**。
这样网址保持不变，不需要再改 `config.js`。（如果选 New deployment 会产生新网址。）

## 八、常见问题

| 情况 | 原因与处理 |
|---|---|
| 打开 API 网址要求登入 | 部署时 Who has access 没选 **Anyone**，重新部署 |
| 网站没有显示新资料 | 检查 `Published` 是否为 Yes；用 **Eduplan → Check data** 看是否被略过；按 Refresh |
| Check data 显示 "belongs in its own sheet" | 该行的 institution_id 和文件名不同，请把资料移到该校自己的 Sheet |
| Check data 没有列出某所学校 | 文件不在「Eduplan School Data」文件夹、文件名以 _ 开头，或部署 API 的帐号没有该文件的权限 |
| Check data 显示 "institution_id … is not a published institution" | 该院校在 Institutions 分页尚未填写或尚未发布 |
| Check data 显示 "course … is not in the Lists sheet" | 课程栏不是从下拉选单选择的，请重新选择 |
| 网站新增了 Faculty 课程 | 请 Eduplan 重新产生资料表的 `Lists` 分页，或在 Lists 的 J–M 栏加上同样格式的一行 |

## 九、Claude artifact 同步

artifact 不能直接连接 API，所以改用「快照」：读取 Google Sheet → 用与 API 相同的规则转换 → 写入 artifact 页面。

```
node tools/sync-artifact.js <sheet-values.json> <artifact.html> <out.html>
```

`sheet-values.json` 是各分页从第 1 行开始的资料：Master 的 `foundation`、`lists`，以及
`schools`（文件夹里每份学校 Sheet 的 `institutions`、`programmes`、`campus`）。
每天早上 5:47（马来西亚时间）由 Claude 自动读取文件夹里所有学校 Sheet、执行并重新发布 artifact。
