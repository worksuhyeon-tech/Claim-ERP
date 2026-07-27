/* ===================== 협력업체 선정평가 — 평가항목/건수 관리 팝업 =====================
   정적 데모: 백엔드 없음. 평가항목(EVAL_ITEM)·답변옵션(EVAL_ITEM_OPTION)·건수(EVAL_QUOTA)를
   localStorage에 저장. 목업 엑셀 4개 시트를 단일 원천으로 화면/도움말/입력컨트롤을 동적 생성.
   - 관리자: 평가항목 추가/수정/삭제(논리삭제), 답변옵션 편집, 평가 건수(비율%) 제어
   - 미리보기: 보상담당자가 청구견적정보 탭에서 보게 될 평가 폼 시연 (합계 100점) */
(function initVendorEval() {
  "use strict";

  /* ---- 시드 데이터 (목업 시트3: 평가항목마스터 / 시트4: 답변옵션마스터) ---- */
  const SEED_ITEMS = [
    { item_code: "EV01", item_name: "선견적 신속도",     answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 1,  use_yn: "Y", required_yn: "Y", col_pos: "L", has_history: true },
    { item_code: "EV02", item_name: "정비작업 신속도",   answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 2,  use_yn: "Y", required_yn: "Y", col_pos: "L", has_history: true },
    { item_code: "EV03", item_name: "수리비청구 신속도", answer_type: "CUSTOM", input_ui: "SELECT", help_text: "(15일초과=0점, 15일=1점, 10일=3점, 5일=5점, 3일=8점, 당일=10점)", max_score: 10, sort_order: 3, use_yn: "Y", required_yn: "Y", col_pos: "L", has_history: true },
    { item_code: "EV04", item_name: "세차 지원",         answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 4,  use_yn: "Y", required_yn: "Y", col_pos: "L", has_history: false },
    { item_code: "EV05", item_name: "업무 협조",         answer_type: "SCALE",  input_ui: "SELECT", help_text: "(점수 0~10 선택)",       max_score: 10, sort_order: 5,  use_yn: "Y", required_yn: "Y", col_pos: "L", has_history: false },
    { item_code: "EV06", item_name: "사진규정 준수",     answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 6,  use_yn: "Y", required_yn: "Y", col_pos: "R", has_history: true },
    { item_code: "EV07", item_name: "선견적 적정성",     answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 7,  use_yn: "Y", required_yn: "Y", col_pos: "R", has_history: false },
    { item_code: "EV08", item_name: "수리비청구 적정성", answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 8,  use_yn: "Y", required_yn: "Y", col_pos: "R", has_history: false },
    { item_code: "EV09", item_name: "청구 입증 충실도",  answer_type: "YESNO",  input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 9,  use_yn: "Y", required_yn: "Y", col_pos: "R", has_history: false },
    { item_code: "EV10", item_name: "시스템 입력 정확도", answer_type: "YESNO", input_ui: "RADIO",  help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: 10, use_yn: "Y", required_yn: "Y", col_pos: "R", has_history: false },
  ];
  const YN = [{ option_label: "예", score: 10 }, { option_label: "아니오", score: 0 }];
  const SEED_OPTIONS = {
    EV01: YN.slice(), EV02: YN.slice(),
    EV03: [
      { option_label: "당일", score: 10 }, { option_label: "3일", score: 8 }, { option_label: "5일", score: 5 },
      { option_label: "10일", score: 3 }, { option_label: "15일", score: 1 }, { option_label: "15일초과", score: 0 },
    ],
    EV04: YN.slice(),
    EV05: Array.from({ length: 11 }, (_, i) => ({ option_label: i + "점", score: i })),
    EV06: YN.slice(), EV07: YN.slice(), EV08: YN.slice(), EV09: YN.slice(), EV10: YN.slice(),
  };
  const SEED_QUOTA = { ratioPct: 30, totalCount: 30, doneCount: 3 };

  /* ---- localStorage 키 ---- */
  const LS_ITEMS = "vendorEvalMaster";
  const LS_OPTS = "vendorEvalOptions";
  const LS_QUOTA = "vendorEvalQuota";
  const LS_CTX = "vendorEvalContext";

  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const byId = id => document.getElementById(id);
  function lsGet(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---- 대상 업체 컨텍스트 (협력업체조회에서 넘김) ---- */
  const qs = new URLSearchParams(location.search);
  const ctx = lsGet(LS_CTX, {}) || {};
  const vendorName = qs.get("name") || ctx.name || "협력업체";
  const vendorBiz = qs.get("biz") || ctx.biz || "-";

  /* ---- 상태 (localStorage 로드, 없으면 시드) ---- */
  let items = lsGet(LS_ITEMS, null) || deepClone(SEED_ITEMS);
  let options = lsGet(LS_OPTS, null) || deepClone(SEED_OPTIONS);
  const quotaAll = lsGet(LS_QUOTA, null) || {};
  let quota = quotaAll[vendorBiz] || deepClone(SEED_QUOTA);
  let selectedCode = (items[0] && items[0].item_code) || null;
  let helpOpen = false;
  const previewAns = {};   // item_code -> 선택 점수(number) | null

  /* ================= 토스트 ================= */
  let toastTimer = null;
  function toast(msg) {
    let el = byId("veToast");
    if (!el) { el = document.createElement("div"); el.id = "veToast"; el.className = "ve-toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ================= 공통 헬퍼 ================= */
  const bySort = arr => arr.slice().sort((a, b) => a.sort_order - b.sort_order);
  const activeItems = () => bySort(items.filter(it => it.use_yn === "Y"));
  function resequence() { bySort(items).forEach((it, i) => { it.sort_order = i + 1; }); }
  function nextItemCode() {
    let max = 0;
    items.forEach(it => { const m = /^EV(\d+)$/.exec(it.item_code || ""); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    return "EV" + String(max + 1).padStart(2, "0");
  }
  function optsOf(code) { return options[code] || (options[code] = []); }
  function maxScoreOf(code) {
    const list = optsOf(code); if (!list.length) return 0;
    return list.reduce((m, o) => Math.max(m, Number(o.score) || 0), 0);
  }

  /* ================= 탭① 평가항목 관리 ================= */
  const AT_OPTS = ["YESNO", "SCALE", "CUSTOM"];
  const UI_OPTS = ["RADIO", "SELECT"];
  function selOptions(list, cur) { return list.map(v => `<option${v === cur ? " selected" : ""}>${esc(v)}</option>`).join(""); }

  function renderItemsTab() {
    const rows = bySort(items).map(it => {
      const off = it.use_yn !== "Y";
      const sel = it.item_code === selectedCode;
      return `<tr data-code="${esc(it.item_code)}" class="${off ? "ve-off" : ""}${sel ? " ve-sel" : ""}">
        <td class="ve-c"><input type="radio" name="veItemSel" ${sel ? "checked" : ""} data-pick></td>
        <td class="ve-c">${it.sort_order}</td>
        <td class="ve-c"><button type="button" class="ve-yn ${it.use_yn === "Y" ? "on" : ""}" data-toggleuse title="사용여부 토글">${it.use_yn}</button></td>
        <td><input class="ve-in" value="${esc(it.item_name)}" data-field="item_name"></td>
        <td><select class="ve-sel" data-field="answer_type">${selOptions(AT_OPTS, it.answer_type)}</select></td>
        <td><select class="ve-sel" data-field="input_ui">${selOptions(UI_OPTS, it.input_ui)}</select></td>
        <td><input class="ve-in" value="${esc(it.help_text)}" data-field="help_text"></td>
        <td class="ve-c"><input class="ve-in ve-num" type="number" min="0" value="${esc(it.max_score)}" data-field="max_score"></td>
        <td class="ve-c"><button type="button" class="ve-yn ${it.required_yn === "Y" ? "on" : ""}" data-togglereq title="필수여부 토글">${it.required_yn}</button></td>
        <td class="ve-c ve-code">${esc(it.item_code)}</td>
      </tr>`;
    }).join("");
    const usedCnt = items.filter(it => it.use_yn === "Y").length;
    const totalMax = activeItems().reduce((s, it) => s + (Number(it.max_score) || 0), 0);
    byId("veItemsWrap").innerHTML = `
      <div class="ve-toolbar">
        <button type="button" class="ve-btn" data-act="add">+ 항목추가</button>
        <button type="button" class="ve-btn gray" data-act="del">- 항목삭제</button>
        <span class="ve-tsep"></span>
        <button type="button" class="ve-btn gray" data-act="up">▲ 위로</button>
        <button type="button" class="ve-btn gray" data-act="down">▼ 아래로</button>
        <span class="ve-grow"></span>
        <button type="button" class="ve-btn" data-act="save">저장</button>
      </div>
      <div class="ve-scroll">
        <table class="ve-tbl" id="veItemsTbl">
          <thead><tr>
            <th class="ve-c"></th><th class="ve-c">정렬<br>순서</th><th class="ve-c">사용<br>여부</th>
            <th>항목명</th><th>답변유형</th><th>입력 UI</th><th>배점기준 (도움말 문구)</th>
            <th class="ve-c">최대<br>점수</th><th class="ve-c">필수<br>여부</th><th class="ve-c">항목코드</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="ve-summary">사용중 항목 <b>${usedCnt}</b>개 / 총 만점 <b>${totalMax}</b>점
        <span class="ve-hint">※ 삭제 시 평가 이력이 있는 항목은 물리삭제 대신 <b>사용여부=N</b> 논리삭제(회색)로 보존됩니다.</span>
      </div>
      <div id="veOptWrap"></div>`;
    renderOptionPanel();
  }

  function renderOptionPanel() {
    const wrap = byId("veOptWrap"); if (!wrap) return;
    const it = items.find(i => i.item_code === selectedCode);
    if (!it) { wrap.innerHTML = `<div class="ve-optempty">항목을 선택하면 답변 옵션을 편집할 수 있습니다.</div>`; return; }
    const list = optsOf(it.item_code);
    const rows = list.map((o, i) => `<tr data-oi="${i}">
        <td class="ve-c">${i + 1}</td>
        <td><input class="ve-in" value="${esc(o.option_label)}" data-ofield="option_label"></td>
        <td class="ve-c"><input class="ve-in ve-num" type="number" value="${esc(o.score)}" data-ofield="score"></td>
        <td class="ve-c">
          <button type="button" class="ve-mini" data-oact="up">▲</button>
          <button type="button" class="ve-mini" data-oact="down">▼</button>
          <button type="button" class="ve-mini gray" data-oact="del">삭제</button>
        </td>
      </tr>`).join("");
    wrap.innerHTML = `
      <div class="ve-optbar">
        <span class="ve-optttl">▼ 답변 옵션 편집 — <b>${esc(it.item_name)}</b> (${esc(it.item_code)})</span>
        <button type="button" class="ve-btn small" data-oact="add">+ 옵션추가</button>
        <span class="ve-optnote">옵션 2개 → RADIO 자동제안, 3개 이상 → SELECT</span>
      </div>
      <table class="ve-tbl ve-opttbl">
        <thead><tr><th class="ve-c">순서</th><th>답변 라벨</th><th class="ve-c">배점</th><th class="ve-c">관리</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="4" class="ve-optempty">등록된 옵션이 없습니다. '+ 옵션추가'로 등록하세요.</td></tr>`}</tbody>
      </table>`;
  }

  /* input UI 자동제안: 옵션 수 2개→RADIO / 3개↑→SELECT */
  function suggestUiFromOptions(it) {
    const n = optsOf(it.item_code).length;
    it.input_ui = n <= 2 ? "RADIO" : "SELECT";
  }

  /* ================= 탭② 건수 관리 (비율%) ================= */
  function evalTarget() { return Math.ceil((Number(quota.totalCount) || 0) * (Number(quota.ratioPct) || 0) / 100); }
  function renderQuotaTab() {
    const target = evalTarget();
    const done = Math.min(Number(quota.doneCount) || 0, target || Number(quota.totalCount) || 0);
    const denom = target || 1;
    const pct = Math.min(100, Math.round((done / denom) * 100));
    byId("veQuotaWrap").innerHTML = `
      <div class="ve-card">
        <div class="ve-cardttl">평가 건수 제어 <span class="ve-sub">대상 업체: <b>${esc(vendorName)}</b> (${esc(vendorBiz)})</span></div>
        <p class="ve-desc">전건 평가는 비효율이므로, 이 업체에 <b>지급/종결</b>되는 건 중 <b>지정 비율(%)</b>만 평가 대상으로 삼습니다.
          비율을 조정하면 평가 대상 건수가 자동으로 재계산됩니다.</p>
        <div class="ve-qgrid">
          <label class="ve-qrow"><span>총 지급/종결 건수 <i class="ve-help" data-desc="전월 종결건수 기준입니다.">*</i></span><b>${quota.totalCount}건</b></label>
          <label class="ve-qrow"><span>평가 비율(%)</span>
            <span><input id="veRatio" class="ve-in ve-num" type="number" min="0" max="100" value="${esc(quota.ratioPct)}"> %</span>
          </label>
          <label class="ve-qrow"><span>평가 대상 건수</span><b id="veTarget">${target}건</b> <span class="ve-sub">(전체 ${quota.totalCount}건의 ${quota.ratioPct}%)</span></label>
          <label class="ve-qrow"><span>심사 완료</span><b>${done}건</b></label>
        </div>
        <div class="ve-prog">
          <div class="ve-progbar"><span id="veProgFill" style="width:${pct}%"></span></div>
          <div class="ve-progtxt" id="veProgTxt">총 <b>${quota.totalCount}</b>건 중 <b>${done}</b>건 심사 완료 · 평가 대상 <b>${target}</b>건 기준 <b>${pct}%</b></div>
        </div>
        <div class="ve-toolbar" style="margin-top:14px">
          <span class="ve-grow"></span>
          <button type="button" class="ve-btn" data-act="saveQuota">저장</button>
        </div>
      </div>`;
  }
  function recalcQuotaLive() {
    const target = evalTarget();
    const done = Math.min(Number(quota.doneCount) || 0, target || Number(quota.totalCount) || 0);
    const denom = target || 1;
    const pct = Math.min(100, Math.round((done / denom) * 100));
    if (byId("veTarget")) byId("veTarget").textContent = target + "건";
    if (byId("veProgFill")) byId("veProgFill").style.width = pct + "%";
    if (byId("veProgTxt")) byId("veProgTxt").innerHTML = `총 <b>${quota.totalCount}</b>건 중 <b>${done}</b>건 심사 완료 · 평가 대상 <b>${target}</b>건 기준 <b>${pct}%</b>`;
    const sub = document.querySelector("#veQuotaWrap .ve-qrow:nth-child(3) .ve-sub");
    if (sub) sub.textContent = `(전체 ${quota.totalCount}건의 ${quota.ratioPct}%)`;
  }

  /* ================= 탭③ 미리보기 (보상담당자 평가 폼 시연) ================= */
  function previewColumns() {
    const act = activeItems();
    const half = Math.ceil(act.length / 2);
    return [act.slice(0, half), act.slice(half)];   // 상단절반=좌, 하단절반=우
  }
  function itemInputHtml(it) {
    const list = optsOf(it.item_code);
    if (it.input_ui === "RADIO") {
      return list.map(o => `<label class="ve-radio"><input type="radio" name="pv_${esc(it.item_code)}" data-pv="${esc(it.item_code)}" value="${Number(o.score) || 0}"> ${esc(o.option_label)}</label>`).join("");
    }
    return `<select class="ve-sel" data-pv="${esc(it.item_code)}">
      <option value="">선택</option>
      ${list.map(o => `<option value="${Number(o.score) || 0}">${esc(o.option_label)} (${Number(o.score) || 0}점)</option>`).join("")}
    </select>`;
  }
  function previewItemRow(it) {
    const ans = previewAns[it.item_code];
    const scoreTxt = (ans == null || ans === "") ? "-" : (ans + "점");
    return `<tr>
      <td class="pv-name">${esc(it.item_name)}${it.required_yn === "Y" ? '<span class="pv-req">*</span>' : ""}</td>
      <td class="pv-input">${itemInputHtml(it)}</td>
      <td class="pv-score" data-score="${esc(it.item_code)}">${scoreTxt}</td>
    </tr>`;
  }
  function renderPreviewTab() {
    const [L, R] = previewColumns();
    const act = activeItems();
    const totalMax = act.reduce((s, it) => s + (Number(it.max_score) || 0), 0);
    const helpRows = act.map(it => `<div class="pv-helprow"><b>${esc(it.item_name)}</b> <span>${esc(it.help_text)}</span></div>`).join("");
    const col = list => `<table class="ve-tbl pv-tbl"><thead><tr><th>항목명</th><th>답변</th><th class="ve-c">점수</th></tr></thead><tbody>${list.map(previewItemRow).join("")}</tbody></table>`;
    byId("vePreviewWrap").innerHTML = `
      <div class="ve-card">
        <div class="ve-cardttl">[업무지침준수] 평가
          <button type="button" class="pv-help" id="vePvHelp" title="배점 기준 안내">( ? )</button>
          <span class="ve-sub">청구견적정보 탭에서 보상담당자가 보게 될 입력 폼 미리보기</span>
        </div>
        <div class="pv-helpbox" id="vePvHelpBox" ${helpOpen ? "" : "hidden"}>
          <div class="pv-helpttl">▼ 답변 기준 안내 (항목별 배점)</div>${helpRows}
        </div>
        <p class="ve-desc">예/아니오 2지선다는 라디오(1회 클릭), 3지선다 이상은 드롭다운으로 입력합니다.</p>
        <div class="pv-cols">
          <div>${col(L)}</div>
          <div>${R.length ? col(R) : ""}</div>
        </div>
        <div class="pv-total">합계 점수 (사용중 ${act.length}개 항목 / ${totalMax}점 만점)
          <b id="vePvSum">0</b> <span>/ ${totalMax}점</span>
        </div>
      </div>`;
    updatePreviewSum();
  }
  function updatePreviewSum() {
    const act = activeItems();
    let sum = 0;
    act.forEach(it => { const v = previewAns[it.item_code]; if (v != null && v !== "") sum += Number(v) || 0; });
    if (byId("vePvSum")) byId("vePvSum").textContent = sum;
  }

  /* ================= 탭 전환 ================= */
  const PANES = { item: "veItemsPane", quota: "veQuotaPane", preview: "vePreviewPane" };
  function switchTab(name) {
    document.querySelectorAll("#veTabs .ve-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    Object.keys(PANES).forEach(k => { const p = byId(PANES[k]); if (p) p.hidden = k !== name; });
    if (name === "quota") renderQuotaTab();
    if (name === "preview") renderPreviewTab();
    if (name === "item") renderItemsTab();
  }

  /* ================= 저장 ================= */
  function saveMaster() {
    resequence();
    lsSet(LS_ITEMS, items);
    lsSet(LS_OPTS, options);
    toast("평가항목을 저장했습니다. (데모)");
  }
  function saveQuota() {
    const all = lsGet(LS_QUOTA, {}) || {};
    all[vendorBiz] = quota;
    lsSet(LS_QUOTA, all);
    toast("평가 건수(비율) 설정을 저장했습니다. (데모)");
  }

  /* ================= 이벤트 위임 ================= */
  const root = byId("veRoot");

  // 클릭
  root.addEventListener("click", e => {
    const tab = e.target.closest("#veTabs .ve-tab");
    if (tab) { switchTab(tab.dataset.tab); return; }

    // 탭① 행 선택
    const pick = e.target.closest("[data-pick]");
    if (pick) { selectedCode = pick.closest("tr").dataset.code; renderItemsTab(); return; }

    // 사용여부 / 필수여부 토글
    const tu = e.target.closest("[data-toggleuse]");
    if (tu) { const it = items.find(i => i.item_code === tu.closest("tr").dataset.code); if (it) { it.use_yn = it.use_yn === "Y" ? "N" : "Y"; renderItemsTab(); } return; }
    const tr = e.target.closest("[data-togglereq]");
    if (tr) { const it = items.find(i => i.item_code === tr.closest("tr").dataset.code); if (it) { it.required_yn = it.required_yn === "Y" ? "N" : "Y"; renderItemsTab(); } return; }

    // 툴바 액션
    const act = e.target.closest("[data-act]");
    if (act) { handleAct(act.dataset.act); return; }

    // 옵션 액션
    const oact = e.target.closest("[data-oact]");
    if (oact) { handleOptAct(oact.dataset.oact, oact.closest("tr")); return; }

    // 미리보기 도움말 토글
    if (e.target.closest("#vePvHelp")) {
      helpOpen = !helpOpen;
      const box = byId("vePvHelpBox"); if (box) box.hidden = !helpOpen;
      return;
    }
    // 닫기
    if (e.target.closest("#veClose")) { window.close(); return; }
  });

  // 입력 (state 동기화 — 리렌더 없이)
  root.addEventListener("input", e => {
    const f = e.target.closest("[data-field]");
    if (f) {
      const it = items.find(i => i.item_code === f.closest("tr").dataset.code);
      if (it) it[f.dataset.field] = f.dataset.field === "max_score" ? (Number(f.value) || 0) : f.value;
      return;
    }
    const of = e.target.closest("[data-ofield]");
    if (of) {
      const list = optsOf(selectedCode);
      const oi = Number(of.closest("tr").dataset.oi);
      if (list[oi]) list[oi][of.dataset.ofield] = of.dataset.ofield === "score" ? (Number(of.value) || 0) : of.value;
      return;
    }
    if (e.target.id === "veRatio") {
      quota.ratioPct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
      recalcQuotaLive();
      return;
    }
  });

  // 변경 (셀렉트/라디오)
  root.addEventListener("change", e => {
    const pv = e.target.closest("[data-pv]");
    if (pv) {
      const code = pv.dataset.pv;
      const val = pv.value === "" ? null : Number(pv.value);
      previewAns[code] = val;
      const cell = document.querySelector(`[data-score="${code}"]`);
      if (cell) cell.textContent = (val == null) ? "-" : (val + "점");
      updatePreviewSum();
      return;
    }
    const fsel = e.target.closest('select[data-field]');
    if (fsel) {
      const it = items.find(i => i.item_code === fsel.closest("tr").dataset.code);
      if (it) it[fsel.dataset.field] = fsel.value;
      return;
    }
  });

  function handleAct(a) {
    if (a === "save") { saveMaster(); return; }
    if (a === "saveQuota") { saveQuota(); return; }
    if (a === "add") {
      const code = nextItemCode();
      const so = items.reduce((m, it) => Math.max(m, it.sort_order), 0) + 1;
      const it = { item_code: code, item_name: "신규 평가항목", answer_type: "YESNO", input_ui: "RADIO", help_text: "(예=10점, 아니오=0점)", max_score: 10, sort_order: so, use_yn: "Y", required_yn: "Y", col_pos: "R", has_history: false };
      items.push(it);
      options[code] = deepClone(YN);
      selectedCode = code;
      renderItemsTab();
      toast(`항목을 추가했습니다. (코드 ${code}) (데모)`);
      return;
    }
    if (a === "del") {
      const it = items.find(i => i.item_code === selectedCode);
      if (!it) { toast("삭제할 항목을 선택하세요. (데모)"); return; }
      if (it.has_history) {
        if (it.use_yn === "N") { toast("이미 논리삭제(사용여부=N)된 항목입니다. (데모)"); return; }
        it.use_yn = "N";
        renderItemsTab();
        toast(`'${it.item_name}'은(는) 평가 이력이 있어 사용여부=N 논리삭제 처리했습니다. (데모)`);
      } else {
        items = items.filter(i => i.item_code !== it.item_code);
        delete options[it.item_code];
        selectedCode = (bySort(items)[0] || {}).item_code || null;
        resequence();
        renderItemsTab();
        toast(`'${it.item_name}' 항목을 삭제했습니다. (데모)`);
      }
      return;
    }
    if (a === "up" || a === "down") {
      const ordered = bySort(items);
      const idx = ordered.findIndex(i => i.item_code === selectedCode);
      if (idx < 0) { toast("이동할 항목을 선택하세요. (데모)"); return; }
      const swap = a === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= ordered.length) return;
      const tmp = ordered[idx].sort_order; ordered[idx].sort_order = ordered[swap].sort_order; ordered[swap].sort_order = tmp;
      renderItemsTab();
      return;
    }
  }

  function handleOptAct(a, trEl) {
    const list = optsOf(selectedCode);
    const it = items.find(i => i.item_code === selectedCode);
    if (!it) return;
    if (a === "add") {
      list.push({ option_label: "새 옵션", score: 0 });
      suggestUiFromOptions(it);
      renderItemsTab();
      return;
    }
    const oi = trEl ? Number(trEl.dataset.oi) : -1;
    if (oi < 0 || !list[oi]) return;
    if (a === "del") {
      list.splice(oi, 1);
      suggestUiFromOptions(it);
      renderItemsTab();
      return;
    }
    if (a === "up" && oi > 0) { const t = list[oi]; list[oi] = list[oi - 1]; list[oi - 1] = t; renderOptionPanel(); return; }
    if (a === "down" && oi < list.length - 1) { const t = list[oi]; list[oi] = list[oi + 1]; list[oi + 1] = t; renderOptionPanel(); return; }
  }

  /* ================= 기능 설명 툴팁 ([data-desc] hover/focus 시 노출) ================= */
  (function initEvalTooltips() {
    const tip = document.createElement("div");
    tip.id = "veTip";
    document.body.appendChild(tip);
    let current = null;
    function place(el) {
      const text = el.getAttribute("data-desc");
      if (!text) return;
      current = el; tip.textContent = text;
      tip.classList.remove("above", "below");
      tip.style.visibility = "hidden"; tip.classList.add("show");
      const r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
      const vw = document.documentElement.clientWidth, gap = 9;
      let left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, vw - tw - 8));
      let top = r.top - th - gap;
      if (top < 8) { top = r.bottom + gap; tip.classList.add("below"); } else { tip.classList.add("above"); }
      tip.style.setProperty("--tip-arrow", Math.max(12, Math.min(r.left + r.width / 2 - left, tw - 12)) + "px");
      tip.style.left = left + "px"; tip.style.top = top + "px"; tip.style.visibility = "visible";
    }
    function hide() { current = null; tip.classList.remove("show"); }
    document.addEventListener("mouseover", e => { const el = e.target.closest("[data-desc]"); if (el && el !== current) place(el); });
    document.addEventListener("mouseout", e => { const el = e.target.closest("[data-desc]"); if (el && el === current && !el.contains(e.relatedTarget)) hide(); });
    document.addEventListener("focusin", e => { const el = e.target.closest("[data-desc]"); if (el) place(el); });
    document.addEventListener("focusout", hide);
    window.addEventListener("scroll", hide, true);
  })();

  /* ================= 초기 렌더 ================= */
  const hdMeta = byId("veVendorName");
  if (hdMeta) hdMeta.textContent = `${vendorName} (${vendorBiz})`;
  renderItemsTab();
})();
