"use strict";
/* ============================================================================
   메시지 발송 (새 창) — 알림톡 / 문자(LMS)
   · 팝업(모달)이 아니라 별도 창으로 열리며, 여는 화면(intake.js)이 localStorage에
     넘겨준 사고건 컨텍스트(msgSendContext)를 읽어 렌더한다.
   · 왼쪽: (상단) 대표 템플릿=알림톡·SK 대표번호 / (하단) LMS 템플릿=표준문구+개인문구
   · 오른쪽: 수신자(피보험자·계약자·통보자·운전자·지급처·자유번호) 선택 + 발송내용
   · 5·60대 시니어도 쓰기 쉽게 큰 글씨·큰 버튼·단계 번호로 구성.
   ※ 정적 데모: 실제 발송 대신 Mock 처리(성공/실패), 백엔드 연동 없음.
   ========================================================================== */

const MSG_CTX_KEY = "msgSendContext";

// 공식 알림톡 발신(공용) / 담당자 업무용 발신번호 화이트리스트
const ALIMTALK_SENDER = { label: "SK 대표번호(알림톡)", no: "1533-0999" };
const SENDER_REGISTRY = {
  "최도윤": "010-4412-8890", "박지현": "010-5567-1123", "김하늘": "010-2245-7781",
  "오세린": "010-3391-2201", "문태호": "010-8834-5560", "유나래": "010-9911-3345",
  "정예린": "010-7782-4410", "한도경": "010-3320-9987", "서지우": "010-6642-1180",
};

// ① 대표 템플릿 — 알림톡(시스템관리자 설정, 본문 수정 불가)
const REP_TEMPLATES = [
  { id: "R1", cat: "사고처리진행안내", title: "(중간메뉴형)애니카 안심파트너 접속안내",
    content: "[SK렌터카] #{고객명}님, 사고접수(#{사고접수번호}) 처리 진행 안내입니다.\n안심파트너에서 진행상황을 확인하실 수 있습니다.\n담당 #{담당자명}", code: "SKR_PARTNER_LINK_01" },
  { id: "R2", cat: "과실결정안내", title: "사고과실안내",
    content: "[SK렌터카] #{고객명}님, 사고건(#{사고접수번호}) 과실 결정 결과를 안내드립니다.\n문의: #{담당자명} #{담당자연락처}", code: "SKR_FAULT_NOTICE_01" },
  { id: "R3", cat: "간접손해지급안내", title: "간접손해 지급 기준 안내 및 지급요청",
    content: "[SK렌터카] #{고객명}님, 간접손해 지급 기준 안내 및 지급요청 관련 안내입니다.\n담당 #{담당자명} #{담당자연락처}", code: "SKR_INDIRECT_PAY_01" },
  { id: "R4", cat: "가족관계서류", title: "가족관계확인서류 제출 안내",
    content: "[SK렌터카] #{고객명}님, 사고건(#{사고접수번호}) 처리를 위해 가족관계확인서류 제출이 필요합니다.\n담당 #{담당자명}", code: "SKR_FAMILY_DOC_01" },
  { id: "R5", cat: "간접손해지급안내", title: "간접손해기준안내 및 지급요청(화물)",
    content: "[SK렌터카] #{고객명}님, 화물 간접손해 기준 안내 및 지급요청 안내입니다.\n담당 #{담당자명} #{담당자연락처}", code: "SKR_INDIRECT_CARGO_01" },
];

// ② LMS 템플릿 = 자유문구(가상) + 표준문구(시스템·표준문구설정에서 관리) + 개인문구(직원·템플릿설정에서 관리)
//    실제 데이터는 localStorage 저장소(loadStd/loadPtpl)에서 가져오며, 아래는 최초 시드값이다.
const FREE_TPL = { id: "FREE", kind: "자유문구", title: "자유문구 (직접 작성)", content: "" };
// 표준문구 시드 — 이미지1 컬럼 구조(순번/등록일시/인물구분/이벤트키/상담유형/송신내용/메시지유형/제목/문구/등록자)
const STD_SEED = [
  { id: "S1", seq: 1, regAt: "2026-04-30 09:16", person: "대물", eventKey: "대물입고안내", consultType: "입고지원", sendType: "입고안내", msgType: "物입고안내", title: "대물입고안내(소유)", regBy: "김수현",
    content: "[SK렌터카] #{고객명}님, 차량(#{차량번호})이 #{정비업체명}에 입고되었습니다.\n수리 진행 후 안내드리겠습니다. 담당 #{담당자명} #{담당자연락처}" },
  { id: "S2", seq: 2, regAt: "2026-05-07 18:21", person: "대물", eventKey: "대물입고안내", consultType: "입고지원", sendType: "입고안내", msgType: "物입고안내", title: "대물입고안내(피보)", regBy: "이혜숙",
    content: "[SK렌터카] #{고객명}님, 피보험차량(#{차량번호}) 입고 안내입니다. #{정비업체명}에서 수리 진행 예정입니다.\n담당 #{담당자명} #{담당자연락처}" },
  { id: "S3", seq: 3, regAt: "2023-09-13 09:27", person: "대물", eventKey: "서류요청", consultType: "서류안내", sendType: "서류요청", msgType: "기타", title: "사업자등록여부", regBy: "김동훈",
    content: "[SK렌터카] #{고객명}님, 부가세 환급 처리를 위해 사업자등록 여부 확인이 필요합니다. 회신 부탁드립니다.\n담당 #{담당자명}" },
  { id: "S4", seq: 4, regAt: "2026-03-02 11:02", person: "대물", eventKey: "렌트안내", consultType: "렌트지원", sendType: "설치안내", msgType: "기타", title: "렌트모바일시스템 설치안내", regBy: "오세린",
    content: "[SK렌터카] #{고객명}님, 렌트 이용을 위한 모바일시스템 설치 안내입니다. 안내 링크에서 설치를 완료해 주세요.\n담당 #{담당자명} #{담당자연락처}" },
];
// 개인문구 시드 — 순번(slot 1~9)=단축키. Alt+숫자로 즉시 세팅
const PTPL_SEED = [
  { slot: 1, title: "재통화 요청", content: "#{고객명}님, SK렌터카 #{담당자명}입니다. 사고 관련 확인차 연락드렸습니다. 편하신 시간에 회신 부탁드립니다. (#{담당자연락처})" },
  { slot: 2, title: "렌트 안내", content: "#{고객명}님, 대차(렌트) 관련 안내드립니다. 궁금하신 점은 편히 연락 주세요.\n#{담당자명} #{담당자연락처}" },
];

/* ---------- 헬퍼 ---------- */
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m])); }
function byteLen(s) { let b = 0; for (const ch of String(s || "")) b += ch.charCodeAt(0) > 127 ? 2 : 1; return b; }
function normPhone(raw) {
  const n = String(raw || "").replace(/[^0-9]/g, "");
  if (!/^01[016789]\d{7,8}$/.test(n)) return null;
  return n.length === 10 ? `${n.slice(0,3)}-${n.slice(3,6)}-${n.slice(6)}` : `${n.slice(0,3)}-${n.slice(3,7)}-${n.slice(7)}`;
}
function varsIn(text) { const out = []; String(text || "").replace(/#\{([^}]+)\}/g, (m, n) => { n = n.trim(); if (!out.includes(n)) out.push(n); return m; }); return out; }
function applyVars(text, vals) { return String(text || "").replace(/#\{([^}]+)\}/g, (m, n) => { const v = vals[n.trim()]; return (v !== undefined && String(v) !== "") ? v : m; }); }

let TOAST_T = null;
function toast(msg) {
  const el = document.getElementById("toast"); if (!el) return;
  el.textContent = msg; el.classList.add("show");
  clearTimeout(TOAST_T); TOAST_T = setTimeout(() => el.classList.remove("show"), 2600);
}

/* ---------- 컨텍스트 로드 ---------- */
function loadCtx() {
  let ctx = null;
  try { ctx = JSON.parse(localStorage.getItem(MSG_CTX_KEY) || "null"); } catch (e) { ctx = null; }
  if (!ctx) ctx = { claimId: "-", custName: "", carNo: "", accidentDate: "", managerName: "담당자", repairShop: "", inDate: "", outDate: "", estimate: "", parties: {} };
  return ctx;
}

const CTX = loadCtx();
const ME_NAME = CTX.managerName || "담당자";
const ME_MOBILE = SENDER_REGISTRY[ME_NAME] || null;
const VARS = {
  "고객명": CTX.custName || "",
  "차량번호": CTX.carNo || "",
  "사고접수번호": CTX.claimId || "",
  "사고일자": CTX.accidentDate || "",
  "담당자명": ME_NAME,
  "담당자연락처": ME_MOBILE || "",
  "정비업체명": CTX.repairShop || "",
  "입고일": CTX.inDate || "",
  "예상수리완료일": CTX.outDate || "",
  "금액": CTX.estimate || "",
};
const VAR_KEYS = Object.keys(VARS);   // 변수 카탈로그(표준문구설정의 문구변수 선택용)

/* ---------- localStorage 저장소 (표준문구 · 주소록 · 개인 템플릿) ---------- */
const STD_KEY = "msgStdTemplates";           // 표준문구(전사 공용)
const ADDR_KEY = "msgAddr_" + ME_NAME;       // 주소록(직원별 지급처 연락처)
const PTPL_KEY = "msgPtpl_" + ME_NAME;       // 개인 템플릿(직원별, 순번=단축키)
// 주소록 시드 — 이미지2(지급처 정비/부품/렌트)
const ADDR_SEED = [
  { id: "a1", gubun: "지급처", type: "정비업체", name: CTX.repairShop || "정비업체", phone: "010-3312-8842" },
  { id: "a2", gubun: "지급처", type: "부품업체", name: "성일모터스 부품", phone: "010-4451-7789" },
  { id: "a3", gubun: "지급처", type: "렌트업체", name: "SK렌터카 지점", phone: "010-1600-2201" },
];
function lsGet(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return (v && Array.isArray(v)) ? v : fallback; } catch (e) { return fallback; } }
function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
function loadStd() { return lsGet(STD_KEY, STD_SEED.map(x => Object.assign({}, x))); }
function saveStd(list) { lsSet(STD_KEY, list); }
function loadAddr() { return lsGet(ADDR_KEY, ADDR_SEED.map(x => Object.assign({}, x))); }
function saveAddr(list) { lsSet(ADDR_KEY, list); }
function loadPtpl() { return lsGet(PTPL_KEY, PTPL_SEED.map(x => Object.assign({}, x))); }
function savePtpl(list) { lsSet(PTPL_KEY, list); }

/* ---------- 상태 ---------- */
const state = {
  role: "STAFF",              // STAFF | ADMIN — 시스템담당자면 표준문구설정 노출
  channel: null,             // 'ALIMTALK' | 'LMS'
  tplId: null,
  content: "",
  contacts: buildContacts(CTX),
};

function buildContacts(ctx) {
  const P = ctx.parties || {};
  const rows = [];
  const add = (gubun, type, o) => {
    const name = (o && o.name) || ""; const phone = (o && o.phone) || "";
    if (!name && !phone) return;
    rows.push({ id: "c" + rows.length, gubun, type, name, phone, checked: false });
  };
  add("고객", "피보험자", P.insured);
  add("고객", "계약자", P.owner);
  add("고객", "통보자", P.notifier);
  add("고객", "운전자", P.driver);
  // 지급처 — 주소록(나의 연락처설정)에서 관리
  loadAddr().forEach((a, i) => rows.push({ id: "p" + i, gubun: a.gubun || "지급처", type: a.type || "", name: a.name || "", phone: a.phone || "", checked: false }));
  return rows;
}

/* ---------- 파생 계산 ---------- */
function repTplList() { return REP_TEMPLATES; }
// 표준문구/개인문구를 발송화면 좌측 하단 목록용 균일 레코드로 변환
function stdRows() { return loadStd().map(t => ({ id: t.id, kind: "표준문구", title: t.title, content: t.content })); }
function ptplRows() {
  return loadPtpl().slice().sort((a, b) => a.slot - b.slot).map(p => ({
    id: "P" + p.slot, kind: "개인문구", slot: p.slot,
    title: `[${p.slot}] ` + ((p.title || (p.content || "").split("\n")[0] || ("개인문구 " + p.slot)).slice(0, 18)),
    content: p.content || "",
  }));
}
function lmsTplList() { return [{ id: FREE_TPL.id, kind: "자유문구", title: FREE_TPL.title, content: "" }].concat(stdRows(), ptplRows()); }
function findLmsTpl(id) { return lmsTplList().find(t => t.id === id) || null; }
function selectedContacts() { return state.contacts.filter(c => c.checked && normPhone(c.phone)); }

function computed() {
  const applied = applyVars(state.content, VARS);
  const unresolved = varsIn(applied);
  const isAlim = state.channel === "ALIMTALK";
  let type, used, max, unit;
  if (isAlim) { type = "알림톡"; unit = "자"; used = Array.from(applied).length; max = 1000; }
  else { const b = byteLen(applied); type = b <= 90 ? "SMS" : "LMS"; unit = "byte"; used = b; max = (type === "SMS") ? 90 : 2000; }
  const over = used > max;
  const senderNo = isAlim ? ALIMTALK_SENDER.no : ME_MOBILE;
  const senderOk = isAlim ? true : !!ME_MOBILE;
  const recipOk = selectedContacts().length >= 1;
  const contentOk = applied.trim().length > 0;
  const canSend = !!state.channel && senderOk && recipOk && contentOk && unresolved.length === 0 && !over;
  return { applied, unresolved, type, used, max, unit, over, senderNo, senderOk, recipOk, contentOk, canSend };
}

/* ---------- 렌더 ---------- */
function render() {
  const c = computed();
  const app = document.getElementById("app");
  app.innerHTML = headerHtml() + noticeHtml() +
    `<div class="wrap">
       <div class="col">${leftTopCard()}${leftBtns()}${leftBottomCard()}</div>
       <div class="col">${rightCard(c)}</div>
     </div>`;
  bind();
}

function headerHtml() {
  return `<div class="hd">
    <span class="t">메시지 발송</span>
    <span class="meta">사고번호 <b>${esc(CTX.claimId)}</b>${CTX.custName ? ` · 고객 <b>${esc(CTX.custName)}</b>` : ""}${CTX.carNo ? ` · ${esc(CTX.carNo)}` : ""}</span>
    <span class="sp"></span>
    <span class="role">권한(데모)
      <select id="roleSel">
        <option value="STAFF" ${state.role === "STAFF" ? "selected" : ""}>담당자(직원)</option>
        <option value="ADMIN" ${state.role === "ADMIN" ? "selected" : ""}>시스템담당자</option>
      </select>
    </span>
  </div>`;
}
function noticeHtml() {
  return `<div class="notice">고객 연락처를 <b>반드시 확인한 뒤</b> 발송하세요. 실제 연락처와 다르면 고객 정보를 먼저 수정해 주세요.</div>`;
}

function leftTopCard() {
  const rows = repTplList().map(t => tplRow("ALIMTALK", t.id, t.cat, t.title, "at")).join("");
  return `<div class="card">
    <div class="card-h"><span class="no">1</span><span class="ti">대표 템플릿</span><span class="hint">알림톡 · SK 대표번호로 발송</span></div>
    <div class="card-b">
      <div class="sender-note">이 목록은 시스템담당자가 등록한 <b>승인 알림톡</b>입니다. <b>${esc(ALIMTALK_SENDER.no)}</b>(SK 대표번호)로 발송되며 <b>내용은 수정할 수 없습니다.</b></div>
      <div class="tpl-list">${rows || `<div class="empty">등록된 대표 템플릿이 없습니다.</div>`}</div>
    </div>
  </div>`;
}
function leftBottomCard() {
  const rows = lmsTplList().map(t => {
    const cls = t.kind === "자유문구" ? "free" : "lms";
    return tplRow("LMS", t.id, t.kind, t.title, cls);
  }).join("");
  return `<div class="card">
    <div class="card-h"><span class="no">2</span><span class="ti">문자(LMS) 템플릿</span><span class="hint">표준문구 + 내 문구 · 내용 수정 가능</span></div>
    <div class="card-b">
      <div class="sender-note">문자(LMS)는 <b>${esc(ME_MOBILE || "내 번호 미등록")}</b>${ME_MOBILE ? ` (${esc(ME_NAME)} 담당자 번호)` : ""}로 발송됩니다. 선택 후 <b>내용을 수정</b>할 수 있습니다.${ME_MOBILE ? "" : ` <span class="miss">발신번호가 없어 문자 발송이 제한됩니다.</span>`}</div>
      <div class="tpl-list">${rows || `<div class="empty">템플릿이 없습니다.</div>`}</div>
    </div>
  </div>`;
}
function tplRow(channel, id, cat, title, catCls) {
  const on = (state.channel === channel && state.tplId === id) ? " on" : "";
  return `<button type="button" class="tpl${on}" data-ch="${channel}" data-tpl="${esc(id)}">
    <span class="cat ${catCls}">${esc(cat)}</span>
    <span class="body"><span class="tt">${esc(title)}</span></span>
  </button>`;
}

function leftBtns() {
  const admin = state.role === "ADMIN" ? `<button type="button" class="lbtn admin" data-open="std">표준문구설정</button>` : "";
  return `<div class="lbtns">
    <button type="button" class="lbtn" data-open="addr">주소록</button>
    <button type="button" class="lbtn" data-open="tpl">템플릿설정</button>
    ${admin}
  </div>`;
}

function rightCard(c) {
  const head = `<div class="rc-head"><span></span><span>구분</span><span>고객명</span><span>연락처</span></div>`;
  const list = state.contacts.map(rcRow).join("") || `<div class="empty">등록된 연락처가 없습니다.</div>`;
  const manual = `<div class="rc-manual">
      <input class="mn" id="mName" type="text" placeholder="이름" />
      <input class="mp" id="mPhone" type="text" inputmode="numeric" placeholder="휴대폰번호 (예: 010-1234-5678)" />
      <button type="button" class="add" id="mAdd">번호 추가</button>
    </div>`;

  const chLabel = state.channel === "ALIMTALK" ? "알림톡" : state.channel === "LMS" ? "문자(LMS)" : "";
  const sendLabel = state.channel === "ALIMTALK" ? "알림톡 발송" : "문자 발송";
  const locked = state.channel === "ALIMTALK";
  const metaTag = state.channel
    ? `<span class="tag ${c.type === "SMS" ? "sms" : c.type === "LMS" ? "lms" : "at"}">${c.type}</span>
       <span class="len ${c.over ? "over" : ""}">${c.used}/${c.max}${c.unit}</span>
       ${c.unresolved.length ? `<span class="miss">빈 항목: ${c.unresolved.map(v => "#{" + esc(v) + "}").join(", ")}</span>` : ""}`
    : `<span class="len">왼쪽에서 템플릿을 먼저 선택하세요.</span>`;

  return `<div class="card">
    <div class="card-h"><span class="no">3</span><span class="ti">받는 사람</span><span class="hint">보낼 사람을 선택하세요 (여러 명 가능)</span></div>
    <div class="card-b">
      ${head}
      <div class="rc-list">${list}</div>
      ${manual}
    </div>
  </div>
  <div class="card">
    <div class="card-h"><span class="no">4</span><span class="ti">발송 내용</span>${chLabel ? `<span class="hint">${esc(chLabel)}${c.senderNo ? " · 발신 " + esc(c.senderNo) : ""}</span>` : ""}</div>
    <div class="card-b">
      <textarea class="content-ta" id="contentTa" ${locked ? "readonly" : ""} placeholder="${locked ? "알림톡은 승인 템플릿 내용으로 발송되어 수정할 수 없습니다." : "보낼 내용을 입력하세요. 위 템플릿을 선택하면 자동으로 채워집니다."}">${esc(state.content)}</textarea>
      <div class="content-meta">${metaTag}</div>
      ${locked ? `<div class="sender-note" style="margin-top:10px">알림톡은 사전 승인된 템플릿만 발송할 수 있어 내용을 바꿀 수 없습니다.</div>` : ""}
      <div class="send-row">
        <span class="len">${c.recipOk ? selectedContacts().length + "명 선택됨" : "받는 사람을 1명 이상 선택하세요."}</span>
        <span class="sp"></span>
        <button type="button" class="send-btn" id="sendBtn" ${c.canSend ? "" : "disabled"}>${esc(sendLabel)}</button>
      </div>
    </div>
  </div>`;
}
function rcRow(c) {
  const valid = !!normPhone(c.phone);
  const on = c.checked && valid ? " on" : "";
  const bad = !valid ? " bad" : "";
  return `<label class="rc${on}${bad}">
    <input type="checkbox" data-rc="${esc(c.id)}" ${c.checked ? "checked" : ""} ${valid ? "" : "disabled"} />
    <span class="gb">${esc(c.gubun)}<br><span style="font-weight:600;color:#6B7382">${esc(c.type)}</span></span>
    <span class="nm">${esc(c.name || "-")}</span>
    <span class="ph">${valid ? esc(c.phone) : `<span class="bad-t">번호 형식 오류</span> ${esc(c.phone)}`}</span>
  </label>`;
}

/* ---------- 이벤트 ---------- */
function bind() {
  const app = document.getElementById("app");
  const roleSel = document.getElementById("roleSel");
  if (roleSel) roleSel.addEventListener("change", () => { state.role = roleSel.value; render(); });

  app.querySelectorAll("[data-tpl]").forEach(b => b.addEventListener("click", () => {
    const ch = b.dataset.ch, id = b.dataset.tpl;
    const t = ch === "ALIMTALK" ? REP_TEMPLATES.find(x => x.id === id) : findLmsTpl(id);
    if (!t) return;
    if (ch === "LMS" && !ME_MOBILE) { toast("발신번호(내 번호)가 등록되어 있지 않아 문자를 보낼 수 없습니다."); return; }
    state.channel = ch; state.tplId = id;
    state.content = ch === "ALIMTALK" ? applyVars(t.content, VARS) : applyVars(t.content, VARS);
    render();
  }));

  app.querySelectorAll("[data-rc]").forEach(cb => cb.addEventListener("change", () => {
    const c = state.contacts.find(x => x.id === cb.dataset.rc); if (c) c.checked = cb.checked;
    render();
  }));

  const mAdd = document.getElementById("mAdd");
  if (mAdd) mAdd.addEventListener("click", () => {
    const name = (document.getElementById("mName").value || "").trim();
    const phoneRaw = (document.getElementById("mPhone").value || "").trim();
    const norm = normPhone(phoneRaw);
    if (!phoneRaw) { toast("휴대폰번호를 입력하세요."); return; }
    if (!norm) { toast("휴대폰 번호 형식이 올바르지 않습니다. (예: 010-1234-5678)"); return; }
    if (state.contacts.some(x => normPhone(x.phone) === norm)) { toast("이미 추가된 번호입니다."); return; }
    state.contacts.push({ id: "c" + (state.contacts.length + Math.random()).toString(36).slice(2, 7), gubun: "자유번호", type: "직접입력", name: name || "직접입력", phone: norm, checked: true });
    render();
  });

  const ta = document.getElementById("contentTa");
  if (ta && !ta.readOnly) ta.addEventListener("input", () => { state.content = ta.value; refreshMeta(); });

  app.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.open === "addr") openAddressBook();
    else if (b.dataset.open === "tpl") openTplSettings();
    else if (b.dataset.open === "std") openStdSettings();
  }));

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.addEventListener("click", openConfirm);
  bindShortcuts();
}

/* ---------- 단축키 Alt+1~9 → 개인 템플릿 즉시 세팅 ---------- */
function bindShortcuts() {
  if (window.__msgKeyBound) return;
  window.__msgKeyBound = true;
  document.addEventListener("keydown", e => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    if (!/^[1-9]$/.test(e.key)) return;
    if (document.getElementById("setOv").classList.contains("open")) return;   // 설정창 열림 시 무시
    e.preventDefault();
    const slot = +e.key;
    const t = loadPtpl().find(p => p.slot === slot);
    if (!t || !(t.content || "").trim()) { toast(`단축키 ${slot}: 등록된 개인 템플릿이 없습니다.`); return; }
    if (!ME_MOBILE) { toast("발신번호(내 번호) 미등록으로 문자 발송이 제한됩니다."); return; }
    state.channel = "LMS"; state.tplId = "P" + slot; state.content = applyVars(t.content, VARS);
    render();
    toast(`단축키 ${slot}: ${(t.title || "개인문구")} 불러옴`);
  });
}

// 발송내용 편집 시 재렌더 없이 하단 표시만 갱신(입력 포커스 유지)
function refreshMeta() {
  const c = computed();
  const meta = document.querySelector(".content-meta");
  if (meta) meta.innerHTML = state.channel
    ? `<span class="tag ${c.type === "SMS" ? "sms" : c.type === "LMS" ? "lms" : "at"}">${c.type}</span>`
      + `<span class="len ${c.over ? "over" : ""}">${c.used}/${c.max}${c.unit}</span>`
      + (c.unresolved.length ? `<span class="miss">빈 항목: ${c.unresolved.map(v => "#{" + esc(v) + "}").join(", ")}</span>` : "")
    : `<span class="len">왼쪽에서 템플릿을 먼저 선택하세요.</span>`;
  const sb = document.getElementById("sendBtn"); if (sb) sb.disabled = !c.canSend;
}

/* ---------- 확인 · 발송(Mock) ---------- */
function openConfirm() {
  const c = computed();
  const recips = selectedContacts();
  if (!recips.length) { toast("받는 사람을 1명 이상 선택하세요."); return; }
  const names = recips.map(r => `${r.name || r.type}(${r.phone})`).join(", ");
  const dlg = document.getElementById("confirmDlg");
  dlg.innerHTML = `
    <div class="dlg-h">발송 확인</div>
    <div class="dlg-b">
      <div class="big">받는 사람 <b>${recips.length}명</b>에게 <b>${state.channel === "ALIMTALK" ? "알림톡" : "문자(" + c.type + ")"}</b>로 발송합니다.</div>
      <div style="font-size:15px;color:#4A5262">발신번호 <b>${esc(c.senderNo)}</b> · ${esc(names)}</div>
      <div class="dlg-pv">${esc(c.applied)}</div>
      <div class="dlg-note">데모 화면으로 실제 발송되지 않으며, 받는 사람별로 성공/실패 결과가 임의 생성됩니다.</div>
    </div>
    <div class="dlg-f">
      <button type="button" class="dlg-btn" id="cCancel">취소</button>
      <button type="button" class="dlg-btn primary" id="cGo">발송하기</button>
    </div>`;
  document.getElementById("confirmOv").classList.add("open");
  document.getElementById("cCancel").addEventListener("click", closeConfirm);
  document.getElementById("cGo").addEventListener("click", doSend);
}
function closeConfirm() { document.getElementById("confirmOv").classList.remove("open"); }

function doSend() {
  const c = computed();
  const recips = selectedContacts();
  let success = 0, fail = 0;
  recips.forEach(() => { if (Math.random() < 0.9) success++; else fail++; });
  closeConfirm();
  toast(`${recips.length}명 발송 완료 — 성공 ${success} · 실패 ${fail}`);
  // 발송 후 수신자 선택 해제(중복발송 방지)
  state.contacts.forEach(x => { x.checked = false; });
  render();
}

/* ============================ 설정 모달 공통 ============================ */
function openSet(html) { const dlg = document.getElementById("setDlg"); dlg.innerHTML = html; document.getElementById("setOv").classList.add("open"); return dlg; }
function closeSet() { document.getElementById("setOv").classList.remove("open"); document.getElementById("setDlg").innerHTML = ""; }
function nowStr() { const d = new Date(); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function insertAtCaret(el, text) {
  const s = el.selectionStart != null ? el.selectionStart : el.value.length;
  const e = el.selectionEnd != null ? el.selectionEnd : el.value.length;
  el.value = el.value.slice(0, s) + text + el.value.slice(e);
  const pos = s + text.length; el.selectionStart = el.selectionEnd = pos;
}

/* ===== 모달 A: 표준문구설정 (시스템담당자 전용) — 마스터/디테일 ===== */
const STD_PERSON = ["대물", "대인", "자차", "공통"];
const STD_CONSULT = ["입고지원", "서류안내", "렌트지원", "과실안내", "지급안내", "기타"];
function openStdSettings() {
  let list = loadStd().map(x => Object.assign({}, x));
  let sel = list.length ? 0 : -1;
  const checks = new Set();
  const blankStd = () => ({ id: "S" + Date.now(), seq: list.reduce((m, x) => Math.max(m, x.seq || 0), 0) + 1, regAt: nowStr(), person: "대물", eventKey: "", consultType: "입고지원", sendType: "", msgType: "기타", title: "", content: "", regBy: ME_NAME });
  let draft = sel >= 0 ? Object.assign({}, list[sel]) : blankStd();

  function paint() {
    const rows = list.map((t, i) => `
      <div class="set-row std${i === sel ? " sel" : ""}" data-std-row="${i}">
        <span><input type="checkbox" data-std-ck="${i}" ${checks.has(i) ? "checked" : ""}></span>
        <span>${t.seq || ""}</span><span>${esc(t.regAt)}</span><span>${esc(t.person)}</span>
        <span>${esc(t.eventKey)}</span><span>${esc(t.consultType)}</span><span>${esc(t.sendType)}</span>
        <span>${esc(t.msgType)}</span><span class="l">${esc(t.title)}</span><span>${esc(t.regBy)}</span>
      </div>`).join("") || `<div class="empty">표준문구가 없습니다. [신규]로 추가하세요.</div>`;
    openSet(`
      <div class="set-h"><b>표준문구설정</b><button class="set-x" id="stdX">×</button></div>
      <div class="set-b">
        <div class="set-secth">표준문구 리스트</div>
        <div class="set-tbl">
          <div class="set-tbl-h std"><span></span><span>순번</span><span>등록일시</span><span>인물구분</span><span>이벤트키</span><span>상담유형</span><span>송신내용</span><span>메시지유형</span><span class="l">제목</span><span>등록자</span></div>
          <div class="set-tbl-b" style="max-height:190px">${rows}</div>
        </div>
        <div class="set-secth">표준문구 상세</div>
        <div class="set-detail">
          <label class="fld"><span class="k">문구제목</span><input id="dTitle" value="${esc(draft.title)}"></label>
          <label class="fld"><span class="k">이벤트키</span><input id="dEvent" value="${esc(draft.eventKey)}"></label>
          <label class="fld"><span class="k">인물구분</span><select id="dPerson">${STD_PERSON.map(o => `<option ${o === draft.person ? "selected" : ""}>${o}</option>`).join("")}</select></label>
          <label class="fld"><span class="k">상담유형</span><select id="dConsult">${STD_CONSULT.map(o => `<option ${o === draft.consultType ? "selected" : ""}>${o}</option>`).join("")}</select></label>
          <label class="fld"><span class="k">메시지유형</span><input id="dMsgType" value="${esc(draft.msgType)}"></label>
          <label class="fld"><span class="k">송신내용</span><input id="dSend" value="${esc(draft.sendType)}"></label>
          <div class="fld var"><span class="k">문구변수</span><select id="dVar">${VAR_KEYS.map(k => `<option value="${esc(k)}">#{${esc(k)}}</option>`).join("")}</select><button class="set-mini" id="dVarCopy">변수복사(문구에 삽입)</button></div>
          <label class="fld full"><span class="k">문구</span><textarea id="dContent" rows="6" placeholder="문구를 입력하세요. 변수는 #{고객명} 처럼 넣으면 발송 시 자동 치환됩니다.">${esc(draft.content)}</textarea></label>
        </div>
      </div>
      <div class="set-f">
        <button class="dlg-btn" id="stdNew">신규</button>
        <button class="dlg-btn" id="stdApply">반영</button>
        <button class="dlg-btn" id="stdDel">삭제</button>
        <span style="flex:1"></span>
        <button class="dlg-btn primary" id="stdSave">저장</button>
        <button class="dlg-btn" id="stdClose">닫기</button>
      </div>`);
    const dlg = document.getElementById("setDlg");
    document.getElementById("stdX").onclick = closeSet;
    document.getElementById("stdClose").onclick = closeSet;
    dlg.querySelectorAll("[data-std-row]").forEach(r => r.addEventListener("click", e => {
      if (e.target.matches("[data-std-ck]")) return;
      sel = +r.dataset.stdRow; draft = Object.assign({}, list[sel]); paint();
    }));
    dlg.querySelectorAll("[data-std-ck]").forEach(cb => cb.addEventListener("change", () => {
      const i = +cb.dataset.stdCk; if (cb.checked) checks.add(i); else checks.delete(i);
    }));
    const bindD = (id, key) => { const el = document.getElementById(id); if (el) el.addEventListener("input", () => draft[key] = el.value); };
    bindD("dTitle", "title"); bindD("dEvent", "eventKey"); bindD("dMsgType", "msgType"); bindD("dSend", "sendType"); bindD("dContent", "content");
    document.getElementById("dPerson").addEventListener("change", e => draft.person = e.target.value);
    document.getElementById("dConsult").addEventListener("change", e => draft.consultType = e.target.value);
    document.getElementById("dVarCopy").addEventListener("click", () => {
      const ta = document.getElementById("dContent");
      insertAtCaret(ta, "#{" + document.getElementById("dVar").value + "}");
      draft.content = ta.value; ta.focus();
    });
    document.getElementById("stdNew").onclick = () => { sel = -1; checks.clear(); draft = blankStd(); paint(); };
    document.getElementById("stdApply").onclick = () => {
      if (!(draft.title || "").trim()) { toast("문구제목을 입력하세요."); return; }
      if (sel >= 0) list[sel] = Object.assign({}, draft);
      else { list.push(Object.assign({}, draft)); sel = list.length - 1; }
      toast("상세 내용을 리스트에 반영했습니다. (저장을 눌러야 확정됩니다)"); paint();
    };
    document.getElementById("stdDel").onclick = () => {
      if (!checks.size) { toast("삭제할 행을 체크하세요."); return; }
      list = list.filter((_, i) => !checks.has(i)); checks.clear();
      sel = list.length ? 0 : -1; draft = sel >= 0 ? Object.assign({}, list[sel]) : blankStd(); paint();
    };
    document.getElementById("stdSave").onclick = () => { saveStd(list); toast("표준문구를 저장했습니다."); render(); closeSet(); };
  }
  paint();
}

/* ===== 모달 B: 주소록(나의 연락처설정) — 직원 ===== */
const ADDR_TYPES = ["정비업체", "부품업체", "렌트업체", "기타업체"];
function openAddressBook() {
  let rows = loadAddr().map(a => { const m = String(a.phone || "").split("-"); return { id: a.id || ("a" + Math.random().toString(36).slice(2, 7)), gubun: a.gubun || "지급처", type: a.type || "정비업체", name: a.name || "", p1: m[0] || "010", p2: m[1] || "", p3: m[2] || "", ck: false }; });
  function paint() {
    const body = rows.map((r, i) => `
      <div class="set-row addr">
        <span><input type="checkbox" data-ad-ck="${i}" ${r.ck ? "checked" : ""}></span>
        <span>${esc(r.gubun)}</span>
        <span><select data-ad="type|${i}">${ADDR_TYPES.map(o => `<option ${o === r.type ? "selected" : ""}>${o}</option>`).join("")}</select></span>
        <span><input data-ad="name|${i}" value="${esc(r.name)}" placeholder="성명"></span>
        <span class="phone"><input data-ad="p1|${i}" value="${esc(r.p1)}" maxlength="3"><span>-</span><input data-ad="p2|${i}" value="${esc(r.p2)}" maxlength="4"><span>-</span><input data-ad="p3|${i}" value="${esc(r.p3)}" maxlength="4"></span>
      </div>`).join("") || `<div class="empty">등록된 연락처가 없습니다. [＋ 행 추가]로 등록하세요.</div>`;
    openSet(`
      <div class="set-h"><b>나의 연락처설정 (주소록)</b><button class="set-x" id="adX">×</button></div>
      <div class="set-b">
        <div class="set-hint">자주 연락하는 지급처(정비·부품·렌트 등)를 등록하면 발송 화면의 <b>받는 사람</b>에 바로 나타납니다.</div>
        <div class="set-tbl">
          <div class="set-tbl-h addr"><span></span><span>구분</span><span>고객구분</span><span>성명</span><span>전화번호</span></div>
          <div class="set-tbl-b" style="max-height:340px">${body}</div>
        </div>
        <div class="set-rowbtns"><button class="set-mini" id="adAdd">＋ 행 추가</button><button class="set-mini" id="adDel">－ 선택 삭제</button></div>
      </div>
      <div class="set-f"><span style="flex:1"></span><button class="dlg-btn primary" id="adSave">저장</button><button class="dlg-btn" id="adClose">닫기</button></div>`);
    const dlg = document.getElementById("setDlg");
    document.getElementById("adX").onclick = closeSet; document.getElementById("adClose").onclick = closeSet;
    dlg.querySelectorAll("[data-ad]").forEach(el => el.addEventListener("input", () => { const a = el.dataset.ad.split("|"); rows[+a[1]][a[0]] = el.value; }));
    dlg.querySelectorAll("[data-ad-ck]").forEach(cb => cb.addEventListener("change", () => { rows[+cb.dataset.adCk].ck = cb.checked; }));
    document.getElementById("adAdd").onclick = () => { rows.push({ id: "a" + Math.random().toString(36).slice(2, 7), gubun: "지급처", type: "정비업체", name: "", p1: "010", p2: "", p3: "", ck: false }); paint(); };
    document.getElementById("adDel").onclick = () => { rows = rows.filter(r => !r.ck); paint(); };
    document.getElementById("adSave").onclick = () => {
      const out = []; let bad = 0;
      rows.forEach(r => {
        if (!r.name && !r.p2 && !r.p3) return;                 // 완전 빈 행은 건너뜀
        const phone = normPhone(`${r.p1}-${r.p2}-${r.p3}`);
        if (!phone) { bad++; return; }
        out.push({ id: r.id, gubun: r.gubun, type: r.type, name: r.name, phone });
      });
      saveAddr(out);
      toast(bad ? `${bad}건은 번호 형식 오류로 제외하고 저장했습니다.` : "주소록을 저장했습니다.");
      state.contacts = buildContacts(CTX); render(); closeSet();
    };
  }
  paint();
}

/* ===== 모달 C: 템플릿설정 · 단축키 관리 — 직원 ===== */
function openTplSettings() {
  let rows = loadPtpl().slice().sort((a, b) => a.slot - b.slot).map(p => ({ title: p.title || "", content: p.content || "" }));
  function paint() {
    const body = rows.map((r, i) => `
      <div class="set-row tpl">
        <span class="slot">${i + 1}</span>
        <span><input data-tp="title|${i}" value="${esc(r.title)}" placeholder="제목(선택)"></span>
        <span><textarea data-tp="content|${i}" rows="2" placeholder="내용을 입력하세요">${esc(r.content)}</textarea></span>
        <span class="ord"><button class="set-mini" data-tp-up="${i}" ${i === 0 ? "disabled" : ""}>▲</button><button class="set-mini" data-tp-dn="${i}" ${i === rows.length - 1 ? "disabled" : ""}>▼</button><button class="set-mini del" data-tp-del="${i}">×</button></span>
      </div>`).join("") || `<div class="empty">등록된 개인 템플릿이 없습니다. [＋ 행 추가]로 등록하세요.</div>`;
    openSet(`
      <div class="set-h"><b>템플릿설정 · 단축키 관리</b><button class="set-x" id="tpX">×</button></div>
      <div class="set-b">
        <div class="set-hint">순번(1~9)이 <b>단축키</b>입니다. 발송 화면에서 <b>Alt + 숫자</b>를 누르면 해당 템플릿이 발송내용에 바로 세팅됩니다.</div>
        <div class="set-tbl">
          <div class="set-tbl-h tpl"><span>순번</span><span>제목</span><span>내용</span><span>정렬</span></div>
          <div class="set-tbl-b" style="max-height:360px">${body}</div>
        </div>
        <div class="set-rowbtns"><button class="set-mini" id="tpAdd" ${rows.length >= 9 ? "disabled" : ""}>＋ 행 추가 (최대 9)</button></div>
      </div>
      <div class="set-f"><span style="flex:1"></span><button class="dlg-btn primary" id="tpOk">확인</button><button class="dlg-btn" id="tpCancel">취소</button></div>`);
    const dlg = document.getElementById("setDlg");
    document.getElementById("tpX").onclick = closeSet; document.getElementById("tpCancel").onclick = closeSet;
    dlg.querySelectorAll("[data-tp]").forEach(el => el.addEventListener("input", () => { const a = el.dataset.tp.split("|"); rows[+a[1]][a[0]] = el.value; }));
    dlg.querySelectorAll("[data-tp-up]").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.tpUp; const t = rows[i - 1]; rows[i - 1] = rows[i]; rows[i] = t; paint(); }));
    dlg.querySelectorAll("[data-tp-dn]").forEach(b => b.addEventListener("click", () => { const i = +b.dataset.tpDn; const t = rows[i + 1]; rows[i + 1] = rows[i]; rows[i] = t; paint(); }));
    dlg.querySelectorAll("[data-tp-del]").forEach(b => b.addEventListener("click", () => { rows.splice(+b.dataset.tpDel, 1); paint(); }));
    document.getElementById("tpAdd").onclick = () => { if (rows.length >= 9) { toast("최대 9개까지 등록할 수 있습니다."); return; } rows.push({ title: "", content: "" }); paint(); };
    document.getElementById("tpOk").onclick = () => {
      const out = rows.filter(r => (r.content || "").trim()).slice(0, 9).map((r, i) => ({ slot: i + 1, title: (r.title || "").trim(), content: r.content }));
      savePtpl(out); toast("개인 템플릿을 저장했습니다. (발송화면에서 Alt+숫자로 사용)"); render(); closeSet();
    };
  }
  paint();
}

document.addEventListener("DOMContentLoaded", render);
