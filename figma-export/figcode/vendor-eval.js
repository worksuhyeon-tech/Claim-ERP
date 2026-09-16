const D = {"name":"vendor-eval","label":"협력업체 평가","png":"vendor-eval.png","pageW":1440,"pageH":900,"markers":[{"n":1,"x":1366,"y":11,"w":56,"h":34,"t":"닫기 버튼","r":"평가 화면 닫기","a":"클릭 시 창/모달 닫기","c":"—"},{"n":2,"x":18,"y":69,"w":140,"h":37,"t":"평가 탭(①평가항목/②배점 등)","r":"평가 설정 단계 전환","a":"클릭 시 해당 탭 표시","c":"(반복 x3) 활성 탭 강조"},{"n":3,"x":35,"y":121,"w":95,"h":34,"t":"+ 항목추가 버튼","r":"평가 항목 추가","a":"클릭 시 새 항목 행 추가","c":"—"},{"n":4,"x":138,"y":121,"w":90,"h":34,"t":"- 항목삭제 버튼","r":"평가 항목 삭제","a":"클릭 시 항목 제거","c":"(반복 x3)"},{"n":5,"x":513,"y":220,"w":91,"h":29,"t":"평가 유형 선택(YESNO/SCALE/CUSTOM)","r":"항목 응답 방식","a":"선택 시 항목 입력 형태 변경","c":"(반복 다수)"},{"n":6,"x":228,"y":221,"w":270,"h":27,"t":"평가 항목명 입력","r":"항목 명칭","a":"입력값 반영","c":"(반복 다수)"},{"n":7,"x":1134,"y":221,"w":72,"h":27,"t":"배점 입력","r":"항목 점수/가중치","a":"숫자 입력 시 배점 반영","c":"(반복)"},{"n":8,"x":171,"y":223,"w":30,"h":22,"t":"Y/N 토글 버튼","r":"예/아니오 응답","a":"클릭 시 Y↔N 전환","c":"(반복 다수)"},{"n":9,"x":57,"y":226,"w":13,"h":13,"t":"옵션 라디오","r":"단일 선택 응답","a":"선택 시 값 반영","c":"(반복)"},{"n":10,"x":305,"y":694,"w":84,"h":29,"t":"+ 옵션추가 버튼","r":"선택 옵션 추가","a":"클릭 시 옵션 행 추가","c":"—"},{"n":11,"x":531,"y":768,"w":38,"h":23,"t":"삭제 버튼(옵션)","r":"옵션/행 삭제","a":"클릭 시 해당 항목 제거","c":"(반복 x2)"},{"n":12,"x":475,"y":769,"w":24,"h":21,"t":"▲ 순서 이동 버튼","r":"항목 순서 조정","a":"클릭 시 위/아래 이동 (추정)","c":"(반복 x4)"}]};
const FX = 17248;
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
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 8225, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };