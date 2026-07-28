// Generator v2: reliable frame builds + 2-chunk verified image embeds.
const fs = require('fs');
const path = require('path');
const OUT = '/home/user/Claim-ERP/figma-export';
const ann = require(path.join(OUT, 'annotations.js'));
const data = JSON.parse(fs.readFileSync(path.join(OUT, 'build-data.json'), 'utf8'));
const FR = path.join(OUT, 'frameOnly'); if (!fs.existsSync(FR)) fs.mkdirSync(FR);
const EM = path.join(OUT, 'embed'); if (!fs.existsSync(EM)) fs.mkdirSync(EM);

const PAD=40, IMGX=40, IMGY=104, GAP=64, PANELW=660;
const FRAMEW = IMGX + 1440 + GAP + PANELW + PAD;
const SPACING = FRAMEW + 220;

function frameTemplate(D, FX) {
  return `const D = ${JSON.stringify(D)};
const FX = ${FX};
const PAD=${PAD}, IMGX=${IMGX}, IMGY=${IMGY}, GAP=${GAP}, PANELW=${PANELW}, BADGE=26, R=13;
const IW = PANELW - 44;
const TW = IW - 34;
await figma.loadFontAsync({family:'Inter',style:'Regular'});
await figma.loadFontAsync({family:'Inter',style:'Bold'});
const blue={r:0.184,g:0.373,b:0.749};
const white={r:1,g:1,b:1};
const ink={r:0.133,g:0.145,b:0.180};
const sub={r:0.357,g:0.384,b:0.451};
function mkText(txt, o){
  const t=figma.createText();
  t.fontName={family:'Inter',style: o.bold?'Bold':'Regular'};
  t.fontSize=o.size; t.fills=[{type:'SOLID',color:o.color}];
  if(o.lh) t.lineHeight={unit:'PERCENT', value:o.lh};
  t.characters=txt;
  t.textAutoResize='HEIGHT';
  t.resize(o.w, t.height);
  return t;
}
const panelX = IMGX + D.pageW + GAP;
const frameW = panelX + PANELW + PAD;
const frame = figma.createFrame();
frame.name = D.label + ' / 설명서';
frame.x = FX; frame.y = 0;
frame.clipsContent = false;
frame.fills = [{type:'SOLID', color:white}];
frame.resize(frameW, IMGY + D.pageH + PAD);
const title = figma.createText();
title.fontName={family:'Inter',style:'Bold'}; title.fontSize=28;
title.characters = D.label + '   /   설명서';
title.fills=[{type:'SOLID',color:ink}];
frame.appendChild(title); title.x=IMGX; title.y=44;
const rect = figma.createRectangle();
rect.name = '배경 캡처(' + D.png + ')';
rect.resize(D.pageW, D.pageH);
rect.fills=[{type:'SOLID', color:{r:0.93,g:0.95,b:0.98}}];
rect.strokes=[{type:'SOLID', color:{r:0.79,g:0.83,b:0.90}}]; rect.strokeWeight=1;
frame.appendChild(rect); rect.x=IMGX; rect.y=IMGY;
for (const m of D.markers) {
  const g = figma.createEllipse();
  g.resize(BADGE,BADGE);
  g.fills=[{type:'SOLID', color:blue}];
  g.strokes=[{type:'SOLID', color:white}]; g.strokeWeight=2;
  g.name='marker '+m.n;
  frame.appendChild(g); g.x = IMGX + m.x - R; g.y = IMGY + m.y - R;
  const t=figma.createText();
  t.fontName={family:'Inter',style:'Bold'}; t.fontSize=13;
  t.characters=String(m.n);
  t.fills=[{type:'SOLID',color:white}];
  t.textAlignHorizontal='CENTER'; t.textAlignVertical='CENTER';
  t.textAutoResize='NONE'; t.resize(BADGE,BADGE);
  frame.appendChild(t); t.x=IMGX+m.x-R; t.y=IMGY+m.y-R;
}
const panel = figma.createAutoLayout('VERTICAL', {name:'설명 패널', itemSpacing:14,
  paddingLeft:22, paddingRight:22, paddingTop:22, paddingBottom:22});
panel.fills=[{type:'SOLID', color:{r:0.98,g:0.99,b:1}}];
panel.strokes=[{type:'SOLID', color:{r:0.79,g:0.83,b:0.90}}]; panel.strokeWeight=1;
panel.cornerRadius=14;
frame.appendChild(panel);
panel.resize(PANELW, 10);
panel.counterAxisSizingMode='FIXED'; panel.primaryAxisSizingMode='AUTO';
panel.x = panelX; panel.y = IMGY;
const ph = mkText('화면 설명서 — '+D.label, {bold:true, size:18, color:ink, w:IW});
panel.appendChild(ph); ph.layoutSizingHorizontal='FIXED';
const phs = mkText('번호 ①②③…는 좌측 캡처의 표시 위치와 대응합니다. (추정)은 코드만으로 단정하기 어려운 부분입니다. 반복 요소는 첫 항목에만 표시했습니다.', {size:11.5, color:sub, lh:140, w:IW});
panel.appendChild(phs); phs.layoutSizingHorizontal='FIXED';
for (const m of D.markers) {
  const row=figma.createAutoLayout('HORIZONTAL', {itemSpacing:10, counterAxisAlignItems:'MIN'});
  row.fills=[]; panel.appendChild(row); row.layoutSizingHorizontal='FILL';
  const bf=figma.createFrame(); bf.resize(24,24); bf.cornerRadius=12;
  bf.fills=[{type:'SOLID',color:blue}]; bf.layoutMode='HORIZONTAL';
  bf.primaryAxisAlignItems='CENTER'; bf.counterAxisAlignItems='CENTER';
  const bt=figma.createText();
  bt.fontName={family:'Inter',style:'Bold'}; bt.fontSize=12; bt.characters=String(m.n);
  bt.fills=[{type:'SOLID',color:white}]; bt.textAutoResize='WIDTH_AND_HEIGHT'; bf.appendChild(bt);
  row.appendChild(bf); bf.layoutSizingHorizontal='FIXED'; bf.layoutSizingVertical='FIXED'; bf.resize(24,24);
  const tb=figma.createAutoLayout('VERTICAL', {itemSpacing:3}); tb.fills=[];
  row.appendChild(tb); tb.layoutSizingHorizontal='FIXED'; tb.resize(TW, tb.height);
  const tt = mkText(m.t, {bold:true, size:13.5, color:ink, w:TW});
  tb.appendChild(tt); tt.layoutSizingHorizontal='FIXED';
  for (const [lab,val] of [['· 역할:',m.r],['· 동작:',m.a],['· 조건·예외:',m.c]]) {
    if(!val) continue;
    const c = mkText(lab+' '+val, {size:12.5, color:sub, lh:145, w:TW});
    tb.appendChild(c); c.layoutSizingHorizontal='FIXED';
  }
}
const fh = Math.max(IMGY + D.pageH, IMGY + panel.height) + PAD;
frame.resize(frameW, fh);
return { frameId: frame.id, rectId: rect.id, panelH: Math.round(panel.height), frameH: Math.round(fh) };`;
}

const FA = path.join(OUT, 'frameA'); if (!fs.existsSync(FA)) fs.mkdirSync(FA);
data.forEach((D, i) => {
  const ft = frameTemplate(D, i * SPACING);
  fs.writeFileSync(path.join(FR, D.name + '.js'), ft);
  const b64 = fs.readFileSync(path.join(OUT, 'b64', D.name + '.b64.txt'), 'utf8').trim();
  const expected = Buffer.from(b64, 'base64').length;
  const mid = Math.ceil(b64.length / 2);
  const a = b64.slice(0, mid), b = b64.slice(mid);
  const label = D.label;
  const aCode = `const LABEL = ${JSON.stringify(label + ' / 설명서')};
const frame = figma.currentPage.children.find(f => f.name === LABEL);
const rect = frame.children.find(c => c.type === 'RECTANGLE');
rect.setSharedPluginData('cap','a', ${JSON.stringify(a)});
const stored = rect.getSharedPluginData('cap','a');
return { storedLen: stored.length, expectLen: ${a.length}, ok: stored.length === ${a.length} };`;
  const bCode = `const LABEL = ${JSON.stringify(label + ' / 설명서')};
const frame = figma.currentPage.children.find(f => f.name === LABEL);
const rect = frame.children.find(c => c.type === 'RECTANGLE');
const a = rect.getSharedPluginData('cap','a');
let s = (a + ${JSON.stringify(b)}).replace(/[^A-Za-z0-9+/]/g, '');
s = s.slice(0, s.length - (s.length % 4));
const bytes = figma.base64Decode(s);
const img = figma.createImage(bytes);
rect.fills = [{ type:'IMAGE', scaleMode:'FILL', imageHash: img.hash }];
rect.locked = true;
rect.setSharedPluginData('cap','a', '');
return { bytes: bytes.length, expected: ${expected}, jpegOk: bytes[0]===0xFF && bytes[1]===0xD8, match: bytes.length === ${expected} };`;
  fs.writeFileSync(path.join(EM, D.name + '.a.js'), aCode);
  fs.writeFileSync(path.join(EM, D.name + '.b.js'), bCode);
  // combined frame build + store chunk A (single call), with storedLen verification
  const ftNoReturn = ft.replace(/\nreturn \{ frameId: frame\.id[^\n]*\n?$/, '\n');
  const frameACode = ftNoReturn.trimEnd() + `
rect.setSharedPluginData('cap','a', ${JSON.stringify(a)});
const __stored = rect.getSharedPluginData('cap','a');
return { rectId: rect.id, storedLen: __stored.length, expectLen: ${a.length}, storeOk: __stored.length === ${a.length}, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };`;
  fs.writeFileSync(path.join(FA, D.name + '.js'), frameACode);
});
console.log('generated frameOnly + 2-chunk embeds for', data.length, 'screens');
data.forEach(D=>{
  const b64=fs.readFileSync(path.join(OUT,'b64',D.name+'.b64.txt'),'utf8').trim();
  console.log(`  ${D.name}: b64=${b64.length}, chunkA≈${Math.ceil(b64.length/2)}`);
});
