"use strict";
const activeView = "assign";

const ASSIGN_MODES         = ["배당제외", "지역순환", "업체순환", "지역+업체순환"];
const ASSIGN_SPECIAL_GROUPS = ["전체", "제외"]; // 전체=모든 그룹 매칭(와일드카드), 제외=해당 그룹 기준 미적용
const ASSIGN_REGION_GROUPS = ["전체", "경기남부", "경기북부", "서울강남", "서울강북", "인천", "제외"];
const ASSIGN_VENDOR_GROUPS = ["전체", "수원협력업체", "분당협력업체", "강서협력업체", "송파협력업체", "일산협력업체", "제외"];
const ORG_REGIONS = ["수도권", "중부권"];
const ORG_DEPTS   = ["Claim운영1팀", "Claim운영2팀"];
const ORG_CENTERS = ["강남센터", "분당센터"];

// 직원별 배당/권한 설정 (mock, in-memory)

let assignChangeHistory = {
  "EMP001": [ { at:"2026-07-01 09:12", by:"김본부(센터장)", field:"지급한도", before:"1,500,000", after:"1,999,000", reason:"분기 권한 상향" } ],
  "EMP003": [ { at:"2026-07-05 13:40", by:"김본부(센터장)", field:"부재 시작", before:"-", after:"07/06 09:00", reason:"본인 연차 신청" } ],
};

// 화면 상태
let assignSelectedId = null;
let assignFilters = { orgRegion:"", dept:"", center:"", name:"" };
let assignDraft = null;          // 상세 패널 편집 중 임시 사본 (저장 전까지 원본 미반영)
let assignToolbarBound = false;

// ---- 파생 헬퍼 ----

function assignParseNum(v) { const n = Number(String(v).replace(/[^\d]/g, "")); return isNaN(n) ? 0 : n; }

function assignIsUnlimited(s) { return s.dailyAssignmentLimit === 999; } // 999 = 무제한(되는대로 배당)
function assignRemaining(s) { return Math.max(0, s.dailyAssignmentLimit - s.todayAssignedCount); }
function assignRemainingLabel(s) { return assignIsUnlimited(s) ? "무제한" : String(assignRemaining(s)); }
function assignDailyLabel(s) { return assignIsUnlimited(s) ? "무제한" : String(s.dailyAssignmentLimit); }
function assignIsLimitOver(s) { return s.dailyAssignmentLimit > 0 && !assignIsUnlimited(s) && s.todayAssignedCount >= s.dailyAssignmentLimit; }
function assignDeputyName(id) { const d = assignStaffById(id); return d ? d.name : "-"; }
function assignCloseAuthLabel(s) {
  if (s.canCloseWaiver && s.canClosePayment) return "면책/지급";
  if (s.canCloseWaiver) return "면책";
  if (s.canClosePayment) return "지급";
  return "없음";
}
// 부재 기간 판정: absenceStart~absenceEnd 사이면 부재중
function assignAbsentAt(s, when) {
  if (!s.absenceStart || !s.absenceEnd || !when) return false;
  return when >= new Date(s.absenceStart) && when <= new Date(s.absenceEnd);
}
function assignFmtDT(iso) {
  if (!iso) return "";
  const d = new Date(iso), p = n => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function assignAbsenceLabel(s) {
  return (s.absenceStart && s.absenceEnd) ? `${assignFmtDT(s.absenceStart)}~${assignFmtDT(s.absenceEnd)}` : "-";
}
// 배당 판정 기준 시점: 적용일자 + 대표시각(오전 10시)
function assignRefWhen() {
  const d = ($("#assignDate") && $("#assignDate").value) || "2026-07-06";
  return new Date(`${d}T10:00`);
}
// 기준 시점의 유효 상태 (배당중지 > 부재중 > 정상)
function assignEffectiveStatus(s, when) {
  if (s.assignmentStatus === "배당중지") return { label:"배당중지", cls:"assign-stop" };
  if (assignAbsentAt(s, when)) return { label:"부재중", cls:"absence-full" };
  return { label:"정상", cls:"assign-normal" };
}

// ---- 배당 로직 (순수 함수, 부작용 없음) ----
// 우선순위 tier: 업체매칭=0, 지역매칭=1, 공통/관리자확인=2, 불일치=null
// 그룹 매칭: 전체=와일드카드(항상 매칭), 제외=미매칭, 그 외 동일 그룹일 때 매칭
function assignGroupMatch(a, b) {
  if (a === "제외" || b === "제외") return false;
  if (a === "전체" || b === "전체") return true;
  return a === b;
}
function assignGroupTier(s, ctx) {
  const vMatch = assignGroupMatch(s.vendorGroup, ctx.vendorGroup);
  const rMatch = assignGroupMatch(s.regionGroup, ctx.regionGroup);
  switch (s.assignmentMode) {
    case "업체순환":      return vMatch ? 0 : null;
    case "지역순환":      return rMatch ? 1 : null;
    case "지역+업체순환": return vMatch ? 0 : (rMatch ? 1 : 2);
    default:              return null; // 배당제외
  }
}
// 배당 후보 제외 사유 (요구사항 순서 그대로) — 후보면 null
function assignExcludeReason(s, ctx) {
  if (s.assignmentMode === "배당제외")   return "배당제외 설정";
  if (s.assignmentStatus === "배당중지") return "배당중지";
  if (assignAbsentAt(s, ctx.when))       return "부재중";
  if (assignIsLimitOver(s))              return "일 배당한도 초과";
  const tier = assignGroupTier(s, ctx);
  if (tier === null) {
    if (s.assignmentMode === "지역순환") return "지역그룹 불일치";
    if (s.assignmentMode === "업체순환") return "업체그룹 불일치";
    return "지역·업체그룹 불일치";
  }
  return null;
}
// 정렬: tier ↑ → 현재 배당건수 ↑(적은 순) → 사번 안정 정렬
function assignOrderCandidates(pool, ctx) {
  return pool
    .map(s => ({ s, tier: assignGroupTier(s, ctx) }))
    .sort((a, b) => (a.tier - b.tier)
      || (a.s.todayAssignedCount - b.s.todayAssignedCount)
      || a.s.employeeNo.localeCompare(b.s.employeeNo))
    .map(x => x.s);
}
function getAssignmentResult(ctx) {
  const excluded = [], pool = [];
  for (const s of staffAssignmentSettings) {
    if (!s.isActive) { excluded.push({ staff:s, reason:"적용안함" }); continue; }
    const reason = assignExcludeReason(s, ctx);
    if (reason) excluded.push({ staff:s, reason });
    else pool.push(s);
  }
  const candidates = assignOrderCandidates(pool, ctx);
  return { candidates, excluded, finalAssignee: candidates[0] || null };
}
const ASSIGN_TIER_LABEL = { 0:"업체매칭", 1:"지역매칭", 2:"공통" };
function assignNowStamp() {
  const t = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())} ${p(t.getHours())}:${p(t.getMinutes())}`;
}

// ---- 조회조건 필터 / 요약 집계 ----
function assignFilteredStaff() {
  const q = assignFilters.name.trim().toLowerCase();
  return staffAssignmentSettings.filter(s => {
    if (assignFilters.orgRegion && s.orgRegion !== assignFilters.orgRegion) return false;
    if (assignFilters.dept && s.dept !== assignFilters.dept) return false;
    if (assignFilters.center && s.center !== assignFilters.center) return false;
    if (q && !`${s.name} ${s.employeeNo}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
// '배당가능'은 기준 시점에 배제되지 않는 활성 직원 수 / '부재'는 기준 시점 부재중 인원
function assignSummary(when) {
  const c = { total:0, avail:0, absent:0, stopped:0, approver:0, over:0 };
  for (const s of staffAssignmentSettings) {
    c.total++;
    if (s.approvalLevel >= 3) c.approver++;
    if (s.assignmentStatus === "배당중지") c.stopped++;
    if (assignAbsentAt(s, when)) c.absent++;
    if (assignIsLimitOver(s)) c.over++;
    const blocked = !s.isActive || s.assignmentMode === "배당제외" || s.assignmentStatus === "배당중지"
      || assignAbsentAt(s, when) || assignIsLimitOver(s);
    if (!blocked) c.avail++;
  }
  return c;
}

// ---- 렌더 ----
function renderAssign() {
  bindAssignToolbar();
  renderAssignSummary();
  renderAssignGrid();
  renderAssignPanel();
}

function renderAssignSummary() {
  const c = assignSummary(assignRefWhen());
  const cards = [
    { k:"전체 직원", v:c.total },
    { k:"배당 가능", v:c.avail, dot:"#15803D" },
    { k:"부재", v:c.absent, dot:"#B45309" },
    { k:"배당중지", v:c.stopped, dot:"#DC2626" },
    { k:"결재권자", v:c.approver, dot:"#2563EB" },
    { k:"한도초과", v:c.over, dot:"#DC2626" },
  ];
  $("#assignSummary").innerHTML = cards.map(x => `
    <div class="appr-card">
      <div class="ac-task">${x.dot ? `<span class="ac-dot" style="background:${x.dot}"></span>` : ""}${x.k}</div>
      <div class="ac-count">${x.v}<b>명</b></div>
    </div>`).join("");
}

// 그리드 컬럼 정의 (sort: 정렬키, get: 정렬값 추출, str: 문자열 정렬 여부)
let assignGridWhen = null; // 그리드 렌더 시 기준 시점 (배당상태 정렬/표시용)
const ASSIGN_COLS = [
  { label:"선택", sort:null },
  { label:"담당자", sort:"name", get:s => s.name, str:true },
  { label:"사번", sort:"employeeNo", get:s => s.employeeNo, str:true },
  { label:"결재레벨", sort:"approvalLevel", get:s => s.approvalLevel },
  { label:"추산한도", sort:"estimateLimit", get:s => s.estimateLimit },
  { label:"지급한도", sort:"paymentLimit", get:s => s.paymentLimit },
  { label:"종결권한", sort:"closeAuth", get:s => (s.canCloseWaiver ? 2 : 0) + (s.canClosePayment ? 1 : 0) },
  { label:"일배당한도", sort:"dailyAssignmentLimit", get:s => s.dailyAssignmentLimit },
  { label:"현재배당", sort:"todayAssignedCount", get:s => s.todayAssignedCount },
  { label:"잔여배당", sort:"remaining", get:s => assignIsUnlimited(s) ? Infinity : assignRemaining(s) },
  { label:"배당방식", sort:"assignmentMode", get:s => ASSIGN_MODES.indexOf(s.assignmentMode) },
  { label:"지역그룹", sort:"regionGroup", get:s => s.regionGroup, str:true },
  { label:"업체그룹", sort:"vendorGroup", get:s => s.vendorGroup, str:true },
  { label:"배당상태", sort:"status", get:s => s.assignmentStatus === "배당중지" ? 2 : (assignAbsentAt(s, assignGridWhen) ? 1 : 0) },
  { label:"부재기간", sort:"absence", get:s => s.absenceStart || "", str:true },
  { label:"직무대행자", sort:"deputy", get:s => s.deputyEmployeeId ? assignDeputyName(s.deputyEmployeeId) : "", str:true },
  { label:"적용여부", sort:"isActive", get:s => s.isActive ? 1 : 0 },
];
let assignSort = { key:"approvalLevel", dir:-1 }; // 기본: 결재레벨 내림차순(3레벨 센터장·부장 최상단)
function assignSortStaff(list) {
  const col = ASSIGN_COLS.find(c => c.sort === assignSort.key);
  if (!col) return list;
  const dir = assignSort.dir;
  return list.slice().sort((a, b) => {
    const va = col.get(a), vb = col.get(b);
    let cmp = col.str ? String(va).localeCompare(String(vb), "ko") : (va < vb ? -1 : va > vb ? 1 : 0);
    if (cmp === 0) cmp = a.employeeNo.localeCompare(b.employeeNo); // 동값은 사번으로 안정 정렬
    return cmp * dir;
  });
}
function assignHeadHtml() {
  return `<thead><tr>${ASSIGN_COLS.map(c => {
    if (!c.sort) return `<th>${c.label}</th>`;
    const active = assignSort.key === c.sort;
    const arrow = active ? (assignSort.dir === 1 ? "▲" : "▼") : "";
    return `<th class="sortable${active ? " active" : ""}" data-sort="${c.sort}">${c.label}<span class="sa-arrow">${arrow}</span></th>`;
  }).join("")}</tr></thead>`;
}
function bindAssignSortHeaders() {
  $("#assignGrid").querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      if (assignSort.key === key) assignSort.dir *= -1; // 같은 헤더 재클릭 → 방향 토글
      else assignSort = { key, dir: 1 };                 // 새 헤더 → 오름차순부터
      renderAssignGrid();
    });
  });
}
function assignStatusBadge(s) {
  const st = assignEffectiveStatus(s, assignGridWhen);
  return `<span class="badge ${st.cls}">${st.label}</span>`;
}
function assignModeCell(s) {
  return s.assignmentMode === "배당제외" ? `<span class="badge mode-off">배당제외</span>` : s.assignmentMode;
}
function renderAssignGrid() {
  assignGridWhen = assignRefWhen(); // 기준 시점(적용일자 오전 10시)로 배당상태/부재중 판정
  const list = assignSortStaff(assignFilteredStaff());
  $("#assignCount").textContent = `총 ${list.length}명`;
  const head = assignHeadHtml();
  if (!list.length) {
    $("#assignGrid").innerHTML = `<table class="sa-table">${head}<tbody><tr><td colspan="${ASSIGN_COLS.length}" style="padding:24px;text-align:center;color:var(--text-dim)">조건에 해당하는 직원이 없습니다.</td></tr></tbody></table>`;
    bindAssignSortHeaders();
    return;
  }
  const rows = list.map(s => {
    const sel = s.id === assignSelectedId ? " selected" : "";
    const over = assignIsLimitOver(s) ? ` <span class="badge limit-over">초과</span>` : "";
    return `<tr class="${sel ? "selected" : ""}" data-sid="${s.id}">
      <td class="ta-c"><input type="checkbox" ${sel ? "checked" : ""} tabindex="-1" aria-label="선택" style="pointer-events:none"></td>
      <td class="sa-name">${s.name}</td>
      <td>${s.employeeNo}</td>
      <td class="ta-c">${s.approvalLevel >= 3 ? "3레벨" : "1레벨"}</td>
      <td class="num">${assignWon(s.estimateLimit)}</td>
      <td class="num">${assignWon(s.paymentLimit)}</td>
      <td class="ta-c">${assignCloseAuthLabel(s)}</td>
      <td class="num">${assignDailyLabel(s)}</td>
      <td class="num">${s.todayAssignedCount}</td>
      <td class="num">${assignRemainingLabel(s)}${over}</td>
      <td>${assignModeCell(s)}</td>
      <td>${s.regionGroup}</td>
      <td>${s.vendorGroup}</td>
      <td>${assignStatusBadge(s)}</td>
      <td>${assignAbsenceLabel(s)}</td>
      <td>${s.deputyEmployeeId ? assignDeputyName(s.deputyEmployeeId) : "-"}</td>
      <td class="ta-c">${s.isActive ? "적용" : "미적용"}</td>
    </tr>`;
  }).join("");
  $("#assignGrid").innerHTML = `<table class="sa-table">${head}<tbody>${rows}</tbody></table>`;
  $("#assignGrid").querySelectorAll("[data-sid]").forEach(tr => {
    tr.addEventListener("click", () => selectAssignStaff(tr.dataset.sid));
  });
  bindAssignSortHeaders();
}

function selectAssignStaff(id) {
  assignSelectedId = id;
  const s = assignStaffById(id);
  assignDraft = s ? JSON.parse(JSON.stringify(s)) : null; // 저장 전까지 원본과 분리된 편집 사본
  renderAssignGrid();
  renderAssignPanel();
}

// 부재 일시 분리 입력 (년.월.일 시:분) — 숫자 키인 시 자릿수 채워지면 자동 tab, 달력 버튼으로 네이티브 피커
function absenceGroupHtml(id, iso) {
  return `<div class="sa-dt" id="${id}" data-iso="${iso || ""}">
    <input class="sa-dt-p sa-dt-y" maxlength="4" inputmode="numeric" placeholder="YYYY" aria-label="년">
    <span class="sa-dt-sep">.</span>
    <input class="sa-dt-p sa-dt-m" maxlength="2" inputmode="numeric" placeholder="MM" aria-label="월">
    <span class="sa-dt-sep">.</span>
    <input class="sa-dt-p sa-dt-d" maxlength="2" inputmode="numeric" placeholder="DD" aria-label="일">
    <input class="sa-dt-p sa-dt-h" maxlength="2" inputmode="numeric" placeholder="HH" aria-label="시" style="margin-left:6px">
    <span class="sa-dt-sep">:</span>
    <input class="sa-dt-p sa-dt-mi" maxlength="2" inputmode="numeric" placeholder="mm" aria-label="분">
    <button type="button" class="sa-dt-cal" aria-label="달력에서 선택" title="달력에서 선택">📅</button>
    <input type="datetime-local" class="sa-dt-native" tabindex="-1" aria-hidden="true">
  </div>`;
}
function parseAbsenceISO(iso) {
  if (!iso) return { y:"", m:"", d:"", h:"", mi:"" };
  const [date, time] = iso.split("T");
  const [y = "", m = "", d = ""] = date.split("-");
  const [h = "", mi = ""] = (time || "").split(":");
  return { y, m, d, h, mi };
}
function buildAbsenceISO(p) {
  const pad = (v, n) => String(v).padStart(n, "0");
  if (p.y.length === 4 && p.m !== "" && p.d !== "" && p.h !== "" && p.mi !== "") {
    return `${p.y}-${pad(p.m, 2)}-${pad(p.d, 2)}T${pad(p.h, 2)}:${pad(p.mi, 2)}`;
  }
  return null; // 미완성 입력은 값 없음 처리
}
function wireAbsenceGroup(container, onChange) {
  const sels = [".sa-dt-y", ".sa-dt-m", ".sa-dt-d", ".sa-dt-h", ".sa-dt-mi"];
  const maxes = [4, 2, 2, 2, 2];
  const inputs = sels.map(s => container.querySelector(s));
  const native = container.querySelector(".sa-dt-native");
  const cal = container.querySelector(".sa-dt-cal");
  const read = () => ({ y:inputs[0].value, m:inputs[1].value, d:inputs[2].value, h:inputs[3].value, mi:inputs[4].value });
  const fill = (iso) => { const p = parseAbsenceISO(iso); [p.y, p.m, p.d, p.h, p.mi].forEach((v, i) => inputs[i].value = v); };
  const emit = () => onChange(buildAbsenceISO(read()));
  fill(container.dataset.iso || "");
  inputs.forEach((el, i) => {
    el.addEventListener("input", () => {
      el.value = el.value.replace(/[^\d]/g, "").slice(0, maxes[i]);
      if (el.value.length >= maxes[i] && i < inputs.length - 1) inputs[i + 1].focus(); // 자릿수 채우면 자동 tab
      emit();
    });
    el.addEventListener("keydown", e => {
      if ([".", ":", "/", " ", "-"].includes(e.key)) { e.preventDefault(); if (i < inputs.length - 1) inputs[i + 1].focus(); }
      else if (e.key === "Backspace" && el.value === "" && i > 0) { e.preventDefault(); inputs[i - 1].focus(); }
    });
    el.addEventListener("focus", () => el.select());
  });
  cal.addEventListener("click", () => {
    const cur = buildAbsenceISO(read());
    if (cur) native.value = cur;
    try { native.showPicker(); } catch (_) { native.focus(); }
  });
  native.addEventListener("change", () => { fill(native.value); emit(); });
}

function renderAssignPanel() {
  const panel = $("#assignPanel");
  const d = assignDraft;
  if (!d) {
    panel.innerHTML = `<div class="panel-empty">좌측에서 직원을 선택하면<br>상세 설정을 편집할 수 있습니다.</div>`;
    return;
  }
  const optTags = (arr, cur) => arr.map(o => `<option value="${o}" ${o === cur ? "selected" : ""}>${o}</option>`).join("");
  const deputyOpts = `<option value="">지정 안함</option>` + staffAssignmentSettings
    .filter(x => x.id !== d.id)
    .map(x => `<option value="${x.id}" ${x.id === d.deputyEmployeeId ? "selected" : ""}>${x.name} (${x.position})</option>`).join("");
  const hist = assignChangeHistory[d.id] || [];
  const histRows = hist.length
    ? hist.map(h => `<tr><td>${h.at}</td><td>${h.by}</td><td>${h.field}</td><td>${h.before}</td><td>${h.after}</td><td>${h.reason}</td></tr>`).join("")
    : `<tr><td class="empty" colspan="6">변경 이력이 없습니다.</td></tr>`;

  panel.innerHTML = `
    <div class="panel-head">
      <div class="ph-top"><span class="pid">${d.name}</span><span class="badge ${d.approvalLevel >= 3 ? "rev-appr" : "s-doing"}">${d.approvalLevel >= 3 ? "3레벨" : "1레벨"}</span></div>
      <div class="ph-sub">${d.position} · ${d.employeeNo} · ${d.center}</div>
    </div>
    <div class="panel-body">
      <div class="sec">
        <div class="sec-title">1. 권한 / 한도</div>
        <div class="sa-form">
          <div class="sa-radio">
            <label><input type="radio" name="saLevel" value="1" ${d.approvalLevel < 3 ? "checked" : ""}> 1레벨 일반직원</label>
            <label><input type="radio" name="saLevel" value="3" ${d.approvalLevel >= 3 ? "checked" : ""}> 3레벨 센터장/부장</label>
          </div>
          <div class="sa-row"><label class="k">추산한도</label><input class="sa-input" id="saEstimate" inputmode="numeric" value="${assignWon(d.estimateLimit)}"></div>
          <div class="sa-row"><label class="k">지급한도</label><input class="sa-input" id="saPayment" inputmode="numeric" value="${assignWon(d.paymentLimit)}"></div>
          <div class="sa-checks">
            <label class="sa-check"><input type="checkbox" id="saWaiver" ${d.canCloseWaiver ? "checked" : ""}> 면책종결 권한</label>
            <label class="sa-check"><input type="checkbox" id="saPay" ${d.canClosePayment ? "checked" : ""}> 지급종결 권한</label>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">2. 순환배당</div>
        <div class="sa-form">
          <div class="sa-row"><label class="k">일 배당한도</label><input class="sa-input" id="saDaily" inputmode="numeric" value="${d.dailyAssignmentLimit}" title="999 입력 시 무제한(되는대로 배당)"></div>
          <div class="sa-row"><label class="k">배당방식</label><select class="sa-select" id="saMode">${optTags(ASSIGN_MODES, d.assignmentMode)}</select></div>
          <div class="sa-row"><label class="k">지역그룹</label><select class="sa-select" id="saRegion">${optTags(ASSIGN_REGION_GROUPS, d.regionGroup)}</select></div>
          <div class="sa-row"><label class="k">업체그룹</label><select class="sa-select" id="saVendor">${optTags(ASSIGN_VENDOR_GROUPS, d.vendorGroup)}</select></div>
          <div class="sa-row"><label class="k">현재배당</label><input class="sa-input ro" value="${d.todayAssignedCount} 건" readonly></div>
          <div class="sa-row"><label class="k">잔여배당</label><input class="sa-input ro" id="saRemain" value="${assignIsUnlimited(d) ? "무제한" : assignRemaining(d) + " 건"}" readonly></div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">3. 부재 / 직무대행</div>
        <div class="sa-form">
          <label class="sa-check"><input type="checkbox" id="saStop" ${d.assignmentStatus === "배당중지" ? "checked" : ""}> 배당중지 (기간과 무관하게 즉시 중지)</label>
          <div class="sa-row"><label class="k">부재 시작</label>${absenceGroupHtml("saAbsStart", d.absenceStart)}</div>
          <div class="sa-row"><label class="k">부재 종료</label>${absenceGroupHtml("saAbsEnd", d.absenceEnd)}</div>
          <div class="sa-row"><label class="k">직무대행자</label><select class="sa-select" id="saDeputy">${deputyOpts}</select></div>
          <button type="button" class="btn" id="saAbsClear" style="align-self:flex-start;padding:6px 12px">부재 기간 해제</button>
          <div class="sa-note">부재 기간에는 신규 배당이 자동 중지됩니다. 기존 배당건은 유지됩니다.</div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">4. 변경이력</div>
        <table class="sa-history">
          <thead><tr><th>변경일시</th><th>변경자</th><th>항목</th><th>변경 전</th><th>변경 후</th><th>사유</th></tr></thead>
          <tbody>${histRows}</tbody>
        </table>
      </div>
    </div>
    <div class="panel-foot">
      <button class="btn-complete" type="button" id="saSave">이 직원 저장</button>
      <button class="btn-hold" type="button" id="saRevert">되돌리기</button>
    </div>`;

  bindAssignPanelEvents();
}

function bindAssignPanelEvents() {
  const d = assignDraft;
  const panel = $("#assignPanel");
  panel.querySelectorAll('input[name="saLevel"]').forEach(r =>
    r.addEventListener("change", e => { d.approvalLevel = Number(e.target.value); }));
  $("#saEstimate").addEventListener("input", e => { d.estimateLimit = assignParseNum(e.target.value); });
  $("#saPayment").addEventListener("input", e => { d.paymentLimit = assignParseNum(e.target.value); });
  $("#saWaiver").addEventListener("change", e => { d.canCloseWaiver = e.target.checked; });
  $("#saPay").addEventListener("change", e => { d.canClosePayment = e.target.checked; });
  $("#saDaily").addEventListener("input", e => {
    d.dailyAssignmentLimit = assignParseNum(e.target.value);
    $("#saRemain").value = assignIsUnlimited(d) ? "무제한" : `${assignRemaining(d)} 건`;
  });
  $("#saMode").addEventListener("change", e => { d.assignmentMode = e.target.value; });
  $("#saRegion").addEventListener("change", e => { d.regionGroup = e.target.value; });
  $("#saVendor").addEventListener("change", e => { d.vendorGroup = e.target.value; });
  $("#saStop").addEventListener("change", e => { d.assignmentStatus = e.target.checked ? "배당중지" : "정상"; });
  wireAbsenceGroup($("#saAbsStart"), iso => { d.absenceStart = iso; });
  wireAbsenceGroup($("#saAbsEnd"), iso => { d.absenceEnd = iso; });
  $("#saAbsClear").addEventListener("click", () => { d.absenceStart = null; d.absenceEnd = null; renderAssignPanel(); });
  $("#saDeputy").addEventListener("change", e => { d.deputyEmployeeId = e.target.value || null; });
  $("#saSave").addEventListener("click", saveAssignStaff);
  $("#saRevert").addEventListener("click", () => selectAssignStaff(assignSelectedId));
}

// ---- 저장 / 변경이력 ----
const ASSIGN_FIELD_LABELS = {
  approvalLevel:"결재레벨", estimateLimit:"추산한도", paymentLimit:"지급한도",
  canCloseWaiver:"면책종결권한", canClosePayment:"지급종결권한",
  dailyAssignmentLimit:"일 배당한도", assignmentMode:"배당방식",
  regionGroup:"지역그룹", vendorGroup:"업체그룹",
  assignmentStatus:"배당중지 여부", absenceStart:"부재 시작", absenceEnd:"부재 종료",
  deputyEmployeeId:"직무대행자",
};
function assignDisplayValue(field, val) {
  if (val === null || val === "" || val === undefined) return "-";
  if (field === "approvalLevel") return `${val}레벨`;
  if (field === "estimateLimit" || field === "paymentLimit") return assignWon(val);
  if (field === "canCloseWaiver" || field === "canClosePayment") return val ? "허용" : "불가";
  if (field === "deputyEmployeeId") return assignDeputyName(val);
  if (field === "absenceStart" || field === "absenceEnd") return assignFmtDT(val);
  return String(val);
}
function saveAssignStaff() {
  const d = assignDraft;
  if (!d) return;
  const orig = assignStaffById(d.id);
  if (!orig) return;
  const now = assignNowStamp();
  const changes = [];
  Object.keys(ASSIGN_FIELD_LABELS).forEach(f => {
    if (orig[f] !== d[f]) {
      changes.push({ at:now, by:"관리자", field:ASSIGN_FIELD_LABELS[f],
        before:assignDisplayValue(f, orig[f]), after:assignDisplayValue(f, d[f]), reason:"관리자 저장" });
    }
  });
  Object.assign(orig, JSON.parse(JSON.stringify(d)));         // 원본 반영
  if (changes.length) assignChangeHistory[d.id] = [...changes, ...(assignChangeHistory[d.id] || [])];
  assignDraft = JSON.parse(JSON.stringify(orig));
  renderAssignSummary();
  renderAssignGrid();
  renderAssignPanel();
  showToast(changes.length ? `${orig.name} 설정 ${changes.length}건이 저장되었습니다.` : `${orig.name} 변경 사항이 없습니다.`);
}

// 일 배당한도 일괄 적용 (조회 목록 내 배당 대상 직원에게 즉시 반영 + 변경이력 기록)
function applyBulkDailyLimit() {
  const raw = $("#assignBulkDaily").value;
  if (raw.trim() === "") { showToast("일괄 적용할 일 배당한도를 입력하세요."); return; }
  const val = Math.min(999, assignParseNum(raw)); // 999 초과 입력은 무제한(999)으로 수렴
  const targets = assignFilteredStaff().filter(s => s.assignmentMode !== "배당제외"); // 배당 대상만
  if (!targets.length) { showToast("적용할 배당 대상 직원이 없습니다."); return; }
  const now = assignNowStamp();
  let changed = 0;
  targets.forEach(s => {
    if (s.dailyAssignmentLimit === val) return;
    const before = assignDailyLabel(s);
    s.dailyAssignmentLimit = val;
    assignChangeHistory[s.id] = [{ at:now, by:"관리자", field:"일 배당한도(일괄)", before, after:assignDailyLabel(s), reason:"일괄 적용" }, ...(assignChangeHistory[s.id] || [])];
    changed++;
  });
  if (assignSelectedId) { const s = assignStaffById(assignSelectedId); assignDraft = s ? JSON.parse(JSON.stringify(s)) : null; }
  renderAssignSummary();
  renderAssignGrid();
  renderAssignPanel();
  const label = val === 999 ? "무제한(999)" : `${val}건`;
  showToast(changed ? `조회 목록 ${changed}명에게 일 배당한도 ${label}을 적용했습니다.` : "변경된 직원이 없습니다.");
}

// ---- 조회조건 툴바 ----
function fillAssignOptions(sel, arr) {
  sel.innerHTML = `<option value="">전체</option>` + arr.map(o => `<option value="${o}">${o}</option>`).join("");
}
function bindAssignToolbar() {
  if (assignToolbarBound) return;
  assignToolbarBound = true;
  fillAssignOptions($("#assignRegion"), ORG_REGIONS);
  fillAssignOptions($("#assignDept"), ORG_DEPTS);
  fillAssignOptions($("#assignCenter"), ORG_CENTERS);
  if (!$("#assignDate").value) $("#assignDate").value = "2026-07-06";
  const apply = () => {
    assignFilters.orgRegion = $("#assignRegion").value;
    assignFilters.dept = $("#assignDept").value;
    assignFilters.center = $("#assignCenter").value;
    assignFilters.name = $("#assignName").value;
    renderAssignGrid();
  };
  $("#assignName").addEventListener("input", apply);
  $("#assignRegion").addEventListener("change", apply);
  $("#assignDept").addEventListener("change", apply);
  $("#assignCenter").addEventListener("change", apply);
  $("#assignSearchBtn").addEventListener("click", apply);
  $("#assignSimBtn").addEventListener("click", openAssignSim);
  $("#assignSaveBtn").addEventListener("click", () => {
    if (!assignDraft) { showToast("먼저 직원을 선택하세요."); return; }
    saveAssignStaff();
  });
  $("#assignBulkBtn").addEventListener("click", applyBulkDailyLimit);
  $("#assignBulkDaily").addEventListener("keydown", e => { if (e.key === "Enter") applyBulkDailyLimit(); });
}

// ---- 시뮬레이션 (저장 전 미리보기) ----
function closeAssignSim() {
  const root = $("#assignSimRoot");
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
}
function assignReasonClass(reason) {
  if (reason === "부재중") return "absence-full";
  if (reason === "배당중지") return "assign-stop";
  if (reason === "일 배당한도 초과") return "limit-over";
  return "mode-off";
}
function renderAssignSimResult(ctx) {
  const { candidates, excluded, finalAssignee } = getAssignmentResult(ctx);
  const candRows = candidates.length
    ? candidates.map((s, i) => `<div class="r"><span class="seq">${i + 1}</span><span class="nm">${s.name}</span><span>${s.todayAssignedCount}건 / ${assignDailyLabel(s)}</span><span class="tier">${ASSIGN_TIER_LABEL[assignGroupTier(s, ctx)] || "-"}</span></div>`).join("")
    : `<div class="empty">배당 가능한 후보가 없습니다.</div>`;
  const exRows = excluded.length
    ? excluded.map(e => `<div class="r"><span class="nm">${e.staff.name}</span><span class="badge ${assignReasonClass(e.reason)}" style="margin-left:auto">${e.reason}</span></div>`).join("")
    : `<div class="empty">제외된 직원이 없습니다.</div>`;
  $("#simResult").innerHTML = `
    <div class="sa-sim-final">최종 배당 예정자: ${finalAssignee ? `${finalAssignee.name} (${finalAssignee.position})` : `<span class="none">배당 가능 직원 없음</span>`}</div>
    <div class="sa-sim-cols">
      <div class="sa-sim-list"><h4>배당 후보자 (${candidates.length})</h4>${candRows}</div>
      <div class="sa-sim-list"><h4>제외 직원 (${excluded.length})</h4>${exRows}</div>
    </div>`;
}
function openAssignSim() {
  const root = $("#assignSimRoot");
  const region0 = ASSIGN_REGION_GROUPS.find(g => !ASSIGN_SPECIAL_GROUPS.includes(g));
  const vendor0 = ASSIGN_VENDOR_GROUPS.find(g => !ASSIGN_SPECIAL_GROUPS.includes(g));
  const date0 = ($("#assignDate") && $("#assignDate").value) || "2026-07-06";
  const when0 = `${date0}T10:00`;
  const runSim = () => {
    renderAssignSimResult({ regionGroup: $("#simRegion").value, vendorGroup: $("#simVendor").value, when: new Date($("#simWhen").value) });
  };
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="action-modal" role="dialog" aria-modal="true" aria-label="배당 시뮬레이션">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">저장 전 미리보기 · 실제 배당 아님</div>
          <h2 class="modal-title">순환배당 시뮬레이션</h2>
          <div class="modal-sub">지정한 배당 시점 기준으로 신규 배당 후보를 계산합니다. (부재 기간은 자동 제외)</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-modal-close>×</button>
      </div>
      <div class="modal-body">
        <div class="sa-sim-input">
          <div><div class="k">지역그룹</div><select id="simRegion">${ASSIGN_REGION_GROUPS.map(o => `<option ${o === region0 ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <div><div class="k">업체그룹</div><select id="simVendor">${ASSIGN_VENDOR_GROUPS.map(o => `<option ${o === vendor0 ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <div style="grid-column:span 2"><div class="k">배당 시점</div><input type="datetime-local" id="simWhen" value="${when0}"></div>
        </div>
        <div id="simResult"></div>
      </div>
      <div class="modal-foot">
        <button class="btn-modal" type="button" data-modal-close>닫기</button>
        <button class="btn-modal primary" type="button" id="simRun">시뮬레이션 실행</button>
      </div>
    </section>`;
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeAssignSim));
  root.querySelector("#simRun").addEventListener("click", runSim);
  $("#simRegion").addEventListener("change", runSim);
  $("#simVendor").addEventListener("change", runSim);
  $("#simWhen").addEventListener("change", runSim);
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  runSim(); // 최초 자동 실행
}


/* ===================== 초기화 ===================== */
(function initAssign() {
  renderAssign();
})();
