// Compress captures to JPEG via headless-chromium canvas, emit base64 + chunk plan.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = '/home/user/Claim-ERP/figma-export';
const B64DIR = path.join(OUT, 'b64');
if (!fs.existsSync(B64DIR)) fs.mkdirSync(B64DIR, { recursive: true });

const screens = ['index','smart-claims','smart-intake','image-system','approval-list',
  'assignment-management','vendor-inquiry','vendor-eval','message-send','ai-dashboard','smart-claims-demo'];

const TARGET_W = 1100;      // downscale width (aspect preserved -> no distortion in FILL)
const CHUNK = 46000;        // base64 chars per use_figma call (code limit 50000)

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const page = await browser.newPage();
  const plan = [];
  for (const name of screens) {
    const pngPath = path.join(OUT, name + '.png');
    const dataUrl = 'data:image/png;base64,' + fs.readFileSync(pngPath).toString('base64');
    // try decreasing quality until under a soft budget, keep >=0.4
    const res = await page.evaluate(async ({ dataUrl }) => {
      const img = new Image();
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = dataUrl; });
      const BUDGET = 12000; // base64 chars -> lean single-call embed (low-res reference underlay)
      const widths = [560, 520, 480, 440, 400, 360, 320];
      const quals  = [0.5, 0.42, 0.36, 0.3, 0.26, 0.22];
      let best = null;
      for (const tw of widths) {
        const scale = Math.min(1, tw / img.width);
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
        ctx.drawImage(img, 0, 0, w, h);
        for (const q of quals) {
          const b64 = c.toDataURL('image/jpeg', q).split(',')[1];
          if (b64.length <= BUDGET) { return { w, h, q: Math.round(q*100), b64 }; }
          if (!best || b64.length < best.b64.length) best = { w, h, q: Math.round(q*100), b64 };
        }
      }
      return best; // may exceed budget -> will be chunked
    }, { dataUrl });
    fs.writeFileSync(path.join(B64DIR, name + '.b64.txt'), res.b64);
    const nchunks = Math.ceil(res.b64.length / CHUNK);
    plan.push({ name, w: res.w, h: res.h, q: res.q, b64len: res.b64.length, chunks: nchunks });
    console.log(`${name}: ${res.w}x${res.h} q${res.q} b64=${(res.b64.length/1024).toFixed(0)}K chunks=${nchunks}`);
  }
  await browser.close();
  fs.writeFileSync(path.join(B64DIR, '_plan.json'), JSON.stringify(plan, null, 2));
  console.log('total chunks:', plan.reduce((n,p)=>n+p.chunks,0));
})();
