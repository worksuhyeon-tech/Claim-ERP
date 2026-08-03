const D = {"name":"assignment-management","label":"전결·순환배당 관리","png":"assignment-management.png","pageW":1440,"pageH":1076,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청","a":"클릭 시 신청 모달 열림(공통)","c":"—"},{"n":2,"x":1158,"y":196,"w":60,"h":40,"t":"검색 버튼","r":"담당자 목록 조회","a":"클릭 시 조건으로 담당자 목록 재조회 (추정)","c":"—"},{"n":3,"x":1226,"y":196,"w":99,"h":40,"t":"시뮬레이션 버튼","r":"순환배당 시뮬레이션","a":"클릭 시 openAssignSim 모달 열림(배당 결과 미리보기)","c":"—"},{"n":4,"x":1333,"y":196,"w":60,"h":40,"t":"저장 버튼","r":"전결권한·배당 규칙 저장","a":"클릭 시 저장 처리 실행","c":"—"},{"n":5,"x":47,"y":200,"w":85,"h":35,"t":"권역 선택","r":"수도권/중부권 필터","a":"change 시 apply() 목록 필터","c":"—"},{"n":6,"x":150,"y":200,"w":126,"h":35,"t":"팀 선택","r":"Claim운영1/2팀 필터","a":"change 시 apply() 목록 필터","c":"—"},{"n":7,"x":294,"y":200,"w":98,"h":35,"t":"센터 선택","r":"강남/분당센터 필터","a":"change 시 apply() 목록 필터","c":"—"},{"n":8,"x":410,"y":202,"w":240,"h":33,"t":"담당자/사번 검색 입력","r":"담당자명·사번 검색","a":"input 시 apply() 실시간 필터","c":"—"},{"n":9,"x":668,"y":214,"w":124,"h":21,"t":"기준일 입력","r":"배당 기준 날짜","a":"날짜 선택 시 기준일 반영","c":"—"},{"n":10,"x":886,"y":387,"w":109,"h":36,"t":"조회목록 적용 버튼","r":"일 배당한도 일괄 적용","a":"클릭 시 applyBulkDailyLimit 실행","c":"조회된 목록 대상"},{"n":11,"x":796,"y":388,"w":84,"h":34,"t":"일 배당한도 입력","r":"일괄 적용할 한도값","a":"입력 후 적용 버튼 또는 Enter 시 applyBulkDailyLimit","c":"숫자 입력"},{"n":12,"x":44,"y":482,"w":13,"h":13,"t":"담당자 행 선택/속성 체크박스","r":"담당자 선택 또는 배당중지 등 속성","a":"토글로 대상/속성 반영 (추정)","c":"(반복)"}]};
const FX = 12320;
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
return { rectId: rect.id, storedLen: __stored.length, expectLen: 5846, storeOk: __stored.length === 5846, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };