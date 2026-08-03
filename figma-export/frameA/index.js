const D = {"name":"index","label":"화면 선택(Hub)","png":"index.png","pageW":1440,"pageH":900,"markers":[{"n":1,"x":310,"y":130,"w":264,"h":127,"t":"미결일괄조회 카드","r":"사고건 단계별 통합 업무 리스트 진입","a":"클릭 시 smart-claims.html 로 이동","c":"—"},{"n":2,"x":588,"y":130,"w":264,"h":127,"t":"Smart업무처리 카드","r":"사고 접수·계약·견적·결재 상세 진입","a":"클릭 시 smart-intake.html 로 이동","c":"—"},{"n":3,"x":866,"y":130,"w":264,"h":127,"t":"이미지시스템 카드","r":"차량·사고 사진 관리 진입","a":"클릭 시 image-system.html 로 이동","c":"—"},{"n":4,"x":310,"y":271,"w":264,"h":127,"t":"결재 LIST 카드","r":"추산·지급 결재 진행 현황 진입","a":"클릭 시 approval-list.html 로 이동","c":"—"},{"n":5,"x":588,"y":271,"w":264,"h":127,"t":"전결·순환배당 관리 카드","r":"전결권한·순환배당 규칙 설정 진입","a":"클릭 시 assignment-management.html 로 이동","c":"—"},{"n":6,"x":866,"y":271,"w":264,"h":127,"t":"협력업체조회 카드","r":"협력업체 계약·수가·지급처 관리 진입","a":"클릭 시 vendor-inquiry.html 로 이동","c":"—"},{"n":7,"x":310,"y":412,"w":264,"h":145,"t":"AI 통합대시보드 카드 (Pro)","r":"AI 견적·손해사정 심사/검토회신 진입","a":"클릭 시 ai-dashboard.html 로 이동","c":"Pro 버전 기능 표기"},{"n":8,"x":588,"y":412,"w":264,"h":145,"t":"자동처리 시연 카드 (Pro)","r":"자동 처리 흐름 애니메이션 시연 진입","a":"클릭 시 smart-claims-demo.html 로 이동","c":"시연 모드"}]};
const FX = 0;
const PAD=40, IMGX=40, IMGY=104, GAP=64, PANELW=660, BADGE=26, R=13;
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
rect.setSharedPluginData('cap','a', "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");
const __stored = rect.getSharedPluginData('cap','a');
return { rectId: rect.id, storedLen: __stored.length, expectLen: 4830, storeOk: __stored.length === 4830, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };