/* intake-aos.js — AOS 손해사정 스냅샷 → 지급결의 저장 (프로토타입)
   ─────────────────────────────────────────────────────────────
   목적: AOS 손해사정(정산) 재원 값을 '스냅샷'으로 가져와 회계적으로 고정된
   지급결의를 저장한다. 확정 후에는 값이 바뀌지 않는다(불변성). 견적이 수정되면
   기존 결의를 고치지 않고 AOS에서 다시 넘겨 새 스냅샷을 만든다.

   · 저장 백엔드: localStorage (§6 paymentStore 인터페이스로 감싸 Supabase 이관 대비)
   · AOS 연동: 실연동 API 없음 → mock JSON 로드 (§2 계약 shape 유지)
   · 결의 저장 단위: 지급처 기준. 다르면 분리, 같으면(정비업체 일괄) 종류 달라도 1건 합산
   ───────────────────────────────────────────────────────────── */

/* ===== §2 데이터 계약: AOS 스냅샷 mock =====
   실연동 시 이 함수만 API 호출로 교체하고 반환 shape는 그대로 유지한다. */
function aosMockSnapshot(claimId) {
  return {
    snapshotId: "SNAP-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
    claimId: claimId,
    capturedAt: new Date().toISOString(),
    source: "aos",
    settlements: [
      {
        종류: "정비", 지급처: "1급비손 모터스 공업사",
        재원: {
          탈착교환: 191400, 판금교정: 315000, 견인구난비: 0, 경미우수: 0, 도장정산: 415069,
          공임소계: 921469, 부품소계: 0, 감가상각: 0, 잔존물: 0, 차감소계: 0, 소계2: 921469,
          부가세율: 10, 부가세: 92146, 합계: 1013615,
          과실상계율: 0, 과실상계액: 0, 대차공제금액: 0, 지급액: 1013615,
        },
      },
      {
        종류: "부품", 지급처: "대한상사(주)",
        재원: {
          순정부품: 1028760, 순정부품할인율: 0, 부품정산: 1028760, 중고부품: 0, 부품소계: 1028760,
          감가상각: 0, 잔존물: 0, 차감소계: 0, 소계1: 1028760,
          부가세율: 10, 부가세: 102876, 합계: 1131636,
          과실상계율: 0, 과실상계액: 0, 지급액: 1131636,
        },
      },
    ],
    lineItems: [
      { 작업구분: "부수작업", 작업내용: "리어도어트림(우)",         작업항목: "탈착",       청구단위: 0.34, 청구금액: 12600,  불인: false, 손해단위: 0.34, 손해금액: 12600 },
      { 작업구분: "부수작업", 작업내용: "프론트도어트림(좌)",       작업항목: "탈착",       청구단위: 0.36, 청구금액: 13340,  불인: false, 손해단위: 0.36, 손해금액: 11340 },
      { 작업구분: "부수작업", 작업내용: "프론트도어몰딩핀넬(좌)",   작업항목: "탈착",       청구단위: 0.49, 청구금액: 18150,  불인: false, 손해단위: 0.49, 손해금액: 18150 },
      { 작업구분: "주작업",   작업내용: "쿼터패널(우) 표면보수",    작업항목: "판금부분도장", 청구단위: 1.9,  청구금액: 118500, 불인: false, 손해단위: 1.9,  손해금액: 118500 },
      { 작업구분: "주작업",   작업내용: "사이드실패널(좌) 표면보수", 작업항목: "판금부분도장", 청구단위: 1.6,  청구금액: 99000,  불인: false, 손해단위: 1.6,  손해금액: 99000 },
      { 작업구분: "주작업",   작업내용: "엔진룸 1/4 표면보수 3코트", 작업항목: "판금부분도장", 청구단위: 1.3,  청구금액: 84370,  불인: false, 손해단위: 1.3,  손해금액: 84370 },
      { 작업구분: "주작업",   작업내용: "가열건조비",              작업항목: "도장계산",    청구단위: 1,    청구금액: 15869,  불인: false, 손해단위: 1,    손해금액: 15869 },
      { 작업구분: "주작업",   작업내용: "리어도어(우) 판금 3코트",  작업항목: "판금부분도장", 청구단위: 2.2,  청구금액: 132000, 불인: false, 손해단위: 2.2,  손해금액: 132000 },
      { 작업구분: "추가부품", 작업내용: "도어미러(좌)",            작업항목: "87610",      청구단위: 1,    청구금액: 164000, 불인: false, 손해단위: 1,    손해금액: 164000 },
      { 작업구분: "추가부품", 작업내용: "TPMS 고무밸브",           작업항목: "00001",      청구단위: 1,    청구금액: 7000,   불인: false, 손해단위: 1,    손해금액: 7000 },
    ],
  };
}

/* ===== §6 저장소 — localStorage → Supabase 추상화 =====
   인터페이스(list/get/save/updateStatus/remove)만 고정. 내부 구현 교체 가능. */
const AOS_PA_PREFIX = "sk_claim_pa_";   // localStorage 키 프리픽스
const paymentStore = {
  _key(claimId) { return AOS_PA_PREFIX + claimId; },
  list(claimId) { try { return JSON.parse(localStorage.getItem(this._key(claimId)) || "[]") || []; } catch (e) { return []; } },
  _writeAll(claimId, arr) { try { localStorage.setItem(this._key(claimId), JSON.stringify(arr)); } catch (e) {} },
  get(claimId, id) { return this.list(claimId).find(r => r.id === id) || null; },
  save(record) {
    const arr = this.list(record.claim_id);
    const i = arr.findIndex(r => r.id === record.id);
    if (i >= 0) arr[i] = record; else arr.push(record);
    this._writeAll(record.claim_id, arr);
    return record;
  },
  updateStatus(claimId, id, status) {
    const arr = this.list(claimId), r = arr.find(x => x.id === id);
    if (!r) return null;
    if (r.상태 === "확정") throw new Error("확정된 지급결의는 상태를 변경할 수 없습니다.");
    r.상태 = status;
    r.저장일시 = new Date().toISOString();
    // §5 확정 전이 시점에 snapshot 재동결(현재 값 기준 최종 확인)
    if (status === "확정" && r.snapshot) r.snapshot = JSON.parse(JSON.stringify(r.snapshot));
    this._writeAll(claimId, arr);
    return r;
  },
  remove(claimId, id) {
    const arr = this.list(claimId), r = arr.find(x => x.id === id);
    if (r && r.상태 === "확정") throw new Error("확정된 지급결의는 삭제할 수 없습니다.");
    this._writeAll(claimId, arr.filter(x => x.id !== id));
  },
};

/* 방금 가져온(미저장) 스냅샷 · 상세보기 중인 저장 결의 — 화면 프리뷰용 */
const aosImportState = {};   // { [claimId]: { snapshot, viewOnly:bool, viewId:string } }

/* ===== 집계 헬퍼 ===== */
// 라인아이템 종류 판정: 추가부품 → '부품', 그 외 → '정비'
function aosLineItemKind(li) { return li && li["작업구분"] === "추가부품" ? "부품" : "정비"; }

// §3 지급처 기준 그룹핑 → 그룹당 결의 1건 집계
function aosGroupSettlements(snapshot) {
  const groups = {};
  (snapshot.settlements || []).forEach(s => {
    const key = s["지급처"] || "미지정";
    if (!groups[key]) groups[key] = { 지급처: key, kinds: new Set(), settlements: [] };
    groups[key].kinds.add(s["종류"]);
    groups[key].settlements.push(s);
  });
  const lineItems = snapshot.lineItems || [];
  return Object.keys(groups).map(key => {
    const g = groups[key];
    const kinds = [...g.kinds];
    const 손해사정 = g.settlements.reduce((n, s) => n + Number((s.재원 || {}).합계 || 0), 0);
    const 과실상계액 = g.settlements.reduce((n, s) => n + Number((s.재원 || {}).과실상계액 || 0), 0);
    const 최종지급액 = g.settlements.reduce((n, s) => n + Number((s.재원 || {}).지급액 || 0), 0);
    // 청구금액: 그룹 종류에 해당하는 라인아이템 청구금액 합
    const 청구금액 = lineItems.reduce((n, li) => n + (g.kinds.has(aosLineItemKind(li)) ? Number(li["청구금액"] || 0) : 0), 0);
    return { 지급처: key, 종류: kinds.join("+"), 청구금액, 손해사정, 과실상계액, 최종지급액 };
  });
}

// 결의번호 PA-YYYYMMDD-### (사고건 내 일자별 순번)
function aosNextPaId(claimId) {
  const today = new Date();
  const ymd = today.getFullYear() + String(today.getMonth() + 1).padStart(2, "0") + String(today.getDate()).padStart(2, "0");
  const prefix = "PA-" + ymd + "-";
  const max = paymentStore.list(claimId)
    .filter(r => String(r.id).indexOf(prefix) === 0)
    .reduce((m, r) => Math.max(m, parseInt(String(r.id).slice(prefix.length), 10) || 0), 0);
  return prefix + String(max + 1).padStart(3, "0");
}

function aosCurrentUser(claimId) {
  const c = (typeof CLAIMS !== "undefined") ? CLAIMS.find(x => x.id === claimId) : null;
  return (c && c.manager) || "담당자";
}

/* ===== 렌더 ===== */
const AOS_STATUS_CLASS = { "작성중": "s-todo", "결재요청": "s-hold", "확정": "rev-appr" };

// 상세/미저장 스냅샷 재원요약 + 라인아이템 (읽기전용) — §4.2
function aosSnapshotViewHtml(snapshot, opts) {
  opts = opts || {};
  const groups = aosGroupSettlements(snapshot);
  const totalPay = groups.reduce((n, g) => n + g.최종지급액, 0);
  const capAt = (snapshot.capturedAt || "").replace("T", " ").slice(0, 16);

  const cards = (snapshot.settlements || []).map(s => {
    const f = s.재원 || {};
    const rows = (s.종류 === "부품")
      ? [["부품소계", f.부품소계], ["감가상각", f.감가상각], ["잔존물", f.잔존물],
         [`부가세(${f.부가세율 || 0}%)`, f.부가세], ["과실상계", f.과실상계액], ["합계(VAT포함)", f.합계, true]]
      : [["탈착교환", f.탈착교환], ["판금교정", f.판금교정], ["도장정산", f.도장정산],
         ["공임소계", f.공임소계], ["감가상각", f.감가상각], ["잔존물", f.잔존물],
         [`부가세(${f.부가세율 || 0}%)`, f.부가세], ["과실상계", f.과실상계액], ["합계(VAT포함)", f.합계, true]];
    return `<div class="aos-card">
      <div class="aos-card-hd"><span class="aos-kind">${iEsc(s.종류)}</span><span class="aos-payto">지급처: ${iEsc(s.지급처)}</span></div>
      <div class="aos-figs">${rows.map(([k, v, strong]) => `
        <div class="aos-fig${strong ? " strong" : ""}"><span class="k">${iEsc(k)}</span><span class="v">${won(Number(v || 0))}</span></div>`).join("")}</div>
    </div>`;
  }).join("");

  const liRows = (snapshot.lineItems || []).map(li => `<tr${li.불인 ? ' class="aos-denied"' : ""}>
      <td>${iEsc(li.작업구분)}</td><td>${iEsc(li.작업내용)}</td><td class="ta-c">${iEsc(li.작업항목)}</td>
      <td class="num">${li.청구단위}</td><td class="num">${won(Number(li.청구금액 || 0))}</td>
      <td class="ta-c">${li.불인 ? "✓" : ""}</td>
      <td class="num">${li.불인 ? "-" : li.손해단위}</td><td class="num strong">${li.불인 ? "0" : won(Number(li.손해금액 || 0))}</td>
    </tr>`).join("");

  return `<div class="aos-view">
    <div class="aos-view-hd">
      <span class="aos-badge">AOS 스냅샷</span>
      <span class="aos-cap">가져온 시각 ${iEsc(capAt)} · 출처 AOS · 읽기전용</span>
      ${opts.viewOnly ? `<span class="aos-viewtag">저장 결의 상세(${iEsc(opts.viewId || "")})</span>` : ""}
    </div>
    <div class="aos-cards">${cards}</div>
    <div class="aos-total">총 지급 예정 <b>${won(totalPay)}</b>원</div>
    <div class="aos-li">
      <div class="aos-li-cap">AOS 손해사정 라인아이템 <span>${(snapshot.lineItems || []).length}건 · 읽기전용</span></div>
      <div class="lg-scroll"><table class="payres-tbl aos-li-tbl">
        <thead><tr><th>작업구분</th><th>작업내용</th><th class="ta-c">작업항목</th>
          <th class="num">청구단위</th><th class="num">청구금액</th><th class="ta-c">불인</th>
          <th class="num">손해단위</th><th class="num">손해금액</th></tr></thead>
        <tbody>${liRows}</tbody>
      </table></div>
    </div>
    ${opts.viewOnly
      ? `<div class="aos-view-foot"><button type="button" class="lg-abtn" id="aosViewClose">닫기</button></div>`
      : `<div class="aos-view-foot">
           <button type="button" class="lg-abtn" id="aosDiscard" data-desc="가져온 스냅샷을 취소합니다.">가져오기 취소</button>
           <button type="button" class="lg-abtn primary" id="aosSaveAuth" data-desc="가져온 AOS 스냅샷을 지급처 기준으로 지급결의로 저장합니다. (지급처가 다르면 분리, 같으면 합산)">지급결의 저장</button>
         </div>`}
  </div>`;
}

// AOS 지급결의 저장내역 테이블 — §3 컬럼 1:1 + 상태머신
function aosAuthTableHtml(d) {
  const list = paymentStore.list(d.id).slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const rows = list.length ? list.map(r => {
    const stCls = AOS_STATUS_CLASS[r.상태] || "";
    const dt = (r.저장일시 || "").replace("T", " ").slice(5, 16);
    let acts = "";
    if (r.상태 === "작성중") acts = `<button type="button" class="payres-mini" data-aos-req="${iEsc(r.id)}" data-desc="이 지급결의를 결재요청 상태로 상신합니다.">결재요청</button>
        <button type="button" class="payres-mini danger" data-aos-del="${iEsc(r.id)}" data-desc="작성중 지급결의를 삭제합니다.">삭제</button>`;
    else if (r.상태 === "결재요청") acts = `<button type="button" class="payres-mini" data-aos-cancel="${iEsc(r.id)}" data-desc="결재요청을 취소해 작성중으로 되돌립니다.">상신취소</button>
        <button type="button" class="payres-mini" data-aos-confirm="${iEsc(r.id)}" data-desc="결재 완료로 확정합니다. 확정 후에는 수정·삭제할 수 없습니다.">결재확정</button>`;
    else acts = `<span class="aos-lock">🔒 확정</span>`;
    return `<tr>
      <td class="ta-c">${iEsc(r.id)}</td>
      <td>${iEsc(r.종류)}<div class="payres-src">${iEsc((r.source || "aos").toUpperCase())}</div></td>
      <td>${iEsc(r.지급처)}</td>
      <td class="num">${won(Number(r.청구금액 || 0))}</td>
      <td class="num">${won(Number(r.손해사정 || 0))}</td>
      <td class="num neg">-${won(Number(r.과실상계액 || 0))}</td>
      <td class="num strong">${won(Number(r.최종지급액 || 0))}</td>
      <td class="ta-c"><span class="badge ${stCls}">${iEsc(r.상태)}</span></td>
      <td class="payres-dt">${iEsc(dt)}</td>
      <td>${iEsc(r.입력자)}</td>
      <td class="ta-c aos-acts"><button type="button" class="payres-mini" data-aos-view="${iEsc(r.id)}" data-desc="이 지급결의의 스냅샷(재원요약·라인아이템)을 봅니다.">상세</button> ${acts}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="11" class="ph">저장된 AOS 지급결의가 없습니다. 'AOS 가져오기'로 손해사정 스냅샷을 불러오세요.</td></tr>`;
  return `<div class="aos-authbox">
    <div class="payres-col-head">AOS 지급결의 저장내역 <span class="cnt">${list.length}건</span></div>
    <div class="payres-scroll"><table class="payres-tbl">
      <thead><tr>
        <th class="ta-c">결의</th><th>종류</th><th>지급처</th>
        <th class="num">청구금액</th><th class="num">손해사정</th><th class="num">과실상계</th><th class="num">최종지급</th>
        <th class="ta-c">상태</th><th>저장일시</th><th>입력자</th><th class="ta-c">처리</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>`;
}

// 청구 견적 정보 탭에 삽입되는 AOS 섹션 전체
function aosSectionHtml(d) {
  const st = aosImportState[d.id];
  const preview = st ? aosSnapshotViewHtml(st.snapshot, { viewOnly: st.viewOnly, viewId: st.viewId }) : "";
  return `<div class="aos-sect">
    ${lgSect("AOS 손해사정 지급결의", "AOS 정산 재원을 스냅샷으로 가져와 지급처 기준 지급결의로 저장 · 확정")}
    <div class="aos-toolbar">
      <button type="button" class="aos-import-btn" id="aosImportBtn" data-desc="AOS 손해사정(정산) 재원 값을 스냅샷으로 가져옵니다. 확정 후에는 값이 변하지 않으며, 견적이 바뀌면 다시 가져와 새 스냅샷을 만듭니다.">🚗 AOS 가져오기</button>
      <span class="aos-hint">가져온 값은 그 시점 그대로 저장됩니다(불변). 지급처가 다르면 결의가 분리 저장됩니다.</span>
    </div>
    ${preview}
    ${aosAuthTableHtml(d)}
  </div>`;
}

/* ===== 동작 ===== */
function aosImport(d) {
  const cur = aosImportState[d.id];
  if (cur && !cur.viewOnly) {
    if (!confirm("기존에 불러온 값을 새 스냅샷으로 덮어씁니다. 계속할까요?")) return;
  }
  aosImportState[d.id] = { snapshot: aosMockSnapshot(d.id), viewOnly: false };
  aosRerender(d);
  showToast("AOS 손해사정 스냅샷을 가져왔습니다. 검토 후 '지급결의 저장'을 누르세요. (데모)");
}

function aosSaveAuthorizations(d) {
  const st = aosImportState[d.id];
  if (!st || st.viewOnly) return;
  const snapshot = st.snapshot;
  const groups = aosGroupSettlements(snapshot);
  const existing = paymentStore.list(d.id);
  // 같은 지급처의 작성중 결의가 있으면 확인
  const dupPayto = groups.map(g => g.지급처).filter(p => existing.some(r => r.지급처 === p && r.상태 === "작성중"));
  if (dupPayto.length && !confirm(`이미 작성중인 결의가 있습니다 (${dupPayto.join(", ")}). 새 스냅샷으로 추가 저장할까요?`)) return;
  const user = aosCurrentUser(d.id);
  const now = new Date().toISOString();
  groups.forEach(g => {
    paymentStore.save({
      id: aosNextPaId(d.id),
      claim_id: d.id,
      종류: g.종류,
      지급처: g.지급처,
      source: "aos",
      청구금액: g.청구금액,
      손해사정: g.손해사정,
      과실상계액: g.과실상계액,
      최종지급액: g.최종지급액,
      상태: "작성중",
      저장일시: now,
      입력자: user,
      snapshot: JSON.parse(JSON.stringify(snapshot)),   // §1 불변성: 원본 blob 그대로 보관
    });
  });
  aosImportState[d.id] = null;   // 미저장 프리뷰 종료
  aosRerender(d);
  showToast(`AOS 지급결의 ${groups.length}건을 저장했습니다. (지급처 기준 ${groups.length > 1 ? "분리" : "1건"} 저장 · 데모)`);
}

function aosViewSaved(d, id) {
  const r = paymentStore.get(d.id, id);
  if (!r || !r.snapshot) { showToast("저장된 스냅샷을 찾을 수 없습니다."); return; }
  aosImportState[d.id] = { snapshot: r.snapshot, viewOnly: true, viewId: id };
  aosRerender(d);
}

function aosCloseView(d) { aosImportState[d.id] = null; aosRerender(d); }

function aosSetStatus(d, id, status) {
  try { paymentStore.updateStatus(d.id, id, status); }
  catch (e) { showToast(e.message); return; }
  aosRerender(d);
  const label = { "결재요청": "결재요청으로 상신했습니다", "작성중": "결재요청을 취소했습니다", "확정": "결재 완료로 확정했습니다" }[status] || "상태를 변경했습니다";
  showToast(`지급결의 ${id} — ${label}. (데모)`);
}

function aosDelete(d, id) {
  if (!confirm("이 작성중 지급결의를 삭제할까요?")) return;
  try { paymentStore.remove(d.id, id); }
  catch (e) { showToast(e.message); return; }
  if (aosImportState[d.id] && aosImportState[d.id].viewId === id) aosImportState[d.id] = null;
  aosRerender(d);
  showToast(`지급결의 ${id}를 삭제했습니다. (데모)`);
}

// 견적 탭 재렌더 + 재바인딩
function aosRerender(d) {
  const body = $("#intakeBody");
  if (!body) return;
  body.innerHTML = renderIntakeTab("estimate", d);
  bindIntakeEstimate(d);
}

/* ===== 바인딩 — bindIntakeEstimate에서 호출 ===== */
function bindIntakeAos(d) {
  const body = $("#intakeBody");
  if (!body || !body.querySelector(".aos-sect")) return;
  const on = (sel, fn) => { const el = body.querySelector(sel); if (el) el.addEventListener("click", fn); };
  on("#aosImportBtn", () => aosImport(d));
  on("#aosSaveAuth", () => aosSaveAuthorizations(d));
  on("#aosDiscard", () => aosCloseView(d));
  on("#aosViewClose", () => aosCloseView(d));
  body.querySelectorAll("[data-aos-view]").forEach(b => b.addEventListener("click", () => aosViewSaved(d, b.dataset.aosView)));
  body.querySelectorAll("[data-aos-req]").forEach(b => b.addEventListener("click", () => aosSetStatus(d, b.dataset.aosReq, "결재요청")));
  body.querySelectorAll("[data-aos-cancel]").forEach(b => b.addEventListener("click", () => aosSetStatus(d, b.dataset.aosCancel, "작성중")));
  body.querySelectorAll("[data-aos-confirm]").forEach(b => b.addEventListener("click", () => aosSetStatus(d, b.dataset.aosConfirm, "확정")));
  body.querySelectorAll("[data-aos-del]").forEach(b => b.addEventListener("click", () => aosDelete(d, b.dataset.aosDel)));
}
