const D = {"name":"smart-claims","label":"미결일괄조회","png":"smart-claims.png","pageW":1440,"pageH":1193,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트(대차)·탑승 신청 접수 진입","a":"클릭 시 신청 모달(openRequestModal) 열림. 선택된 사고건이 있으면 해당 ID 프리셋. 신청 완료 시 \"{ID} 신청이 접수되었습니다\" 토스트","c":"선택 사고 없으면 프리셋 없이 열림"},{"n":2,"x":762,"y":12,"w":133,"h":32,"t":"모드변경·시연 링크","r":"자동처리 시연 화면 전환","a":"클릭 시 smart-claims-demo.html 로 이동","c":"—"},{"n":3,"x":78,"y":145,"w":132,"h":33,"t":"Flow 단계 선택 드롭다운","r":"처리 단계 필터(접수·선견적/수리승인/손해사정/지급·정산)","a":"change 시 setStage() 호출 → 조치유형 전체로 초기화, 1페이지로 이동, 카드·리스트 재렌더","c":"상단 Flow 카드와 상태 동기화"},{"n":4,"x":228,"y":154,"w":15,"h":15,"t":"조치유형 전체 체크박스","r":"현재 단계의 모든 조치유형 on/off","a":"체크 시 checkedTypes=해당 단계 전체, 해제 시 빈 집합","c":"개별 유형이 모두 체크되면 자동 on"},{"n":5,"x":287,"y":154,"w":15,"h":15,"t":"개별 조치유형 체크박스 (면허미확인·계약조사 등)","r":"조치유형별 리스트 필터","a":"토글 시 checkedTypes 갱신, 1페이지·재렌더","c":"(반복) 전체 상태에서 개별 해제 시 나머지만 표시"},{"n":6,"x":1242,"y":190,"w":73,"h":36,"t":"초기화 버튼","r":"검색 필터 초기화","a":"조치유형·계획·정비공장명·검색어·금액대 초기화 후 renderAll","c":"현재 단계(activeStage)는 유지"},{"n":7,"x":1323,"y":190,"w":72,"h":36,"t":"조회 버튼","r":"현재 조건으로 재조회","a":"1페이지 이동·selectFirst·renderList","c":"입력값은 실시간 반영되므로 확정 트리거 성격"},{"n":8,"x":356,"y":192,"w":190,"h":33,"t":"정비공장명 like검색 입력","r":"정비공장명 부분검색","a":"input 시 즉시 필터(shopQuery), 1페이지","c":"—"},{"n":9,"x":638,"y":192,"w":108,"h":33,"t":"추산 금액대 하한 입력","r":"추산 금액 이상 조건","a":"입력 시 천단위 콤마 자동 서식, 숫자만 추출해 estMin 반영, 실시간 필터","c":"숫자 외 문자 제거"},{"n":10,"x":770,"y":192,"w":108,"h":33,"t":"추산 금액대 상한 입력","r":"추산 금액 이하 조건","a":"입력 시 천단위 콤마 자동 서식, 숫자만 추출해 estMax 반영, 실시간 필터","c":"숫자 외 문자 제거"},{"n":11,"x":960,"y":192,"w":264,"h":33,"t":"통합 검색 입력(접수번호·차량명·차량번호·담당자)","r":"통합 like 검색","a":"input 시 실시간 필터, Enter 키로도 재조회","c":"—"},{"n":12,"x":79,"y":193,"w":51,"h":31,"t":"계획 필터 탭 (전체/★긴급/★관심)","r":"별점(계획) 상태로 리스트 필터","a":"클릭 시 planFilter=버튼값, selectFirst·재렌더","c":"(반복 x3)"},{"n":13,"x":28,"y":255,"w":336,"h":97,"t":"Flow 단계 카드","r":"단계별 건수 표시 + 단계 필터","a":"클릭 시 setStage(dataset.stage) 로 해당 단계 필터","c":"(반복 x4) 활성 카드 강조"},{"n":14,"x":1300,"y":368,"w":110,"h":30,"t":"페이지당 표시 건수 선택","r":"10/20/50개씩 보기","a":"change 시 pageSize 변경, 1페이지 재렌더","c":"기본 20개"},{"n":15,"x":43,"y":432,"w":15,"h":15,"t":"전체선택 체크박스","r":"현재 페이지 행 전체 선택","a":"체크 시 현재 페이지 항목을 selectedRows에 추가/제거","c":"현재 페이지 기준(전체 데이터 아님)"},{"n":16,"x":76,"y":472,"w":19,"h":19,"t":"계획(별점) 토글 버튼","r":"행별 긴급/관심 표시","a":"클릭 시 없음→긴급→관심→없음 순환(planState)","c":"(반복 x20) 계획 필터가 전체가 아니면 selectFirst 재수행"},{"n":17,"x":43,"y":474,"w":15,"h":15,"t":"행 선택 체크박스","r":"개별 사고건 선택","a":"토글 시 selectedRows 갱신, selectAll 동기화","c":"(반복 x20) 행 클릭 이벤트 전파 중단"}]};
const FX = 2464;
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