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
return { frameId: frame.id, rectId: rect.id, panelH: Math.round(panel.height), frameH: Math.round(fh) };