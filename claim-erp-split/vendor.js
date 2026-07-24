/* ===================== 협력업체조회 (vendor-inquiry) ===================== */
/* 정적 데모: 실제 저장/백엔드 없음. 탭 전환 · 유관업체 시드 · 행 추가/삭제 · 저장 토스트. */

(function initVendor() {
  const root = document.getElementById("viewVendor");
  if (!root) return;

  /* 업체구분 · 거래메이커 드롭다운 옵션 (엑셀 드롭다운 구분값) */
  const KIND_OPTS = ["정비업체", "부품업체", "유리업체", "렌트업체", "실런트업체"];
  const MAKER_OPTS = ["", "현대", "기아", "쌍용", "르노삼성", "한국GM", "제네시스"];

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
    { name: "정태순", no: "10200849", dept: "애니카손사 Claim1팀", end: "9999.12.31" },
    { name: "고석민", no: "11060684", dept: "SK Claim 1팀", end: "2026.07.22" },
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

  function optionsHtml(list, selected) {
    return list.map(v => `<option${v === selected ? " selected" : ""}>${esc(v || "선택")}</option>`).join("");
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
    d = d || { name: "", no: "", dept: "", end: "9999.12.31" };
    return `<tr>
      <td class="vcheck"><input type="checkbox" data-rowchk></td>
      <td><input class="lg-in" data-f="dept" value="${esc(d.dept)}" placeholder="조회 시 자동" readonly></td>
      <td><input class="lg-in" data-f="no" value="${esc(d.no)}" placeholder="자동" readonly></td>
      <td>
        <span class="vname">
          <input class="lg-in" data-f="name" value="${esc(d.name)}" placeholder="성명 입력">
          <button type="button" class="lg-mini gray" data-staffsearch title="이름으로 사번 조회">조회</button>
        </span>
      </td>
      <td><input class="lg-in" data-f="end" value="${esc(d.end)}"></td>
    </tr>`;
  }

  /* 시드 렌더 */
  const relatedBody = document.getElementById("vRelatedBody");
  if (relatedBody) relatedBody.innerHTML = RELATED_SEED.map(relatedRow).join("");
  const staffBody = document.getElementById("vStaffBody");
  if (staffBody) staffBody.innerHTML = STAFF_SEED.map(staffRow).join("");

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

    /* 안내용 버튼(데모 토스트) */
    const t = e.target.closest("[data-toast]");
    if (t) { toast(t.dataset.toast); return; }

    /* 저장 / 검색 */
    if (e.target.closest("#vSaveBtn") || e.target.closest("#vSaveBtn2")) { toast("협력업체 정보를 저장했습니다. (데모)"); return; }
    if (e.target.closest("#vSearchBtn")) {
      const kw = (root.querySelector("#vSearchKeyword") || {}).value || "";
      toast(kw ? `'${kw}' 조회 결과를 표시합니다. (데모)` : "검색어를 입력하세요. (데모)");
      return;
    }
  });

  /* 전체선택 체크박스 */
  root.addEventListener("change", e => {
    const all = e.target.closest("input[data-checkall]");
    if (!all) return;
    const body = all.closest("table").querySelector("tbody");
    body.querySelectorAll("input[data-rowchk]").forEach(chk => { chk.checked = all.checked; });
  });
})();
