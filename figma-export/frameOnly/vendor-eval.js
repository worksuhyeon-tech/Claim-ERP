const D = {"name":"vendor-eval","label":"협력업체 평가","png":"vendor-eval.png","pageW":1440,"pageH":900,"markers":[{"n":1,"x":1366,"y":11,"w":56,"h":34,"t":"닫기 버튼","r":"평가 화면 닫기","a":"클릭 시 창/모달 닫기","c":"—"},{"n":2,"x":18,"y":69,"w":140,"h":37,"t":"평가 탭(①평가항목/②배점 등)","r":"평가 설정 단계 전환","a":"클릭 시 해당 탭 표시","c":"(반복 x3) 활성 탭 강조"},{"n":3,"x":35,"y":121,"w":95,"h":34,"t":"+ 항목추가 버튼","r":"평가 항목 추가","a":"클릭 시 새 항목 행 추가","c":"—"},{"n":4,"x":138,"y":121,"w":90,"h":34,"t":"- 항목삭제 버튼","r":"평가 항목 삭제","a":"클릭 시 항목 제거","c":"(반복 x3)"},{"n":5,"x":513,"y":220,"w":91,"h":29,"t":"평가 유형 선택(YESNO/SCALE/CUSTOM)","r":"항목 응답 방식","a":"선택 시 항목 입력 형태 변경","c":"(반복 다수)"},{"n":6,"x":228,"y":221,"w":270,"h":27,"t":"평가 항목명 입력","r":"항목 명칭","a":"입력값 반영","c":"(반복 다수)"},{"n":7,"x":1134,"y":221,"w":72,"h":27,"t":"배점 입력","r":"항목 점수/가중치","a":"숫자 입력 시 배점 반영","c":"(반복)"},{"n":8,"x":171,"y":223,"w":30,"h":22,"t":"Y/N 토글 버튼","r":"예/아니오 응답","a":"클릭 시 Y↔N 전환","c":"(반복 다수)"},{"n":9,"x":57,"y":226,"w":13,"h":13,"t":"옵션 라디오","r":"단일 선택 응답","a":"선택 시 값 반영","c":"(반복)"},{"n":10,"x":305,"y":694,"w":84,"h":29,"t":"+ 옵션추가 버튼","r":"선택 옵션 추가","a":"클릭 시 옵션 행 추가","c":"—"},{"n":11,"x":531,"y":768,"w":38,"h":23,"t":"삭제 버튼(옵션)","r":"옵션/행 삭제","a":"클릭 시 해당 항목 제거","c":"(반복 x2)"},{"n":12,"x":475,"y":769,"w":24,"h":21,"t":"▲ 순서 이동 버튼","r":"항목 순서 조정","a":"클릭 시 위/아래 이동 (추정)","c":"(반복 x4)"}]};
const FX = 17248;
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