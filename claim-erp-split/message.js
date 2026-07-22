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

// ② LMS 템플릿 — 표준문구(시스템) + 자유문구 + 개인문구(직원). 선택 시 본문 수정 가능.
const LMS_TEMPLATES = [
  { id: "L0", kind: "자유문구", title: "자유문구 (직접 작성)", content: "", owner: "*" },
  { id: "L1", kind: "표준문구", title: "대물입고안내(소유)",
    content: "[SK렌터카] #{고객명}님, 차량(#{차량번호})이 #{정비업체명}에 입고되었습니다.\n수리 진행 후 안내드리겠습니다. 담당 #{담당자명} #{담당자연락처}", owner: null },
  { id: "L2", kind: "표준문구", title: "대물입고안내(피보)",
    content: "[SK렌터카] #{고객명}님, 피보험차량(#{차량번호}) 입고 안내입니다. #{정비업체명}에서 수리 진행 예정입니다.\n담당 #{담당자명} #{담당자연락처}", owner: null },
  { id: "L3", kind: "표준문구", title: "사업자등록여부",
    content: "[SK렌터카] #{고객명}님, 부가세 환급 처리를 위해 사업자등록 여부 확인이 필요합니다. 회신 부탁드립니다.\n담당 #{담당자명}", owner: null },
  { id: "L4", kind: "표준문구", title: "렌트모바일시스템 설치안내",
    content: "[SK렌터카] #{고객명}님, 렌트 이용을 위한 모바일시스템 설치 안내입니다. 안내 링크에서 설치를 완료해 주세요.\n담당 #{담당자명} #{담당자연락처}", owner: null },
  { id: "P1", kind: "개인문구", title: "[내문구] 재통화 요청",
    content: "#{고객명}님, SK렌터카 #{담당자명}입니다. 사고 관련 확인차 연락드렸습니다. 편하신 시간에 회신 부탁드립니다. (#{담당자연락처})", owner: "*" },
  { id: "P2", kind: "개인문구", title: "[내문구] 렌트 안내",
    content: "#{고객명}님, 대차(렌트) 관련 안내드립니다. 궁금하신 점은 편히 연락 주세요.\n#{담당자명} #{담당자연락처}", owner: "*" },
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
  // 지급처(정비·부품·렌트) — 데모 연락처
  rows.push({ id: "c" + rows.length, gubun: "지급처", type: "정비업체", name: ctx.repairShop || "정비업체", phone: "010-3312-8842", checked: false });
  rows.push({ id: "c" + rows.length, gubun: "지급처", type: "부품업체", name: "성일모터스 부품", phone: "010-4451-7789", checked: false });
  rows.push({ id: "c" + rows.length, gubun: "지급처", type: "렌트업체", name: "SK렌터카 지점", phone: "010-1600-2201", checked: false });
  return rows;
}

/* ---------- 파생 계산 ---------- */
function repTplList() { return REP_TEMPLATES; }
function lmsTplList() { return LMS_TEMPLATES.filter(t => t.owner === null || t.owner === "*" || t.owner === ME_NAME); }
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
    const t = ch === "ALIMTALK" ? REP_TEMPLATES.find(x => x.id === id) : LMS_TEMPLATES.find(x => x.id === id);
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
    const map = { addr: "주소록", tpl: "템플릿설정", std: "표준문구설정" };
    toast(`'${map[b.dataset.open]}' 화면은 준비 중입니다. (별도 화면 제공 예정)`);
  }));

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.addEventListener("click", openConfirm);
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

document.addEventListener("DOMContentLoaded", render);
