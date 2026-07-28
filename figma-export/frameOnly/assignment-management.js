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
return { frameId: frame.id, rectId: rect.id, panelH: Math.round(panel.height), frameH: Math.round(fh) };