const D = {"name":"vendor-inquiry","label":"협력업체조회","png":"vendor-inquiry.png","pageW":1440,"pageH":2270,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청","a":"클릭 시 신청 모달 열림(공통)","c":"—"},{"n":2,"x":1176,"y":170,"w":59,"h":33,"t":"검색 버튼","r":"협력업체 조회","a":"클릭 시 검색 유형·키워드로 업체 조회","c":"—"},{"n":3,"x":97,"y":174,"w":122,"h":26,"t":"검색 유형 선택","r":"업체명/사업자번호/BP ID/제휴사/지점코드/대표자명","a":"선택 후 키워드와 함께 검색","c":"—"},{"n":4,"x":227,"y":174,"w":682,"h":26,"t":"검색 키워드 입력","r":"검색 유형에 대응하는 값","a":"입력 후 검색 실행","c":"—"},{"n":5,"x":917,"y":174,"w":94,"h":26,"t":"업체 구분 선택","r":"정비/부품/유리/렌트/실런트 업체 구분","a":"선택 시 업체 종류 필터","c":"—"},{"n":6,"x":1161,"y":255,"w":59,"h":29,"t":"저장 버튼(섹션별)","r":"업체 정보 저장","a":"클릭 시 해당 섹션 값 저장 (추정)","c":"(반복 x4)"},{"n":7,"x":371,"y":396,"w":62,"h":23,"t":"정보수정 버튼","r":"업체 상세 정보 수정 모드","a":"클릭 시 수정 활성화 (추정)","c":"(반복 x6)"},{"n":8,"x":1062,"y":577,"w":65,"h":23,"t":"＋ 행추가 버튼","r":"표에 행 추가","a":"클릭 시 신규 행 추가 (추정)","c":"—"},{"n":9,"x":76,"y":613,"w":13,"h":13,"t":"선택/여부 체크박스","r":"항목 선택 또는 사용여부","a":"토글로 상태 반영 (추정)","c":"(반복)"},{"n":10,"x":104,"y":640,"w":77,"h":24,"t":"구분 선택(담당 구분 등)","r":"셀 단위 구분값","a":"선택 시 값 반영","c":"(반복)"},{"n":11,"x":194,"y":640,"w":284,"h":24,"t":"표 셀 입력 필드","r":"업체 계약/수가/지급처 상세값","a":"입력값 반영","c":"(반복 다수)"},{"n":12,"x":970,"y":640,"w":140,"h":24,"t":"계약 만료일 입력","r":"계약 종료일(예: 9999-12-31)","a":"날짜 입력 시 반영","c":"—"},{"n":13,"x":124,"y":948,"w":110,"h":31,"t":"실적관리 버튼 (Pro)","r":"업체 실적 관리 진입","a":"클릭 시 실적관리 기능 (Pro)","c":"(반복 x2) Pro 기능"},{"n":14,"x":56,"y":952,"w":62,"h":23,"t":"선정평가 버튼","r":"협력업체 선정평가 열기","a":"클릭 시 vendor-eval 평가 화면/모달 오픈","c":"—"},{"n":15,"x":197,"y":1350,"w":13,"h":13,"t":"옵션 라디오(국산/외산 등)","r":"단일 선택 옵션","a":"선택 시 값 반영","c":"(반복)"},{"n":16,"x":56,"y":1520,"w":110,"h":26,"t":"원산지 선택","r":"국산/외산 구분","a":"선택 시 수가율 기준 반영","c":"—"},{"n":17,"x":272,"y":1520,"w":70,"h":26,"t":"수가율 입력","r":"원산지별 적용 요율(%)","a":"입력값 반영","c":"—"},{"n":18,"x":370,"y":1521,"w":62,"h":23,"t":"일괄적용 버튼","r":"요율 일괄 적용","a":"클릭 시 대상 행에 요율 일괄 반영 (추정)","c":"—"},{"n":19,"x":217,"y":1892,"w":130,"h":26,"t":"비밀번호 입력","r":"결재/승인용 인증","a":"입력값 인증에 사용 (추정)","c":"마스킹"},{"n":20,"x":217,"y":1931,"w":993,"h":60,"t":"결재 의견 입력","r":"상신 의견","a":"상신 시 의견 반영","c":"—"},{"n":21,"x":1069,"y":2015,"w":59,"h":33,"t":"상신 버튼","r":"변경 내용 결재 상신","a":"클릭 시 상신 처리 (추정)","c":"(반복 x4)"}]};
const FX = 14784;
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
return { rectId: rect.id, storedLen: __stored.length, expectLen: 5536, storeOk: __stored.length === 5536, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };