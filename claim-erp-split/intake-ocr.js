"use strict";
/* ===================== AI-OCR 부품청구서 (Pro) =====================
   Smart업무처리 '청구 견적 정보' 탭의 AI-OCR 기능.
   - 부품청구서(PDF/JPG/PNG) 업로드 → OCR 분석 → 편집 가능한 결과 테이블
   - 담당자가 부품명·부품번호·부품항목·수량·불인·청구금액·손해사정금액 수정
   - 확정 시 PAYMENT_RESOLUTIONS(common.js)에 '지급결의' 신규 저장
   더미 OCR은 generateDummyOcr()에 격리 — 실제 OCR API로 교체 가능한 단일 인터페이스.
   공용 접두사: ocr- (전역명·CSS) */

const OCR_PART_CATEGORIES = ["교환", "수리", "탈착", "도장", "공임"];
const OCR_MAX_MB = 20;
const OCR_ACCEPT = ["pdf", "jpg", "jpeg", "png"];

// 편집 상태 — 모달이 열려 있는 동안만 유지
let ocrState = null; // { claimId, fileName, sourceType, rows:[], originalRows:[], editingResolutionId }

/* ---- 더미 OCR (파일명+사고번호 시드 결정론적 생성) ----
   실제 연동 시 이 함수만 OCR API 응답 파싱으로 교체한다. */
function generateDummyOcr(fileName, claimNo) {
  const seedStr = (fileName || "part") + "|" + (claimNo || "");
  const p = apprPicker(apprSeed(seedStr));
  const PARTS = [
    ["프론트 범퍼 커버", "86511-L1000"], ["헤드램프 ASSY", "92101-L2000"], ["본네트 판넬", "66400-L1000"],
    ["프론트 펜더", "66311-L0000"], ["라디에이터 그릴", "86350-L3000"], ["프론트 도어 판넬", "76003-L1000"],
    ["아웃사이드 미러", "87610-L4000"], ["리어 범퍼 커버", "86611-L5000"], ["테일램프 ASSY", "92401-L6000"],
    ["휠 가드", "86811-L1000"], ["범퍼 브라켓", "86513-L1000"], ["프론트 훨하우스", "86821-L2000"],
  ];
  const n = 3 + p.pick([0, 1, 2, 3]);
  const rows = [];
  const used = {};
  for (let i = 0; i < n; i++) {
    let part; let guard = 0;
    do { part = PARTS[apprSeed(fileName + "#" + i + "#" + guard) % PARTS.length]; guard++; } while (used[part[1]] && guard < 40);
    used[part[1]] = true;
    const qty = p.pick([1, 1, 1, 2]);
    const unit = p.pick([55000, 88000, 120000, 180000, 240000, 320000, 420000]);
    const claim = unit * qty;
    const category = p.pick(OCR_PART_CATEGORIES);
    // OCR 최초 인식값(담당자 수정 전). 손해사정금액은 청구금액과 동일하게 인식.
    rows.push({
      partName: part[0],
      partNumber: part[1],
      partCategory: category,
      quantity: qty,
      denied: false,
      claimAmount: claim,
      assessedAmount: claim,
    });
  }
  return rows;
}

/* ---- 업로드 모달 진입점 (AI-OCR Pro 버튼) ---- */
function openOcrUpload(d) {
  if (!d) return;
  ocrState = null;
  const root = $("#ocrModalRoot");
  if (!root) return;
  const repair = d.repairShop || (d.repair && d.repair.shop) || "-";
  root.innerHTML = `
    <div class="modal-backdrop" data-ocr-close></div>
    <section class="action-modal ocr-modal" role="dialog" aria-modal="true" aria-label="AI-OCR 부품청구서 등록">
      <div class="modal-head">
        <div>
          <div class="modal-eyebrow">AI-OCR <span class="ocr-pro-tag">Pro</span></div>
          <div class="modal-title">AI-OCR 부품청구서 등록</div>
        </div>
        <button class="modal-close" type="button" data-ocr-close aria-label="닫기">×</button>
      </div>
      <div class="modal-body">
        <div class="ocr-meta">
          <div><span class="k">사고번호</span><span class="v">${iEsc(d.id)}</span></div>
          <div><span class="k">차량번호</span><span class="v">${iEsc(d.car)}</span></div>
          <div><span class="k">정비업체</span><span class="v">${iEsc(repair)}</span></div>
        </div>
        <div class="ocr-drop" id="ocrDrop" tabindex="0" data-desc="부품청구서 파일을 이 영역에 끌어다 놓거나 클릭해 선택합니다.">
          <div class="ocr-drop-ico">📄</div>
          <div class="ocr-drop-main">부품청구서를 여기에 끌어다 놓으세요</div>
          <div class="ocr-drop-sub">또는 <button type="button" class="ocr-link" id="ocrPick">파일 선택</button></div>
          <div class="ocr-drop-hint">PDF · JPG · PNG · 최대 ${OCR_MAX_MB}MB (프로토타입 1개)</div>
          <input type="file" id="ocrFile" accept=".pdf,.jpg,.jpeg,.png" hidden>
        </div>
        <div class="ocr-file" id="ocrFileInfo" hidden></div>
        <div class="ocr-err" id="ocrErr" hidden></div>
      </div>
      <div class="modal-foot">
        <button class="btn-modal" type="button" data-ocr-close>취소</button>
        <button class="btn-modal primary" type="button" id="ocrAnalyze" disabled>분석 시작</button>
      </div>
    </section>`;
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  bindOcrUpload(d);
}

function closeOcrModal() {
  const root = $("#ocrModalRoot");
  if (!root) return;
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
  ocrState = null;
}

function ocrValidateFile(file) {
  if (!file) return "부품청구서 파일을 선택하세요.";
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (OCR_ACCEPT.indexOf(ext) < 0) return "PDF, JPG, PNG 파일만 등록할 수 있습니다.";
  if (file.size > OCR_MAX_MB * 1024 * 1024) return "파일 용량은 " + OCR_MAX_MB + "MB 이하만 등록할 수 있습니다.";
  return null;
}

function bindOcrUpload(d) {
  const root = $("#ocrModalRoot");
  root.querySelectorAll("[data-ocr-close]").forEach(b => b.addEventListener("click", closeOcrModal));
  const drop = $("#ocrDrop"), input = $("#ocrFile"), pick = $("#ocrPick");
  const info = $("#ocrFileInfo"), err = $("#ocrErr"), analyze = $("#ocrAnalyze");
  let picked = null;

  const showErr = msg => { err.textContent = msg; err.hidden = !msg; };
  const setFile = file => {
    const msg = ocrValidateFile(file);
    if (msg) { picked = null; info.hidden = true; analyze.disabled = true; showErr(msg); return; }
    picked = file;
    const mb = (file.size / 1024 / 1024).toFixed(2);
    info.innerHTML = `<span class="ocr-file-ico">📎</span><span class="ocr-file-nm">${escapeHtml(file.name)}</span><span class="ocr-file-sz">${mb} MB</span>`;
    info.hidden = false;
    showErr("");
    analyze.disabled = false;
  };

  if (pick) pick.addEventListener("click", () => input.click());
  if (drop) drop.addEventListener("click", e => { if (e.target === drop || e.target.closest(".ocr-drop-main,.ocr-drop-ico,.ocr-drop-hint")) input.click(); });
  if (input) input.addEventListener("change", () => setFile(input.files && input.files[0]));
  ["dragover", "dragenter"].forEach(ev => drop && drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(ev => drop && drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("drag"); }));
  if (drop) drop.addEventListener("drop", e => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) setFile(f);
  });
  if (analyze) analyze.addEventListener("click", () => { if (picked) runOcrAnalyze(d, picked.name); });
}

/* ---- 분석중 화면 → 더미 결과 전환 ---- */
function runOcrAnalyze(d, fileName) {
  const root = $("#ocrModalRoot");
  const modal = root.querySelector(".ocr-modal");
  if (modal) modal.innerHTML = `
    <div class="modal-head">
      <div><div class="modal-eyebrow">AI-OCR <span class="ocr-pro-tag">Pro</span></div>
      <div class="modal-title">부품청구서 분석중</div></div>
    </div>
    <div class="modal-body">
      <div class="ocr-analyzing">
        <div class="ocr-spinner" aria-hidden="true"></div>
        <div class="ocr-analyzing-main">부품청구서를 분석하고 있습니다.</div>
        <div class="ocr-analyzing-sub">파일 구조와 부품 항목을 확인하는 중입니다.</div>
        <div class="ocr-analyzing-file">${escapeHtml(fileName)}</div>
      </div>
    </div>`;
  setTimeout(() => {
    const rows = generateDummyOcr(fileName, d.id).map((r, i) => Object.assign({
      rowId: "ROW-" + Date.now() + "-" + i,
      seq: i + 1,
      ocrOriginal: { partName: r.partName, partNumber: r.partNumber, partCategory: r.partCategory, quantity: r.quantity, claimAmount: r.claimAmount, assessedAmount: r.assessedAmount },
    }, r));
    ocrState = { claimId: d.id, fileName: fileName, sourceType: "AI-OCR", rows: rows, editingResolutionId: null };
    renderOcrEditor(d);
  }, 900);
}

/* ---- 기존 지급결의 수정 (목록의 '수정' 버튼) ---- */
function openOcrEditor(d, resolution) {
  const root = $("#ocrModalRoot");
  if (!root) return;
  const rows = resolution.rows.map(r => Object.assign({}, r, { ocrOriginal: r.ocrOriginal }));
  ocrState = { claimId: d.id, fileName: resolution.sourceFileName, sourceType: resolution.sourceType, rows: rows, editingResolutionId: resolution.id };
  root.innerHTML = `<div class="modal-backdrop" data-ocr-close></div><section class="action-modal ocr-modal ocr-editor" role="dialog" aria-modal="true"></section>`;
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  renderOcrEditor(d);
}

/* ---- 금액 계산 ---- */
function ocrTotals() {
  const claim = ocrState.rows.reduce((s, r) => s + Number(r.claimAmount || 0), 0);
  const assessed = ocrState.rows.reduce((s, r) => s + (r.denied ? 0 : Number(r.assessedAmount || 0)), 0);
  return { claim, assessed };
}

/* ---- 결과 편집기 렌더 ---- */
function renderOcrEditor(d) {
  const root = $("#ocrModalRoot");
  let modal = root.querySelector(".ocr-modal");
  if (!modal) { openOcrUpload(d); return; }
  modal.classList.add("ocr-editor");
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  const editing = !!ocrState.editingResolutionId;
  modal.innerHTML = `
    <div class="modal-head">
      <div>
        <div class="modal-eyebrow">AI-OCR <span class="ocr-pro-tag">Pro</span>${editing ? ' · 결의 수정' : ''}</div>
        <div class="modal-title">부품청구서 OCR 결과</div>
        <div class="modal-sub">${escapeHtml(ocrState.fileName || "")} · 담당자가 검토·수정 후 확정하세요.</div>
      </div>
      <button class="modal-close" type="button" data-ocr-close aria-label="닫기">×</button>
    </div>
    <div class="modal-body">
      <div class="ocr-tblwrap">
        <table class="ocr-tbl" id="ocrTbl">
          <colgroup><col style="width:44px"><col><col style="width:130px"><col style="width:86px"><col style="width:64px"><col style="width:46px"><col style="width:110px"><col style="width:110px"><col style="width:40px"></colgroup>
          <thead><tr>
            <th>순번</th><th>부품명</th><th>부품번호</th><th>부품항목</th><th>수량</th><th>불인</th>
            <th class="num">청구금액</th><th class="num">손해사정금액</th><th></th>
          </tr></thead>
          <tbody id="ocrTbody">${ocrRowsHtml()}</tbody>
        </table>
      </div>
      <div class="ocr-tbl-actions">
        <button class="btn-modal ghost" type="button" id="ocrAddRow" data-desc="OCR이 누락한 부품 항목을 직접 추가합니다.">＋ 행 추가</button>
        <span class="ocr-empty-note" id="ocrEmptyNote" ${ocrState.rows.length ? "hidden" : ""}>인식된 부품 항목이 없습니다. 파일을 다시 등록하거나 행을 직접 추가하세요.</span>
      </div>
      ${ocrSummaryHtml(fault)}
    </div>
    <div class="modal-foot">
      ${editing && !fault.confirmed ? `<span class="ocr-fault-warn">과실율 확정 후 결의입력하세요</span>` : ""}
      <button class="btn-modal" type="button" data-ocr-close>취소</button>
      ${editing
        ? `<button class="btn-modal primary" type="button" id="ocrConfirm" ${fault.confirmed ? "" : "disabled"} data-desc="검토·수정한 내용으로 부품 지급결의를 재확정합니다.">재확정</button>`
        : `<button class="btn-modal primary" type="button" id="ocrConfirm" data-desc="검토·수정한 부품 내역을 청구내역 테이블에 반영합니다. (저장은 별도 '저장' 버튼)">확정 (청구내역 반영)</button>`}
    </div>`;
  bindOcrEditor(d);
}

function ocrRowsHtml() {
  return ocrState.rows.map((r, i) => {
    const catOpts = OCR_PART_CATEGORIES.map(c => `<option value="${c}" ${c === r.partCategory ? "selected" : ""}>${c}</option>`).join("")
      + (OCR_PART_CATEGORIES.indexOf(r.partCategory) < 0 && r.partCategory ? `<option value="${escapeHtml(r.partCategory)}" selected>${escapeHtml(r.partCategory)}</option>` : "");
    const chg = f => ocrRowChanged(r, f) ? " ocr-chg" : "";
    return `<tr data-row="${i}">
      <td class="ta-c ocr-seq">${i + 1}</td>
      <td><input type="text" class="ocr-in${chg("partName")}" data-f="partName" value="${escapeHtml(r.partName || "")}"></td>
      <td><input type="text" class="ocr-in${chg("partNumber")}" data-f="partNumber" value="${escapeHtml(r.partNumber || "")}"></td>
      <td><select class="ocr-in${chg("partCategory")}" data-f="partCategory">${catOpts}</select></td>
      <td><input type="number" min="1" class="ocr-in ta-c${chg("quantity")}" data-f="quantity" value="${Number(r.quantity || 0)}"></td>
      <td class="ta-c"><input type="checkbox" class="ocr-denied" data-f="denied" ${r.denied ? "checked" : ""}></td>
      <td class="num"><input type="number" min="0" class="ocr-in num${chg("claimAmount")}" data-f="claimAmount" value="${Number(r.claimAmount || 0)}"></td>
      <td class="num"><input type="number" min="0" class="ocr-in num${chg("assessedAmount")}" data-f="assessedAmount" value="${Number(r.assessedAmount || 0)}" ${r.denied ? "disabled" : ""}></td>
      <td class="ta-c"><button type="button" class="ocr-delrow" data-del="${i}" title="행 삭제" aria-label="행 삭제">✕</button></td>
    </tr>`;
  }).join("");
}

// OCR 원본 대비 변경 여부(강조용)
function ocrRowChanged(r, field) {
  if (!r.ocrOriginal) return false;
  return String(r.ocrOriginal[field]) !== String(r[field]);
}

function ocrSummaryHtml(fault) {
  const t = ocrTotals();
  const offset = Math.round(t.assessed * (fault.pct / 100));
  const final = t.assessed - offset;
  return `<div class="ocr-summary" id="ocrSummary">
    <div class="ocr-sum-fault">자차 과실률 <b>${fault.pct}%</b> <span class="${fault.confirmed ? "ok" : "warn"}">(${fault.confirmed ? "확정" : "미확정"})</span> · 과실상계는 손해사정금액에만 적용</div>
    <table class="ocr-sum-tbl">
      <tr><th></th><th class="num">청구금액</th><th class="num">손해사정금액</th></tr>
      <tr><td>합계</td><td class="num" id="ocrSumClaim">${won(t.claim)}원</td><td class="num" id="ocrSumAssessed">${won(t.assessed)}원</td></tr>
      <tr><td>과실상계금액</td><td class="num dim">-</td><td class="num neg" id="ocrSumOffset">-${won(offset)}원</td></tr>
      <tr class="ocr-sum-final"><td>최종 지급예정금액</td><td class="num dim">-</td><td class="num strong" id="ocrSumFinal">${won(final)}원</td></tr>
    </table>
  </div>`;
}

function updateOcrSummary(d) {
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  const t = ocrTotals();
  const offset = Math.round(t.assessed * (fault.pct / 100));
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("ocrSumClaim", won(t.claim) + "원");
  set("ocrSumAssessed", won(t.assessed) + "원");
  set("ocrSumOffset", "-" + won(offset) + "원");
  set("ocrSumFinal", won(t.assessed - offset) + "원");
}

function bindOcrEditor(d) {
  const root = $("#ocrModalRoot");
  root.querySelectorAll("[data-ocr-close]").forEach(b => b.addEventListener("click", closeOcrModal));

  // 셀 입력 — 키 입력마다 상태만 갱신(포커스 유지), 합계는 라이브 갱신
  root.querySelectorAll(".ocr-in").forEach(inp => {
    const tr = inp.closest("tr"); const i = parseInt(tr.dataset.row, 10); const f = inp.dataset.f;
    inp.addEventListener("input", () => {
      let v = inp.value;
      if (f === "quantity") { v = Math.max(1, Math.floor(Number(v) || 1)); if (Number(inp.value) < 1) inp.value = v; }
      if (f === "claimAmount" || f === "assessedAmount") { v = Math.max(0, Math.floor(Number(v) || 0)); if (Number(inp.value) < 0) inp.value = v; }
      ocrState.rows[i][f] = v;
      inp.classList.toggle("ocr-chg", ocrRowChanged(ocrState.rows[i], f));
      if (f === "claimAmount" || f === "assessedAmount") updateOcrSummary(d);
    });
  });

  // 불인 체크 — 손해사정금액 0/입력가능 토글
  root.querySelectorAll(".ocr-denied").forEach(chk => {
    const tr = chk.closest("tr"); const i = parseInt(tr.dataset.row, 10);
    chk.addEventListener("change", () => {
      ocrState.rows[i].denied = chk.checked;
      if (chk.checked) ocrState.rows[i].assessedAmount = 0; // 불인 시 0원. 해제해도 자동 복원하지 않음.
      const assessedInput = tr.querySelector('input[data-f="assessedAmount"]');
      if (assessedInput) { assessedInput.disabled = chk.checked; if (chk.checked) assessedInput.value = 0; }
      updateOcrSummary(d);
    });
  });

  // 행 추가
  const addBtn = $("#ocrAddRow");
  if (addBtn) addBtn.addEventListener("click", () => {
    ocrState.rows.push({
      rowId: "ROW-" + Date.now() + "-" + ocrState.rows.length,
      seq: ocrState.rows.length + 1,
      partName: "", partNumber: "", partCategory: "교환", quantity: 1, denied: false,
      claimAmount: 0, assessedAmount: 0, ocrOriginal: null, ocrAdded: true,
    });
    renderOcrEditor(d);
  });

  // 행 삭제
  root.querySelectorAll(".ocr-delrow").forEach(btn => btn.addEventListener("click", () => {
    const i = parseInt(btn.dataset.del, 10);
    ocrState.rows.splice(i, 1);
    renderOcrEditor(d);
  }));

  // 확정 / 재확정
  const confirm = $("#ocrConfirm");
  if (confirm) confirm.addEventListener("click", () => confirmOcrResolution(d));
}

/* ---- 수정이력 산출 (확정/재확정 시 OCR 원본↔최종 비교) ---- */
const OCR_FIELD_LABELS = { partName: "부품명", partNumber: "부품번호", partCategory: "부품항목", quantity: "수량", denied: "불인", claimAmount: "청구금액", assessedAmount: "손해사정금액" };
function diffOcrRows(rows, actor) {
  const at = apprNow();
  const hist = [];
  rows.forEach((r, i) => {
    const seq = i + 1;
    if (r.ocrAdded || !r.ocrOriginal) {
      hist.push({ rowSeq: seq, changeType: "행추가", field: null, fieldLabel: "OCR 누락 행 직접 추가", before: null, after: r.partName || "(빈 행)", changedBy: actor.id, changedAt: at });
      return;
    }
    ["partName", "partNumber", "partCategory", "quantity", "claimAmount", "assessedAmount", "denied"].forEach(f => {
      const before = r.ocrOriginal[f], after = r[f];
      if (String(before) !== String(after)) {
        hist.push({ rowSeq: seq, changeType: f === "denied" ? "불인변경" : "행수정", field: f, fieldLabel: OCR_FIELD_LABELS[f], before: before, after: after, changedBy: actor.id, changedAt: at });
      }
    });
  });
  return hist;
}

/* ===================== 미저장 부품 스테이징 (확정→청구내역 반영, 저장→결의) =====================
   확정 시 곧바로 지급결의로 저장하지 않고, 청구내역 테이블에 '추가부품'으로 반영(스테이징).
   담당자가 정비 견적과 부품을 함께 확인한 뒤 별도 '저장' 버튼으로 부품 지급결의를 확정한다.
   프로토타입은 localStorage로 화면 간 유지. */
const OCR_STAGE_LS_KEY = "claimOcrStaged";
let ocrStagedMap = null; // { claimId: { fileName, sourceType, rows, editHistory } }
function ocrLoadStaged() {
  if (ocrStagedMap) return;
  try { ocrStagedMap = JSON.parse(localStorage.getItem(OCR_STAGE_LS_KEY) || "{}") || {}; } catch (e) { ocrStagedMap = {}; }
}
function ocrPersistStaged() { try { localStorage.setItem(OCR_STAGE_LS_KEY, JSON.stringify(ocrStagedMap || {})); } catch (e) {} }
function ocrGetStaged(claimId) { ocrLoadStaged(); return ocrStagedMap[claimId] || null; }
function ocrSetStaged(claimId, batch) { ocrLoadStaged(); ocrStagedMap[claimId] = batch; ocrPersistStaged(); }
function ocrClearStaged(claimId) { ocrLoadStaged(); delete ocrStagedMap[claimId]; ocrPersistStaged(); }

// 확정: 신규는 청구내역에 반영(스테이징), 편집은 기존 부품결의 재확정
function confirmOcrResolution(d) {
  if (!ocrState || !ocrState.rows.length) {
    showToast("인식된 부품 항목이 없습니다. 파일을 다시 등록하거나 행을 직접 추가하세요.");
    return;
  }
  const c = CLAIMS.find(x => x.id === d.id);
  const staff = srCurrentStaff(c);
  const editing = ocrState.editingResolutionId ? getResolution(ocrState.editingResolutionId) : null;

  const rows = ocrState.rows.map((r, i) => ({
    rowId: r.rowId, seq: i + 1,
    partName: r.partName, partNumber: r.partNumber, partCategory: r.partCategory,
    quantity: Number(r.quantity) || 1, denied: !!r.denied,
    claimAmount: Number(r.claimAmount) || 0,
    assessedAmount: r.denied ? 0 : (Number(r.assessedAmount) || 0),
    ocrOriginal: r.ocrOriginal || null,
  }));
  const newHist = diffOcrRows(ocrState.rows, staff);

  if (editing) {
    // 기존 부품 지급결의 재확정 (과실률 확정 필요)
    const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
    if (!fault.confirmed) { showToast("과실율 확정 후 결의입력하세요"); return; }
    editing.rows = rows;
    editing.faultRateAtConfirmed = fault.pct;
    recalcResolutionAmounts(editing, fault.pct);
    editing.editHistory = (editing.editHistory || []).concat(newHist);
    editing.status = "결재 전";
    editing.faultRateAtReview = null;
    editing.updatedAt = apprNow();
    persistResolutions();
    showToast(`${d.id} 부품 지급결의 ${editing.resolutionSeq}가 재확정되었습니다.`);
  } else {
    // 신규: 청구내역 테이블에 반영(스테이징). 저장은 별도 '저장' 버튼.
    ocrSetStaged(d.id, { fileName: ocrState.fileName, sourceType: ocrState.sourceType || "AI-OCR", rows: rows, editHistory: newHist });
    if (typeof estimateDocType !== "undefined") estimateDocType = "claim"; // 부품청구서는 청구서 보기
    showToast(`부품청구서 ${ocrState.fileName}이(가) 청구내역에 반영되었습니다. '저장'을 눌러 부품 지급결의로 저장하세요.`);
  }
  closeOcrModal();
  renderIntake();
}

// 지급결의 저장소 생성 헬퍼 (정비/부품 공용) — resolutionSeq는 push 시점 기준으로 순차 부여
function ocrMakeResolution(d, staff, type, sourceType, fileName, rows, editHistory, faultPct) {
  const res = {
    id: nextResolutionId(),
    claimNo: d.id,
    resolutionSeq: nextResolutionSeq(d.id),
    resolutionType: type,
    sourceType: sourceType,
    sourceFileName: fileName,
    documentType: "claim",
    status: "결재 전",
    faultRateAtConfirmed: faultPct,
    claimAmount: 0, assessedAmountBeforeFault: 0, faultOffsetAmount: 0, finalAssessedAmount: 0,
    rows: rows,
    editHistory: editHistory || [],
    currentApprovalId: null,
    approvalHistoryIds: [],
    confirmedBy: staff.id,
    confirmedByName: staff.name,
    confirmedAt: apprNow(),
    updatedAt: apprNow(),
  };
  recalcResolutionAmounts(res, faultPct);
  PAYMENT_RESOLUTIONS.push(res);
  return res;
}

// 저장: 현재 청구내역을 지급결의로 확정 저장 (과실률 확정 필요)
//  - 정비 견적이 아직 결의 저장 안 됨 → 정비 지급결의 저장
//  - 부품(OCR) 반영분이 있음 → 부품 지급결의 저장
//  - 둘 다면 함께 저장(정비→부품 순번). 정비가 이미 저장됐으면 부품만 다음 순번.
function saveClaimResolutions(d) {
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  if (!fault.confirmed) { showToast("과실율 확정 후 결의입력하세요"); return; }
  const c = CLAIMS.find(x => x.id === d.id);
  const staff = srCurrentStaff(c);
  const hasMech = resolutionsFor(d.id).some(r => r.resolutionType === "정비");
  const mechRows = (d.estimateDoc && d.estimateDoc.claim) ? d.estimateDoc.claim : [];
  const staged = ocrGetStaged(d.id);
  const saved = [];

  // 1) 정비 지급결의 (정비 견적 존재 + 미저장)
  if (!hasMech && mechRows.length) {
    const rows = mechRows.map((r, i) => ({
      rowId: "MECH-" + Date.now() + "-" + i, seq: i + 1,
      partName: r.n, partNumber: "-", partCategory: r.it || "",
      quantity: Number(r.base.unit) || 1, denied: !!r.adjust.denied,
      claimAmount: Number(r.base.amount) || 0,
      assessedAmount: r.adjust.denied ? 0 : (Number(r.adjust.amount) || 0),
      ocrOriginal: null,
    }));
    saved.push(ocrMakeResolution(d, staff, "정비", "견적", "정비청구서_" + d.id, rows, [], fault.pct));
  }

  // 2) 부품 지급결의 (OCR 반영분)
  if (staged) {
    const dup = resolutionsFor(d.id).some(r => r.sourceFileName === staged.fileName);
    if (dup && !window.confirm("동일한 파일명으로 저장된 지급결의가 있습니다.\n계속 등록하시겠습니까?")) return;
    saved.push(ocrMakeResolution(d, staff, "부품", staged.sourceType || "AI-OCR", staged.fileName, staged.rows, staged.editHistory || [], fault.pct));
    ocrClearStaged(d.id);
  }

  if (!saved.length) { showToast("저장할 청구 내역이 없습니다."); return; }
  persistResolutions();
  const label = saved.map(r => `${r.resolutionType} 지급결의 ${r.resolutionSeq}`).join(", ");
  showToast(`${d.id} ${label}가 저장되었습니다.`);
  renderIntake();
}

// 미저장 부품 취소 (청구내역 반영 철회)
function cancelStagedOcr(d) {
  if (!ocrGetStaged(d.id)) return;
  if (!window.confirm("반영한 미저장 부품 내역을 취소하시겠습니까?")) return;
  ocrClearStaged(d.id);
  showToast("미저장 부품 내역을 취소했습니다.");
  renderIntake();
}

// ESC 닫기 — 다른 모달과 동일 관례
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    const root = $("#ocrModalRoot");
    if (root && root.classList.contains("open")) closeOcrModal();
  }
});
