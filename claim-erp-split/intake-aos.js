/* intake-aos.js — AOS 손해사정 재원 가져오기 (견적 정보 내 '재원 카드')
   ─────────────────────────────────────────────────────────────
   흐름:
   · '견적 정보' 섹션 안의 [AOS 가져오기] → 정비공장 재원을 '재원 카드'로 표시(읽기전용)
   · [＋추가] → 부품/유리 등 다른 지급처 재원을 추가 카드로 가져오기
   · 재원 '합계(VAT포함)'는 저장되는 지급결의의 '손해사정' 금액에 반영(saveClaimResolutions)
   · 저장·결재는 기존 '지급결의 저장' + '지급결의 저장내역' + '결재순번/결재이력' 재사용
   (별도 AOS 저장내역/상태머신 없음)
   ───────────────────────────────────────────────────────────── */

/* ===== §2 데이터 계약: AOS 스냅샷 mock (종류/지급처별 재원) =====
   실연동 시 이 함수만 API 호출로 교체하고 반환 shape는 유지한다. */
function aosMockSnapshot(claimId) {
  return {
    snapshotId: "SNAP-" + Date.now().toString(36),
    claimId: claimId,
    capturedAt: new Date().toISOString(),
    source: "aos",
    funds: {
      "정비": { 지급처: "1급비손 모터스 공업사", 재원: {
        탈착교환: 191400, 판금교정: 315000, 도장정산: 415069, 공임소계: 921469,
        감가상각: 0, 잔존물: 0, 부가세율: 10, 부가세: 92146,
        과실상계율: 0, 과실상계액: 0, 합계: 1013615 } },
      "부품": { 지급처: "대한상사(주)", 재원: {
        부품소계: 1028760, 감가상각: 0, 잔존물: 0, 부가세율: 10, 부가세: 102876,
        과실상계율: 0, 과실상계액: 0, 합계: 1131636 } },
      "유리": { 지급처: "정산글라스(주)", 재원: {
        유리대: 454545, 부품소계: 454545, 감가상각: 0, 부가세율: 10, 부가세: 45455,
        과실상계율: 0, 과실상계액: 0, 합계: 500000 } },
    },
  };
}
const AOS_TYPES = ["정비", "부품", "유리"];

/* ===== 가져온 재원 상태 (세션 유지: localStorage 캐시) ===== */
const aosImported = {};   // { [claimId]: { 정비?:{지급처,재원,capturedAt}, 부품?:{...}, 유리?:{...} } }
const aosAddOpen = {};    // '＋추가' 인라인 선택 열림 여부
const AOS_CACHE_PREFIX = "sk_claim_aos_";
function aosLoad(claimId) {
  if (aosImported[claimId]) return aosImported[claimId];
  try { aosImported[claimId] = JSON.parse(localStorage.getItem(AOS_CACHE_PREFIX + claimId) || "null") || {}; }
  catch (e) { aosImported[claimId] = {}; }
  return aosImported[claimId];
}
function aosPersist(claimId) {
  try { localStorage.setItem(AOS_CACHE_PREFIX + claimId, JSON.stringify(aosImported[claimId] || {})); } catch (e) {}
}

/* 손해사정 반영용: 가져온 종류의 재원 합계 (없으면 null) — saveClaimResolutions에서 참조 */
function aosAssessedTotal(claimId, type) {
  const imp = aosLoad(claimId);
  return imp[type] ? Number(imp[type].재원.합계 || 0) : null;
}

/* ===== 재원 카드 필드 정의 (종류별 표기 순서) ===== */
const AOS_FIELD_ROWS = {
  "정비": [["탈착교환", "탈착교환"], ["판금교정", "판금교정"], ["도장정산", "도장정산"], ["공임소계", "공임소계"], ["감가상각", "감가상각"], ["잔존물", "잔존물"], ["부가세", "부가세"], ["과실상계", "과실상계액"]],
  "부품": [["부품소계", "부품소계"], ["감가상각", "감가상각"], ["잔존물", "잔존물"], ["부가세", "부가세"], ["과실상계", "과실상계액"]],
  "유리": [["유리대", "유리대"], ["부품소계", "부품소계"], ["감가상각", "감가상각"], ["부가세", "부가세"], ["과실상계", "과실상계액"]],
};

/* ===== 렌더 ===== */
function aosCardHtml(type, entry) {
  const f = entry.재원 || {};
  const rows = (AOS_FIELD_ROWS[type] || []).map(([label, key]) => {
    let lab = label;
    if (key === "부가세" && f.부가세율 != null) lab = `부가세(${f.부가세율}%)`;
    if (key === "과실상계액" && f.과실상계율) lab = `과실상계(${f.과실상계율}%)`;
    return `<div class="aos-fig"><span class="k">${iEsc(lab)}</span><span class="v">${won(Number(f[key] || 0))}</span></div>`;
  }).join("");
  const cap = (entry.capturedAt || "").replace("T", " ").slice(0, 16);
  return `<div class="aos-card" data-aos-card="${iEsc(type)}">
    <div class="aos-card-hd">
      <span class="aos-kind">${iEsc(type)} 재원</span>
      <span class="aos-payto">지급처 · ${iEsc(entry.지급처)}</span>
      <button type="button" class="aos-card-x" data-aos-remove="${iEsc(type)}" title="재원 카드 제거" data-desc="이 재원 카드를 제거합니다.">✕</button>
    </div>
    <div class="aos-figs">${rows}</div>
    <div class="aos-fig strong"><span class="k">합계(VAT포함)</span><span class="v">${won(Number(f.합계 || 0))}</span></div>
    <div class="aos-reflect">🚗 AOS · ${iEsc(cap)} → <b>${iEsc(type)} 지급결의</b> 손해사정에 반영 <b>${won(Number(f.합계 || 0))}</b>원</div>
  </div>`;
}

// 견적 정보 섹션 내부에 삽입되는 AOS 바 (버튼 + 재원 카드들)
function aosBarHtml(d) {
  const imp = aosLoad(d.id);
  const importedTypes = AOS_TYPES.filter(t => imp[t]);
  const notImported = AOS_TYPES.filter(t => !imp[t]);
  const cards = importedTypes.map(t => aosCardHtml(t, imp[t])).join("");
  const chooser = (aosAddOpen[d.id] && notImported.length)
    ? `<span class="aos-add-menu">${notImported.map(t => `<button type="button" class="lg-abtn" data-aos-add="${iEsc(t)}" data-desc="${iEsc(t)} 지급처 재원을 AOS에서 가져옵니다.">${iEsc(t)} 가져오기</button>`).join("")}
        <button type="button" class="lg-abtn" data-aos-add-cancel data-desc="추가 선택을 닫습니다.">취소</button></span>`
    : "";
  return `<div class="aos-bar">
    <div class="aos-bar-head">
      <button type="button" class="aos-import-btn" id="aosImportBtn" data-desc="AOS 손해사정(정산) 재원을 가져옵니다. 정비공장 재원이 재원 카드로 표시되고, 저장 시 지급결의 손해사정 금액에 반영됩니다.">🚗 AOS 가져오기</button>
      ${importedTypes.length ? `<button type="button" class="lg-abtn" id="aosAddBtn" ${notImported.length ? "" : "disabled"} data-desc="부품/유리 등 다른 지급처 재원을 추가로 가져옵니다.">＋ 추가</button>` : ""}
      ${chooser}
      <span class="aos-hint">가져온 재원 합계가 해당 지급결의의 손해사정 금액에 반영됩니다.</span>
    </div>
    ${cards ? `<div class="aos-cards">${cards}</div>` : ""}
  </div>`;
}

/* ===== 동작 ===== */
function aosImport(d, type) {
  const fund = aosMockSnapshot(d.id).funds[type];
  if (!fund) { showToast(type + " 재원이 AOS에 없습니다."); return; }
  const imp = aosLoad(d.id);
  imp[type] = { 지급처: fund.지급처, 재원: fund.재원, capturedAt: new Date().toISOString() };
  aosPersist(d.id);
  aosAddOpen[d.id] = false;
  aosRerender(d);
  showToast(`AOS ${type} 재원을 가져왔습니다. 손해사정 반영 ${won(Number(fund.재원.합계 || 0))}원 · '${type === "정비" ? "정비 지급결의 저장" : type + " 지급결의 저장"}'으로 확정하세요. (데모)`);
}
function aosRemove(d, type) {
  const imp = aosLoad(d.id);
  delete imp[type];
  aosPersist(d.id);
  aosRerender(d);
  showToast(`AOS ${type} 재원 카드를 제거했습니다.`);
}
function aosRerender(d) {
  const body = $("#intakeBody");
  if (!body) return;
  body.innerHTML = renderIntakeTab("estimate", d);
  bindIntakeEstimate(d);
}

/* ===== 바인딩 — bindIntakeEstimate에서 호출 ===== */
function bindIntakeAos(d) {
  const body = $("#intakeBody");
  if (!body || !body.querySelector(".aos-bar")) return;
  const on = (sel, fn) => { const el = body.querySelector(sel); if (el) el.addEventListener("click", fn); };
  on("#aosImportBtn", () => aosImport(d, "정비"));
  on("#aosAddBtn", () => { aosAddOpen[d.id] = true; aosRerender(d); });
  on("[data-aos-add-cancel]", () => { aosAddOpen[d.id] = false; aosRerender(d); });
  body.querySelectorAll("[data-aos-add]").forEach(b => b.addEventListener("click", () => aosImport(d, b.dataset.aosAdd)));
  body.querySelectorAll("[data-aos-remove]").forEach(b => b.addEventListener("click", () => aosRemove(d, b.dataset.aosRemove)));
}
