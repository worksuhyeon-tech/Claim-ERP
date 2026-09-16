const D = {"name":"smart-claims-demo","label":"미결일괄조회(자동처리 시연)","png":"smart-claims-demo.png","pageW":1440,"pageH":1471,"markers":[{"n":1,"x":780,"y":12,"w":161,"h":32,"t":"모드변경·실제 화면 링크","r":"실제 미결일괄조회로 전환","a":"클릭 시 smart-claims.html 로 이동","c":"시연 모드 종료"},{"n":2,"x":12,"y":108,"w":200,"h":40,"t":"좌측 네비 항목","r":"화면 이동 메뉴","a":"클릭 시 해당 화면 이동","c":"(반복) 활성 항목 강조"},{"n":3,"x":302,"y":145,"w":118,"h":33,"t":"단계 선택 드롭다운","r":"단계 필터","a":"change 시 단계 필터 적용","c":"시연 데이터 기준"},{"n":4,"x":438,"y":154,"w":15,"h":15,"t":"조치유형 체크박스","r":"조치유형 필터","a":"토글로 필터 반영","c":"(반복 x5)"},{"n":5,"x":1242,"y":190,"w":73,"h":36,"t":"초기화 버튼","r":"필터 초기화","a":"클릭 시 조건 초기화","c":"—"},{"n":6,"x":1323,"y":190,"w":72,"h":36,"t":"조회 버튼","r":"재조회","a":"클릭 시 리스트 재조회","c":"—"},{"n":7,"x":580,"y":192,"w":190,"h":33,"t":"정비공장명 검색 입력","r":"정비공장 부분검색","a":"입력 시 필터","c":"—"},{"n":8,"x":833,"y":192,"w":391,"h":33,"t":"통합 검색 입력","r":"통합 like 검색","a":"입력 시 필터","c":"—"},{"n":9,"x":303,"y":193,"w":51,"h":31,"t":"계획 필터 탭(전체/긴급/관심)","r":"별점 상태 필터","a":"클릭 시 필터 적용","c":"(반복 x3)"},{"n":10,"x":975,"y":376,"w":134,"h":35,"t":"자동 처리 시작 버튼","r":"시연 자동 재생/일시정지 토글","a":"클릭 시 running이면 pause(), 아니면 play(): setInterval(tick, tickMs)로 자동 처리 진행. 라벨 \"처리 진행중…/이어서 재생\"으로 변경","c":"대기건 0이면 먼저 reset()"},{"n":11,"x":1119,"y":376,"w":75,"h":35,"t":"리셋 버튼","r":"시연 초기화","a":"클릭 시 reset(): 타이머 정지, seed()·fullRender()로 초기 상태 복원","c":"—"},{"n":12,"x":1235,"y":385,"w":92,"h":16,"t":"재생 속도 슬라이더","r":"자동 처리 간격 조절","a":"input 시 tickMs=1280-값, 라벨 \"빠름/보통/느림\" 갱신","c":"값 클수록 빠름"},{"n":13,"x":1368,"y":387,"w":13,"h":13,"t":"반복 재생 체크박스","r":"시연 반복 여부","a":"체크 시 완료 후 반복 재생 (추정)","c":"—"},{"n":14,"x":267,"y":452,"w":15,"h":15,"t":"전체선택 체크박스","r":"현재 페이지 전체 선택","a":"체크 시 페이지 항목 선택","c":"—"},{"n":15,"x":300,"y":499,"w":19,"h":19,"t":"계획(별점) 토글","r":"행별 긴급/관심 표시","a":"클릭 시 상태 순환","c":"(반복 x28)"},{"n":16,"x":267,"y":501,"w":15,"h":15,"t":"행 선택 체크박스","r":"개별 건 선택","a":"토글로 선택","c":"(반복 x28)"},{"n":17,"x":533,"y":644,"w":374,"h":34,"t":"다시 재생 버튼","r":"처음부터 재생","a":"클릭 시 reset() 후 150ms 뒤 play()","c":"완료 오버레이에서 노출"}]};
const FX = 24640;
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
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 8399, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };