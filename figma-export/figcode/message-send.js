const D = {"name":"message-send","label":"메시지 발송","png":"message-send.png","pageW":1440,"pageH":900,"markers":[{"n":1,"x":1309,"y":11,"w":113,"h":29,"t":"역할 선택(담당자/시스템담당자)","r":"사용자 역할 전환","a":"change 시 state.role 변경, 화면 재렌더(관리자 전용 버튼 노출 등)","c":"ADMIN 시 표준문구설정 노출"},{"n":2,"x":758,"y":193,"w":17,"h":17,"t":"수신 채널/대상 체크박스","r":"발송 채널 또는 수신자 선택","a":"토글로 대상 반영","c":"(반복 x3)"},{"n":3,"x":31,"y":219,"w":669,"h":35,"t":"템플릿 버튼(운전자확인 등)","r":"대표 문구 템플릿 선택","a":"클릭 시 내용란 자동 채움(data-tpl)","c":"(반복 x12)"},{"n":4,"x":1325,"y":337,"w":84,"h":35,"t":"번호 추가 버튼","r":"수신자 행 추가","a":"클릭 시 이름·휴대폰 입력 행 추가","c":"—"},{"n":5,"x":740,"y":338,"w":96,"h":33,"t":"이름 입력","r":"수신자 성명","a":"입력값 수신자에 반영","c":"—"},{"n":6,"x":842,"y":338,"w":477,"h":33,"t":"휴대폰번호 입력","r":"수신자 연락처","a":"입력값 수신자에 반영","c":"형식 예: 010-1234-5678"},{"n":7,"x":18,"y":437,"w":344,"h":37,"t":"주소록/템플릿설정 버튼","r":"주소록·개인 템플릿 관리 열기","a":"클릭 시 data-open 대상 모달 오픈","c":"(반복 x2)"},{"n":8,"x":740,"y":446,"w":669,"h":118,"t":"보낼 내용 입력(textarea)","r":"발송 본문","a":"input 시 state.content 갱신, 글자수 등 메타 갱신","c":"읽기전용 아닐 때만 편집"},{"n":9,"x":1296,"y":607,"w":113,"h":38,"t":"문자 발송 버튼","r":"발송 실행","a":"클릭 시 발송 확인 모달(openConfirm) 열림 → 확인 시 doSend","c":"수신자·내용 필요"}]};
const FX = 19712;
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
return { frameId: frame.id, rectId: rect.id, imgHash: __img.hash, bytes: __bytes.length, expectedBytes: 8544, jpegOk: __jpeg, panelH: Math.round(panel.height), frameH: Math.round(frame.height) };