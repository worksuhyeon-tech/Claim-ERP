const D = {"name":"ai-dashboard","label":"AI 통합대시보드","png":"ai-dashboard.png","pageW":1440,"pageH":1091,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청","a":"클릭 시 신청 모달 열림(공통)","c":"—"},{"n":2,"x":1287,"y":80,"w":125,"h":38,"t":"AI 검토요청 버튼","r":"AI 심사 요청 생성","a":"클릭 시 openRequestModal(AI 검토요청 모달) 열림 → 대상 선택 후 startAnalysis 로 분석 시작","c":"대상 사고건 선택 필요"},{"n":3,"x":28,"y":132,"w":336,"h":114,"t":"AI 요약 카드(검토대상 등)","r":"AI 검토 상태별 건수 표시 + 필터","a":"클릭 시 cardFilter 적용, 리스트 필터","c":"(반복 x3) 활성 카드 강조"},{"n":4,"x":1077,"y":132,"w":336,"h":114,"t":"보류·대기 카드","r":"보류/자료대기/분석실패 건수 강조","a":"클릭 시 해당 상태로 필터","c":"경고색 표기"},{"n":5,"x":1258,"y":277,"w":73,"h":36,"t":"초기화 버튼","r":"AI 필터 초기화","a":"클릭 시 단계·판정·점수·확신도·검색어 초기화 후 재렌더","c":"—"},{"n":6,"x":77,"y":278,"w":98,"h":35,"t":"단계 필터 선택","r":"대기중/수리승인/손해사정/완료","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":7,"x":223,"y":278,"w":115,"h":35,"t":"판정 필터 선택","r":"자료대기/분석대기/적정 등","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":8,"x":411,"y":278,"w":115,"h":35,"t":"AI 점수 필터 선택","r":"점수 구간(85↑ 등)","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":9,"x":605,"y":278,"w":102,"h":35,"t":"확신도 필터 선택","r":"확신도 구간(90%↑ 등)","a":"change 시 filters 반영, renderAiList","c":"—"},{"n":10,"x":723,"y":279,"w":519,"h":33,"t":"통합 검색 입력","r":"접수번호·차량·업체 검색","a":"input 시 filters.q 반영, renderAiList","c":"—"},{"n":11,"x":1325,"y":400,"w":55,"h":31,"t":"이동 버튼(행)","r":"해당 사고 상세로 이동","a":"클릭 시 data-move 대상으로 이동 (추정)","c":"(반복 x11)"},{"n":12,"x":93,"y":408,"w":94,"h":15,"t":"접수번호 링크(행)","r":"AI 검토 상세 열기","a":"클릭 시 data-detail 로 상세 표시","c":"(반복 x11)"}]};
const FX = 22176;
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