// Read-only capture + DOM extraction for claim-erp-split screens.
// Does NOT modify any source HTML/JS. Outputs PNG + JSON to figma-export/.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/home/user/Claim-ERP/claim-erp-split';
const OUT = '/home/user/Claim-ERP/figma-export';
const VIEWPORT = { width: 1440, height: 900 };

// Target screens (name -> file). name is used for output filenames + frame labels.
const SCREENS = [
  { name: 'index', file: 'index.html', label: '화면 선택(Hub)' },
  { name: 'smart-claims', file: 'smart-claims.html', label: '미결일괄조회' },
  { name: 'smart-intake', file: 'smart-intake.html', label: 'Smart업무처리' },
  { name: 'image-system', file: 'image-system.html', label: '이미지시스템' },
  { name: 'approval-list', file: 'approval-list.html', label: '결재 LIST' },
  { name: 'assignment-management', file: 'assignment-management.html', label: '전결·순환배당 관리' },
  { name: 'vendor-inquiry', file: 'vendor-inquiry.html', label: '협력업체조회' },
  { name: 'vendor-eval', file: 'vendor-eval.html', label: '협력업체 평가' },
  { name: 'message-send', file: 'message-send.html', label: '메시지 발송' },
  { name: 'ai-dashboard', file: 'ai-dashboard.html', label: 'AI 통합대시보드' },
  { name: 'smart-claims-demo', file: 'smart-claims-demo.html', label: '미결일괄조회(자동처리 시연)' },
];

// Extraction function evaluated in-page.
function extractElements() {
  const KNOWN_HANDLER_ATTRS = ['onclick','onchange','oninput','onsubmit','onkeyup','onkeydown','onfocus','onblur','onmouseover','onmouseenter'];
  function cssPathShort(el) {
    const id = el.id ? '#' + el.id : '';
    const cls = (el.className && typeof el.className === 'string')
      ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return el.tagName.toLowerCase() + id + cls;
  }
  function fnFromHandler(str) {
    if (!str) return null;
    // capture a function call name like foo( or obj.foo(
    const m = str.match(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*\(/);
    return m ? m[1] : null;
  }
  const selector = 'button, a, input, select, textarea, [onclick], [onchange], [oninput], [role="button"], [role="tab"]';
  const nodes = Array.from(document.querySelectorAll(selector));
  const seen = new Set();
  const out = [];
  for (const el of nodes) {
    if (seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    // skip zero-size / hidden
    const style = window.getComputedStyle(el);
    if (r.width < 1 || r.height < 1) continue;
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    const tag = el.tagName.toLowerCase();
    let text = (el.innerText || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim();
    text = text.replace(/\s+/g, ' ').slice(0, 60);
    const handlers = {};
    for (const a of KNOWN_HANDLER_ATTRS) {
      const v = el.getAttribute(a);
      if (v) handlers[a] = v;
    }
    let fn = null;
    for (const a of KNOWN_HANDLER_ATTRS) {
      if (handlers[a]) { fn = fnFromHandler(handlers[a]); if (fn) break; }
    }
    const rec = {
      tag,
      type: el.getAttribute('type') || null,
      role: el.getAttribute('role') || null,
      text,
      id: el.id || null,
      class: (el.getAttribute('class') || null),
      selector: cssPathShort(el),
      href: tag === 'a' ? el.getAttribute('href') : null,
      name: el.getAttribute('name') || null,
      dataset: Object.assign({}, el.dataset),
      handlers,
      fn,
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
    out.push(rec);
  }
  return {
    page: {
      title: document.title,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
    },
    elements: out,
  };
}

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const summary = [];
  for (const s of SCREENS) {
    const filePath = path.join(ROOT, s.file);
    if (!fs.existsSync(filePath)) { console.log('SKIP missing', s.file); continue; }
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const url = 'file://' + filePath;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); } catch (e2) {}
    }
    await page.waitForTimeout(1500); // let JS render dummy data
    const pngPath = path.join(OUT, s.name + '.png');
    await page.screenshot({ path: pngPath, fullPage: true });
    const data = await page.evaluate(extractElements);
    data.screen = { name: s.name, file: s.file, label: s.label, viewport: VIEWPORT };
    const jsonPath = path.join(OUT, s.name + '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    const dim = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
    summary.push({ name: s.name, elements: data.elements.length, w: dim.w, h: dim.h });
    console.log(`OK ${s.name}: ${data.elements.length} elements, page ${dim.w}x${dim.h}`);
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, '_summary.json'), JSON.stringify(summary, null, 2));
  console.log('DONE');
})();
