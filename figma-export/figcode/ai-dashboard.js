const D = {"name":"ai-dashboard","label":"AI 통합대시보드","png":"ai-dashboard.png","pageW":1440,"pageH":1091,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청","a":"클릭 시 신청 모달 열림(공통)","c":"—"},{"n":2,"x":1287,"y":80,"w":125,"h":38,"t":"AI 검토요청 버튼","r":"AI 심사 요청 생성","a":"클릭 시 openRequestModal(AI 검토요청 모달) 열림 → 대상 선택 후 startAnalysis 로 분석 시작","c":"대상 사고건 선택 필요"},{"n":3,"x":28,"y":132,"w":336,"h":114,"t":"AI 요약 카드(검토대상 등)","r":"AI 검토 상태별 건수 표시 + 필터","a":"클릭 시 cardFilter 적용, 리스트 필터","c":"(반복 x3) 활성 카드 강조"},{"n":4,"x":1077,"y":132,"w":336,"h":114,"t":"보류·대기 카드","r":"보류/자료대기/분석실패 건수 강조","a":"클릭 시 해당 상태로 필터","c":"경고색 표기"},{"n":5,"x":1258,"y":277,"w":73,"h":36,"t":"초기화 버튼","r":"AI 필터 초기화","a":"클릭 시 단계·판정·점수·확신도·검색어 초기화 후 재렌더","c":"—"},{"n":6,"x":77,"y":278,"w":98,"h":35,"t":"단계 필터 선택","r":"대기중/수리승인/손해사정/완료","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":7,"x":223,"y":278,"w":115,"h":35,"t":"판정 필터 선택","r":"자료대기/분석대기/적정 등","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":8,"x":411,"y":278,"w":115,"h":35,"t":"AI 점수 필터 선택","r":"점수 구간(85↑ 등)","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":9,"x":605,"y":278,"w":102,"h":35,"t":"확신도 필터 선택","r":"확신도 구간(90%↑ 등)","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":10,"x":723,"y":279,"w":519,"h":33,"t":"통합 검색 입력","r":"접수번호·차량·업체 검색","a":"input 시 filters.q 반영, renderAiList","c":"—"},{"n":11,"x":1325,"y":400,"w":55,"h":31,"t":"이동 버튼(행)","r":"해당 사고 상세로 이동","a":"클릭 시 data-move 대상으로 이동 (추정)","c":"(반복 x11)"},{"n":12,"x":93,"y":408,"w":94,"h":15,"t":"접수번호 링크(행)","r":"AI 검토 상세 열기","a":"클릭 시 data-detail 로 상세 표시","c":"(반복 x11)"}]};
const FX = 22176;
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
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 8407, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };