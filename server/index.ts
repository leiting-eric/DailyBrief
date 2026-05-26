/**
 * DailyBrief 管理后台 — Express 服务器
 *
 * 提供 Web UI 来配置项目、管理数据源、触发运行、查看日志。
 * 启动方式：npm run serve
 * 访问地址：http://localhost:3456
 */

import express from "express";
import { spawn, execSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ----- 路径 -----

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");
const SOURCES_FILE = path.join(PROJECT_ROOT, "sources.config.json");
const LOGS_DIR = path.join(PROJECT_ROOT, "logs");
const REPORTS_DIR = path.join(PROJECT_ROOT, "daily_reports");

const PORT = parseInt(process.env.PORT || "3456", 10);

// ----- 运行状态跟踪 -----

let currentRun: {
  process: ChildProcess;
  command: string;
  startedAt: string;
  output: string[];
} | null = null;

// ----- 辅助函数 -----

function readFileSafe(p: string): string {
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return "";
  }
}

function writeFileSafe(p: string, content: string): boolean {
  try {
    fs.writeFileSync(p, content, "utf-8");
    return true;
  } catch (e) {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ========================================================================
// 配置读写 (.env.local)
// ========================================================================

function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // 去掉引号
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function readConfig(): Record<string, string> {
  return parseEnv(readFileSafe(ENV_FILE));
}

function saveConfig(updates: Record<string, string>): { success: boolean; message: string } {
  try {
    let content = readFileSafe(ENV_FILE);
    if (!content) {
      // 创建默认 .env.local
      const example = readFileSafe(path.join(PROJECT_ROOT, ".env.example"));
      content = example || "# DailyBrief 配置\n";
    }

    // 逐行更新
    const lines = content.split("\n");
    const updatedKeys = new Set(Object.keys(updates));
    const newLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;
      const eq = trimmed.indexOf("=");
      if (eq === -1) return line;
      const key = trimmed.slice(0, eq).trim();
      if (updatedKeys.has(key)) {
        const val = updates[key];
        if (val === "" || val === undefined) {
          // 清空：注释掉
          return `# ${key}=`;
        }
        // 如果值包含空格或特殊字符，加引号
        const needsQuote = /[\s#]/.test(val);
        return needsQuote ? `${key}="${val}"` : `${key}=${val}`;
      }
      return line;
    });

    // 添加新 key
    for (const [key, val] of Object.entries(updates)) {
      if (!lines.some((l) => {
        const t = l.trim();
        return !t.startsWith("#") && t.startsWith(key + "=");
      })) {
        if (val && val !== "") {
          const needsQuote = /[\s#]/.test(val);
          newLines.push(needsQuote ? `${key}="${val}"` : `${key}=${val}`);
        }
      }
    }

    fs.writeFileSync(ENV_FILE, newLines.join("\n"), "utf-8");
    return { success: true, message: "配置已保存" };
  } catch (e: any) {
    return { success: false, message: `保存失败: ${e.message}` };
  }
}

// ========================================================================
// 数据源读写 (sources.config.json)
// ========================================================================

function readSources(): any[] {
  try {
    return JSON.parse(readFileSafe(SOURCES_FILE));
  } catch {
    return [];
  }
}

function saveSources(sources: any[]): { success: boolean; message: string } {
  try {
    fs.writeFileSync(SOURCES_FILE, JSON.stringify(sources, null, 2), "utf-8");
    return { success: true, message: "数据源已保存" };
  } catch (e: any) {
    return { success: false, message: `保存失败: ${e.message}` };
  }
}

// ========================================================================
// 运行管理
// ========================================================================

function runCommand(command: string): { success: boolean; message: string } {
  if (currentRun) {
    return { success: false, message: "已有任务在运行中" };
  }

  let cmd: string;
  let args: string[];
  if (command === "daily") {
    cmd = "npm";
    args = ["run", "daily"];
  } else if (command === "dry-run") {
    cmd = "npm";
    args = ["run", "dry-run"];
  } else {
    return { success: false, message: `未知命令: ${command}` };
  }

  const child = spawn("cmd.exe", ["/c", cmd, ...args], {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });

  currentRun = {
    process: child,
    command,
    startedAt: new Date().toISOString(),
    output: [],
  };

  child.stdout?.on("data", (chunk: Buffer) => {
    const lines = chunk.toString("utf-8").split("\n");
    for (const l of lines) {
      if (l.trim()) currentRun?.output.push(l.trimEnd());
    }
    // 限制内存中的输出长度
    if (currentRun && currentRun.output.length > 500) {
      currentRun.output = currentRun.output.slice(-500);
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    const lines = chunk.toString("utf-8").split("\n");
    for (const l of lines) {
      if (l.trim()) currentRun?.output.push(`[stderr] ${l.trimEnd()}`);
    }
  });

  child.on("close", () => {
    currentRun = null;
  });

  child.on("error", () => {
    currentRun = null;
  });

  return { success: true, message: "任务已启动" };
}

function stopRun(): { success: boolean; message: string } {
  if (!currentRun) {
    return { success: false, message: "没有正在运行的任务" };
  }
  const pid = currentRun.process.pid;
  // 强行终止整棵进程树（npm → tsx → node → daily.ts）
  if (pid) {
    try {
      execSync(`taskkill /F /T /PID ${pid}`, { timeout: 5000, stdio: "ignore" });
    } catch {
      // 进程可能已结束，忽略
    }
  }
  currentRun = null;
  return { success: true, message: "任务已终止" };
}

// ========================================================================
// Express 应用
// ========================================================================

const app = express();
app.use(express.json());

// ---- API: 配置 ----

app.get("/api/config", (_req, res) => {
  const config = readConfig();
  const envContent = readFileSafe(ENV_FILE) || readFileSafe(path.join(PROJECT_ROOT, ".env.example"));
  res.json({ config, envContent });
});

app.put("/api/config", (req, res) => {
  const result = saveConfig(req.body);
  res.json(result);
});

// ---- API: 数据源 ----

app.get("/api/sources", (_req, res) => {
  const sources = readSources();
  const categories = [...new Set(sources.map((s: any) => s.category))];
  res.json({ sources, categories });
});

app.put("/api/sources/:id", (req, res) => {
  const sources = readSources();
  const idx = sources.findIndex((s: any) => s.id === req.params.id);
  if (idx === -1) {
    res.json({ success: false, message: "未找到该数据源" });
    return;
  }
  const src = sources[idx];
  if (typeof req.body.enabled === "boolean") src.enabled = req.body.enabled;
  if (req.body.name !== undefined) src.name = req.body.name;
  if (req.body.url !== undefined) src.url = req.body.url;
  if (req.body.type !== undefined) src.type = req.body.type;
  if (req.body.category !== undefined) src.category = req.body.category;
  if (req.body.subcategory !== undefined) src.subcategory = req.body.subcategory;
  if (req.body.lang !== undefined) src.lang = req.body.lang;
  if (req.body.notes !== undefined) src.notes = req.body.notes;
  if (req.body.locales !== undefined) src.locales = req.body.locales;
  const result = saveSources(sources);
  res.json(result);
});

app.post("/api/sources", (req, res) => {
  const sources = readSources();
  const newSource = req.body;
  if (!newSource.id || !newSource.name || !newSource.url) {
    res.json({ success: false, message: "缺少必填字段：id、name、url" });
    return;
  }
  if (sources.some((s: any) => s.id === newSource.id)) {
    res.json({ success: false, message: `数据源 ID "${newSource.id}" 已存在` });
    return;
  }
  sources.push({
    id: newSource.id,
    name: newSource.name,
    type: newSource.type || "rss",
    url: newSource.url,
    category: newSource.category || "tech",
    subcategory: newSource.subcategory || "",
    enabled: newSource.enabled !== false,
    lang: newSource.lang || "",
    locales: newSource.locales || ["zh", "en"],
    notes: newSource.notes || "",
  });
  const result = saveSources(sources);
  res.json(result);
});

// ---- API: 运行控制 ----

app.post("/api/run/:command", (req, res) => {
  const result = runCommand(req.params.command);
  res.json(result);
});

app.get("/api/run/status", (_req, res) => {
  if (currentRun) {
    res.json({
      running: true,
      command: currentRun.command,
      startedAt: currentRun.startedAt,
      outputCount: currentRun.output.length,
      lastOutput: currentRun.output.slice(-10),
    });
  } else {
    res.json({ running: false });
  }
});

app.get("/api/run/output", (req, res) => {
  if (!currentRun) {
    res.json({ newOutput: [], total: 0, running: false });
    return;
  }
  const since = parseInt(req.query.since as string) || 0;
  res.json({
    newOutput: currentRun.output.slice(since),
    total: currentRun.output.length,
    running: true,
  });
});

app.delete("/api/run", (_req, res) => {
  const result = stopRun();
  res.json(result);
});

// 停止服务器
app.post("/api/shutdown", (_req, res) => {
  res.json({ success: true, message: "服务器即将关闭" });
  setTimeout(() => {
    process.exit(0);
  }, 300);
});

// ---- API: 日志 ----

app.get("/api/logs", (_req, res) => {
  let files: { name: string; size: number; mtime: string }[] = [];
  try {
    if (fs.existsSync(LOGS_DIR)) {
      files = fs.readdirSync(LOGS_DIR)
        .filter((f) => f.endsWith(".log") || f.endsWith(".jsonl"))
        .map((f) => {
          const stat = fs.statSync(path.join(LOGS_DIR, f));
          return {
            name: f,
            size: stat.size,
            mtime: stat.mtime.toISOString(),
          };
        })
        .sort((a, b) => b.mtime.localeCompare(a.mtime));
    }
  } catch {}
  res.json({ files });
});

app.get("/api/logs/:file", (req, res) => {
  const fileName = path.basename(req.params.file); // 防目录穿越
  const filePath = path.join(LOGS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    res.json({ content: "", error: "文件不存在" });
    return;
  }
  const content = readFileSafe(filePath);
  // 只返回后 500 行
  const lines = content.split("\n");
  const tail = lines.slice(-500);
  res.json({ content: tail.join("\n"), totalLines: lines.length });
});

// ---- API: 用量 ----

app.get("/api/quota", (_req, res) => {
  // 执行 quota-report 并返回结果
  const child = spawn("cmd.exe", ["/c", "npm", "run", "quota-report"], {
    cwd: PROJECT_ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout?.on("data", (chunk: Buffer) => { output += chunk.toString("utf-8"); });
  child.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString("utf-8"); });
  child.on("close", () => {
    res.json({ output });
  });
  child.on("error", (err) => {
    res.json({ output: `错误: ${err.message}` });
  });
});

// ---- API: 报告概览 ----

app.get("/api/reports/summary", (_req, res) => {
  let reports: { date: string; hasHtml: boolean; size: number }[] = [];
  try {
    if (fs.existsSync(REPORTS_DIR)) {
      reports = fs.readdirSync(REPORTS_DIR)
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .map((d) => {
          const htmlFile = path.join(REPORTS_DIR, d, `${d}.html`);
          const hasHtml = fs.existsSync(htmlFile);
          return {
            date: d,
            hasHtml,
            size: hasHtml ? fs.statSync(htmlFile).size : 0,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date));
    }
  } catch {}
  res.json({ total: reports.length, latest: reports[0] || null, reports: reports.slice(0, 30) });
});

// ---- 报告查看 ----

app.get("/report/:date", (req, res) => {
  const date = req.params.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(404).send("无效日期格式");
    return;
  }
  const htmlFile = path.join(REPORTS_DIR, date, `${date}.html`);
  if (!fs.existsSync(htmlFile)) {
    res.status(404).send("该日期没有 HTML 报告");
    return;
  }
  res.sendFile(htmlFile);
});

// ---- 前端页面 ----

app.get("/", (_req, res) => {
  res.send(renderPage());
});

// ---- 启动 ----

app.listen(PORT, () => {
  console.log(`\n  🗂️  DailyBrief 管理后台`);
  console.log(`  ───────────────────────`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log(`  退出: Ctrl+C\n`);
});

// ========================================================================
// 前端 HTML 模板
// ========================================================================

function renderPage(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DailyBrief 管理后台</title>
<style>
  :root {
    --bg: #f5f5f4;
    --surface: #ffffff;
    --sidebar: #1c1917;
    --sidebar-hover: #292524;
    --sidebar-active: #44403c;
    --fg: #1c1917;
    --fg-soft: #57534e;
    --fg-muted: #a8a29e;
    --border: #e7e5e4;
    --accent: #2563eb;
    --accent-hover: #1d4ed8;
    --success: #16a34a;
    --warning: #d97706;
    --danger: #dc2626;
    --radius: 8px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
      "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    background: var(--bg);
    color: var(--fg);
    display: flex;
    min-height: 100vh;
    line-height: 1.5;
  }

  /* ===== 侧边栏 ===== */
  .sidebar {
    width: 220px;
    background: var(--sidebar);
    color: #fff;
    padding: 0;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .sidebar-header {
    padding: 1.25rem 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .sidebar-header h1 {
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .sidebar-header .sub {
    font-size: 0.75rem;
    color: var(--fg-muted);
    margin-top: 0.2rem;
  }
  .sidebar-nav { padding: 0.75rem 0.5rem; flex: 1; }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 0.75rem;
    border-radius: 6px;
    color: #d4d4d4;
    text-decoration: none;
    font-size: 0.88rem;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
    transition: background 0.12s;
  }
  .nav-item:hover { background: var(--sidebar-hover); color: #fff; }
  .nav-item.active { background: var(--sidebar-active); color: #fff; font-weight: 500; }
  .nav-icon { font-size: 1.1rem; width: 1.4rem; text-align: center; flex-shrink: 0; }
  .sidebar-footer {
    padding: 0.75rem 1rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-size: 0.75rem;
    color: var(--fg-muted);
  }
  .sidebar-footer .version { margin-top: 0.1rem; }

  /* ===== 主内容 ===== */
  .main {
    flex: 1;
    padding: 0;
    overflow-y: auto;
    max-height: 100vh;
  }
  .page-header {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .page-header h2 { font-size: 1.3rem; font-weight: 600; }
  .page-header p { font-size: 0.85rem; color: var(--fg-soft); margin-top: 0.25rem; }
  .page-content { padding: 1.5rem 2rem 3rem; }

  /* ===== 面板 ===== */
  .panel { display: none; }
  .panel.active { display: block; }

  /* ===== 卡片 ===== */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem;
    margin-bottom: 1rem;
  }
  .card h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* ===== 栅格布局 ===== */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
  @media (max-width: 768px) {
    .grid-2, .grid-3 { grid-template-columns: 1fr; }
  }

  /* ===== 表单 ===== */
  .form-group { margin-bottom: 1rem; }
  .form-group label {
    display: block;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--fg-soft);
    margin-bottom: 0.3rem;
  }
  .form-group .hint {
    font-size: 0.75rem;
    color: var(--fg-muted);
    margin-top: 0.2rem;
  }
  input[type="text"], input[type="password"], select, textarea {
    width: 100%;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.88rem;
    font-family: inherit;
    background: var(--surface);
    color: var(--fg);
    transition: border-color 0.12s;
  }
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }
  textarea { font-family: "SF Mono", "Fira Code", "Consolas", monospace; font-size: 0.82rem; resize: vertical; }

  /* ===== 按钮 ===== */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.85rem;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    background: var(--surface);
    color: var(--fg);
    transition: all 0.12s;
    text-decoration: none;
  }
  .btn:hover { background: #f5f5f4; }
  .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); }
  .btn-danger:hover { background: #b91c1c; }
  .btn-success { background: var(--success); color: #fff; border-color: var(--success); }
  .btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ===== 开关 ===== */
  .toggle {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
  }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle .slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #d4d4d4;
    border-radius: 20px;
    transition: 0.2s;
  }
  .toggle .slider::before {
    content: "";
    position: absolute;
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background: #fff;
    border-radius: 50%;
    transition: 0.2s;
  }
  .toggle input:checked + .slider { background: var(--accent); }
  .toggle input:checked + .slider::before { transform: translateX(16px); }

  /* ===== 日志输出 ===== */
  .log-output {
    background: #1c1917;
    color: #d4d4d4;
    font-family: "SF Mono", "Fira Code", "Consolas", monospace;
    font-size: 0.78rem;
    padding: 1rem;
    border-radius: 6px;
    max-height: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.5;
  }
  .log-output .info { color: #93c5fd; }
  .log-output .warn { color: #fcd34d; }
  .log-output .error { color: #fca5a5; }
  .log-output .ok { color: #86efac; }

  /* ===== Toast ===== */
  .toast {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 500;
    z-index: 1000;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.25s;
    pointer-events: none;
  }
  .toast.show { opacity: 1; transform: translateY(0); }
  .toast.success { background: var(--success); }
  .toast.error { background: var(--danger); }

  /* ===== 源列表 ===== */
  .source-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--border);
  }
  .source-row:last-child { border-bottom: none; }
  .source-info { flex: 1; }
  .source-name { font-size: 0.9rem; font-weight: 500; }
  .source-meta { font-size: 0.75rem; color: var(--fg-muted); margin-top: 0.1rem; }
  .source-id { font-family: monospace; }
  .badge {
    display: inline-block;
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-weight: 500;
  }
  .badge-tech { background: #dbeafe; color: #1e40af; }
  .badge-finance { background: #dcfce7; color: #166534; }
  .badge-politics { background: #f3e8ff; color: #6b21a8; }

  /* ===== 弹窗 ===== */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }
  .modal-content {
    background: var(--surface);
    border-radius: 12px;
    width: 520px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border);
  }
  .modal-header h3 { margin: 0; font-size: 1rem; }
  .modal-close {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    color: var(--fg-muted);
    padding: 0 0.25rem;
  }
  .modal-close:hover { color: var(--fg); }
  .modal-body { padding: 1.25rem; }
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border);
  }
  .field-required { color: var(--danger); }

  /* ===== 日历 ===== */
  .calendar-card { min-height: 320px; }
  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .calendar-header h4 {
    font-size: 0.95rem;
    font-weight: 600;
  }
  .calendar-nav {
    display: flex;
    gap: 0.25rem;
  }
  .calendar-nav button {
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.2rem 0.5rem;
    cursor: pointer;
    font-size: 0.8rem;
    color: var(--fg);
  }
  .calendar-nav button:hover { background: var(--bg); }
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    text-align: center;
  }
  .calendar-grid .weekday {
    font-size: 0.75rem;
    color: var(--fg-muted);
    padding: 0.3rem 0;
    font-weight: 500;
  }
  .calendar-grid .day {
    padding: 0.35rem 0;
    font-size: 0.82rem;
    border-radius: 4px;
    cursor: default;
    color: var(--fg-soft);
  }
  .calendar-grid .day.other-month { color: #d4d4d4; }
  .calendar-grid .day.has-report {
    background: #dbeafe;
    color: #1e40af;
    font-weight: 600;
    cursor: pointer;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  .calendar-grid .day.has-report:hover { background: #93c5fd; }
  .calendar-grid .day.today { outline: 2px solid var(--accent); outline-offset: -2px; }
  .calendar-legend {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--fg-muted);
  }
  .calendar-legend span { display: flex; align-items: center; gap: 0.3rem; }
  .calendar-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  /* ===== 进度条（美观版） ===== */
  .run-progress {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem 1.25rem;
    margin-top: 0.75rem;
  }
  .run-progress-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }
  .run-progress-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.88rem;
    font-weight: 500;
  }
  .run-progress-status .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .run-progress-pct {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    min-width: 2.8em;
    text-align: right;
  }
  .run-progress-label {
    font-size: 0.78rem;
    color: var(--fg-soft);
    margin-bottom: 0.4rem;
  }
  .run-progress-track {
    position: relative;
    height: 10px;
    background: #e7e5e4;
    border-radius: 5px;
    overflow: visible;
    margin-bottom: 0.3rem;
  }
  .run-progress-fill {
    height: 100%;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--accent), #3b82f6, #60a5fa, #8b5cf6);
    background-size: 200% 100%;
    animation: shimmer 2s ease infinite;
    transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    width: 0%;
    position: relative;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .run-progress-fill::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 5px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1);
  }
  .run-progress-milestones {
    display: flex;
    justify-content: space-between;
    margin-top: 0.4rem;
    padding: 0 1px;
  }
  .run-progress-milestone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    font-size: 0.65rem;
    color: var(--fg-muted);
    transition: color 0.3s;
    position: relative;
    flex: 1;
    text-align: center;
  }
  .run-progress-milestone .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border);
    border: 2px solid var(--surface);
    transition: all 0.3s;
    z-index: 1;
  }
  .run-progress-milestone.active .dot {
    background: var(--accent);
    box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
  }
  .run-progress-milestone.done .dot {
    background: var(--success);
    box-shadow: 0 0 0 3px rgba(22,163,74,0.2);
  }
  .run-progress-milestone.done .label { color: var(--success); }
  .run-progress-milestone.active .label { color: var(--accent); font-weight: 500; }
  .run-progress-milestone .label { font-size: 0.68rem; white-space: nowrap; }

  /* ===== 运行简报 ===== */
  .run-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem; }
  .run-summary-section { }
  .run-summary-section h4 { font-size: 0.82rem; font-weight: 600; margin-bottom: 0.3rem; }
  .run-summary-section.ok h4 { color: var(--success); }
  .run-summary-section.fail h4 { color: var(--danger); }
  .run-summary-item { font-size: 0.78rem; padding: 0.15rem 0; color: var(--fg-soft); }
  .run-summary-item .badge { display: inline-block; font-size: 0.7rem; padding: 0 0.4rem; border-radius: 3px; margin-right: 0.3rem; }
  .run-summary-item .badge.ok { background: #dcfce7; color: #166534; }
  .run-summary-item .badge.fail { background: #fee2e2; color: #991b1b; }
  .run-summary-total { font-size: 0.82rem; font-weight: 500; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }

  /* ===== 日志切换按钮 ===== */
  .log-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    color: var(--fg-soft);
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    margin-top: 0.5rem;
    user-select: none;
    transition: all 0.15s;
  }
  .log-toggle:hover { background: #f5f5f4; }
  .log-toggle .arrow { transition: transform 0.2s; display: inline-block; }
  .log-toggle .arrow.open { transform: rotate(90deg); }

  /* ===== 状态指示 ===== */
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.4rem;
  }
  .status-dot.green { background: var(--success); }
  .status-dot.yellow { background: var(--warning); }
  .status-dot.red { background: var(--danger); }
  .status-dot.gray { background: var(--fg-muted); }

  /* ===== 滚动条 ===== */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
</style>
</head>
<body>

<!-- ===== 侧边栏 ===== -->
<aside class="sidebar">
  <div class="sidebar-header">
    <h1>📰 DailyBrief</h1>
    <div class="sub">管理后台</div>
  </div>
  <nav class="sidebar-nav">
    <button class="nav-item active" data-panel="dashboard">
      <span class="nav-icon">📊</span> 仪表盘
    </button>
    <button class="nav-item" data-panel="config">
      <span class="nav-icon">⚙️</span> 配置
    </button>
    <button class="nav-item" data-panel="sources">
      <span class="nav-icon">📡</span> 数据源
    </button>
    <button class="nav-item" data-panel="run">
      <span class="nav-icon">▶️</span> 运行控制
    </button>
    <button class="nav-item" data-panel="logs">
      <span class="nav-icon">📋</span> 日志
    </button>
  </nav>
  <div class="sidebar-footer">
    <div>DailyBrief v0.1</div>
    <div class="version">Node.js · TypeScript</div>
    <button class="btn btn-danger btn-sm" onclick="shutdownServer()" style="margin-top:0.5rem;width:100%">⏹ 停止服务</button>
  </div>
</aside>

<!-- ===== 主内容 ===== -->
<main class="main" id="mainContent">

<!-- ============================== -->
<!-- 仪表盘 -->
<!-- ============================== -->
<div class="panel active" id="panel-dashboard">
  <div class="page-header">
    <h2>📊 仪表盘</h2>
    <p>项目概览与快速状态</p>
  </div>
  <div class="page-content">
    <div class="grid-2" id="dashboardGrid">
      <div class="card">
        <h3>📅 最新报告</h3>
        <div id="latestReport"><span class="status-dot gray"></span> 加载中...</div>
      </div>
      <div class="card">
        <h3>📈 报告统计</h3>
        <div id="reportStats"><span class="status-dot gray"></span> 加载中...</div>
      </div>
      <div class="card">
        <h3>▶️ 快速操作</h3>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="switchPanel('run');startRun('daily')">运行日报</button>
          <button class="btn btn-sm" onclick="switchPanel('run');startRun('dry-run')">测试抓取</button>
          <button class="btn btn-sm" onclick="switchPanel('config')">修改配置</button>
          <button class="btn btn-sm" onclick="switchPanel('logs')">查看日志</button>
        </div>
      </div>
      <div class="card">
        <h3>ℹ️ 项目信息</h3>
        <div style="font-size:0.85rem;color:var(--fg-soft)">
          <div>项目路径：<code>${escapeHtml(PROJECT_ROOT)}</code></div>
          <div style="margin-top:0.3rem">管理后台端口：<code>${PORT}</code></div>
          <div style="margin-top:0.3rem">数据源数量：<span id="sourceCount">-</span></div>
        </div>
      </div>
    </div>
    <!-- 日历 -->
    <div class="card calendar-card" style="margin-top:1rem">
      <h3>📅 日报日历</h3>
      <div id="calendarWrap">
        <div class="calendar-header">
          <h4 id="calendarMonth">加载中...</h4>
          <div class="calendar-nav">
            <button onclick="calendarPrevMonth()">‹</button>
            <button onclick="calendarNextMonth()">›</button>
          </div>
        </div>
        <div class="calendar-grid" id="calendarGrid"></div>
        <div class="calendar-legend">
          <span><span class="dot" style="background:#dbeafe"></span> 有日报</span>
          <span><span class="dot" style="outline:2px solid var(--accent);outline-offset:-1px;width:10px;height:10px"></span> 今天</span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ============================== -->
<!-- 配置 -->
<!-- ============================== -->
<div class="panel" id="panel-config">
  <div class="page-header">
    <h2>⚙️ 配置</h2>
    <p>LLM 后端、报告设置等（保存到 .env.local）</p>
  </div>
  <div class="page-content">
    <div class="card">
      <h3>🤖 LLM 后端</h3>
      <div class="grid-2">
        <div class="form-group">
          <label for="config_LLM_BACKEND">LLM 后端</label>
          <select id="config_LLM_BACKEND" onchange="onBackendChange()">
            <option value="claude-cli">claude-cli（默认，需登录 Claude Code）</option>
            <option value="anthropic">Anthropic (Claude API)</option>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek（便宜，中文友好）</option>
            <option value="minimax">MiniMax</option>
          </select>
          <div class="hint" id="backendHint">切换后端后下方的 API Key 输入框会自动对应</div>
        </div>
        <div class="form-group">
          <label for="config_LLM_MODEL">模型名称（可选）</label>
          <input type="text" id="config_LLM_MODEL" placeholder="留空则使用后端默认模型">
          <div class="hint">覆盖默认模型，如 gpt-4o、claude-sonnet-4-6</div>
        </div>
      </div>
      <div class="form-group">
        <label for="config_API_KEY">API Key <span id="apiKeyLabel">（通用）</span></label>
        <input type="password" id="config_API_KEY" placeholder="根据所选后端自动对应">
        <div class="hint" id="apiKeyHint">选择 LLM 后端后，此输入框会自动对应到相应的 API Key</div>
      </div>
      <div class="form-group">
        <label for="config_LLM_BASE_URL">自定义 API 地址 (可选)</label>
        <input type="text" id="config_LLM_BASE_URL" placeholder="如 https://api.moonshot.cn/v1">
        <div class="hint">中转站、自建代理或 Ollama/LM Studio 等兼容服务使用</div>
      </div>
    </div>

    <div class="card">
      <h3>🌐 报告设置</h3>
      <div class="grid-2">
        <div class="form-group">
          <label for="config_REPORT_LOCALE">语言</label>
          <select id="config_REPORT_LOCALE">
            <option value="zh">中文 (zh)</option>
            <option value="en">英文 (en)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="config_REPORT_TZ">时区</label>
          <input type="text" id="config_REPORT_TZ" placeholder="Asia/Shanghai">
          <div class="hint">IANA 时区名，如 Asia/Shanghai、America/New_York</div>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label for="config_REPORT_HOUR">触发小时</label>
          <input type="text" id="config_REPORT_HOUR" placeholder="8">
          <div class="hint">24 小时制，多个用逗号分隔，如 8,18</div>
        </div>
        <div class="form-group">
          <label for="config_REPORT_DAYS">触发星期</label>
          <input type="text" id="config_REPORT_DAYS" placeholder="*">
          <div class="hint">cron 风格，0=周日，*=每天，1-5=工作日</div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:0.5rem">
      <button class="btn btn-primary" onclick="saveConfig()">💾 保存配置</button>
      <button class="btn" onclick="loadConfig()">🔄 重新加载</button>
    </div>
  </div>
</div>

<!-- ============================== -->
<!-- 数据源 -->
<!-- ============================== -->
<div class="panel" id="panel-sources">
  <div class="page-header">
    <h2>📡 数据源管理</h2>
    <p>启用/禁用数据源，查看各源状态</p>
  </div>
  <div class="page-content">
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
        <h3 style="margin:0">数据源列表</h3>
        <div style="display:flex;gap:0.5rem;align-items:center">
          <button class="btn btn-sm" onclick="showAddSourceModal()">➕ 添加数据源</button>
          <span id="sourceStats" style="font-size:0.82rem;color:var(--fg-muted)">加载中...</span>
        </div>
      </div>
      <div id="sourceList"></div>
    </div>
  </div>
</div>

<!-- ============================== -->
<!-- 添加数据源弹窗 -->
<!-- ============================== -->
<div class="modal-overlay" id="addSourceModal" style="display:none" onclick="if(event.target===this)hideAddSourceModal()">
  <div class="modal-content">
    <div class="modal-header">
      <h3>➕ 添加数据源</h3>
      <button class="modal-close" onclick="hideAddSourceModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>ID <span class="field-required">*</span></label>
        <input id="newSourceId" placeholder="例如：my-new-source">
      </div>
      <div class="form-group">
        <label>名称 <span class="field-required">*</span></label>
        <input id="newSourceName" placeholder="例如：我的数据源">
      </div>
      <div class="form-group">
        <label>URL <span class="field-required">*</span></label>
        <input id="newSourceUrl" placeholder="https://example.com/feed.xml">
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>类型</label>
          <select id="newSourceType">
            <option value="rss">RSS</option>
            <option value="api">API</option>
            <option value="scrape">Scrape</option>
          </select>
        </div>
        <div class="form-group">
          <label>分类</label>
          <select id="newSourceCategory">
            <option value="tech">技术</option>
            <option value="finance">财经</option>
            <option value="politics">时政</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>子分类</label>
          <input id="newSourceSubcategory" placeholder="例如：ai-news">
        </div>
        <div class="form-group">
          <label>语言</label>
          <input id="newSourceLang" placeholder="zh 或 en（可选）">
        </div>
      </div>
      <div class="form-group">
        <label>备注</label>
        <input id="newSourceNotes" placeholder="可选备注信息">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideAddSourceModal()">取消</button>
      <button class="btn btn-primary" onclick="addSource()">确认添加</button>
    </div>
  </div>
</div>

<!-- ============================== -->
<!-- 编辑数据源弹窗 -->
<!-- ============================== -->
<div class="modal-overlay" id="editSourceModal" style="display:none" onclick="if(event.target===this)hideEditSourceModal()">
  <div class="modal-content">
    <div class="modal-header">
      <h3>✏️ 编辑数据源</h3>
      <button class="modal-close" onclick="hideEditSourceModal()">&times;</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label>ID</label>
        <input id="editSourceId" disabled style="background:var(--bg-muted);color:var(--fg-muted)">
      </div>
      <div class="form-group">
        <label>名称 <span class="field-required">*</span></label>
        <input id="editSourceName" placeholder="例如：我的数据源">
      </div>
      <div class="form-group">
        <label>URL <span class="field-required">*</span></label>
        <input id="editSourceUrl" placeholder="https://example.com/feed.xml">
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>类型</label>
          <select id="editSourceType">
            <option value="rss">RSS</option>
            <option value="api">API</option>
            <option value="scrape">Scrape</option>
          </select>
        </div>
        <div class="form-group">
          <label>分类</label>
          <select id="editSourceCategory">
            <option value="tech">技术</option>
            <option value="finance">财经</option>
            <option value="politics">时政</option>
          </select>
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>子分类</label>
          <input id="editSourceSubcategory" placeholder="例如：ai-news">
        </div>
        <div class="form-group">
          <label>语言</label>
          <input id="editSourceLang" placeholder="zh 或 en（可选）">
        </div>
      </div>
      <div class="form-group">
        <label>备注</label>
        <input id="editSourceNotes" placeholder="可选备注信息">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="hideEditSourceModal()">取消</button>
      <button class="btn btn-primary" onclick="saveEditSource()">保存修改</button>
    </div>
  </div>
</div>

<!-- ============================== -->
<!-- 运行控制 -->
<!-- ============================== -->
<div class="panel" id="panel-run">
  <div class="page-header">
    <h2>▶️ 运行控制</h2>
    <p>手动触发日报生成，查看实时输出</p>
  </div>
  <div class="page-content">
    <div class="card">
      <h3>🎯 触发任务</h3>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
        <button class="btn btn-primary" id="btnRunDaily" onclick="startRun('daily')">📰 运行日报 (npm run daily)</button>
        <button class="btn" id="btnRunDry" onclick="startRun('dry-run')">🔍 测试抓取 (npm run dry-run)</button>
        <button class="btn btn-danger" id="btnStopRun" onclick="stopRun()" style="display:none">⏹ 终止任务</button>
      </div>
    </div>
    <div class="card" id="runStatusCard" style="display:none">
      <h3>⏳ 运行状态</h3>
      <div id="runStatusInfo"></div>
      <!-- 进度条区域 -->
      <div class="run-progress" id="progressWrap">
        <div class="run-progress-header">
          <div class="run-progress-status">
            <span class="spinner" id="progressSpinner"></span>
            <span id="runProgressStage">启动中...</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="run-progress-pct" id="runProgressPct">0%</span>
            <button class="btn btn-danger btn-sm" id="btnStopRunProgress" onclick="stopRun()" style="display:none">⏹ 终止</button>
          </div>
        </div>
        <div class="run-progress-label" id="progressLabel">正在初始化...</div>
        <div class="run-progress-track">
          <div class="run-progress-fill" id="progressFill"></div>
        </div>
        <!-- 里程碑 -->
        <div class="run-progress-milestones" id="progressMilestones">
          <div class="run-progress-milestone" data-stage="fetch">
            <span class="dot"></span>
            <span class="label">抓取</span>
          </div>
          <div class="run-progress-milestone" data-stage="enrich">
            <span class="dot"></span>
            <span class="label">增强</span>
          </div>
          <div class="run-progress-milestone" data-stage="analyze">
            <span class="dot"></span>
            <span class="label">分析</span>
          </div>
          <div class="run-progress-milestone" data-stage="generate">
            <span class="dot"></span>
            <span class="label">生成</span>
          </div>
          <div class="run-progress-milestone" data-stage="done">
            <span class="dot"></span>
            <span class="label">完成</span>
          </div>
        </div>
      </div>
      <!-- 日志切换按钮 -->
      <div class="log-toggle" id="logToggle" onclick="toggleLog()">
        <span class="arrow" id="logArrow">▶</span> 查看运行日志
      </div>
      <div class="log-output" id="runOutput" style="margin-top:0.5rem;max-height:500px;display:none"></div>
    </div>
    <!-- 运行简报 -->
    <div class="card" id="runSummaryCard" style="display:none">
      <h3>📋 运行简报</h3>
      <div id="runSummaryContent"></div>
    </div>
  </div>
</div>

<!-- ============================== -->
<!-- 日志 -->
<!-- ============================== -->
<div class="panel" id="panel-logs">
  <div class="page-header">
    <h2>📋 日志</h2>
    <p>运行日志和 LLM 调用记录</p>
  </div>
  <div class="page-content">
    <div class="card">
      <h3>📄 日志文件</h3>
      <div id="logFileList"></div>
    </div>
    <div class="card" id="logContentCard" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
        <h3 id="logFileName" style="margin:0"></h3>
        <button class="btn btn-sm" onclick="document.getElementById('logContentCard').style.display='none'">✕ 关闭</button>
      </div>
      <div class="log-output" id="logContent" style="max-height:600px"></div>
    </div>
    <div class="card">
      <h3>📊 LLM 用量</h3>
      <div id="quotaOutput" class="log-output" style="max-height:300px">加载中...</div>
    </div>
  </div>
</div>

</main>

<!-- ===== Toast ===== -->
<div class="toast" id="toast"></div>

<script>
// ========================================================================
// 导航切换
// ========================================================================

function switchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
  const navBtn = document.querySelector('.nav-item[data-panel="' + name + '"]');
  if (navBtn) navBtn.classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    switchPanel(btn.dataset.panel);
    // 进入页面时加载数据
    loaders[btn.dataset.panel]?.();
  });
});

// ========================================================================
// Toast 通知
// ========================================================================

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ========================================================================
// API 调用
// ========================================================================

async function api(url, opts) {
  try {
    const res = await fetch(url, opts);
    return await res.json();
  } catch (e) {
    showToast('网络错误：' + e.message, 'error');
    return null;
  }
}

// ========================================================================
// 加载器 — 切换到对应面板时调用
// ========================================================================

const loaders = {
  dashboard: loadDashboard,
  config: loadConfig,
  sources: loadSources,
  logs: loadLogs,
};

// 默认加载仪表盘
loadDashboard();

// ========================================================================
// 仪表盘
// ========================================================================

async function loadDashboard() {
  const summary = await api('/api/reports/summary');
  if (summary) {
    document.getElementById('sourceCount').textContent = '-';
    if (summary.latest) {
      document.getElementById('latestReport').innerHTML = \`
        <span class="status-dot green"></span>
        <strong>\${summary.latest.date}</strong>
        \${summary.latest.hasHtml
          ? '<a href="/report/' + summary.latest.date + '" target="_blank" style="text-decoration:none">✅ 已生成</a>'
          : '⚠️ 无 HTML 文件'}
        \${summary.latest.size ? '（' + (summary.latest.size / 1024).toFixed(0) + ' KB）' : ''}
      \`;
    } else {
      document.getElementById('latestReport').innerHTML = '<span class="status-dot gray"></span> 暂无报告，请先运行日报';
    }
    document.getElementById('reportStats').innerHTML = \`
      累计报告：<strong>\${summary.total}</strong> 天
      \${summary.total > 0 ? '· 最新：' + summary.latest.date : ''}
    \`;
    // 更新日历数据
    calendarReports = summary.reports || [];
    renderCalendar();
  }
  const src = await api('/api/sources');
  if (src && src.sources) {
    const enabled = src.sources.filter(s => s.enabled !== false).length;
    document.getElementById('sourceCount').textContent = enabled + '/' + src.sources.length;
  }
}

// ========================================================================
// 配置
// ========================================================================

const API_KEY_MAP = {
  'claude-cli':  null,        // 不需要 API Key
  'anthropic':   'ANTHROPIC_API_KEY',
  'openai':      'OPENAI_API_KEY',
  'deepseek':    'DEEPSEEK_API_KEY',
  'minimax':     'MINIMAX_API_KEY',
};
const API_KEY_LABELS = {
  'claude-cli':  '（本地 CLI，无需 Key）',
  'anthropic':   '（Anthropic）',
  'openai':      '（OpenAI）',
  'deepseek':    '（DeepSeek）',
  'minimax':     '（MiniMax）',
};
const API_KEY_HINTS = {
  'claude-cli':  'claude-cli 使用本地 Claude Code 登录，无需 API Key',
  'anthropic':   '输入 Anthropic API Key（sk-ant-...）',
  'openai':      '输入 OpenAI API Key（sk-...）',
  'deepseek':    '输入 DeepSeek API Key（sk-...）',
  'minimax':     '输入 MiniMax API Key',
};

function updateApiKeyField(backend) {
  const label = document.getElementById('apiKeyLabel');
  const hint = document.getElementById('apiKeyHint');
  const input = document.getElementById('config_API_KEY');
  if (!label || !hint || !input) return;
  const envKey = API_KEY_MAP[backend];
  if (!envKey) {
    label.textContent = '（无需 Key）';
    hint.textContent = API_KEY_HINTS[backend] || '';
    input.disabled = true;
    input.placeholder = '此后端无需 API Key';
    input.value = '';
    return;
  }
  input.disabled = false;
  label.textContent = API_KEY_LABELS[backend] || '';
  hint.textContent = API_KEY_HINTS[backend] || '';
  input.placeholder = '输入 ' + (API_KEY_LABELS[backend] || 'API Key');
  // 尝试从已加载的配置中读取对应 key 的值
  if (window._lastConfig) {
    input.value = window._lastConfig[envKey] || '';
  }
}

async function loadConfig() {
  const data = await api('/api/config');
  if (!data) return;
  const cfg = data.config;
  window._lastConfig = cfg;
  const fields = [
    'LLM_BACKEND', 'LLM_MODEL', 'LLM_BASE_URL',
    'REPORT_LOCALE', 'REPORT_TZ', 'REPORT_HOUR', 'REPORT_DAYS',
  ];
  for (const key of fields) {
    const el = document.getElementById('config_' + key);
    if (el) el.value = cfg[key] || '';
  }
  // 初始化 API Key 字段
  const backend = cfg['LLM_BACKEND'] || 'claude-cli';
  updateApiKeyField(backend);
  // 监听后端切换
  const sel = document.getElementById('config_LLM_BACKEND');
  if (sel) {
    sel.removeEventListener('change', onBackendChange);
    sel.addEventListener('change', onBackendChange);
  }
}

function onBackendChange() {
  const sel = document.getElementById('config_LLM_BACKEND');
  if (sel) updateApiKeyField(sel.value);
}

// 暴露给 HTML onclick
window.onBackendChange = onBackendChange;

async function saveConfig() {
  const fields = [
    'LLM_BACKEND', 'LLM_MODEL', 'LLM_BASE_URL',
    'REPORT_LOCALE', 'REPORT_TZ', 'REPORT_HOUR', 'REPORT_DAYS',
  ];
  const updates = {};
  for (const key of fields) {
    const el = document.getElementById('config_' + key);
    if (el) updates[key] = el.value.trim();
  }
  // 单 API Key 字段 → 按后端路由到正确环境变量
  const backend = updates['LLM_BACKEND'] || 'claude-cli';
  const envKey = API_KEY_MAP[backend];
  if (envKey) {
    const apiInput = document.getElementById('config_API_KEY');
    if (apiInput) updates[envKey] = apiInput.value.trim();
  }
  const result = await api('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (result) {
    showToast(result.message, result.success ? 'success' : 'error');
    // 保存后刷新缓存
    if (result.success) {
      window._lastConfig = { ...window._lastConfig, ...updates };
    }
  }
}

// ========================================================================
// 数据源
// ========================================================================

async function loadSources() {
  const data = await api('/api/sources');
  if (!data) return;
  window._lastSourceList = data; // 缓存供编辑弹窗使用
  const { sources, categories } = data;
  const enabled = sources.filter(s => s.enabled !== false).length;
  document.getElementById('sourceStats').textContent = \`\${enabled} 启用 / \${sources.length} 总计\`;

  const list = document.getElementById('sourceList');
  list.innerHTML = sources.map(s => {
    const isEnabled = s.enabled !== false;
    const badgeType = s.category || 'tech';
    return \`<div class="source-row">
      <div class="source-info">
        <div class="source-name">
          <span class="badge badge-\${badgeType}">\${s.category || 'tech'}</span>
          \${escapeHtml(s.name)}
          <code class="source-id">[\${s.id}]</code>
        </div>
        <div class="source-meta">
          类型：\${s.type || 'rss'} · URL：<code>\${escapeHtml(s.url || '')}</code>
          \${s.lang ? '· 语言：' + s.lang : ''}
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem">
        <button class="btn btn-sm" onclick="showEditSourceModal('\${s.id}')" title="编辑" style="font-size:0.75rem;padding:0.2rem 0.5rem">✏️</button>
        <label class="toggle">
          <input type="checkbox" \${isEnabled ? 'checked' : ''} onchange="toggleSource('\${s.id}', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
    </div>\`;
  }).join('');
}

async function toggleSource(id, enabled) {
  const result = await api('/api/sources/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (result) {
    showToast(result.message, result.success ? 'success' : 'error');
    loadSources(); // 刷新列表
  }
}

// ========================================================================
// 编辑数据源
// ========================================================================

function showEditSourceModal(id) {
  const data = window._lastSourceList;
  if (!data) return;
  const source = data.sources.find(s => s.id === id);
  if (!source) return;
  document.getElementById('editSourceId').value = source.id;
  document.getElementById('editSourceName').value = source.name || '';
  document.getElementById('editSourceUrl').value = source.url || '';
  document.getElementById('editSourceType').value = source.type || 'rss';
  document.getElementById('editSourceCategory').value = source.category || 'tech';
  document.getElementById('editSourceSubcategory').value = source.subcategory || '';
  document.getElementById('editSourceLang').value = source.lang || '';
  document.getElementById('editSourceNotes').value = source.notes || '';
  document.getElementById('editSourceModal').style.display = 'flex';
}

function hideEditSourceModal() {
  document.getElementById('editSourceModal').style.display = 'none';
}

async function saveEditSource() {
  const id = document.getElementById('editSourceId').value;
  const name = document.getElementById('editSourceName').value.trim();
  const url = document.getElementById('editSourceUrl').value.trim();
  if (!name || !url) {
    showToast('名称 和 URL 不能为空', 'error');
    return;
  }
  const result = await api('/api/sources/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      url,
      type: document.getElementById('editSourceType').value,
      category: document.getElementById('editSourceCategory').value,
      subcategory: document.getElementById('editSourceSubcategory').value.trim(),
      lang: document.getElementById('editSourceLang').value.trim(),
      notes: document.getElementById('editSourceNotes').value.trim(),
    }),
  });
  if (result) {
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      hideEditSourceModal();
      loadSources();
    }
  }
}

// ========================================================================
// 添加数据源
// ========================================================================

function showAddSourceModal() {
  document.getElementById('addSourceModal').style.display = 'flex';
}

function hideAddSourceModal() {
  document.getElementById('addSourceModal').style.display = 'none';
}

async function addSource() {
  const id = document.getElementById('newSourceId').value.trim();
  const name = document.getElementById('newSourceName').value.trim();
  const url = document.getElementById('newSourceUrl').value.trim();
  if (!id || !name || !url) {
    showToast('请填写 ID、名称 和 URL', 'error');
    return;
  }
  const result = await api('/api/sources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      name,
      url,
      type: document.getElementById('newSourceType').value,
      category: document.getElementById('newSourceCategory').value,
      subcategory: document.getElementById('newSourceSubcategory').value.trim(),
      lang: document.getElementById('newSourceLang').value.trim(),
      notes: document.getElementById('newSourceNotes').value.trim(),
    }),
  });
  if (result) {
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      hideAddSourceModal();
      // 清空表单
      document.getElementById('newSourceId').value = '';
      document.getElementById('newSourceName').value = '';
      document.getElementById('newSourceUrl').value = '';
      document.getElementById('newSourceSubcategory').value = '';
      document.getElementById('newSourceLang').value = '';
      document.getElementById('newSourceNotes').value = '';
      loadSources();
    }
  }
}

// ========================================================================
// 运行控制
// ========================================================================

let runPollTimer = null;

// 进度条阶段判断：从输出文本中估算进度
// 百分比按实际执行耗时分配：抓取约 30%、增强约 25%、分析约 10%、生成约 35%
const STAGE_MILESTONES = [
  { re: /\[daily\] (done\.?|已完成)$/,  stage: 'done',     pct: 100, label: '✓ 已完成' },
  { re: /wrote/i,                       stage: 'done',     pct: 95,  label: '写入文件...' },
  { re: /digest ready|摘要生成/i,        stage: 'generate', pct: 88,  label: '摘要已生成' },
  { re: /generating digest|生成摘要/i,   stage: 'generate', pct: 80,  label: '生成摘要中...' },
  { re: /trading commentary ready/i,     stage: 'generate', pct: 75,  label: '交易评论完成' },
  { re: /indicators ready/i,             stage: 'analyze',  pct: 70,  label: '行情数据就绪' },
  { re: /watchlist|trading|分析行情/i,    stage: 'analyze',  pct: 63,  label: '分析行情中...' },
  { re: /xviral.*summaries/i,            stage: 'enrich',   pct: 57,  label: 'AI 增强 X 热帖...' },
  { re: /ai-news.*summaries/i,           stage: 'enrich',   pct: 53,  label: 'AI 增强科技新闻...' },
  { re: /politics.*summaries/i,          stage: 'enrich',   pct: 49,  label: 'AI 增强时政新闻...' },
  { re: /finance.*news.*summaries/i,     stage: 'enrich',   pct: 45,  label: 'AI 增强财经新闻...' },
  { re: /github trending.*summaries/i,   stage: 'enrich',   pct: 41,  label: 'AI 增强 GitHub...' },
  { re: /enrichment done|增强完成/i,      stage: 'enrich',   pct: 60,  label: 'AI 增强完成' },
  { re: /enriching|增强中/i,              stage: 'enrich',   pct: 38,  label: 'AI 增强中...' },
  { re: /total articles|抓取完成/i,       stage: 'fetch',    pct: 35,  label: '抓取完成' },
  { re: /fetching sources|抓取数据/i,     stage: 'fetch',    pct: 10,  label: '抓取数据源...' },
];
const STAGE_ORDER = ['fetch', 'enrich', 'analyze', 'generate', 'done'];
const STAGE_LABEL_CN = { fetch: '抓取', enrich: '增强', analyze: '分析', generate: '生成', done: '完成' };

function estimateStage(lines) {
  let best = { stage: '', pct: 0, label: '运行中...' };
  for (const line of lines) {
    for (const rule of STAGE_MILESTONES) {
      if (rule.re.test(line) && rule.pct > best.pct) {
        best = { stage: rule.stage, pct: rule.pct, label: rule.label };
      }
    }
  }
  return best;
}

function updateMilestones(stage) {
  const ms = document.querySelectorAll('.run-progress-milestone');
  let activeFound = false;
  ms.forEach(el => {
    const s = el.dataset.stage;
    el.classList.remove('active', 'done');
    if (!activeFound && s === stage) {
      el.classList.add('active');
      activeFound = true;
    } else if (!activeFound && STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(stage)) {
      el.classList.add('done');
    } else if (STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(stage)) {
      el.classList.add('done');
    }
  });
}

function updateProgress(lines) {
  const { stage, pct, label } = estimateStage(lines);
  const pctVal = pct > 0 ? pct : 3;
  // 进度填充
  const fill = document.getElementById('progressFill');
  const pctEl = document.getElementById('runProgressPct');
  const stageEl = document.getElementById('runProgressStage');
  const labelEl = document.getElementById('progressLabel');
  if (fill) fill.style.width = Math.min(pctVal, 100) + '%';
  if (pctEl) pctEl.textContent = Math.min(pctVal, 100) + '%';
  if (stageEl) stageEl.textContent = label;
  if (labelEl) labelEl.textContent = stage ? STAGE_LABEL_CN[stage] + '阶段 · ' + label : label;
  if (stage) updateMilestones(stage);
}

function setProgress(pct, label, stage) {
  const fill = document.getElementById('progressFill');
  const pctEl = document.getElementById('runProgressPct');
  const stageEl = document.getElementById('runProgressStage');
  const labelEl = document.getElementById('progressLabel');
  const spinner = document.getElementById('progressSpinner');
  if (fill) fill.style.width = Math.min(pct, 100) + '%';
  if (pctEl) pctEl.textContent = Math.min(pct, 100) + '%';
  if (stageEl) stageEl.textContent = label;
  if (labelEl) labelEl.textContent = (stage ? STAGE_LABEL_CN[stage] + '阶段 · ' : '') + label;
  if (pct >= 100 && spinner) spinner.style.borderTopColor = 'var(--success)';
  if (stage) updateMilestones(stage);
}

function toggleLog() {
  const log = document.getElementById('runOutput');
  const arrow = document.getElementById('logArrow');
  if (!log) return;
  const isHidden = log.style.display === 'none' || log.style.display === '';
  log.style.display = isHidden ? 'block' : 'none';
  if (arrow) arrow.className = isHidden ? 'arrow open' : 'arrow';
}

async function startRun(command) {
  // 已有日报时提示确认
  if (command === 'daily') {
    const summary = await api('/api/reports/summary');
    if (summary && summary.reports) {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (summary.reports.some(r => r.date === todayStr)) {
        if (!confirm('今日已有日报，是否更新？更新会在已有数据基础上补充新文章（保留旧摘要），并重新生成 AI 摘要。')) {
          return;
        }
      }
    }
  }
  const result = await api('/api/run/' + command, { method: 'POST' });
  if (!result) return;
  showToast(result.message, result.success ? 'success' : 'error');
  if (result.success) {
    document.getElementById('btnRunDaily').disabled = true;
    document.getElementById('btnRunDry').disabled = true;
    document.getElementById('btnStopRun').style.display = '';
    document.getElementById('btnStopRunProgress').style.display = '';
    document.getElementById('runStatusCard').style.display = '';
    document.getElementById('runSummaryCard').style.display = 'none';
    document.getElementById('progressWrap').style.display = '';
    document.getElementById('runStatusInfo').innerHTML = '<span class="status-dot yellow"></span> 任务已启动...';
    document.getElementById('runOutput').textContent = '';
    document.getElementById('runOutput').style.display = 'none';
    document.getElementById('logArrow').className = 'arrow';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('runProgressPct').textContent = '0%';
    document.getElementById('runProgressStage').textContent = '启动中...';
    document.getElementById('progressLabel').textContent = '正在初始化...';
    document.getElementById('progressSpinner').style.borderTopColor = '';
    updateMilestones('');
    // 开始轮询
    if (runPollTimer) clearInterval(runPollTimer);
    let since = 0;
    let allOutput = [];
    runPollTimer = setInterval(async () => {
      const status = await api('/api/run/output?since=' + since);
      if (!status) return;
      if (status.newOutput && status.newOutput.length > 0) {
        const out = document.getElementById('runOutput');
        const append = status.newOutput.join('\\n') + '\\n';
        out.textContent += append;
        out.scrollTop = out.scrollHeight;
        since = status.total;
        allOutput.push(...status.newOutput);
        // 更新进度条
        updateProgress(allOutput);
      }
      if (!status.running) {
        clearInterval(runPollTimer);
        runPollTimer = null;
        document.getElementById('btnRunDaily').disabled = false;
        document.getElementById('btnRunDry').disabled = false;
        document.getElementById('btnStopRun').style.display = 'none';
        document.getElementById('btnStopRunProgress').style.display = 'none';
        // 隐藏进度条和转圈，只保留状态文字和输出日志
        document.getElementById('progressWrap').style.display = 'none';
        document.getElementById('runOutput').style.display = 'block';
        document.getElementById('runStatusInfo').innerHTML = \`<span class="status-dot green"></span> 任务已完成，<a href="#latestReport" onclick="switchPanel('dashboard')" style="color:var(--accent)">查看最新报告</a>\`;
        // 显示运行简报
        if (allOutput.length > 0) {
          showRunSummary(allOutput);
        }
        // 再拉一次完整状态
        const finalStatus = await api('/api/run/status');
        if (finalStatus && !finalStatus.running) {
          loadDashboard();
        }
      }
    }, 1000);
  }
}

async function stopRun() {
  const result = await api('/api/run', { method: 'DELETE' });
  if (result) {
    showToast(result.message, 'success');
    if (runPollTimer) {
      clearInterval(runPollTimer);
      runPollTimer = null;
    }
    document.getElementById('btnRunDaily').disabled = false;
    document.getElementById('btnRunDry').disabled = false;
    document.getElementById('btnStopRun').style.display = 'none';
    document.getElementById('btnStopRunProgress').style.display = 'none';
    document.getElementById('progressWrap').style.display = 'none';
    document.getElementById('runOutput').style.display = 'block';
    document.getElementById('runStatusInfo').innerHTML = '<span class="status-dot red"></span> 已终止';
    setProgress(0, '⏹ 已终止', '');
  }
}

// ========================================================================
// 运行简报
// ========================================================================

function parseRunSummary(lines) {
  const ok = [];    // { source, count }
  const fail = [];  // { source }
  let total = 0;
  for (const line of lines) {
    const okMatch = line.match(/^\s{2,}(\S+)\s{2,}(\d+)$/);
    if (okMatch) { ok.push({ source: okMatch[1], count: parseInt(okMatch[2], 10) }); continue; }
    const failMatch = line.match(/^\s{2,}(\S+)\s{2,}FAILED$/);
    if (failMatch) { fail.push({ source: failMatch[1] }); continue; }
    const totalMatch = line.match(/\[daily\] total articles:\s*(\d+)/);
    if (totalMatch) { total = parseInt(totalMatch[1], 10); }
  }
  return { ok, fail, total };
}

function showRunSummary(lines) {
  const summary = parseRunSummary(lines);
  const card = document.getElementById('runSummaryCard');
  const content = document.getElementById('runSummaryContent');
  if (!card || !content) return;
  if (summary.ok.length === 0 && summary.fail.length === 0) { card.style.display = 'none'; return; }
  let html = '<div class="run-summary-grid">';
  // 成功的站点
  html += '<div class="run-summary-section ok"><h4>✅ 成功 (' + summary.ok.length + ')</h4>';
  for (const s of summary.ok) {
    html += '<div class="run-summary-item"><span class="badge ok">' + s.count + '</span>' + escapeHtml(s.source) + '</div>';
  }
  html += '</div>';
  // 失败的站点
  html += '<div class="run-summary-section fail"><h4>❌ 失败 (' + summary.fail.length + ')</h4>';
  if (summary.fail.length === 0) {
    html += '<div class="run-summary-item" style="color:var(--success)">全部成功</div>';
  } else {
    for (const s of summary.fail) {
      html += '<div class="run-summary-item"><span class="badge fail">✕</span>' + escapeHtml(s.source) + '</div>';
    }
  }
  html += '</div></div>';
  // 总计
  if (summary.total > 0) {
    html += '<div class="run-summary-total">📊 共抓取 <strong>' + summary.total + '</strong> 篇文章</div>';
  }
  content.innerHTML = html;
  card.style.display = '';
}

// ========================================================================
// 停止服务
// ========================================================================

async function shutdownServer() {
  if (!confirm('确定要停止 DailyBrief 服务吗？')) return;
  await api('/api/shutdown', { method: 'POST' });
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:1.2rem;color:var(--fg-muted)">服务已停止，可以关闭此窗口</div>';
}

// ========================================================================
// 日历
// ========================================================================

let calendarDate = new Date();
let calendarReports = [];
// 初始渲染空白日历（loadDashboard 完成后会刷新数据）
renderCalendar();

async function loadCalendar() {
  const data = await api('/api/reports/summary');
  if (data) {
    calendarReports = data.reports || [];
    renderCalendar();
  }
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  document.getElementById('calendarMonth').textContent = year + '年 ' + monthNames[month];

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const reportDates = new Set(calendarReports.map(r => r.date));
  const todayStr = new Date().toISOString().slice(0, 10);

  let html = '<div class="weekday">日</div><div class="weekday">一</div><div class="weekday">二</div><div class="weekday">三</div><div class="weekday">四</div><div class="weekday">五</div><div class="weekday">六</div>';

  // 上月填充
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    html += '<div class="day other-month">' + d + '</div>';
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    let cls = 'day';
    if (reportDates.has(dateStr)) cls += ' has-report';
    if (dateStr === todayStr) cls += ' today';
    html += '<div class="' + cls + '" onclick="' + (reportDates.has(dateStr) ? "openReport('" + dateStr + "')" : '') + '">' + d + '</div>';
  }

  // 下月填充
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    html += '<div class="day other-month">' + d + '</div>';
  }

  document.getElementById('calendarGrid').innerHTML = html;
}

function calendarPrevMonth() {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
}

function calendarNextMonth() {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
}

function openReport(dateStr) {
  const report = calendarReports.find(r => r.date === dateStr);
  if (report && report.hasHtml) {
    window.open('/report/' + dateStr, '_blank');
  } else {
    showToast(dateStr + ' 暂无 HTML 报告', 'info');
  }
}

// 在 loadDashboard 中也加载日历（通过主动调用）
// 见 loadDashboard 函数末尾

// ========================================================================
// 日志
// ========================================================================

async function loadLogs() {
  // 日志文件列表
  const data = await api('/api/logs');
  if (!data) return;
  const list = document.getElementById('logFileList');
  if (data.files.length === 0) {
    list.innerHTML = '<p style="color:var(--fg-muted)">暂无日志文件</p>';
  } else {
    list.innerHTML = data.files.map(f => \`
      <div class="source-row" style="cursor:pointer" onclick="viewLog('\${f.name}')">
        <div class="source-info">
          <div class="source-name">\${escapeHtml(f.name)}</div>
          <div class="source-meta">\${(f.size / 1024).toFixed(1)} KB · \${new Date(f.mtime).toLocaleString()}</div>
        </div>
        <button class="btn btn-sm">查看</button>
      </div>
    \`).join('');
  }

  // LLM 用量
  const quota = await api('/api/quota');
  if (quota) {
    document.getElementById('quotaOutput').textContent = quota.output || '暂无数据';
  }
}

async function viewLog(file) {
  const data = await api('/api/logs/' + encodeURIComponent(file));
  if (!data) return;
  document.getElementById('logContentCard').style.display = '';
  document.getElementById('logFileName').textContent = '📄 ' + file + (data.totalLines ? '（共 ' + data.totalLines + ' 行）' : '');
  document.getElementById('logContent').textContent = data.content || '（空文件）';
}

// ========================================================================
// 工具函数
// ========================================================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
</script>
</body>
</html>`;
}
