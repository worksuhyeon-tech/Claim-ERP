const D = {"name":"approval-list","label":"결재 LIST","png":"approval-list.png","pageW":1440,"pageH":1103,"markers":[{"n":1,"x":909,"y":10,"w":140,"h":36,"t":"대차/탑승 신청 버튼","r":"렌트·탑승 신청","a":"클릭 시 신청 모달 열림(공통)","c":"—"},{"n":2,"x":1284,"y":194,"w":44,"h":42,"t":"검색 버튼","r":"결재 목록 재조회","a":"클릭 시 renderClosingView 재렌더","c":"—"},{"n":3,"x":1336,"y":194,"w":57,"h":42,"t":"초기화 버튼","r":"결재 검색 조건 초기화","a":"클릭 시 유형·상태·기간·검색어 초기화 후 재렌더","c":"—"},{"n":4,"x":305,"y":200,"w":107,"h":35,"t":"결재 유형 선택","r":"추산/지급(종결)/면책종결/추가지급/업체관리 필터","a":"change 시 apprType 반영, 재렌더","c":"—"},{"n":5,"x":430,"y":200,"w":98,"h":35,"t":"결재 상태 선택","r":"상신중/결재완료/반려/상신취소 필터","a":"change 시 apprStatus 반영, 재렌더","c":"—"},{"n":6,"x":546,"y":200,"w":143,"h":35,"t":"조회 시작일","r":"결재 기간 하한","a":"change 시 apprFrom 반영, 재렌더","c":"—"},{"n":7,"x":717,"y":200,"w":143,"h":35,"t":"조회 종료일","r":"결재 기간 상한","a":"change 시 apprTo 반영, 재렌더","c":"—"},{"n":8,"x":47,"y":202,"w":240,"h":33,"t":"담당자/사고번호 검색 입력","r":"담당자명·사고번호 like 검색","a":"input 시 apprQuery 실시간 필터","c":"—"},{"n":9,"x":28,"y":266,"w":219,"h":86,"t":"결재 유형 요약 카드","r":"유형별 건수 표시 + 필터","a":"클릭 시 apprType=카드 key 로 필터","c":"(반복 x6) 활성 카드 강조"},{"n":10,"x":43,"y":471,"w":15,"h":15,"t":"결재 행 선택 체크박스","r":"일괄 결재 대상 선택","a":"토글 시 대상 선택 (추정)","c":"(반복)"}]};
const FX = 9856;
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
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 8479, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };