const D = {"name":"smart-claims-demo","label":"미결일괄조회(자동처리 시연)","png":"smart-claims-demo.png","pageW":1440,"pageH":1471,"markers":[{"n":1,"x":780,"y":12,"w":161,"h":32,"t":"모드변경·실제 화면 링크","r":"실제 미결일괄조회로 전환","a":"클릭 시 smart-claims.html 로 이동","c":"시연 모드 종료"},{"n":2,"x":12,"y":108,"w":200,"h":40,"t":"좌측 네비 항목","r":"화면 이동 메뉴","a":"클릭 시 해당 화면 이동","c":"(반복) 활성 항목 강조"},{"n":3,"x":302,"y":145,"w":118,"h":33,"t":"단계 선택 드롭다운","r":"단계 필터","a":"change 시 단계 필터 적용","c":"시연 데이터 기준"},{"n":4,"x":438,"y":154,"w":15,"h":15,"t":"조치유형 체크박스","r":"조치유형 필터","a":"토글로 필터 반영","c":"(반복 x5)"},{"n":5,"x":1242,"y":190,"w":73,"h":36,"t":"초기화 버튼","r":"필터 초기화","a":"클릭 시 조건 초기화","c":"—"},{"n":6,"x":1323,"y":190,"w":72,"h":36,"t":"조회 버튼","r":"재조회","a":"클릭 시 리스트 재조회","c":"—"},{"n":7,"x":580,"y":192,"w":190,"h":33,"t":"정비공장명 검색 입력","r":"정비공장 부분검색","a":"입력 시 필터","c":"—"},{"n":8,"x":833,"y":192,"w":391,"h":33,"t":"통합 검색 입력","r":"통합 like 검색","a":"입력 시 필터","c":"—"},{"n":9,"x":303,"y":193,"w":51,"h":31,"t":"계획 필터 탭(전체/긴급/관심)","r":"별점 상태 필터","a":"클릭 시 필터 적용","c":"(반복 x3)"},{"n":10,"x":975,"y":376,"w":134,"h":35,"t":"자동 처리 시작 버튼","r":"시연 자동 재생/일시정지 토글","a":"클릭 시 running이면 pause(), 아니면 play(): setInterval(tick, tickMs)로 자동 처리 진행. 라벨 \"처리 진행중…/이어서 재생\"으로 변경","c":"대기건 0이면 먼저 reset()"},{"n":11,"x":1119,"y":376,"w":75,"h":35,"t":"리셋 버튼","r":"시연 초기화","a":"클릭 시 reset(): 타이머 정지, seed()·fullRender()로 초기 상태 복원","c":"—"},{"n":12,"x":1235,"y":385,"w":92,"h":16,"t":"재생 속도 슬라이더","r":"자동 처리 간격 조절","a":"input 시 tickMs=1280-값, 라벨 \"빠름/보통/느림\" 갱신","c":"값 클수록 빠름"},{"n":13,"x":1368,"y":387,"w":13,"h":13,"t":"반복 재생 체크박스","r":"시연 반복 여부","a":"체크 시 완료 후 반복 재생 (추정)","c":"—"},{"n":14,"x":267,"y":452,"w":15,"h":15,"t":"전체선택 체크박스","r":"현재 페이지 전체 선택","a":"체크 시 페이지 항목 선택","c":"—"},{"n":15,"x":300,"y":499,"w":19,"h":19,"t":"계획(별점) 토글","r":"행별 긴급/관심 표시","a":"클릭 시 상태 순환","c":"(반복 x28)"},{"n":16,"x":267,"y":501,"w":15,"h":15,"t":"행 선택 체크박스","r":"개별 건 선택","a":"토글로 선택","c":"(반복 x28)"},{"n":17,"x":533,"y":644,"w":374,"h":34,"t":"다시 재생 버튼","r":"처음부터 재생","a":"클릭 시 reset() 후 150ms 뒤 play()","c":"완료 오버레이에서 노출"}]};
const FX = 24640;
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
return { frameId: frame.id, rectId: rect.id, panelH: Math.round(panel.height), frameH: Math.round(fh) };