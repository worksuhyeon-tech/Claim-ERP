// Generate compact per-screen build data for the Figma builder.
const fs = require('fs');
const ann = require('/home/user/Claim-ERP/figma-export/annotations.js');
const OUT = '/home/user/Claim-ERP/figma-export';
const order = ['index','smart-claims','smart-intake','image-system','approval-list',
  'assignment-management','vendor-inquiry','vendor-eval','message-send','ai-dashboard','smart-claims-demo'];
const labels = {
  index:'화면 선택(Hub)','smart-claims':'미결일괄조회','smart-intake':'Smart업무처리',
  'image-system':'이미지시스템','approval-list':'결재 LIST','assignment-management':'전결·순환배당 관리',
  'vendor-inquiry':'협력업체조회','vendor-eval':'협력업체 평가','message-send':'메시지 발송',
  'ai-dashboard':'AI 통합대시보드','smart-claims-demo':'미결일괄조회(자동처리 시연)'};

const out = [];
for (const name of order) {
  const d = JSON.parse(fs.readFileSync(`${OUT}/${name}.curated.json`,'utf8'));
  const a = ann[name] || {};
  const markers = d.elements.map((e, i) => {
    const info = a[e.sig] || {};
    return { n: i+1, x: e.x, y: e.y, w: e.w, h: e.h,
      t: info.t || e.text || e.sig, r: info.r || '', a: info.a || '', c: info.c || '' };
  });
  out.push({ name, label: labels[name], png: `${name}.png`,
    pageW: d.page.w, pageH: d.page.h, markers });
}
fs.writeFileSync(`${OUT}/build-data.json`, JSON.stringify(out));
// also emit per-screen minified lines for easy embedding
for (const s of out) {
  fs.writeFileSync(`${OUT}/build-${s.name}.min.json`, JSON.stringify(s));
}
console.log('screens:', out.length, 'total markers:', out.reduce((n,s)=>n+s.markers.length,0));
out.forEach(s=>console.log(`  ${s.name}: ${s.markers.length} markers, page ${s.pageW}x${s.pageH}`));
