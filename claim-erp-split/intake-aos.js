/* intake-aos.js — AOS 스냅샷 가져오기 (AI-OCR과 유사한 견적 스냅샷 임포트)
   ─────────────────────────────────────────────────────────────
   흐름 (AI-OCR로 청구서를 전산화하듯, 이번엔 AOS를 '스냅샷'으로 가져옴):
   · 견적 정보 섹션의 [AOS 가져오기](AI-OCR 버튼 왼쪽) 클릭
     → 현재 보기(선견적/청구서)의 견적내역 그리드에 라인아이템이 펼쳐지고
     → 차량 사진(스냅샷 이미지)도 함께 들어오고
     → 그리드 하단에 '재원 정산 합계 카드'가 표시됨
   · 정비업체는 수리 전 '선견적' 1번, 수리 후 '청구서' 1번 발송 → 각각 가져오기(모드별)
   · 오른쪽 아래 '정비 지급결의 저장'(기존 버튼) → 정비 지급결의 1건 생성/저장
     (재원 정산 합계가 그 지급결의의 손해사정 금액에 반영)
   · '＋추가' → 부품/유리 등 별도 지급처 재원 카드 추가(각자의 지급결의 손해사정 반영)
   저장·결재는 기존 '지급결의 저장내역' + '결재순번/결재이력' 재사용.
   ───────────────────────────────────────────────────────────── */

/* ===== §2 데이터 계약: AOS 스냅샷 mock ===== */
// 견적 라인아이템 [구분, 작업내용, 작업항목, 단위(시간), 청구금액, 불인정]
const AOS_EST_ROWS = [
  ["부품", "에어덕트-프론트범퍼,좌측", "86543L1100", 1, 2400, false],
  ["부품", "에어덕트-프론트범퍼,우측", "86544L1100", 1, 2400, false],
  ["부품", "몰딩-범퍼,하부,좌측", "865C1L1080", 1, 4300, false],
  ["부품", "몰딩-범퍼,하부,우측", "865C2L1080", 1, 4300, false],
  ["도장", "프론트범퍼 교환", "도장", 2.01, 126200, false],
  ["주체", "프론트범퍼사이드마운팅브라켓(펜더부착)(좌)", "교환", 0.17, 5100, false],
  ["부품", "브라켓-프론트 범퍼 사이드,좌측", "86551L1000", 1, 2000, false],
  ["주체", "스티프너", "불인정", 0.17, 5100, true],
  ["주체", "라디에이터그릴", "불인정", 0.44, 13200, true],
];
function aosClaimRows() { return AOS_EST_ROWS.map(([g, n, it, u, a, denied]) => estRow(g, n, it, u, a, denied ? { denied: true } : null)); }
function aosPreRows() { return AOS_EST_ROWS.filter(r => !r[5]).map(([g, n, it, u, a]) => estRow(g, n, it, u, Math.round(a * 1.05 / 10) * 10)); }

// 정비 재원 정산 상세 (손해사정 재원) — 공임 소계 / 부품 소계 / 부가세 / 자기부담금액
const AOS_MECH_FUND = {
  공임: { 탈착교환: 191400, 판금교정: 315000, 견인구난비: 0, 도장정산: 415069,
    // 도장정산 = 도장재료대 + 도장공임 + 할증공임 + 가열건조비
    도장재료대: 165500, 도장공임: 233700, 할증공임: 0, 가열건조비: 15869, 공임소계: 921469 },
  부품: { 순정부품: 0, 순정부품할인율: 0, 방청부품: 0, 방청부품할인율: 0, 유리부품: 0, 부품소계: 0 },
  부가세율: 10, 자기부담금액: 0,
};
// 값 스케일 복제 (선견적 = 청구 대비 소폭 상향, 율 필드는 유지)
function aosDeriveFund(base, f) {
  const walk = o => {
    const r = {};
    for (const k in o) {
      const v = o[k];
      r[k] = (v && typeof v === "object") ? walk(v) : (/율$/.test(k) ? v : (typeof v === "number" ? Math.round(v * f / 10) * 10 : v));
    }
    return r;
  };
  return walk(base);
}
// 정비 재원 → 지급액(손해사정 반영액) = 공임소계+부품소계 + 부가세 − 자기부담금액
function aosMechDerive(f) {
  const 소계 = Number((f.공임 || {}).공임소계 || 0) + Number((f.부품 || {}).부품소계 || 0);
  const 부가세 = Math.floor(소계 * (Number(f.부가세율) || 0) / 100);
  const 자부담 = Number(f.자기부담금액) || 0;
  return { 소계, 부가세, 합계: 소계 + 부가세, 자부담, 지급액: 소계 + 부가세 - 자부담 };
}

function aosMockSnapshot(claimId) {
  return {
    snapshotId: "SNAP-" + Date.now().toString(36),
    claimId: claimId, capturedAt: new Date().toISOString(), source: "aos",
    payTo: "1급비손 모터스 공업사",
    estimate: { pre: aosPreRows(), claim: aosClaimRows() },
    images: [
      { folder: "수리전사진", id: "aos-b1", name: "AOS_입고_전면.jpg", date: "AOS", url: "assets/accident_car/repair_01.jpg" },
      { folder: "수리전사진", id: "aos-b2", name: "AOS_범퍼_파손.jpg", date: "AOS", url: "assets/accident_car/repair_02.jpg" },
      { folder: "수리전사진", id: "aos-b3", name: "AOS_그릴_파손.jpg", date: "AOS", url: "assets/accident_car/repair_03.jpg" },
      { folder: "수리완료사진", id: "aos-a1", name: "AOS_도장완료_전면.jpg", date: "AOS", url: "assets/accident_car/repair_07.jpg" },
      { folder: "수리완료사진", id: "aos-a2", name: "AOS_완료_범퍼.jpg", date: "AOS", url: "assets/accident_car/repair_08.jpg" },
    ],
    // 정비 재원 정산 (모드별) — AOS 손해사정 재원 상세 (첨부 IMG_4741 기준)
    funds: { claim: AOS_MECH_FUND, pre: aosDeriveFund(AOS_MECH_FUND, 1.02) },
    // '＋추가' 별도 지급처 재원 (부품/유리)
    extra: {
      "부품": { 지급처: "대한상사(주)", 재원: { 부품소계: 1028760, 감가상각: 0, 잔존물: 0, 부가세율: 10, 부가세: 102876, 과실상계율: 0, 과실상계액: 0, 합계: 1131636 } },
      "유리": { 지급처: "정산글라스(주)", 재원: { 유리대: 454545, 부품소계: 454545, 감가상각: 0, 부가세율: 10, 부가세: 45455, 과실상계율: 0, 과실상계액: 0, 합계: 500000 } },
    },
  };
}
const AOS_ADD_TYPES = ["부품", "유리"];

/* ===== 가져온 상태 (세션 유지) ===== */
const aosImported = {};   // { [claimId]: { 정비?:{정산}, 부품?:{재원}, 유리?:{재원} } }
const aosAddOpen = {};
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

/* 손해사정 반영용: 가져온 종류의 반영액 (없으면 null) — saveClaimResolutions에서 참조
   정비=청구서 재원 지급액(저장은 청구서 단계), 부품/유리=재원 합계 */
function aosAssessedTotal(claimId, type) {
  const imp = aosLoad(claimId);
  if (type === "정비") { const c = imp["정비"] && imp["정비"].claim; return c ? Number(c.지급액 || 0) : null; }
  const e = imp[type];
  return e ? Number(e.합계 || 0) : null;
}

/* 스냅샷 이미지 주입 (차량 사진 스트립에 표시) */
function aosInjectImages(claimId, images) {
  if (typeof CLAIM_IMAGES === "undefined") return;
  const store = CLAIM_IMAGES[claimId] || (CLAIM_IMAGES[claimId] = {});
  images.forEach(im => {
    store[im.folder] = store[im.folder] || [];
    if (!store[im.folder].some(x => x.id === im.id)) store[im.folder].push(mkImg(im.id, im.name, im.date || "", "shop", im.url));
  });
}

/* ===== 렌더 ===== */
// 견적 정보 토글/빈바에 들어갈 [AOS 가져오기] 버튼 (AI-OCR 왼쪽)
function aosImportBtnHtml() {
  return `<button type="button" class="aos-import-btn" id="aosImportBtn" data-desc="AOS 손해사정 스냅샷을 가져옵니다. 현재 보기(선견적/청구서)의 견적내역·차량사진이 함께 들어오고, 하단에 재원 정산 합계 카드가 표시됩니다. (선견적 1번, 청구서 1번 가져오기)">🚗 AOS 가져오기</button>`;
}

const AOS_ADD_FIELD_ROWS = {
  "부품": [["부품소계", "부품소계"], ["감가상각", "감가상각"], ["잔존물", "잔존물"], ["부가세", "부가세"], ["과실상계", "과실상계액"]],
  "유리": [["유리대", "유리대"], ["부품소계", "부품소계"], ["감가상각", "감가상각"], ["부가세", "부가세"], ["과실상계", "과실상계액"]],
};

// 증감 칩 (현재값 − 상대모드값) — 값이 다를 때만
function aosDeltaChip(cur, other) {
  if (other == null) return "";
  const d = Number(cur || 0) - Number(other || 0);
  if (d === 0) return "";
  return `<span class="aos-delta ${d > 0 ? "up" : "down"}">${d > 0 ? "▲" : "▼"}${won(Math.abs(d))}</span>`;
}

// 정비 재원 정산 카드 — 공임 소계 / 부품 소계 / 소계 / 부가세 / 자기부담금액 → 지급액
//  other: 상대 모드(선견적↔청구서) 재원 → 선견적 대비 증감 표시
function aosMechCardHtml(entry, other, mode) {
  const modeLabel = mode === "pre" ? "선견적" : "청구서";
  const otherLabel = mode === "pre" ? "청구서" : "선견적";
  const cap = (entry.capturedAt || "").replace("T", " ").slice(0, 16);
  const gj = entry.공임 || {}, bp = entry.부품 || {};
  const ogj = (other && other.공임) || {}, obp = (other && other.부품) || {};
  const der = aosMechDerive(entry);
  const od = other ? aosMechDerive(other) : null;
  const fig = (k, v) => `<div class="aos-fig"><span class="k">${k}</span><span class="v">${won(Number(v || 0))}</span></div>`;
  const figRate = (label, rate, v) => `<div class="aos-fig"><span class="k">${label}${rate ? ` <em>${rate}%</em>` : ""}</span><span class="v">${won(Number(v || 0))}</span></div>`;
  const dchip = (cur, oth) => other ? aosDeltaChip(cur, oth) : "";

  // 선견적 → 청구서 비교 배너 (양쪽 다 가져왔을 때)
  const preE = mode === "pre" ? entry : other, claimE = mode === "pre" ? other : entry;
  let cmp = "";
  if (preE && claimE) {
    const pp = aosMechDerive(preE).지급액, cp = aosMechDerive(claimE).지급액, dd = cp - pp;
    cmp = `<div class="aos-cmp">
      <span class="cl">선견적</span> ${won(pp)} <span class="ar">→</span> <span class="cl">청구서</span> ${won(cp)}
      ${dd !== 0 ? `<span class="aos-delta ${dd > 0 ? "up" : "down"}">${dd > 0 ? "▲ 증액" : "▼ 감액"} ${won(Math.abs(dd))}</span>` : `<span class="aos-same">변동 없음</span>`}
    </div>`;
  }

  return `<div class="aos-card aos-card-mech" data-aos-card="정비">
    <div class="aos-card-hd">
      <span class="aos-kind">재원 정산 · ${modeLabel}</span>
      <span class="aos-payto">지급처 · ${iEsc(entry.지급처)}</span>
      ${other ? `<span class="aos-cmp-tag">${otherLabel} 대비</span>` : ""}
      <button type="button" class="aos-card-x" data-aos-remove="정비" data-aos-mode="${mode}" title="가져온 재원 제거" data-desc="가져온 ${modeLabel} 재원 정산을 제거합니다.">✕</button>
    </div>
    ${cmp}
    <div class="aos-settle">
      <div class="aos-settle-col">
        <div class="aos-settle-h">공임 소계</div>
        ${fig("탈착교환", gj.탈착교환)}
        ${fig("판금교정", gj.판금교정)}
        ${fig("견인/구난비", gj.견인구난비)}
        ${fig("도장정산", gj.도장정산)}
        <div class="aos-subnote">도장재료대 + 도장공임 + 할증공임 + 가열건조비</div>
        <div class="aos-fig sub"><span class="k">공임 소계</span><span class="v">${won(Number(gj.공임소계 || 0))}${dchip(gj.공임소계, ogj.공임소계)}</span></div>
      </div>
      <div class="aos-settle-col">
        <div class="aos-settle-h">부품 소계</div>
        ${figRate("순정부품", bp.순정부품할인율, bp.순정부품)}
        ${figRate("방청부품", bp.방청부품할인율, bp.방청부품)}
        ${fig("유리부품", bp.유리부품)}
        <div class="aos-fig sub"><span class="k">부품 소계</span><span class="v">${won(Number(bp.부품소계 || 0))}${dchip(bp.부품소계, obp.부품소계)}</span></div>
      </div>
    </div>
    <div class="aos-settle-sum">
      <div class="aos-sum-item"><span class="k">공임 + 부품 소계</span><span class="v">${won(der.소계)}${dchip(der.소계, od && od.소계)}</span></div>
      <div class="aos-sum-item"><span class="k">부가세 <em>${entry.부가세율 || 0}%</em></span><span class="v">${won(der.부가세)}</span></div>
      <div class="aos-sum-item"><span class="k">자기부담금액</span><span class="v neg">${der.자부담 ? "-" : ""}${won(der.자부담)}</span></div>
      <div class="aos-sum-item pay"><span class="k">지급액</span><span class="v">${won(der.지급액)}${dchip(der.지급액, od && od.지급액)}</span></div>
    </div>
    <div class="aos-reflect">🚗 AOS · ${iEsc(cap)} → <b>정비 지급결의</b> 손해사정에 반영 <b>${won(der.지급액)}</b>원${mode === "pre" ? ' <em>(선견적 기준 추산)</em>' : ""}</div>
  </div>`;
}

// 부품/유리 별도 지급처 재원 카드
function aosAddCardHtml(type, entry) {
  const f = entry.재원 || {};
  const rows = (AOS_ADD_FIELD_ROWS[type] || []).map(([label, key]) => {
    let lab = label;
    if (key === "부가세" && f.부가세율 != null) lab = `부가세(${f.부가세율}%)`;
    if (key === "과실상계액" && f.과실상계율) lab = `과실상계(${f.과실상계율}%)`;
    return `<div class="aos-fig"><span class="k">${iEsc(lab)}</span><span class="v">${won(Number(f[key] || 0))}</span></div>`;
  }).join("");
  return `<div class="aos-card" data-aos-card="${iEsc(type)}">
    <div class="aos-card-hd">
      <span class="aos-kind">${iEsc(type)} 재원</span>
      <span class="aos-payto">지급처 · ${iEsc(entry.지급처)}</span>
      <button type="button" class="aos-card-x" data-aos-remove="${iEsc(type)}" title="재원 카드 제거" data-desc="이 재원 카드를 제거합니다.">✕</button>
    </div>
    <div class="aos-figs">${rows}</div>
    <div class="aos-fig strong"><span class="k">합계(VAT포함)</span><span class="v">${won(Number(f.합계 || 0))}</span></div>
    <div class="aos-reflect">🚗 AOS → <b>${iEsc(type)} 지급결의</b> 손해사정에 반영 <b>${won(Number(f.합계 || 0))}</b>원</div>
  </div>`;
}

// 견적 그리드 하단 AOS 재원 카드 영역 (현재 모드 재원이 있을 때). 선견적/청구서 모두 표시 + 상대모드 비교
function aosBarHtml(d) {
  const imp = aosLoad(d.id);
  const mode = (typeof estimateDocType !== "undefined" && estimateDocType === "pre") ? "pre" : "claim";
  const mech = imp["정비"] || {};
  const cur = mech[mode], other = mech[mode === "pre" ? "claim" : "pre"];
  const hasAdd = AOS_ADD_TYPES.some(t => imp[t]);
  if (!cur && !hasAdd) return "";
  const cards = (cur ? aosMechCardHtml(cur, other, mode) : "")
    + AOS_ADD_TYPES.filter(t => imp[t]).map(t => aosAddCardHtml(t, imp[t])).join("");
  const notAdded = AOS_ADD_TYPES.filter(t => !imp[t]);
  const chooser = (aosAddOpen[d.id] && notAdded.length)
    ? `<span class="aos-add-menu">${notAdded.map(t => `<button type="button" class="lg-abtn" data-aos-add="${iEsc(t)}" data-desc="${iEsc(t)} 지급처 재원을 AOS에서 추가로 가져옵니다.">${iEsc(t)} 가져오기</button>`).join("")}
        <button type="button" class="lg-abtn" data-aos-add-cancel data-desc="추가 선택을 닫습니다.">취소</button></span>`
    : "";
  return `<div class="aos-bar">
    <div class="aos-bar-head">
      <span class="aos-bar-title">AOS 재원 정산</span>
      <button type="button" class="lg-abtn" id="aosAddBtn" ${notAdded.length ? "" : "disabled"} data-desc="부품/유리 등 다른 지급처 재원을 추가로 가져옵니다.">＋ 추가</button>
      ${chooser}
      <span class="aos-hint">재원 합계가 해당 지급결의의 손해사정 금액에 반영됩니다.</span>
    </div>
    <div class="aos-cards">${cards}</div>
  </div>`;
}

/* ===== 동작 ===== */
// 메인 스냅샷 가져오기: 현재 보기 모드(선견적/청구서)의 견적내역 + 이미지 + 정비 재원 정산
function aosImportMain(d) {
  const mode = (typeof estimateDocType !== "undefined" && estimateDocType === "pre") ? "pre" : "claim";
  const snap = aosMockSnapshot(d.id);
  const det = INTAKE_DETAIL[d.id] || (INTAKE_DETAIL[d.id] = {});
  const doc = det.estimateDoc || { payTo: snap.payTo, paidAmount: 0, finalPaid: false, pre: [], claim: [] };
  doc.payTo = snap.payTo;
  doc[mode] = snap.estimate[mode];
  det.estimateDoc = doc;
  aosInjectImages(d.id, snap.images);
  // 선견적/청구서 모두 재원 정산 카드 표시. 선견적 = 추산 기준, 청구서 = 손해사정(지급결의) 반영.
  const imp = aosLoad(d.id);
  const der = aosMechDerive(snap.funds[mode]);
  imp["정비"] = imp["정비"] || {};
  imp["정비"][mode] = Object.assign({ 지급처: snap.payTo, mode: mode, capturedAt: snap.capturedAt, 지급액: der.지급액 }, snap.funds[mode]);
  aosPersist(d.id);
  aosRerender(d);
  if (mode === "claim") {
    showToast(`AOS 청구서 스냅샷을 가져왔습니다. 견적내역·차량사진·재원 정산 반영 · 손해사정 ${won(der.지급액)}원. '정비 지급결의 저장'으로 확정하세요. (데모)`);
  } else {
    showToast(`AOS 선견적 스냅샷을 가져왔습니다. 견적내역·차량사진·재원 정산(추산 기준 ${won(der.지급액)}원) 반영. (데모)`);
  }
}

// '＋추가': 부품/유리 별도 지급처 재원 카드
function aosAddImport(d, type) {
  const ex = aosMockSnapshot(d.id).extra[type];
  if (!ex) { showToast(type + " 재원이 AOS에 없습니다."); return; }
  const imp = aosLoad(d.id);
  imp[type] = { 지급처: ex.지급처, 재원: ex.재원, 합계: Number(ex.재원.합계 || 0) };
  aosPersist(d.id);
  aosAddOpen[d.id] = false;
  aosRerender(d);
  showToast(`AOS ${type} 재원을 추가했습니다. 손해사정 반영 ${won(Number(ex.재원.합계 || 0))}원. (데모)`);
}

function aosRemove(d, type, mode) {
  const imp = aosLoad(d.id);
  if (type === "정비" && mode) {
    if (imp["정비"]) { delete imp["정비"][mode]; if (!imp["정비"].pre && !imp["정비"].claim) delete imp["정비"]; }
    showToast(`AOS ${mode === "pre" ? "선견적" : "청구서"} 재원을 제거했습니다.`);
  } else {
    delete imp[type];
    showToast(`AOS ${type} 재원을 제거했습니다.`);
  }
  aosPersist(d.id);
  aosRerender(d);
}

// 견적 탭 재렌더 (새 estimateDoc 반영 위해 d 재조회)
function aosRerender(d) {
  const body = $("#intakeBody");
  if (!body) return;
  const fd = (typeof getIntakeData === "function" && getIntakeData(d.id)) || d;
  body.innerHTML = renderIntakeTab("estimate", fd);
  bindIntakeEstimate(fd);
}

/* ===== 바인딩 — bindIntakeEstimate에서 호출 ===== */
function bindIntakeAos(d) {
  const body = $("#intakeBody");
  if (!body) return;
  const on = (sel, fn) => { const el = body.querySelector(sel); if (el) el.addEventListener("click", fn); };
  on("#aosImportBtn", () => aosImportMain(d));       // 토글/빈바의 메인 가져오기 버튼
  on("#aosAddBtn", () => { aosAddOpen[d.id] = true; aosRerender(d); });
  on("[data-aos-add-cancel]", () => { aosAddOpen[d.id] = false; aosRerender(d); });
  body.querySelectorAll("[data-aos-add]").forEach(b => b.addEventListener("click", () => aosAddImport(d, b.dataset.aosAdd)));
  body.querySelectorAll("[data-aos-remove]").forEach(b => b.addEventListener("click", () => aosRemove(d, b.dataset.aosRemove, b.dataset.aosMode)));
}
