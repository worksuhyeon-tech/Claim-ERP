const D = {"name":"smart-intake","label":"Smart업무처리","png":"smart-intake.png","pageW":1440,"pageH":1949,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청 접수","a":"클릭 시 신청 모달 열림(공통)","c":"선택 사고건 프리셋"},{"n":2,"x":28,"y":80,"w":92,"h":31,"t":"← 목록으로 버튼","r":"미결일괄조회로 복귀","a":"클릭 시 목록 화면으로 이동 (추정)","c":"—"},{"n":3,"x":1253,"y":132,"w":68,"h":27,"t":"🔍 검색 버튼","r":"사고건 조회","a":"클릭 시 runIntakeSearch 실행 → 좌측 조건으로 검색","c":"—"},{"n":4,"x":1328,"y":132,"w":71,"h":27,"t":"↻ 재설정 버튼","r":"검색 조건 초기화","a":"클릭 시 검색 조건 리셋 (추정)","c":"—"},{"n":5,"x":97,"y":133,"w":122,"h":26,"t":"조회 유형 선택","r":"검색 기준(사고번호/차량번호/피보험자/휴대폰 등)","a":"선택 후 입력값과 함께 검색","c":"—"},{"n":6,"x":227,"y":133,"w":150,"h":26,"t":"검색어 입력(사고번호 등)","r":"조회 유형에 대응하는 검색어","a":"값 입력 후 검색 실행","c":"—"},{"n":7,"x":1350,"y":502,"w":40,"h":23,"t":"속성 저장 버튼","r":"미결속성/진행 메모 저장","a":"클릭 시 attrSave 핸들러로 속성 저장","c":"—"},{"n":8,"x":484,"y":505,"w":13,"h":13,"t":"미결속성 라디오(재통화/방문 등)","r":"진행 조치유형 선택","a":"선택 시 해당 속성 활성화 (추정)","c":"(반복)"},{"n":9,"x":669,"y":527,"w":353,"h":26,"t":"메모 대상 유형 선택","r":"통화·연락 상대(피보/정비공장/콜센터 등)","a":"선택 시 메모 대상 구분","c":"—"},{"n":10,"x":1128,"y":532,"w":262,"h":28,"t":"재통화 날짜 입력","r":"재통화 예정일","a":"날짜 지정 시 속성값 반영 (추정)","c":"—"},{"n":11,"x":50,"y":533,"w":73,"h":23,"t":"메세지발송 버튼","r":"대상에게 알림톡·문자 발송창 열기","a":"클릭 시 openMsgSendWindow 로 발송 창 오픈","c":"—"},{"n":12,"x":1057,"y":539,"w":13,"h":13,"t":"조치 체크박스(재통화 등)","r":"조치 항목 체크","a":"토글로 조치 상태 반영 (추정)","c":"(반복)"},{"n":13,"x":669,"y":559,"w":353,"h":26,"t":"메모 대상자 입력","r":"통화/연락 대상 이름","a":"입력값 메모에 반영","c":"—"},{"n":14,"x":669,"y":591,"w":353,"h":169,"t":"진행 내용 메모 입력","r":"진행 경과 기록","a":"텍스트 입력 후 메모 저장","c":"—"},{"n":15,"x":1128,"y":604,"w":262,"h":24,"t":"속성 입력 필드(탁송 메모 등)","r":"미결 속성 상세값","a":"입력값 속성에 반영 (추정)","c":"(반복) 최대 20자 등 필드별 제한"},{"n":16,"x":956,"y":768,"w":65,"h":23,"t":"메모 저장 버튼","r":"진행 메모 저장","a":"클릭 시 memoSave 핸들러 실행","c":"—"},{"n":17,"x":41,"y":812,"w":120,"h":32,"t":"상세 탭(계약/사고 정보 등)","r":"상세 정보 영역 전환","a":"클릭 시 해당 탭 콘텐츠 표시","c":"(반복 x3) 활성 탭 강조"},{"n":18,"x":151,"y":895,"w":555,"h":22,"t":"계약/사고 상세 입력 필드","r":"계약·사고 상세 정보 입력","a":"값 입력 시 상세 데이터 반영","c":"(반복)"},{"n":19,"x":676,"y":926,"w":28,"h":26,"t":"지도에서 사고장소 검색 버튼","r":"사고장소 지도 검색","a":"클릭 시 장소 검색 실행 (추정)","c":"—"},{"n":20,"x":151,"y":1019,"w":225,"h":24,"t":"사고 유형 선택(차대차/차량단독 등)","r":"사고 형태 분류","a":"선택 시 사고 정보에 반영","c":"(반복)"},{"n":21,"x":481,"y":1019,"w":225,"h":24,"t":"사고 세부유형 선택","r":"세부 사고 상황(추돌/후진/주정차 등)","a":"선택 시 세부유형 반영","c":"—"},{"n":22,"x":151,"y":1051,"w":225,"h":24,"t":"중대사고 구분 선택","r":"중앙선침범·침수·태풍 등 중대사고 여부","a":"선택 시 중대사고 항목 반영","c":"기본값 \"선택\""},{"n":23,"x":483,"y":1052,"w":64,"h":22,"t":"과실비율 입력","r":"과실 비율 값","a":"숫자 입력 시 과실 정보 반영","c":"—"},{"n":24,"x":183,"y":1173,"w":166,"h":22,"t":"경찰서명 등 소형 입력","r":"사고 접수 관련 부가정보","a":"입력값 반영","c":"(반복)"},{"n":25,"x":313,"y":1300,"w":130,"h":22,"t":"운전자명 입력","r":"운전자 성명","a":"입력값 반영","c":"—"},{"n":26,"x":465,"y":1331,"w":28,"h":26,"t":"운전자 정보 조회 버튼","r":"운전자 정보 조회","a":"클릭 시 운전자 정보 조회 (추정)","c":"—"},{"n":27,"x":501,"y":1331,"w":28,"h":26,"t":"전화·문자 발송 버튼","r":"운전자 연락","a":"클릭 시 openMsgSendWindow 로 발송 창 오픈","c":"—"},{"n":28,"x":171,"y":1333,"w":82,"h":22,"t":"생년월일 앞자리 입력","r":"운전자 주민번호 앞자리","a":"입력값 반영","c":"개인정보 마스킹 표기"},{"n":29,"x":269,"y":1333,"w":30,"h":22,"t":"주민번호 뒷자리 첫자리 입력","r":"성별 구분자","a":"입력값 반영","c":"—"},{"n":30,"x":399,"y":1333,"w":42,"h":22,"t":"나이 표시/입력 필드","r":"운전자 연령","a":"생년월일 기준 산출 또는 입력 (추정)","c":"—"},{"n":31,"x":171,"y":1397,"w":84,"h":23,"t":"운전면허조회 버튼","r":"면허 진위/정보 조회","a":"클릭 시 fetchLicenseKooKoon 실행(외부 조회 연동)","c":"—"},{"n":32,"x":263,"y":1397,"w":62,"h":23,"t":"직접입력 버튼","r":"면허 정보 수기 입력 전환","a":"클릭 시 면허 필드 수동 입력 모드 (추정)","c":"—"},{"n":33,"x":299,"y":1432,"w":210,"h":22,"t":"운전면허번호 입력","r":"면허번호","a":"입력값 반영","c":"—"},{"n":34,"x":243,"y":1555,"w":26,"h":24,"t":"알림톡·문자메세지 발송 버튼","r":"고객/운전자 메시지 발송","a":"클릭 시 openMsgSendWindow 로 발송 창 오픈","c":"—"},{"n":35,"x":205,"y":1595,"w":90,"h":23,"t":"타사 정보 조회 버튼","r":"상대(타사) 보험 정보 조회","a":"클릭 시 fetchCompetitorInfo 실행","c":"—"},{"n":36,"x":1273,"y":1863,"w":59,"h":33,"t":"저장 버튼","r":"상세 입력 내용 저장","a":"클릭 시 현재 탭/속성 저장","c":"—"},{"n":37,"x":1340,"y":1863,"w":59,"h":33,"t":"종결 버튼","r":"사고건 처리 종결","a":"클릭 시 해당 건 종결 처리 (추정)","c":"종결 조건 충족 필요 (추정)"}]};
const FX = 4928;
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
return { rectId: rect.id, storedLen: __stored.length, expectLen: 5492, storeOk: __stored.length === 5492, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };