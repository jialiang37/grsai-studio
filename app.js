/* =====================================================
 * Grsai 图像工作站
 * 纯静态前端：API Key 仅存内存，任务历史存 localStorage
 * ===================================================== */
"use strict";

/* ---------- 模型元数据（来自官方文档与模型列表页） ---------- */
// GPT 高清档位模型（vip/flare/sunburst）：比例 → [1K, 2K, 4K] 像素值
const GPT_TIER_PIXELS = {
  "1:1":  ["1024x1024", "2048x2048", "2880x2880"],
  "16:9": ["1280x720",  "2048x1152", "3840x2160"],
  "9:16": ["720x1280",  "1152x2048", "2160x3840"],
  "4:3":  ["1152x864",  "2304x1728", "3264x2448"],
  "3:4":  ["864x1152",  "1728x2304", "2440x3264"],
  "3:2":  ["1536x1024", "2048x1360", "3504x2336"],
  "2:3":  ["1024x1536", "1360x2048", "2336x3504"],
  "5:4":  ["1120x896",  "2240x1792", "3200x2560"],
  "4:5":  ["896x1120",  "1792x2240", "2560x3200"],
  "21:9": ["1456x624",  "2912x1248", "3840x1648"],
  "9:21": ["624x1456",  "1248x2912", "1648x3840"],
  "2:1":  ["1536x768",  "3072x1536", "3840x1920"],
  "1:2":  ["768x1536",  "1536x3072", "1920x3840"],
};

const RATIO_GPT = ["auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9", "9:21", "2:1", "1:2"];
const RATIO_BANANA = ["auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9"];
const RATIO_BANANA_EXTRA = ["auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "5:4", "4:5", "21:9", "1:4", "4:1", "1:8", "8:1"];

// sizeMode: "ratio"=直接发比例字符串; "tier"=按档位发像素值; "imageSize"=Banana 的 1K/2K/4K
const MODELS = [
  { id: "gpt-image-2.5",          family: "gpt",    label: "GPT Image 2.5",           price: 0.03,  sizeMode: "ratio",     quality: ["auto"],                                  background: false, note: "1K · 性价比默认款" },
  { id: "gpt-image-2",            family: "gpt",    label: "GPT Image 2",             price: 0.03,  sizeMode: "ratio",     quality: ["auto"],                                  background: false, note: "1K · 上一代经典" },
  { id: "gpt-image-2-vip",        family: "gpt",    label: "GPT Image 2 VIP",         price: 0.10,  sizeMode: "tier",      quality: ["medium"],                                background: true,  tiers: ["1K", "2K", "4K"], note: "最高 4K · 支持透明背景" },
  { id: "gpt-image-2.5-flare",    family: "gpt",    label: "GPT Image 2.5 Flare",     price: 0.10,  sizeMode: "tier",      quality: ["low", "medium", "high"],                 background: true,  tiers: ["1K", "2K", "4K"], maintenance: true, note: "维护中 · 支持 2K 高质量" },
  { id: "gpt-image-2.5-sunburst", family: "gpt",    label: "GPT Image 2.5 Sunburst",  price: 0.12,  sizeMode: "tier",      quality: ["low", "medium", "high", "xhigh", "max"], background: true,  tiers: ["1K", "2K", "4K"], maintenance: true, note: "维护中 · 最高 4K max 质量" },
  { id: "nano-banana-pro",        family: "banana", label: "Nano Banana Pro",         price: 0.09,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["1K", "2K", "4K"], note: "Gemini 3 Pro 图像 · 质量最佳" },
  { id: "nano-banana-2",          family: "banana", label: "Nano Banana 2",           price: 0.06,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["1K", "2K", "4K"], ratios: "extra", note: "Gemini 3.1 Flash Image · 支持极端比例" },
  { id: "nano-banana-2-lite",     family: "banana", label: "Nano Banana 2 Lite",      price: 0.022, sizeMode: "ratio",     quality: [],                                        background: false, note: "最便宜 · 日常够用" },
  { id: "nano-banana-fast",       family: "banana", label: "Nano Banana Fast",        price: 0.022, sizeMode: "ratio",     quality: [],                                        background: false, note: "强图像编辑 · 图生图推荐" },
  { id: "nano-banana-2-cl",       family: "banana", label: "Nano Banana 2 CL",        price: 0.30,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["1K"], note: "稳定渠道 · 固定 1K" },
  { id: "nano-banana-2-2k-cl",    family: "banana", label: "Nano Banana 2 2K CL",     price: 0.45,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["2K"], note: "稳定渠道 · 固定 2K" },
  { id: "nano-banana-2-4k-cl",    family: "banana", label: "Nano Banana 2 4K CL",     price: 0.65,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["4K"], note: "稳定渠道 · 固定 4K" },
  { id: "nano-banana-pro-cl",     family: "banana", label: "Nano Banana Pro CL",      price: 0.50,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["1K"], note: "稳定渠道 · Pro 1K" },
  { id: "nano-banana-pro-vip",    family: "banana", label: "Nano Banana Pro VIP",     price: 0.50,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["1K", "2K"], note: "高成本稳定渠道 · 1K/2K" },
  { id: "nano-banana-pro-4k-vip", family: "banana", label: "Nano Banana Pro 4K VIP",  price: 0.90,  sizeMode: "imageSize", quality: [],                                        background: false, tiers: ["4K"], note: "高成本稳定渠道 · 4K" },
];
const ENDPOINTS = { gpt: "/v1/draw/completions", banana: "/v1/draw/nano-banana" };

const PRESETS = [
  { name: "盲盒手办", text: "把参考图转化为可爱的卡通Q版潮玩盲盒手办，树脂/软胶质感，表面细节精致，光影柔和，搭配与主题呼应的正方形纸质包装盒，专业商品摄影棚布光，暖色调，背景简洁。" },
  { name: "3D头像", text: "将人物转化为 3D 皮克斯风格卡通头像，大眼睛，圆润可爱，柔和的工作室灯光，纯色背景，高细节，电影级质感。" },
  { name: "扁平插画", text: "扁平矢量插画风格，简洁的几何形状，和谐的配色，柔和的阴影层次，主题明确，适合作为文章封面。" },
  { name: "写实摄影", text: "写实摄影风格，35mm 镜头，浅景深，黄金时刻的自然光线，细腻的皮肤与材质纹理，色彩还原准确，构图讲究。" },
];

/* ---------- 全局状态 ---------- */
const state = {
  apiKey: null,            // 仅内存，绝不持久化
  refImages: [],           // [{name, dataUrl}] 参考图
  maskImage: null,         // {name, dataUrl}
  tasks: [],               // 任务列表（urls/mask 仅内存）
  selectedIds: new Set(),
};

const $ = (id) => document.getElementById(id);
const els = {};
["modelSelect","modelHint","ratioSelect","tierField","tierSelect","qualityField","qualitySelect","bgField","bgTransparent",
 "promptInput","promptCount","presetChips","uploadZone","uploadEmpty","refFileInput","refThumbs","advancedBox",
 "maskSelectBtn","maskFileInput","maskPreview","maskClearBtn","countSelect","costValue","generateBtn",
 "tasksList","tasksEmpty","taskCountBadge","selectAllBtn","zipBtn","deleteBtn","retryBtn","clearDoneBtn",
 "keyChip","keyChipText","keyDot","importKeyBtn","keyModal","keyInput","keyFileBtn","keyFileInput","keyFileName",
 "keyModalError","keyCancelBtn","keySaveBtn","nodeSelect","customNodeInput","testConnBtn",
 "lightbox","lightboxImg","lightboxClose","toastWrap"].forEach(id => { els[id] = $(id); });

/* ---------- 工具 ---------- */
function toast(msg, type = "info", ms = 3200) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  els.toastWrap.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, ms);
}
function maskKey(key) {
  if (!key) return "未导入 KEY";
  return `${key.slice(0, 6)}***${key.slice(-4)}`;
}
function currentModel() { return MODELS.find(m => m.id === els.modelSelect.value) || MODELS[0]; }
function baseUrl() {
  const v = els.nodeSelect.value;
  if (v === "custom") {
    const raw = els.customNodeInput.value.trim().replace(/\/+$/, "");
    if (!raw) return null;
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }
  return v;
}
function fmtTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function friendlyError(code, msg, failure) {
  const m = `${msg || ""} ${failure || ""}`;
  if (/apikey/i.test(m)) return "API Key 无效，请检查后重新导入";
  if (/balance|积分不足|余额不足/i.test(m)) return "积分/余额不足，请前往控制台充值";
  if (failure === "input_moderation") return "提示词或参考图触发平台内容审核（输入违规）";
  if (failure === "output_moderation") return "生成内容触发平台内容审核（输出违规），积分已退还";
  if (code === -22) return "任务不存在（可能已过期）";
  return msg || failure || "未知错误";
}
function extFromUrl(url, fallback = "png") {
  try { const m = new URL(url).pathname.match(/\.(\w{3,4})$/); return m ? m[1].toLowerCase() : fallback; }
  catch { return fallback; }
}

/* ---------- API 客户端 ---------- */
async function apiPost(path, body) {
  const base = baseUrl();
  if (!base) throw new Error("请先填写自定义节点地址");
  const headers = { "Content-Type": "application/json" };
  if (state.apiKey) headers["Authorization"] = `Bearer ${state.apiKey}`;
  const res = await fetch(base + path, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({ code: -1, msg: `HTTP ${res.status}` }));
  return json;
}

// 提交任务：返回任务 id；失败抛错
async function submitTask(modelId, family, payload) {
  if (!state.apiKey) throw new Error("请先导入 API KEY");
  const json = await apiPost(ENDPOINTS[family], payload);
  if (json.code !== 0 || !json.data || !json.data.id) {
    throw new Error(friendlyError(json.code, json.msg));
  }
  return json.data.id;
}

// 查询结果
async function fetchResult(taskId) {
  return await apiPost("/v1/draw/result", { id: taskId });
}

/* ---------- 表单联动 ---------- */
function buildModelSelect() {
  const groups = { gpt: "GPT Image 系列", banana: "Nano Banana 系列" };
  els.modelSelect.innerHTML = "";
  for (const [family, label] of Object.entries(groups)) {
    const og = document.createElement("optgroup");
    og.label = label;
    MODELS.filter(m => m.family === family).forEach(m => {
      const op = document.createElement("option");
      op.value = m.id;
      op.textContent = `${m.label}（¥${m.price.toFixed(3)}/张）${m.maintenance ? " ⚠维护中" : ""}`;
      og.appendChild(op);
    });
    els.modelSelect.appendChild(og);
  }
}

function onModelChange() {
  const m = currentModel();
  els.modelHint.textContent = `¥${m.price.toFixed(3)}/张 · ${m.note}`;

  // 比例列表
  let ratios = RATIO_GPT;
  if (m.family === "banana") ratios = m.ratios === "extra" ? RATIO_BANANA_EXTRA : RATIO_BANANA;
  els.ratioSelect.innerHTML = ratios.map(r => `<option value="${r}"${r === "auto" ? " selected" : ""}>${r === "auto" ? "auto（自动）" : r}</option>`).join("");

  // 分辨率档位
  if (m.sizeMode === "tier" || m.sizeMode === "imageSize") {
    els.tierField.classList.remove("hidden");
    els.tierSelect.innerHTML = m.tiers.map(t => `<option value="${t}">${t}${m.sizeMode === "imageSize" ? "" : " 像素档"}</option>`).join("");
    els.tierSelect.disabled = m.tiers.length === 1;
  } else {
    els.tierField.classList.add("hidden");
  }

  // 质量档（仅 GPT）
  if (m.family === "gpt") {
    els.qualityField.classList.remove("hidden");
    els.qualitySelect.innerHTML = m.quality.map(q => `<option value="${q}">${q}</option>`).join("");
    els.qualitySelect.disabled = m.quality.length === 1;
  } else {
    els.qualityField.classList.add("hidden");
  }

  // 透明背景
  els.bgField.style.visibility = m.background ? "visible" : "hidden";
  if (!m.background) els.bgTransparent.checked = false;

  // 遮罩（仅 GPT）
  els.advancedBox.style.display = m.family === "gpt" ? "" : "none";
  if (m.family !== "gpt") clearMask();

  updateCost();
}

function buildPresets() {
  PRESETS.forEach(p => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "preset-chip";
    chip.textContent = p.name;
    chip.title = p.text;
    chip.onclick = () => { els.promptInput.value = p.text; updatePromptCount(); };
    els.presetChips.appendChild(chip);
  });
}

function buildCountSelect() {
  els.countSelect.innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<option value="${i + 1}"${i === 0 ? " selected" : ""}>${i + 1} 张</option>`).join("");
  els.countSelect.onchange = updateCost;
}

function updateCost() {
  const m = currentModel();
  const n = parseInt(els.countSelect.value, 10) || 1;
  els.costValue.textContent = `约 ¥${(m.price * n).toFixed(3)}`;
}
function updatePromptCount() {
  els.promptCount.textContent = els.promptInput.value.trim().length;
}

/* ---------- 参考图上传 ---------- */
function addRefFiles(files) {
  const ok = ["image/jpeg", "image/png", "image/webp"];
  for (const f of files) {
    if (!ok.includes(f.type)) { toast(`已跳过不支持的文件：${f.name}`, "warning"); continue; }
    if (f.size > 15 * 1024 * 1024) { toast(`图片过大（>15MB）：${f.name}`, "warning"); continue; }
    const reader = new FileReader();
    reader.onload = () => {
      state.refImages.push({ name: f.name, dataUrl: reader.result });
      renderThumbs();
    };
    reader.readAsDataURL(f);
  }
}
function renderThumbs() {
  els.refThumbs.innerHTML = "";
  els.uploadEmpty.classList.toggle("hidden", state.refImages.length > 0);
  state.refImages.forEach((img, i) => {
    const d = document.createElement("div");
    d.className = "thumb";
    d.innerHTML = `<img src="${img.dataUrl}" alt="${img.name}"><button class="thumb-del" title="移除">×</button>`;
    d.querySelector(".thumb-del").onclick = () => { state.refImages.splice(i, 1); renderThumbs(); };
    els.refThumbs.appendChild(d);
  });
}

/* ---------- 遮罩 ---------- */
function setMask(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.maskImage = { name: file.name, dataUrl: reader.result };
    els.maskPreview.src = reader.result;
    els.maskPreview.classList.remove("hidden");
    els.maskClearBtn.classList.remove("hidden");
    els.maskSelectBtn.textContent = "更换图片";
  };
  reader.readAsDataURL(file);
}
function clearMask() {
  state.maskImage = null;
  els.maskPreview.classList.add("hidden");
  els.maskPreview.removeAttribute("src");
  els.maskClearBtn.classList.add("hidden");
  els.maskSelectBtn.textContent = "选择遮罩图片";
  els.maskFileInput.value = "";
}

/* ---------- 组装请求 ---------- */
function buildPayload() {
  const m = currentModel();
  const ratio = els.ratioSelect.value;
  const payload = {
    model: m.id,
    prompt: els.promptInput.value.trim(),
    webHook: "-1",
  };
  if (m.sizeMode === "ratio") {
    if (ratio !== "auto") payload.aspectRatio = ratio;
  } else if (m.sizeMode === "tier") {
    const tierIdx = ["1K", "2K", "4K"].indexOf(els.tierSelect.value);
    if (ratio !== "auto") payload.aspectRatio = GPT_TIER_PIXELS[ratio][tierIdx];
  } else if (m.sizeMode === "imageSize") {
    if (ratio !== "auto") payload.aspectRatio = ratio;
    if (m.tiers.length > 1) payload.imageSize = els.tierSelect.value;
  }
  if (m.family === "gpt") payload.quality = els.qualitySelect.value;
  if (m.background && els.bgTransparent.checked) payload.background = "transparent";
  if (state.refImages.length) payload.urls = state.refImages.map(i => i.dataUrl);
  if (m.family === "gpt" && state.maskImage) payload.mask = state.maskImage.dataUrl;
  return payload;
}

function validateForm() {
  if (!state.apiKey) {
    toast("请先导入 API KEY", "warning");
    openKeyModal();
    return false;
  }
  if (!els.promptInput.value.trim()) {
    toast("提示词不能为空", "warning");
    els.promptInput.focus();
    return false;
  }
  if (!baseUrl()) {
    toast("请填写自定义节点地址", "warning");
    els.customNodeInput.focus();
    return false;
  }
  const m = currentModel();
  if (m.maintenance && !confirm(`${m.label} 当前处于维护状态，可能无法生成，是否继续提交？`)) return false;
  return true;
}

/* ---------- 生成 ---------- */
async function generate() {
  if (!validateForm()) return;
  const m = currentModel();
  const count = parseInt(els.countSelect.value, 10) || 1;
  const payload = buildPayload();
  const urls = payload.urls || null;
  const mask = payload.mask || null;

  els.generateBtn.disabled = true;
  let okCount = 0;
  for (let i = 0; i < count; i++) {
    try {
      const id = await submitTask(m.id, m.family, payload);
      state.tasks.unshift({
        id, model: m.id, family: m.family,
        prompt: payload.prompt, ratio: els.ratioSelect.value,
        tier: m.sizeMode === "ratio" ? null : els.tierSelect.value,
        quality: m.family === "gpt" ? els.qualitySelect.value : null,
        bg: !!(m.background && els.bgTransparent.checked),
        hasRefs: !!urls, hasMask: !!mask,
        urls, mask,
        createdAt: Date.now(), status: "running", progress: 0,
        results: [], error: "", failureReason: "", notified: false,
      });
      okCount++;
      renderTasks();
    } catch (e) {
      toast(`第 ${i + 1} 个任务提交失败：${e.message}`, "error", 5000);
      break;
    }
  }
  els.generateBtn.disabled = false;
  if (okCount) {
    toast(`已提交 ${okCount} 个任务，正在生成…`, "success");
    persistTasks();
  }
}

/* ---------- 轮询 ---------- */
let pollTimer = null;
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollActiveTasks, 3000);
}
async function pollActiveTasks() {
  const active = state.tasks.filter(t => t.status === "running" || t.status === "queued");
  for (const task of active) {
    try {
      const json = await fetchResult(task.id);
      if (json.code !== 0) {
        if (json.code === -22 && Date.now() - task.createdAt < 20000) continue; // 刚提交可能未入库
        task.status = "failed";
        task.error = friendlyError(json.code, json.msg);
        continue;
      }
      const d = json.data || {};
      task.progress = typeof d.progress === "number" ? d.progress : task.progress;
      if (d.status === "succeeded") {
        task.status = "succeeded";
        task.progress = 100;
        task.results = d.results || [];
        if (!task.results.length && d.url) task.results = [{ url: d.url }];
      } else if (d.status === "failed") {
        task.status = "failed";
        task.failureReason = d.failure_reason || "";
        task.error = friendlyError(null, d.error, d.failure_reason);
      } else {
        task.status = "running";
      }
    } catch { /* 网络抖动，下轮重试 */ }
  }
  if (active.length) renderTasks();
  state.tasks.filter(t => t.status === "succeeded" && !t.notified).forEach(t => {
    t.notified = true;
    toast(`任务完成：${t.model}`, "success");
  });
  persistTasks();
}
async function refetchTask(task) {
  try {
    const json = await fetchResult(task.id);
    if (json.code === 0 && json.data) {
      const d = json.data;
      task.status = d.status || task.status;
      task.progress = typeof d.progress === "number" ? d.progress : task.progress;
      task.results = d.results || task.results;
      if (!task.results.length && d.url) task.results = [{ url: d.url }];
      renderTasks();
      persistTasks();
      if (d.status === "succeeded") toast("已重新获取结果", "success");
      else toast(`当前状态：${d.status}（进度 ${d.progress}%）`, "info");
    } else {
      toast(friendlyError(json.code, json.msg), "error");
    }
  } catch (e) {
    toast(`获取失败：${e.message}`, "error");
  }
}

/* ---------- 任务渲染 ---------- */
const STATUS_TEXT = { queued: "排队中", running: "生成中", succeeded: "已完成", failed: "失败" };
function renderTasks() {
  els.taskCountBadge.textContent = state.tasks.length;
  els.tasksEmpty.classList.toggle("hidden", state.tasks.length > 0);
  els.tasksList.querySelectorAll(".task-card").forEach(n => n.remove());

  state.tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = `task-card status-${task.status}` + (state.selectedIds.has(task.id) ? " selected" : "");

    const firstUrl = task.results && task.results[0] && task.results[0].url;
    const PLACEHOLDER = `<div class="thumb-placeholder"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>${task.status === "failed" ? "失败" : "等待"}</div>`;
    const thumbHtml = firstUrl
      ? `<img src="${firstUrl}" alt="结果" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\'thumb-placeholder\\'>已过期</div>'">`
      : PLACEHOLDER;

    const metaBits = [
      task.ratio !== "auto" ? `比例 ${task.ratio}` : "比例 auto",
      task.tier,
      task.quality ? `质量 ${task.quality}` : null,
      task.bg ? "透明背景" : null,
      task.hasRefs ? "图生图" : "文生图",
    ].filter(Boolean);

    const progressRow = (task.status === "running" || task.status === "queued")
      ? `<div class="task-status-row"><div class="progress-track"><div class="progress-fill" style="width:${task.progress}%"></div></div><span class="progress-text">${task.progress}%</span></div>`
      : "";
    const errorRow = task.status === "failed" && task.error ? `<div class="task-error">${task.error}</div>` : "";

    const btns = [];
    if (task.status === "succeeded") {
      btns.push(`<button class="btn ghost small" data-act="download">⬇ 下载</button>`);
      btns.push(`<button class="btn ghost small" data-act="refetch" title="结果 URL 有效期 2 小时，过期后可重新获取">↻ 重新获取</button>`);
    } else if (task.status === "failed") {
      const canRetry = !(task.hasRefs && !task.urls);
      btns.push(`<button class="btn ghost small" data-act="resubmit" ${canRetry ? "" : "disabled title='参考图仅存于内存，请重新上传后重新提交'"}>↻ 重新提交</button>`);
      btns.push(`<button class="btn ghost small" data-act="refetch">↻ 查询结果</button>`);
    }
    btns.push(`<button class="btn ghost small danger" data-act="delete">删除</button>`);

    card.innerHTML = `
      <div class="task-check"><input type="checkbox" ${state.selectedIds.has(task.id) ? "checked" : ""} aria-label="选择任务"></div>
      <div class="task-thumb" data-thumb>${thumbHtml}${firstUrl && task.status === "succeeded" ? `<div class="thumb-expires">URL 2小时内有效</div>` : ""}</div>
      <div class="task-body">
        <div class="task-title-row">
          <span class="task-model">${task.model}</span>
          <span class="status-tag ${task.status}">${STATUS_TEXT[task.status]}</span>
          <span class="task-meta">${fmtTime(task.createdAt)}</span>
        </div>
        <div class="task-meta">${metaBits.join(" · ")}</div>
        <div class="task-prompt" title="${task.prompt.replace(/"/g, "&quot;")}">${task.prompt}</div>
        ${progressRow}
        ${errorRow}
        <div class="task-actions">${btns.join("")}</div>
      </div>`;

    card.querySelector(".task-check input").addEventListener("change", (e) => {
      if (e.target.checked) state.selectedIds.add(task.id); else state.selectedIds.delete(task.id);
      card.classList.toggle("selected", e.target.checked);
    });
    card.querySelector("[data-thumb]").addEventListener("click", () => { if (firstUrl) openLightbox(firstUrl); });
    card.querySelectorAll(".task-actions [data-act]").forEach(b => {
      b.addEventListener("click", () => handleTaskAction(b.dataset.act, task));
    });
    els.tasksList.appendChild(card);
  });
}

async function handleTaskAction(act, task) {
  if (act === "download") downloadTaskImages(task);
  else if (act === "refetch") refetchTask(task);
  else if (act === "resubmit") resubmitTask(task);
  else if (act === "delete") deleteTasks([task.id]);
}

async function resubmitTask(task) {
  const payload = {
    model: task.model,
    prompt: task.prompt,
    webHook: "-1",
  };
  if (task.ratio && task.ratio !== "auto") payload.aspectRatio = task.ratio;
  if (task.tier && task.family === "banana") payload.imageSize = task.tier;
  if (task.quality) payload.quality = task.quality;
  if (task.bg) payload.background = "transparent";
  if (task.urls) payload.urls = task.urls;
  if (task.mask) payload.mask = task.mask;
  try {
    const id = await submitTask(task.model, task.family, payload);
    state.tasks.unshift({ ...task, id, createdAt: Date.now(), status: "running", progress: 0, results: [], error: "", failureReason: "", notified: false });
    renderTasks(); persistTasks();
    toast("已重新提交", "success");
  } catch (e) {
    toast(`重提失败：${e.message}`, "error");
  }
}

function deleteTasks(ids) {
  state.tasks = state.tasks.filter(t => !ids.includes(t.id));
  ids.forEach(i => state.selectedIds.delete(i));
  renderTasks(); persistTasks();
}

/* ---------- 下载 ---------- */
async function urlToBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}
function saveBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
function taskFilename(task, i) {
  const stamp = new Date(task.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const multi = task.results.length > 1 ? `_${i + 1}` : "";
  const url = task.results[i] && task.results[i].url || "";
  return `grsai_${task.model}_${stamp}${multi}.${extFromUrl(url)}`;
}
async function downloadTaskImages(task) {
  if (!task.results.length) { toast("该任务没有结果图", "warning"); return; }
  for (let i = 0; i < task.results.length; i++) {
    try {
      saveBlob(await urlToBlob(task.results[i].url), taskFilename(task, i));
    } catch {
      toast("图片跨域受限，已在新标签打开，请右键另存为", "warning", 5000);
      window.open(task.results[i].url, "_blank");
    }
    if (task.results.length > 1) await new Promise(r => setTimeout(r, 400));
  }
}
async function downloadSelectedZip() {
  const selected = state.tasks.filter(t => state.selectedIds.has(t.id) && t.status === "succeeded" && t.results.length);
  if (!selected.length) { toast("请先勾选已完成且有结果的任务", "warning"); return; }
  if (typeof JSZip === "undefined") { toast("JSZip 未加载，将逐张下载", "warning"); selected.forEach(downloadTaskImages); return; }

  els.zipBtn.disabled = true;
  els.zipBtn.textContent = "打包中…";
  try {
    const zip = new JSZip();
    let ok = 0, fail = 0;
    for (const task of selected) {
      for (let i = 0; i < task.results.length; i++) {
        try { zip.file(taskFilename(task, i), await urlToBlob(task.results[i].url)); ok++; }
        catch { fail++; }
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveBlob(blob, `grsai_images_${Date.now()}.zip`);
    toast(`打包完成：${ok} 张成功${fail ? `，${fail} 张因跨域受限跳过（可逐张下载）` : ""}`, fail ? "warning" : "success", 4500);
  } catch (e) {
    toast(`打包失败：${e.message}`, "error");
  }
  els.zipBtn.disabled = false;
  els.zipBtn.textContent = "打包下载";
}

/* ---------- KEY 管理 ---------- */
function refreshKeyChip() {
  if (state.apiKey) {
    els.keyChip.classList.add("active");
    els.keyChipText.textContent = maskKey(state.apiKey);
    els.importKeyBtn.textContent = "更换 KEY";
  } else {
    els.keyChip.classList.remove("active");
    els.keyChipText.textContent = "未导入 KEY";
    els.importKeyBtn.textContent = "导入 KEY";
  }
}
function openKeyModal() {
  els.keyInput.value = state.apiKey || "";
  els.keyModalError.classList.add("hidden");
  els.keyFileName.textContent = "";
  els.keyModal.classList.remove("hidden");
  setTimeout(() => els.keyInput.focus(), 50);
}
function closeKeyModal() { els.keyModal.classList.add("hidden"); }
function saveKey() {
  const v = els.keyInput.value.trim();
  if (!v) { els.keyModalError.textContent = "Key 不能为空"; els.keyModalError.classList.remove("hidden"); return; }
  if (/\s/.test(v)) { els.keyModalError.textContent = "Key 中包含空白字符，请检查是否复制完整"; els.keyModalError.classList.remove("hidden"); return; }
  state.apiKey = v;
  refreshKeyChip();
  closeKeyModal();
  toast("KEY 已导入（仅保存在内存中）", "success");
}

/* ---------- 连接测试 ---------- */
async function testConnection() {
  if (!state.apiKey) { toast("请先导入 API KEY", "warning"); openKeyModal(); return; }
  if (!baseUrl()) { toast("请填写自定义节点地址", "warning"); return; }
  els.testConnBtn.disabled = true;
  els.testConnBtn.textContent = "测试中…";
  try {
    // 用不存在的模型名触发参数校验：不产生费用，但会先校验 Key
    const json = await apiPost("/v1/draw/completions", { model: "__connection_test__", prompt: "test", webHook: "-1" });
    if (/apikey/i.test(json.msg || "")) toast(`❌ Key 无效：${json.msg}`, "error", 5000);
    else toast("✅ 节点连通，Key 有效", "success");
  } catch (e) {
    toast(`❌ 无法连接节点：${e.message}`, "error", 5000);
  }
  els.testConnBtn.disabled = false;
  els.testConnBtn.textContent = "测试连接";
}

/* ---------- 持久化（不含 Key、不含图片 base64） ---------- */
function persistTasks() {
  try {
    const slim = state.tasks.slice(0, 100).map(t => {
      const { urls, mask, ...rest } = t;
      return rest;
    });
    localStorage.setItem("grsai_tasks_v1", JSON.stringify(slim));
  } catch { /* 超容忽略 */ }
}
function restoreTasks() {
  try {
    const raw = localStorage.getItem("grsai_tasks_v1");
    if (!raw) return;
    state.tasks = JSON.parse(raw) || [];
    state.tasks.forEach(t => { t.notified = false; });
    renderTasks();
  } catch { state.tasks = []; }
}

/* ---------- 灯箱 ---------- */
function openLightbox(url) { els.lightboxImg.src = url; els.lightbox.classList.remove("hidden"); }
function closeLightbox() { els.lightbox.classList.add("hidden"); els.lightboxImg.removeAttribute("src"); }

/* ---------- 初始化 ---------- */
function init() {
  buildModelSelect();
  buildPresets();
  buildCountSelect();
  onModelChange();

  // 节点
  const savedNode = localStorage.getItem("grsai_node");
  if (savedNode) {
    if (savedNode === "https://grsaiapi.com" || savedNode === "https://grsai.dakka.com.cn") {
      els.nodeSelect.value = savedNode;
    } else {
      els.nodeSelect.value = "custom";
      els.customNodeInput.classList.remove("hidden");
      els.customNodeInput.value = savedNode;
    }
  }
  els.nodeSelect.addEventListener("change", () => {
    const custom = els.nodeSelect.value === "custom";
    els.customNodeInput.classList.toggle("hidden", !custom);
    const v = baseUrl();
    if (v) { localStorage.setItem("grsai_node", v); toast(`已切换节点：${v}`, "info", 2000); }
  });
  els.customNodeInput.addEventListener("change", () => {
    const v = baseUrl();
    if (v) localStorage.setItem("grsai_node", v);
  });

  // 表单
  els.modelSelect.addEventListener("change", onModelChange);
  els.promptInput.addEventListener("input", updatePromptCount);
  els.generateBtn.addEventListener("click", generate);

  // 上传
  els.uploadZone.addEventListener("click", (e) => {
    if (e.target === els.uploadZone || e.target === els.uploadEmpty || els.uploadEmpty.contains(e.target)) els.refFileInput.click();
  });
  els.refFileInput.addEventListener("change", () => { addRefFiles([...els.refFileInput.files]); els.refFileInput.value = ""; });
  ["dragover", "dragenter"].forEach(ev => els.uploadZone.addEventListener(ev, (e) => { e.preventDefault(); els.uploadZone.classList.add("dragover"); }));
  ["dragleave", "drop"].forEach(ev => els.uploadZone.addEventListener(ev, (e) => { e.preventDefault(); els.uploadZone.classList.remove("dragover"); }));
  els.uploadZone.addEventListener("drop", (e) => { if (e.dataTransfer && e.dataTransfer.files.length) addRefFiles([...e.dataTransfer.files]); });

  // 遮罩
  els.maskSelectBtn.addEventListener("click", () => els.maskFileInput.click());
  els.maskFileInput.addEventListener("change", () => setMask(els.maskFileInput.files[0]));
  els.maskClearBtn.addEventListener("click", clearMask);

  // Key 弹窗
  els.importKeyBtn.addEventListener("click", openKeyModal);
  els.keyCancelBtn.addEventListener("click", closeKeyModal);
  els.keySaveBtn.addEventListener("click", saveKey);
  els.keyInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveKey(); });
  els.keyModal.addEventListener("click", (e) => { if (e.target === els.keyModal) closeKeyModal(); });
  els.keyFileBtn.addEventListener("click", () => els.keyFileInput.click());
  els.keyFileInput.addEventListener("change", () => {
    const f = els.keyFileInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { els.keyInput.value = String(reader.result).trim(); els.keyFileName.textContent = `已读取：${f.name}`; };
    reader.readAsText(f);
  });

  // 测试连接
  els.testConnBtn.addEventListener("click", testConnection);

  // 任务工具栏
  els.selectAllBtn.addEventListener("click", () => {
    const all = state.tasks.length > 0 && state.tasks.every(t => state.selectedIds.has(t.id));
    state.selectedIds.clear();
    if (!all) state.tasks.forEach(t => state.selectedIds.add(t.id));
    renderTasks();
  });
  els.zipBtn.addEventListener("click", downloadSelectedZip);
  els.deleteBtn.addEventListener("click", () => {
    if (!state.selectedIds.size) { toast("请先勾选要删除的任务", "warning"); return; }
    deleteTasks([...state.selectedIds]);
  });
  els.retryBtn.addEventListener("click", async () => {
    const failed = state.tasks.filter(t => t.status === "failed" && !(t.hasRefs && !t.urls));
    if (!failed.length) { toast("没有可重提的失败任务", "warning"); return; }
    for (const t of failed) await resubmitTask(t);
  });
  els.clearDoneBtn.addEventListener("click", () => {
    const ids = state.tasks.filter(t => t.status === "succeeded").map(t => t.id);
    if (!ids.length) { toast("没有已完成的任务", "warning"); return; }
    deleteTasks(ids);
  });

  // 灯箱
  els.lightboxClose.addEventListener("click", closeLightbox);
  els.lightbox.addEventListener("click", (e) => { if (e.target === els.lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeLightbox(); closeKeyModal(); } });

  restoreTasks();
  startPolling();
  refreshKeyChip();
  updatePromptCount();
}

document.addEventListener("DOMContentLoaded", init);
