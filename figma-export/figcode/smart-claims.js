const D = {"name":"smart-claims","label":"미결일괄조회","png":"smart-claims.png","pageW":1440,"pageH":1193,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트(대차)·탑승 신청 접수 진입","a":"클릭 시 신청 모달(openRequestModal) 열림. 선택된 사고건이 있으면 해당 ID 프리셋. 신청 완료 시 \"{ID} 신청이 접수되었습니다\" 토스트","c":"선택 사고 없으면 프리셋 없이 열림"},{"n":2,"x":762,"y":12,"w":133,"h":32,"t":"모드변경·시연 링크","r":"자동처리 시연 화면 전환","a":"클릭 시 smart-claims-demo.html 로 이동","c":"—"},{"n":3,"x":78,"y":145,"w":132,"h":33,"t":"Flow 단계 선택 드롭다운","r":"처리 단계 필터(접수·선견적/수리승인/손해사정/지급·정산)","a":"change 시 setStage() 호출 → 조치유형 전체로 초기화, 1페이지로 이동, 카드·리스트 재렌더","c":"상단 Flow 카드와 상태 동기화"},{"n":4,"x":228,"y":154,"w":15,"h":15,"t":"조치유형 전체 체크박스","r":"현재 단계의 모든 조치유형 on/off","a":"체크 시 checkedTypes=해당 단계 전체, 해제 시 빈 집합","c":"개별 유형이 모두 체크되면 자동 on"},{"n":5,"x":287,"y":154,"w":15,"h":15,"t":"개별 조치유형 체크박스 (면허미확인·계약조사 등)","r":"조치유형별 리스트 필터","a":"토글 시 checkedTypes 갱신, 1페이지·재렌더","c":"(반복) 전체 상태에서 개별 해제 시 나머지만 표시"},{"n":6,"x":1242,"y":190,"w":73,"h":36,"t":"초기화 버튼","r":"검색 필터 초기화","a":"조치유형·계획·정비공장명·검색어·금액대 초기화 후 renderAll","c":"현재 단계(activeStage)는 유지"},{"n":7,"x":1323,"y":190,"w":72,"h":36,"t":"조회 버튼","r":"현재 조건으로 재조회","a":"1페이지 이동·selectFirst·renderList","c":"입력값은 실시간 반영되므로 확정 트리거 성격"},{"n":8,"x":356,"y":192,"w":190,"h":33,"t":"정비공장명 like검색 입력","r":"정비공장명 부분검색","a":"input 시 즉시 필터(shopQuery), 1페이지","c":"—"},{"n":9,"x":638,"y":192,"w":108,"h":33,"t":"추산 금액대 하한 입력","r":"추산 금액 이상 조건","a":"입력 시 천단위 콤마 자동 서식, 숫자만 추출해 estMin 반영, 실시간 필터","c":"숫자 외 문자 제거"},{"n":10,"x":770,"y":192,"w":108,"h":33,"t":"추산 금액대 상한 입력","r":"추산 금액 이하 조건","a":"입력 시 천단위 콤마 자동 서식, 숫자만 추출해 estMax 반영, 실시간 필터","c":"숫자 외 문자 제거"},{"n":11,"x":960,"y":192,"w":264,"h":33,"t":"통합 검색 입력(접수번호·차량명·차량번호·담당자)","r":"통합 like 검색","a":"input 시 실시간 필터, Enter 키로도 재조회","c":"—"},{"n":12,"x":79,"y":193,"w":51,"h":31,"t":"계획 필터 탭 (전체/★긴급/★관심)","r":"별점(계획) 상태로 리스트 필터","a":"클릭 시 planFilter=버튼값, selectFirst·재렌더","c":"(반복 x3)"},{"n":13,"x":28,"y":255,"w":336,"h":97,"t":"Flow 단계 카드","r":"단계별 건수 표시 + 단계 필터","a":"클릭 시 setStage(dataset.stage) 로 해당 단계 필터","c":"(반복 x4) 활성 카드 강조"},{"n":14,"x":1300,"y":368,"w":110,"h":30,"t":"페이지당 표시 건수 선택","r":"10/20/50개씩 보기","a":"change 시 pageSize 변경, 1페이지 재렌더","c":"기본 20개"},{"n":15,"x":43,"y":432,"w":15,"h":15,"t":"전체선택 체크박스","r":"현재 페이지 행 전체 선택","a":"체크 시 현재 페이지 항목을 selectedRows에 추가/제거","c":"현재 페이지 기준(전체 데이터 아님)"},{"n":16,"x":76,"y":472,"w":19,"h":19,"t":"계획(별점) 토글 버튼","r":"행별 긴급/관심 표시","a":"클릭 시 없음→긴급→관심→없음 순환(planState)","c":"(반복 x20) 계획 필터가 전체가 아니면 selectFirst 재수행"},{"n":17,"x":43,"y":474,"w":15,"h":15,"t":"행 선택 체크박스","r":"개별 사고건 선택","a":"토글 시 selectedRows 갱신, selectAll 동기화","c":"(반복 x20) 행 클릭 이벤트 전파 중단"}]};
const FX = 2464;
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
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 8506, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };