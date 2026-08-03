const D = {"name":"image-system","label":"이미지시스템","png":"image-system.png","pageW":1440,"pageH":900,"markers":[{"n":1,"x":644,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청","a":"클릭 시 신청 모달 열림(공통)","c":"—"},{"n":2,"x":41,"y":172,"w":254,"h":38,"t":"사진 검색 입력(사고번호·고객·차량)","r":"사고건/차량 검색","a":"input 시 applyImgSearch 실시간 필터, Enter 지원","c":"—"},{"n":3,"x":269,"y":182,"w":18,"h":18,"t":"검색어 지우기(×) 버튼","r":"검색어 초기화","a":"클릭 시 검색 입력 비우고 목록 복원","c":"—"},{"n":4,"x":37,"y":229,"w":262,"h":58,"t":"사고건 목록 항목","r":"사진 열람 대상 사고 선택","a":"클릭 시 imgSelectedClaimId 변경, 사진/폴더 갱신","c":"(반복) 활성 항목 강조"},{"n":5,"x":345,"y":237,"w":105,"h":33,"t":"사진 폴더 탭(사고사진 등)","r":"사진 분류 폴더 전환","a":"클릭 시 해당 폴더 사진 표시","c":"(반복) 활성 폴더 강조"},{"n":6,"x":825,"y":237,"w":130,"h":33,"t":"빈 폴더 탭(청구관련서류 0 등)","r":"사진 없는 분류 표시","a":"클릭 시 빈 상태 표시","c":"장수 0인 폴더"},{"n":7,"x":850,"y":503,"w":84,"h":40,"t":"확대보기 버튼","r":"선택 사진 확대","a":"클릭 시 \"선택한 N장을 확대보기로 엽니다\" 토스트(데모)","c":"선택 사진 없으면 0장"},{"n":8,"x":944,"y":503,"w":84,"h":40,"t":"다운로드 버튼","r":"선택 사진 다운로드","a":"클릭 시 \"N장을 다운로드합니다\" 토스트(데모)","c":"데모 동작"},{"n":9,"x":1038,"y":503,"w":89,"h":40,"t":"문자 발송 버튼","r":"고객에게 이미지 발송","a":"클릭 시 openImageSendModal 열림(보안 링크/MMS 선택 발송)","c":"선택 사진과 대상 사고 필요"}]};
const FX = 7392;
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
return { rectId: rect.id, storedLen: __stored.length, expectLen: 5884, storeOk: __stored.length === 5884, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };