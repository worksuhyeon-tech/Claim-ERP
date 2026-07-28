const D = {"name":"index","label":"화면 선택(Hub)","png":"index.png","pageW":1440,"pageH":900,"markers":[{"n":1,"x":310,"y":130,"w":264,"h":127,"t":"미결일괄조회 카드","r":"사고건 단계별 통합 업무 리스트 진입","a":"클릭 시 smart-claims.html 로 이동","c":"—"},{"n":2,"x":588,"y":130,"w":264,"h":127,"t":"Smart업무처리 카드","r":"사고 접수·계약·견적·결재 상세 진입","a":"클릭 시 smart-intake.html 로 이동","c":"—"},{"n":3,"x":866,"y":130,"w":264,"h":127,"t":"이미지시스템 카드","r":"차량·사고 사진 관리 진입","a":"클릭 시 image-system.html 로 이동","c":"—"},{"n":4,"x":310,"y":271,"w":264,"h":127,"t":"결재 LIST 카드","r":"추산·지급 결재 진행 현황 진입","a":"클릭 시 approval-list.html 로 이동","c":"—"},{"n":5,"x":588,"y":271,"w":264,"h":127,"t":"전결·순환배당 관리 카드","r":"전결권한·순환배당 규칙 설정 진입","a":"클릭 시 assignment-management.html 로 이동","c":"—"},{"n":6,"x":866,"y":271,"w":264,"h":127,"t":"협력업체조회 카드","r":"협력업체 계약·수가·지급처 관리 진입","a":"클릭 시 vendor-inquiry.html 로 이동","c":"—"},{"n":7,"x":310,"y":412,"w":264,"h":145,"t":"AI 통합대시보드 카드 (Pro)","r":"AI 견적·손해사정 심사/검토회신 진입","a":"클릭 시 ai-dashboard.html 로 이동","c":"Pro 버전 기능 표기"},{"n":8,"x":588,"y":412,"w":264,"h":145,"t":"자동처리 시연 카드 (Pro)","r":"자동 처리 흐름 애니메이션 시연 진입","a":"클릭 시 smart-claims-demo.html 로 이동","c":"시연 모드"}]};
const FX = 0;
const PAD=40, IMGX=40, IMGY=104, GAP=64, PANELW=660, BADGE=26, R=13;
const IW = PANELW - 44;   // panel inner width
const TW = IW - 34;       // text width in a row (badge 24 + gap 10)
await figma.loadFontAsync({family:'Inter',style:'Regular'});
await figma.loadFontAsync({family:'Inter',style:'Bold'});
const blue={r:0.184,g:0.373,b:0.749};
const white={r:1,g:1,b:1};
const ink={r:0.133,g:0.145,b:0.180};
const sub={r:0.357,g:0.384,b:0.451};
// wrapping text helper: FIXED width + auto height (FILL is unreliable for TEXT)
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

// frame title
const title = figma.createText();
title.fontName={family:'Inter',style:'Bold'}; title.fontSize=28;
title.characters = D.label + '   /   설명서';
title.fills=[{type:'SOLID',color:ink}];
frame.appendChild(title); title.x=IMGX; title.y=44;

// background capture rectangle (image fill embedded via figma.createImage afterwards)
const rect = figma.createRectangle();
rect.name = '배경 캡처(' + D.png + ')';
rect.resize(D.pageW, D.pageH);
rect.fills=[{type:'SOLID', color:{r:0.93,g:0.95,b:0.98}}];
rect.strokes=[{type:'SOLID', color:{r:0.79,g:0.83,b:0.90}}]; rect.strokeWeight=1;
frame.appendChild(rect); rect.x=IMGX; rect.y=IMGY;

// number markers over elements (first instance of repeated groups)
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

// description panel (auto-layout, to the right of the capture)
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

// size the frame to the taller of capture / panel
const fh = Math.max(IMGY + D.pageH, IMGY + panel.height) + PAD;
frame.resize(frameW, fh);

// ---- embed captured background (base64 via MCP channel; egress to figma upload host is policy-blocked) ----
const __raw = "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";
let __s = __raw.replace(/[^A-Za-z0-9+/]/g, '');       // tolerate stray whitespace
__s = __s.slice(0, __s.length - (__s.length % 4));    // fix padding to a multiple of 4
const __bytes = figma.base64Decode(__s);
const __img = figma.createImage(__bytes);
rect.fills = [{ type:'IMAGE', scaleMode:'FILL', imageHash: __img.hash }];
rect.locked = true;
const __jpeg = __bytes[0]===0xFF && __bytes[1]===0xD8;   // JPEG magic sanity check
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 7244, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };