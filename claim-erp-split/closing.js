"use strict";
const activeView = "closing";

const APPR_TYPES = ["추산", "지급(종결)", "면책종결", "추가지급", "VOC"];
const APPR_STATUS_CLASS = { "상신중": "appr-ing", "결재완료": "appr-done", "반려": "appr-reject", "상신취소": "appr-cancel" };
const APPR_TYPE_COLOR = { "추산": "#2563EB", "지급(종결)": "#15803D", "면책종결": "#7C3AED", "추가지급": "#0891B2", "VOC": "#DC2626" };
const APPR_ACT_CLASS = { "상신": "", "승인": "h-approve", "반려": "h-reject" };

// 결재 공용 기반(APPROVALS·config·시드·헬퍼)은 common.js로 이동 (공유).

// 결재 LIST 상태
let apprQuery = "";
let apprType = "전체";       // 결재종류 필터 (전체 / 5종) — 요약카드와 셀렉트 공용
let apprStatus = "전체";     // 결재상태 필터 (전체 / 상신중 / 결재완료 / 반려)
let apprFrom = "";           // 조회 시작일 (결재완료일 기준)
let apprTo = "";             // 조회 종료일
let apprSelectedId = null;   // 선택 결재건 id
let apprBound = false;       // 툴바 이벤트 1회 바인딩 플래그
let apprPwTargetId = null;   // 비밀번호 인증 대기 중인 결재건 id

// ---- 헬퍼 (전결권한 화면의 assignWon/assignStaffById 재사용) ----
function apprAmountLabel(type) {
  if (type === "추산") return "추산액";
  if (apprIsPayType(type)) return "지급액";
  if (type === "면책종결") return "면책금";
  return "청구액";
}

// ---- 검색/상태/기간 필터 (결재종류 필터 제외 — 카드 카운트 산출용) ----
function apprFilteredBase() {
  const q = apprQuery.trim().toLowerCase();
  return APPROVALS.filter(a => {
    if (q && !`${a.claimNo} ${a.requesterName}`.toLowerCase().includes(q)) return false;
    if (apprStatus !== "전체" && a.approvalStatus !== apprStatus) return false;
    if (apprFrom || apprTo) {
      const d = (a.completedAt || "").slice(0, 10);
      if (apprFrom && (!d || d < apprFrom)) return false;
      if (apprTo && (!d || d > apprTo)) return false;
    }
    return true;
  });
}

function renderClosingView() {
  if (!apprSeeded) { seedApprovals(); apprSeeded = true; }
  if (typeof loadClaimResolutionState === "function") loadClaimResolutionState();
  bindApprToolbar();
  const base = apprFilteredBase();
  renderApprSummary(base);
  renderApprList(base);
  renderApprPanel();
}

function renderApprSummary(base) {
  const sel = $("#apprType"); if (sel) sel.value = apprType;
  const cards = [{ key: "전체", color: "#5B6678" }].concat(APPR_TYPES.map(t => ({ key: t, color: APPR_TYPE_COLOR[t] })));
  $("#apprCards").innerHTML = cards.map(c => {
    const n = c.key === "전체" ? base.length : base.filter(a => a.approvalType === c.key).length;
    return `<button type="button" class="appr-card ${apprType === c.key ? "active" : ""}" data-type="${c.key}">
      <div class="ac-task"><span class="ac-dot" style="background:${c.color}"></span>${c.key}</div>
      <div class="ac-count">${n}<b>건</b></div>
    </button>`;
  }).join("");
  $("#apprCards").querySelectorAll("[data-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type;
      apprType = (apprType === t && t !== "전체") ? "전체" : t;
      renderClosingView();
    });
  });
}

function apprRowHtml(a) {
  const sel = a.id === apprSelectedId;
  const stCls = APPR_STATUS_CLASS[a.approvalStatus] || "appr-ing";
  return `<tr data-id="${a.id}" class="${sel ? "selected" : ""}">
    <td class="ta-c"><input type="checkbox" ${sel ? "checked" : ""} tabindex="-1" aria-label="선택"></td>
    <td class="sa-name">${a.requesterName}</td>
    <td>${a.approvalType}</td>
    <td>${a.claimNo}</td>
    <td class="ta-c">${a.approvalSeq || a.resolutionNo}${(a.includedResolutionSeqs && a.includedResolutionSeqs.length) ? `<div class="appr-incl">결의 ${a.includedResolutionSeqs.join(", ")}</div>` : ""}</td>
    <td>${a.damagedObjectName}</td>
    <td>${a.damageInfo}</td>
    <td>${a.repairShopName}</td>
    <td class="num">${assignWon(a.approvalAmount)}원</td>
    <td class="ta-c"><span class="badge ${stCls}">${a.approvalStatus}</span></td>
    <td>${a.requestedAt ? a.requestedAt.slice(0, 10) : "-"}</td>
    <td>${a.completedAt ? a.completedAt.slice(0, 10) : "-"}</td>
  </tr>`;
}

function renderApprList(base) {
  const list = (apprType === "전체") ? base : base.filter(a => a.approvalType === apprType);
  $("#apprListTitle").textContent = (apprType === "전체") ? "전체 결재 건" : `${apprType} 결재 건`;
  $("#apprCount").textContent = `총 ${list.length}건`;
  if (!list.length) {
    $("#apprRows").innerHTML = `<div class="rows-empty">조건에 해당하는 결재 건이 없습니다.</div>`;
    return;
  }
  $("#apprRows").innerHTML = `
    <table class="sa-table appr-table">
      <thead><tr>
        <th class="ta-c">선택</th><th>상신자</th><th>결재종류</th><th>사고번호</th><th class="ta-c">결재순번</th>
        <th>피해물명</th><th>피해정보</th><th>수리업체명</th><th class="num">결재금액</th>
        <th class="ta-c">결재상태</th><th>상신일</th><th>결재완료일</th>
      </tr></thead>
      <tbody>${list.map(apprRowHtml).join("")}</tbody>
    </table>`;
  $("#apprRows").querySelectorAll("tr[data-id]").forEach(tr => {
    tr.addEventListener("click", () => { apprSelectedId = tr.dataset.id; renderClosingView(); });
  });
}

function apprApproverOptions() {
  return APPR_APPROVERS.map(id => {
    const s = assignStaffById(id); if (!s) return "";
    return `<option value="${id}" ${id === currentApproverId ? "selected" : ""}>${s.name} (${s.position})</option>`;
  }).join("");
}
// ---- 품의서 스타일 요약/전체 문서 ----
function apprDocGroup(title, pairs) {
  const rows = pairs.map(([k, v, hl]) => {
    const val = (v === null || v === undefined || v === "") ? "-" : v;
    return `<div class="dk ${hl ? "hl" : ""}">${k}</div><div class="dv ${hl ? "hl" : ""}">${val}</div>`;
  }).join("");
  return `<div class="doc-grp"><div class="doc-grp-h">${title}</div><div class="doc-rows">${rows}</div></div>`;
}
function apprDocStrip(item) {
  const cls = (item.coreInfo && item.coreInfo.closing) || {};
  return `<div class="doc-strip">
    <div><div class="k">수리업체</div><div class="v">${item.repairShopName}</div></div>
    <div><div class="k">피해물</div><div class="v">${item.damagedObjectName}</div></div>
    <div><div class="k">종결번호</div><div class="v">${cls.종결번호 || "-"}</div></div>
  </div>`;
}
function apprSignHtml(item) {
  const approverName = item.approvalStatus === "상신중"
    ? ((assignStaffById(currentApproverId) || {}).name || "-")
    : (item.approverName || "-");
  let stamp;
  if (item.approvalStatus === "결재완료") stamp = `<span class="stamp">결재완료</span>`;
  else if (item.approvalStatus === "반려") stamp = `<span class="stamp">반려</span>`;
  else stamp = `<span class="stamp wait">상신중</span>`;
  return `<div class="appr-sign">
    <div><div class="sk">담당자(상신)</div><div class="sv">${item.requesterName}</div></div>
    <div><div class="sk">결재자</div><div class="sv">${approverName}</div></div>
    <div><div class="sk">결재</div>${stamp}</div>
  </div>`;
}
// 패널용 요약 품의서 (핵심만 한눈에)
function apprDocSummaryHtml(item) {
  const ci = item.coreInfo || {};
  const acc = ci.accident || {}, con = ci.contract || {}, dmg = ci.damage || {}, cls = ci.closing || {};
  const car = `${con.차량명 || "-"}${con.차량번호 ? " · " + con.차량번호 : ""}`;
  return `<div class="appr-doc">
    <div class="doc-head"><span class="doc-title">자동차 보험금 지급 품의서</span><span class="doc-no">${item.claimNo}-${item.resolutionNo}</span></div>
    <div class="doc-amt"><span class="lbl">결재금액 (${apprAmountLabel(item.approvalType)})</span><span class="val">${assignWon(item.approvalAmount)}원</span></div>
    ${apprDocStrip(item)}
    ${apprDocGroup("사고사항", [["사고번호", item.claimNo], ["사고일시", acc.사고일시], ["사고구분", acc.사고구분], ["과실률", acc.과실률]])}
    ${apprDocGroup("계약사항", [["고객명", con.고객명], ["차량", car], ["렌트/리스", con["렌트/리스구분"]], ["면책약정금액", con.면책약정금액]])}
    ${apprDocGroup("피해 · 지급금액", [["피해구분", dmg.피해구분], ["담보구분", dmg.담보구분], ["청구액", dmg.청구액], ["추산액", dmg.추산액], ["손해사정액", dmg.손해사정액], ["면책금", dmg.면책금], ["실지급액", dmg.실지급액, true]])}
    ${apprDocGroup("종결사항", [["종결구분", cls.종결구분], ["종결승인자", cls.종결승인자], ["종결일", cls.종결일]])}
    ${apprSignHtml(item)}
  </div>
  <button type="button" class="btn doc-full-btn" data-doc-full>품의서 전체보기</button>`;
}
// 전체 품의서 (모달) — 2단 전체 필드
function apprDocSectionFull(sec, item) {
  const data = (item.coreInfo && item.coreInfo[sec.key]) || {};
  const rows = sec.fields.map(f => {
    const v = data[f];
    const val = (v === null || v === undefined || v === "") ? "-" : v;
    return `<div class="dk">${f}</div><div class="dv">${val}</div>`;
  }).join("");
  return `<div class="doc-grp"><div class="doc-grp-h">${sec.title}</div><div class="doc-rows">${rows}</div></div>`;
}
function apprDocFullHtml(item) {
  const secByKey = k => APPR_CORE_SECTIONS.find(s => s.key === k);
  const col = keys => keys.map(k => apprDocSectionFull(secByKey(k), item)).join("");
  return `<div class="appr-doc">
    <div class="doc-head"><span class="doc-title">자동차 보험금 지급 품의서</span><span class="doc-no">${item.claimNo}-${item.resolutionNo}</span></div>
    <div class="doc-amt"><span class="lbl">결재금액 (${apprAmountLabel(item.approvalType)})</span><span class="val">${assignWon(item.approvalAmount)}원</span></div>
    ${apprDocStrip(item)}
    <div class="df-cols">
      <div>${col(["accident", "contract", "closing", "closingNotice"])}</div>
      <div>${col(["damage", "payment", "previousPayment"])}</div>
    </div>
    ${apprSignHtml(item)}
  </div>`;
}
function openApprDoc(id) {
  const item = APPROVALS.find(a => a.id === id); if (!item) return;
  const root = $("#apprDocRoot");
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="action-modal appr-doc-modal" role="dialog" aria-modal="true" aria-label="지급 품의서 전체보기">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">${item.approvalType} · ${item.approvalStatus}</div>
          <h2 class="modal-title">지급 품의서 전체보기</h2>
          <div class="modal-sub">${item.claimNo} · 결의순번 ${item.resolutionNo} · 상신자 ${item.requesterName}</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-modal-close>×</button>
      </div>
      <div class="modal-body">${apprDocFullHtml(item)}</div>
      <div class="modal-foot"><button class="btn-modal" type="button" data-modal-close>닫기</button></div>
    </section>`;
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeApprDoc));
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
}
function closeApprDoc() {
  const root = $("#apprDocRoot");
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
}
function apprHistoryHtml(item) {
  if (!item.histories || !item.histories.length) return `<div class="spd-hist"><div class="h-empty">이력이 없습니다.</div></div>`;
  return `<div class="spd-hist">${item.histories.map(h => `
    <div class="h-row">
      <div class="h-line"><span class="h-time">${h.actedAt}</span><span class="h-name">${h.actorName}</span><span class="h-badge ${APPR_ACT_CLASS[h.actionType] || ""}">${h.actionType}</span></div>
      ${h.comment ? `<div class="h-comment">${h.comment}</div>` : ""}
    </div>`).join("")}</div>`;
}

function renderApprPanel() {
  const panel = $("#apprPanel");
  const item = APPROVALS.find(a => a.id === apprSelectedId);
  if (!item) { panel.innerHTML = `<div class="panel-empty">결재 건을 선택하세요.</div>`; return; }
  const done = item.approvalStatus !== "상신중";
  panel.innerHTML = `
    <div class="panel-head">
      <div class="ph-top">
        <span class="pid">${item.claimNo}</span>
        <span class="badge ${APPR_STATUS_CLASS[item.approvalStatus] || "appr-ing"}">${item.approvalStatus}</span>
      </div>
      <div class="ph-sub">${item.approvalType} · 상신자 ${item.requesterName} · 결의순번 ${item.resolutionNo}</div>
    </div>
    <div class="panel-body">
      <div class="spd-approver">
        <label class="k" for="apprApprover">결재자</label>
        <select id="apprApprover" class="sa-select">${apprApproverOptions()}</select>
      </div>
      <div class="sec"><div class="sec-title">지급 품의서</div>${apprDocSummaryHtml(item)}</div>
      <div class="sec spd-opinion"><div class="sec-title">결재의견</div>
        <div class="k">상신자 의견</div>
        <div class="spd-ro">${item.requesterComment || "-"}</div>
        <div class="k" style="margin-top:8px">결재자 의견 ${done ? "" : `<span class="spd-req">(반려 시 필수)</span>`}</div>
        ${done
          ? `<div class="spd-ro">${item.approverComment || "-"}</div>`
          : `<textarea class="memo" id="apprApproverComment" placeholder="승인 시 선택 · 반려 시 필수로 입력하세요.">${item.approverComment || ""}</textarea>`}
      </div>
      <div class="sec"><div class="sec-title">결재이력</div>${apprHistoryHtml(item)}</div>
      <div class="sec"><div class="sec-title">빠른 이동</div>
        <div class="btn-grid">
          <button class="btn" type="button" data-jump="intake">Smart업무처리 보기</button>
          <button class="btn" type="button" data-jump="pay">지급결의 화면</button>
          <button class="btn" type="button" data-jump="contact">고객 컨택이력</button>
          <button class="btn" type="button" data-jump="image">첨부/이미지 확인</button>
        </div>
      </div>
    </div>
    <div class="panel-foot">
      ${done
        ? `<div class="spd-done">이미 ${item.approvalStatus} 처리된 건입니다.</div>`
        : `<button class="btn-complete" id="apprApproveBtn" type="button">승인</button>
           <button class="btn-hold" id="apprRejectBtn" type="button">반려</button>`}
    </div>`;

  const approverSel = $("#apprApprover");
  if (approverSel) approverSel.addEventListener("change", e => { currentApproverId = e.target.value; renderApprPanel(); });
  const ta = $("#apprApproverComment");
  if (ta) ta.addEventListener("input", e => { item.approverComment = e.target.value; });
  panel.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => apprJump(b.dataset.jump, item)));
  panel.querySelectorAll("[data-doc-full]").forEach(b => b.addEventListener("click", () => openApprDoc(item.id)));
  if (!done) {
    $("#apprApproveBtn").addEventListener("click", () => apprApprove(item.id));
    $("#apprRejectBtn").addEventListener("click", () => apprReject(item.id));
  }
}

function apprJump(kind, item) {
  if (kind === "intake" && CLAIMS.some(c => c.id === item.claimNo)) { openIntake(item.claimNo); return; }
  showToast("해당 화면으로 이동합니다.");
}

// ---- 결재 처리 (승인/반려) ----
function apprFinalizeApprove(item, approver) {
  const before = item.approvalStatus;
  item.approvalStatus = "결재완료";
  item.completedAt = apprNow();
  item.approverId = approver.id;
  item.approverName = approver.name;
  pushApprHistory(item, "승인", approver, item.approverComment, before, "결재완료");
  // 연결 지급결의 상태 동기화(설계문서 §11) — 결재완료 시 결의도 영구 잠금
  if (typeof syncResolutionStatusFromApproval === "function" && item.resolutionIds) {
    syncResolutionStatusFromApproval(item, "결재완료");
    if (typeof persistExtraApprovals === "function") persistExtraApprovals();
  }
  renderClosingView();
  showToast("결재완료 처리되었습니다.");
}
function apprApprove(id) {
  const item = APPROVALS.find(a => a.id === id); if (!item) return;
  const approver = assignStaffById(currentApproverId);
  const ta = $("#apprApproverComment"); if (ta) item.approverComment = ta.value.trim();
  // 지급성 결재 → 비밀번호 인증
  if (apprIsPayType(item.approvalType)) { openApprPw(id); return; }
  apprFinalizeApprove(item, approver);
}
function apprReject(id) {
  const item = APPROVALS.find(a => a.id === id); if (!item) return;
  const approver = assignStaffById(currentApproverId);
  const ta = $("#apprApproverComment");
  const reason = ta ? ta.value.trim() : "";
  if (!reason) { showToast("반려사유를 입력해 주세요."); if (ta) ta.focus(); return; }
  item.approverComment = reason;
  const before = item.approvalStatus;
  item.approvalStatus = "반려";
  item.completedAt = apprNow();
  item.approverId = approver.id;
  item.approverName = approver.name;
  pushApprHistory(item, "반려", approver, reason, before, "반려");
  // 연결 지급결의 상태 동기화(설계문서 §11) — 반려 시 결의 잠금 해제(수정·재상신 가능)
  if (typeof syncResolutionStatusFromApproval === "function" && item.resolutionIds) {
    syncResolutionStatusFromApproval(item, "반려");
    if (typeof persistExtraApprovals === "function") persistExtraApprovals();
  }
  renderClosingView();
  showToast("반려 처리되었습니다.");
}

// ---- 비밀번호 인증 모달 (지급성 결재 최종승인) ----
function openApprPw(id) {
  apprPwTargetId = id;
  const root = $("#apprPwRoot");
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="action-modal" role="dialog" aria-modal="true" aria-label="지급 비밀번호 인증">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">지급성 결재 · 최종승인</div>
          <h2 class="modal-title">비밀번호 인증</h2>
          <div class="modal-sub">지급(종결)·추가지급 승인에는 결재 비밀번호가 필요합니다.</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-modal-close>×</button>
      </div>
      <div class="modal-body">
        <div class="spd-pw">
          <label class="k" for="apprPwInput">결재 비밀번호</label>
          <input type="password" id="apprPwInput" class="sa-input" autocomplete="off" placeholder="비밀번호 입력" />
          <div class="spd-pw-hint">데모 비밀번호: ${APPR_PASSWORD}</div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-modal" type="button" data-modal-close>취소</button>
        <button class="btn-modal primary" type="button" id="apprPwSubmit">확인</button>
      </div>
    </section>`;
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeApprPw));
  $("#apprPwSubmit").addEventListener("click", submitApprPw);
  $("#apprPwInput").addEventListener("keydown", e => { if (e.key === "Enter") submitApprPw(); });
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  setTimeout(() => { const el = $("#apprPwInput"); if (el) el.focus(); }, 0);
}
function closeApprPw() {
  const root = $("#apprPwRoot");
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
  apprPwTargetId = null;
}
function submitApprPw() {
  const val = ($("#apprPwInput") && $("#apprPwInput").value) || "";
  if (val !== APPR_PASSWORD) { showToast("비밀번호가 불일치합니다."); return; }  // 불일치 → 상태 불변
  const item = APPROVALS.find(a => a.id === apprPwTargetId);
  const approver = assignStaffById(currentApproverId);
  closeApprPw();
  if (item && approver) apprFinalizeApprove(item, approver);
}

function bindApprToolbar() {
  if (apprBound) return;
  apprBound = true;
  $("#apprSearch").addEventListener("input", e => { apprQuery = e.target.value; renderClosingView(); });
  $("#apprType").addEventListener("change", e => { apprType = e.target.value; renderClosingView(); });
  $("#apprStatus").addEventListener("change", e => { apprStatus = e.target.value; renderClosingView(); });
  $("#apprFrom").addEventListener("change", e => { apprFrom = e.target.value; renderClosingView(); });
  $("#apprTo").addEventListener("change", e => { apprTo = e.target.value; renderClosingView(); });
  $("#apprSearchBtn").addEventListener("click", renderClosingView);
  $("#apprReset").addEventListener("click", () => {
    apprQuery = ""; apprType = "전체"; apprStatus = "전체"; apprFrom = ""; apprTo = "";
    $("#apprSearch").value = ""; $("#apprType").value = "전체"; $("#apprStatus").value = "전체";
    $("#apprFrom").value = ""; $("#apprTo").value = "";
    renderClosingView();
  });
}


/* ===================== 초기화 ===================== */
(function initClosing() {
  renderClosingView();
})();
