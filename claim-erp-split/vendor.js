/* ===================== 협력업체조회 (vendor-inquiry) ===================== */
/* 정적 데모: 실제 저장/백엔드 없음. 탭 전환 · 유관업체 시드 · 행 추가/삭제 · 저장 토스트. */

(function initVendor() {
  const root = document.getElementById("viewVendor");
  if (!root) return;

  /* 업체구분 · 거래메이커 드롭다운 옵션 (엑셀 드롭다운 구분값) */
  const KIND_OPTS = ["정비업체", "부품업체", "유리업체", "렌트업체", "실런트업체"];
  const MAKER_OPTS = ["", "현대", "기아", "쌍용", "르노삼성", "한국GM", "제네시스"];
  /* 담당자 업무구분 — SA 또는 SK (대물-AS·대인·자차 불필요) */
  const TASK_OPTS = ["SA", "SK"];

  /* 브랜드별 부품할인율 — 브랜드는 자동차 제조사코드(산지 D=국산/F=외산) 기준으로 채운다.
     공통코드: 대분류 시스템(SYST) > 중분류 제작사 국산/외산 > 소분류 브랜드(제작사코드). */
  const BRAND_CODES = {
    국산: ["현대", "기아", "르노(삼성)", "KG모빌리티(쌍용)", "쉐보레(대우)", "기타"],
    외산: [
      "BMW", "벤츠", "렉서스", "크라이슬러", "볼보", "아우디", "랜드로버", "GM", "포드", "폭스바겐",
      "사브", "머큐리", "포르쉐", "페라리", "재규어", "푸조", "시트로엥", "링컨", "시보레", "오펠",
      "GMC", "캐딜락", "람보르기니", "피아트", "도요타", "마쯔다", "미쯔비시", "이스즈", "혼다", "닛산",
      "다이하쓰", "닷지", "란치아", "로버", "로터스", "롤스로이스", "르노", "마세라티", "벤틀리", "뷰익",
      "세아트", "스바루", "스즈키", "알파로메오", "애스턴마틴", "올즈모빌", "인피니티", "허머", "홀덴", "폰티악",
      "기타", "스카니아", "만", "북기은상", "맥라렌", "테슬라", "MINI",
    ],
  };
  /* 제작사 구분별 기본 부품할인율(%) — 상단 요약값 */
  const ORIGIN_RATE = { 국산: "5.00", 외산: "0.00" };
  /* 브랜드별 부품할인율(%) 편집 상태 — 구분 전환 시에도 입력값 유지 (데모 시드) */
  const brandRates = {
    국산: { "현대": "5", "기아": "5", "르노(삼성)": "3", "KG모빌리티(쌍용)": "3", "쉐보레(대우)": "3", "기타": "0" },
    외산: {},
  };

  /* 은행명 드롭다운 — 국내 이용 빈도(개인고객 접근성·시장규모) 기준 조회순서
     (엑셀 '정렬기준' 시트: 국내은행·상호금융 → 외국계 → 증권 → 구/폐지 코드 순) */
  const BANK_OPTS = [
    "(004) 국민은행", "(088) 신한은행", "(011) 농협중앙회", "(012) 지역농협",
    "(081) KEB하나은행", "(020) 우리은행", "(090) 카카오뱅크", "(003) 기업은행",
    "(045) 새마을금고", "(071) 우체국", "(092) 토스뱅크", "(089) 케이뱅크",
    "(048) 신용협동조합", "(007) 수협", "(023) 제일은행", "(050) 상호저축은행",
    "(031) IM뱅크((구)대구은행)", "(032) 부산은행", "(039) 경남은행", "(034) 광주은행",
    "(037) 전북은행", "(035) 제주은행", "(027) 씨티은행", "(002) 산업은행",
    "(064) 산림조합중앙회", "(054) HSBC", "(051) Ｄ．Ｂ．Ｓ．", "(055) 도이치은행",
    "(057) JP모간체이스은행", "(060) BOA", "(059) 엠유에프지은행", "(058) 미즈호은행",
    "(061) BNP파리바은행", "(264) 키움증권", "(230) 미래에셋증권", "(238) 미래에셋증권",
    "(240) 삼성증권", "(243) 한국투자증권", "(247) NH투자증권", "(218) KB증권",
    "(271) 토스증권", "(288) 카카오페이증권", "(278) 신한금융투자", "(270) 하나금융투자",
    "(287) 메리츠증권", "(209) 유안타증권", "(269) 한화투자증권", "(263) 현대차증권",
    "(225) IBK투자증권", "(265) 이베스트증권", "(266) SK증권", "(280) 유진투자증권",
    "(262) 하이투자증권", "(291) 신영증권", "(227) KTB투자증권", "(294) 한국포스증권",
    "(005) 외환은행", "(053) (구)씨티은행", "(001) 한국은행", "(006) (폐)주택은행",
    "(010) (폐)농협중앙회", "(013) (폐)지역농협", "(014) (폐)지역농협", "(015) (폐)지역농협",
    "(021) (폐)(구)조흥은행", "(022) (폐)우리은행", "(024) (폐)우리은행", "(025) (폐)서울은행",
    "(026) (폐)(구)신한은행", "(046) (폐)새마을금고", "(049) (폐)신용협동조합", "(072) (폐)우체국",
    "(073) (폐)우체국", "(074) (폐)우체국", "(075) (폐)우체국", "(083) (폐)평화은행",
    "(261) (폐)교보증권", "(267) (폐)대신증권", "(268) (폐)아이엠투자증권", "(279) (폐)동부증권",
    "(289) (폐)NH투자증권", "(290) (폐)부국증권", "(292) (폐)LIG투자증권",
  ];

  /* 담당자 인사 디렉터리 (성명 → 사번·부서) — 조회 데모용 */
  const STAFF_DIR = {
    "정태순": { no: "10200849", dept: "애니카손사 Claim1팀" },
    "고석민": { no: "11060684", dept: "SK Claim 1팀" },
    "홍길동": { no: "10233210", dept: "애니카손사 Claim2팀" },
    "박지현": { no: "11091234", dept: "SK Claim 운영1팀" },
    "서미나": { no: "10277451", dept: "SK Claim 2팀" },
  };

  /* 담당자 시드 (엑셀 시트2) */
  const STAFF_SEED = [
    { task: "SA", name: "정태순", no: "10200849", dept: "애니카손사 Claim1팀", end: "9999.12.31" },
    { task: "SK", name: "고석민", no: "11060684", dept: "SK Claim 1팀", end: "2026.07.22" },
  ];

  /* 유관업체 시드 (엑셀 시트2) — 자주 거래하는 업체 */
  const RELATED_SEED = [
    { biz: "226-11-55893", name: "전흥주(강원오토)", kind: "실런트업체", tel: "033-653-8310", maker: "",       fax: "033-653-8311", mgr: "033-653-8310" },
    { biz: "113-81-32864", name: "에스케이렌터카㈜", kind: "렌트업체",   tel: "1599-9111",   maker: "",       fax: "02-6474-5513", mgr: "1599-9111" },
    { biz: "536-85-00786", name: "(주)로드렌트카",   kind: "렌트업체",   tel: "033-647-7233", maker: "",       fax: "",             mgr: "033-647-7233" },
    { biz: "608-85-38836", name: "스타렌트카(주)",   kind: "렌트업체",   tel: "010-7167-4972", maker: "",      fax: "",             mgr: "010-7167-4972" },
    { biz: "226-01-74834", name: "이박사차유리",     kind: "유리업체",   tel: "033-645-6282", maker: "",       fax: "033-643-6295", mgr: "033-645-6282" },
    { biz: "226-33-05454", name: "강릉자동차유리",   kind: "유리업체",   tel: "033-643-1372", maker: "",       fax: "",             mgr: "033-643-1372" },
    { biz: "226-01-26458", name: "승원상사",         kind: "부품업체",   tel: "033-651-5788", maker: "쌍용",   fax: "033-652-8954", mgr: "033-651-5788" },
    { biz: "226-16-95740", name: "대양상사",         kind: "부품업체",   tel: "033-652-2266", maker: "르노삼성", fax: "033-653-2241", mgr: "033-652-2266" },
    { biz: "228-03-64001", name: "강릉지엠부품",     kind: "부품업체",   tel: "033-652-4289", maker: "한국GM", fax: "033-652-4482", mgr: "033-652-4289" },
    { biz: "226-81-28803", name: "현대상사㈜",       kind: "부품업체",   tel: "010-6809-7879", maker: "현대",  fax: "033-648-0872", mgr: "010-6809-7879" },
    { biz: "226-81-33626", name: "(주)홍길동부품상사", kind: "부품업체", tel: "033-643-6901", maker: "기아",   fax: "033-643-6903", mgr: "033-643-6901" },
  ];

  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const toast = msg => (typeof showToast === "function" ? showToast(msg) : void 0);

  /* 적용종료일 무기한(미지정) 센티넬 */
  const END_OPEN = "9999.12.31";
  const END_OPEN_ISO = "9999-12-31";
  const pad2 = n => String(n).padStart(2, "0");
  /* "9999.12.31" ↔ "9999-12-31" (네이티브 date 입력용) */
  const dotToIso = dot => {
    const m = String(dot || "").match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    return m ? `${m[1]}-${pad2(m[2])}-${pad2(m[3])}` : "";
  };
  const isoToDot = iso => {
    const m = String(iso || "").match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? `${m[1]}.${pad2(m[2])}.${pad2(m[3])}` : "";
  };
  /* 입력(저장)일 기준 D-1 을 dot 포맷으로 */
  const yesterdayDot = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
  };

  function optionsHtml(list, selected) {
    return list.map(v => `<option${v === selected ? " selected" : ""}>${esc(v || "선택")}</option>`).join("");
  }

  /* 적용종료일 셀 — 무기한(9999.12.31)만 달력/키인 가능, 종료된 행은 잠금 표시 */
  function endCell(end) {
    end = end || END_OPEN;
    if (end === END_OPEN) {
      return `<input type="date" class="lg-in vend" data-f="end" value="${END_OPEN_ISO}" data-desc="적용종료일을 달력에서 선택하거나 직접 입력합니다. (9999-12-31 = 무기한)">`;
    }
    return `<span class="vend-lock" data-f="end" data-end="${esc(end)}" data-desc="종료 처리된 담당자입니다. 종료일은 수정할 수 없습니다.">${esc(end)}</span>`;
  }

  /* 유관업체 한 행 마크업 */
  function relatedRow(r) {
    r = r || { biz: "", name: "", kind: KIND_OPTS[0], tel: "", maker: "", fax: "", mgr: "" };
    return `<tr>
      <td class="vcheck"><input type="checkbox" data-rowchk></td>
      <td><input class="lg-in" value="${esc(r.biz)}"></td>
      <td><input class="lg-in" value="${esc(r.name)}"></td>
      <td><select class="lg-sel">${optionsHtml(KIND_OPTS, r.kind)}</select></td>
      <td><input class="lg-in" value="${esc(r.tel)}"></td>
      <td><select class="lg-sel">${optionsHtml(MAKER_OPTS, r.maker)}</select></td>
      <td><input class="lg-in" value="${esc(r.fax)}"></td>
      <td><input class="lg-in" value="${esc(r.mgr)}"></td>
    </tr>`;
  }

  /* 담당자 행 마크업 — 성명 조회로 사번·부서 자동 채움 */
  function staffRow(d) {
    d = d || { task: TASK_OPTS[0], name: "", no: "", dept: "", end: "9999.12.31" };
    return `<tr>
      <td class="vcheck"><input type="checkbox" data-rowchk></td>
      <td><select class="lg-sel" data-f="task">${optionsHtml(TASK_OPTS, d.task)}</select></td>
      <td><input class="lg-in" data-f="dept" value="${esc(d.dept)}" placeholder="조회 시 자동" readonly></td>
      <td><input class="lg-in" data-f="no" value="${esc(d.no)}" placeholder="자동" readonly></td>
      <td>
        <span class="vname">
          <input class="lg-in" data-f="name" value="${esc(d.name)}" placeholder="성명 입력">
          <button type="button" class="lg-mini gray" data-staffsearch title="이름으로 사번 조회">조회</button>
        </span>
      </td>
      <td>${endCell(d.end)}</td>
    </tr>`;
  }

  /* 은행명 드롭다운 채우기 — [data-bankselect] 셀렉트에 조회순서대로 옵션 주입,
     data-selected 값(현재 계좌 은행)을 기본 선택으로 표시 */
  root.querySelectorAll("select[data-bankselect]").forEach(sel => {
    const cur = sel.getAttribute("data-selected") || "";
    sel.innerHTML = optionsHtml(BANK_OPTS, cur);
  });

  /* 브랜드별 부품할인율 — 선택된 제작사 구분(국산/외산)의 제조사코드 브랜드로 표 렌더.
     외산은 브랜드가 많아 3열(컬럼별 세로 분배) 레이아웃으로 표시한다. */
  function currentOrigin() { const s = document.getElementById("vOriginSel"); return (s && s.value) || "국산"; }
  function brandCell(b, rates) {
    return `<td class="vbr-name">${esc(b)}</td><td><input class="lg-in" style="text-align:right" data-brand="${esc(b)}" value="${esc(rates[b] || "0")}"></td>`;
  }
  function renderBrandRates() {
    const wrap = document.getElementById("vBrandWrap");
    if (!wrap) return;
    const origin = currentOrigin();
    const rates = brandRates[origin] || (brandRates[origin] = {});
    const brands = BRAND_CODES[origin] || [];
    if (brands.length > 12) {
      // 4열 레이아웃 (컬럼별 세로 분배)
      const cols = 4, per = Math.ceil(brands.length / cols);
      let body = "";
      for (let r = 0; r < per; r++) {
        let tr = "<tr>";
        for (let c = 0; c < cols; c++) {
          const idx = c * per + r;
          tr += idx < brands.length ? brandCell(brands[idx], rates) : "<td></td><td></td>";
        }
        body += tr + "</tr>";
      }
      const head = "<tr>" + "<th>브랜드</th><th>부품할인율 (%)</th>".repeat(cols) + "</tr>";
      wrap.innerHTML = `<table class="lg-tbl vbr-tbl"><thead>${head}</thead><tbody>${body}</tbody></table>`;
    } else {
      const body = brands.map(b => `<tr>${brandCell(b, rates)}</tr>`).join("");
      wrap.innerHTML = `<table class="lg-tbl" style="max-width:360px"><colgroup><col style="width:55%"><col style="width:45%"></colgroup><thead><tr><th>브랜드</th><th>부품할인율 (%)</th></tr></thead><tbody>${body}</tbody></table>`;
    }
    const label = document.getElementById("vOriginLabel");
    if (label) label.textContent = origin + "부품할인율";
    const rate = document.getElementById("vOriginRate");
    if (rate) rate.value = ORIGIN_RATE[origin] || "0.00";
  }

  /* 시드 렌더 */
  const relatedBody = document.getElementById("vRelatedBody");
  if (relatedBody) relatedBody.innerHTML = RELATED_SEED.map(relatedRow).join("");
  const staffBody = document.getElementById("vStaffBody");
  if (staffBody) staffBody.innerHTML = STAFF_SEED.map(staffRow).join("");
  renderBrandRates();

  /* 탭 전환 */
  const tabs = root.querySelector("#vTabs");
  if (tabs) {
    tabs.addEventListener("click", e => {
      const tab = e.target.closest(".lg-tab");
      if (!tab) return;
      tabs.querySelectorAll(".lg-tab").forEach(t => t.classList.toggle("active", t === tab));
      root.querySelectorAll(".v-tabpane").forEach(p => { p.hidden = p.dataset.pane !== tab.dataset.tab; });
    });
  }

  /* 표 헬퍼: data-table 로 tbody 찾기 */
  const tableBody = key => {
    const tbl = root.querySelector(`table[data-table="${key}"]`);
    return tbl ? tbl.querySelector("tbody") : null;
  };

  /* 종료일 셀을 잠금(종료 처리) 상태로 전환 */
  function lockEndCell(td, dot) {
    td.innerHTML = endCell(dot);
  }
  /* 저장 시 직전 담당자 종료일 자동 처리 (D-1)
     — 무기한(9999-12-31) 담당자가 2명 이상이면 가장 최근(마지막) 1명만 유지하고
       나머지(직전 담당자)의 종료일을 입력일 D-1 로 자동 입력한다. (키인 아님) */
  function closePreviousStaff() {
    const body = tableBody("staff");
    if (!body) return { closed: 0, date: "" };
    const openInputs = [...body.querySelectorAll('tr input.vend[data-f="end"]')]
      .filter(inp => inp.value === END_OPEN_ISO);
    if (openInputs.length < 2) return { closed: 0, date: "" };
    const dm1 = yesterdayDot();
    openInputs.slice(0, -1).forEach(inp => lockEndCell(inp.closest("td"), dm1));
    return { closed: openInputs.length - 1, date: dm1 };
  }

  /* 행 추가 / 선택삭제 / 전체선택 (이벤트 위임) */
  root.addEventListener("click", e => {
    const add = e.target.closest("[data-addrow]");
    if (add) {
      const key = add.dataset.addrow;
      const body = tableBody(key);
      if (!body) return;
      body.insertAdjacentHTML("beforeend", key === "related" ? relatedRow() : staffRow());
      toast("행을 추가했습니다. (데모)");
      return;
    }
    const del = e.target.closest("[data-delrow]");
    if (del) {
      const body = tableBody(del.dataset.delrow);
      if (!body) return;
      const checked = body.querySelectorAll("tr input[data-rowchk]:checked");
      if (!checked.length) { toast("삭제할 행을 선택하세요. (데모)"); return; }
      checked.forEach(chk => chk.closest("tr").remove());
      toast(`${checked.length}개 행을 삭제했습니다. (데모)`);
      return;
    }
    /* 담당자 성명 조회 → 사번·부서 자동 채움 */
    const sb = e.target.closest("[data-staffsearch]");
    if (sb) {
      const tr = sb.closest("tr");
      const nameEl = tr.querySelector('[data-f="name"]');
      const nm = (nameEl.value || "").trim();
      if (!nm) { toast("성명을 입력한 뒤 조회하세요. (데모)"); return; }
      const hit = STAFF_DIR[nm];
      if (!hit) { toast(`'${nm}' 사번 조회 결과가 없습니다. (데모)`); return; }
      tr.querySelector('[data-f="no"]').value = hit.no;
      tr.querySelector('[data-f="dept"]').value = hit.dept;
      toast(`${nm} · 사번 ${hit.no} 조회 완료 (데모)`);
      return;
    }

    /* 선정평가 → 평가항목/건수 관리 팝업 새 창 열기 (업체 컨텍스트 전달) */
    if (e.target.closest("#vEvalBtn")) {
      const nm = (document.getElementById("vBaseName") || {}).textContent || "협력업체";
      const biz = (document.getElementById("vBaseBiz") || {}).textContent || "-";
      try { localStorage.setItem("vendorEvalContext", JSON.stringify({ name: nm.trim(), biz: biz.trim() })); } catch (err) {}
      const url = "vendor-eval.html?name=" + encodeURIComponent(nm.trim()) + "&biz=" + encodeURIComponent(biz.trim());
      const w = window.open(url, "vendorEval", "width=1120,height=860,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes");
      if (w) w.focus(); else toast("팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도하세요. (데모)");
      return;
    }

    /* 부품할인율 일괄적용 — 상단 %값을 현재 구분의 모든 브랜드 칸에 적용 */
    if (e.target.closest("#vBulkApply")) {
      const origin = currentOrigin();
      const raw = (document.getElementById("vOriginRate") || {}).value;
      const num = parseFloat(raw);
      const val = isNaN(num) ? "0" : String(num);
      const rates = brandRates[origin] || (brandRates[origin] = {});
      root.querySelectorAll("#vBrandWrap input[data-brand]").forEach(inp => {
        inp.value = val;
        rates[inp.dataset.brand] = val;
      });
      toast(`${origin} 부품할인율 ${val}%를 전체 브랜드에 일괄 적용했습니다. (데모)`);
      return;
    }

    /* 안내용 버튼(데모 토스트) */
    const t = e.target.closest("[data-toast]");
    if (t) { toast(t.dataset.toast); return; }

    /* 저장 — 섹션별 저장 버튼([data-vsave]) 처리 */
    const saveBtn = e.target.closest("[data-vsave]");
    if (saveBtn) {
      const label = saveBtn.dataset.vsave ? saveBtn.dataset.vsave + "을(를) " : "협력업체 정보를 ";
      const r = closePreviousStaff();
      toast(r.closed
        ? `${label}저장했습니다. 직전 담당자 ${r.closed}명의 종료일을 ${r.date}(입력일 D-1)로 자동 처리했습니다. (데모)`
        : `${label}저장했습니다. (데모)`);
      return;
    }
    if (e.target.closest("#vSearchBtn")) {
      const kw = (root.querySelector("#vSearchKeyword") || {}).value || "";
      toast(kw ? `'${kw}' 조회 결과를 표시합니다. (데모)` : "검색어를 입력하세요. (데모)");
      return;
    }
  });

  /* 전체선택 체크박스 / 제작사 구분(국산·외산) 전환 */
  root.addEventListener("change", e => {
    const all = e.target.closest("input[data-checkall]");
    if (all) {
      const body = all.closest("table").querySelector("tbody");
      body.querySelectorAll("input[data-rowchk]").forEach(chk => { chk.checked = all.checked; });
      return;
    }
    if (e.target.id === "vOriginSel") { renderBrandRates(); return; }
    if (e.target.closest("[data-actradio]")) { applyContractActivation(e.target.closest("[data-actradio]").dataset.actradio); return; }
  });

  /* 계약여부='계약'일 때만 계약일자·계약약관·계약적용일자·계약기간 활성화 (첫 라디오='계약') */
  function applyContractActivation(grp) {
    const radios = root.querySelectorAll(`input[name="vc-${grp}"]`);
    const contracted = radios[0] && radios[0].checked;
    root.querySelectorAll(`[data-actgrp="${grp}"]`).forEach(el => {
      el.disabled = !contracted;
      const lbl = el.closest("label");
      if (lbl) lbl.classList.toggle("dis", !contracted);
    });
  }
  applyContractActivation("dom");
  applyContractActivation("imp");

  /* 섹션별 '저장' 버튼에 hover/focus 시 해당 저장 박스를 강조 — 저장 범위를 시각적으로 안내 */
  function toggleSaveBox(target, on) {
    const btn = target && target.closest && target.closest("[data-vsave]");
    if (!btn) return;
    const box = btn.closest(".v-savebox");
    if (box) box.classList.toggle("hi", on);
  }
  root.addEventListener("mouseover", e => toggleSaveBox(e.target, true));
  root.addEventListener("mouseout", e => toggleSaveBox(e.target, false));
  root.addEventListener("focusin", e => toggleSaveBox(e.target, true));
  root.addEventListener("focusout", e => toggleSaveBox(e.target, false));

  /* 브랜드별 부품할인율 입력값 유지 (구분 전환 시에도 보존) + 기본 요약율 반영 */
  root.addEventListener("input", e => {
    const bi = e.target.closest("[data-brand]");
    if (bi) { (brandRates[currentOrigin()] || {})[bi.dataset.brand] = bi.value; return; }
    if (e.target.id === "vOriginRate") { ORIGIN_RATE[currentOrigin()] = e.target.value; return; }
  });
})();

/* [data-desc] 요소에 마우스를 올리면(또는 포커스하면) 기능 설명을 말풍선으로 노출 — Smart업무처리와 동일 */
(function initVendorDescTooltips() {
  if (!document.getElementById("viewVendor")) return;
  const tip = document.createElement("div");
  tip.id = "clTooltip";
  document.body.appendChild(tip);
  let current = null;

  function place(el) {
    const text = el.getAttribute("data-desc");
    if (!text) return;
    current = el;
    tip.textContent = text;
    tip.classList.remove("above", "below");
    tip.style.visibility = "hidden";
    tip.classList.add("show");           // 실제 크기 측정을 위해 표시
    const r = el.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const vw = document.documentElement.clientWidth;
    const gap = 10;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, vw - tw - 8));
    let top = r.top - th - gap;
    if (top < 8) { top = r.bottom + gap; tip.classList.add("below"); }
    else { tip.classList.add("above"); }
    const arrow = r.left + r.width / 2 - left;
    tip.style.setProperty("--tip-arrow", Math.max(12, Math.min(arrow, tw - 12)) + "px");
    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.style.visibility = "visible";
  }
  function hide() { current = null; tip.classList.remove("show"); }

  document.addEventListener("mouseover", e => {
    const el = e.target.closest("[data-desc]");
    if (el && el !== current) place(el);
  });
  document.addEventListener("mouseout", e => {
    const el = e.target.closest("[data-desc]");
    if (el && el === current && !el.contains(e.relatedTarget)) hide();
  });
  document.addEventListener("focusin", e => {
    const el = e.target.closest("[data-desc]");
    if (el) place(el);
  });
  document.addEventListener("focusout", hide);
  window.addEventListener("scroll", hide, true);
  document.addEventListener("click", hide, true);
})();
