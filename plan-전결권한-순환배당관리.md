# 전결권한 및 순환배당 관리 화면 — 구현 계획

> 이 문서는 코드 수정 없이 작성한 설계 계획서입니다. 구현은 별도 지시에 따라 진행합니다.

---

## Context (배경)

센터장/부장 등 관리자가 **직원별 전결권한·추산/지급 한도·종결권한·일 배당한도·순환배당 방식·부재/직무대행**을 한 화면에서 관리할 수 있어야 한다. 현재 Claim-ERP에는 이 관리 기능이 없어, 배당 규칙과 권한이 시스템에 표현되지 않는다. 본 계획은 기존 단일 `index.html` SPA에 신규 관리자 전용 화면 1종을 추가하되, 기존 디자인 톤과 4개 화면(Smart업무관리·Smart접수지·이미지시스템·결재 LIST)의 동작을 깨뜨리지 않는 것을 목표로 한다.

**확정된 설계 방향(사용자 선택):**
- 디자인 톤: **모던 톤**(결재 LIST 스타일) — `.card`/`.badge`/`.appr-toolbar`/`.panel`/`.claim-table` 재사용
- 메뉴 위치: 좌측 **'메뉴' 섹션 하단**(결재 LIST 아래, 같은 그룹)
- 배당순번 기준: **현재 배당건수(todayAssignedCount) 적은 순**
- 긴급도 판단 로직: **넣지 않음**(요구사항 명시)

---

## 1. 현재 index.html에서 수정/추가할 영역

단일 파일 SPA(`index.html`, 약 4,603줄). 구조: CSS `<style>`(7–1618), HTML(1620–1825), JS `<script>`(1827–4603).
새 화면 추가는 기존 뷰 추가 패턴(nav 항목 → 뷰 컨테이너 → `VIEW_TITLES` → `switchView` 분기 → 렌더 함수)을 그대로 따른다.

| # | 영역 | 위치(앵커) | 작업 |
|---|------|-----------|------|
| A | 좌측 메뉴 | `nav.side-nav` 내 결재 LIST 버튼 뒤 (~1653) | `data-view="assign"` nav 항목 추가 (`.sn-section "메뉴"` 그룹 하단) |
| B | 뷰 컨테이너 | `viewIntake` 뒤, `</main>` 앞 (~1816) | `<section id="viewAssign" class="view" hidden>` 신설(조회조건·요약카드·그리드·우측패널 root) |
| C | 시뮬레이션 모달 | `#imageViewerRoot` 뒤 (~1825) | `<div class="modal-root" id="assignSimRoot" aria-hidden="true">` 추가 |
| D | CSS | `</style>` 앞 (~1616) | 신규 클래스 블록(`/* ===== 전결권한·순환배당 관리 ===== */`) 추가 |
| E | 목업 데이터 | `APPROVALS` 정의 근처 mock 영역 (~2543 이후) | `staffAssignmentSettings` 등 데이터·상수·변경이력 추가 |
| F | 라우팅 | `VIEW_TITLES`(3666) + `switchView`(3667–3678) | 타이틀 매핑 + `hidden` 토글 + `renderAssign()` 분기 추가 |
| G | 렌더/로직 함수 | 스크립트 후반(예: 4256 이후, 결재 LIST 렌더 근처) | `renderAssign*`, 배당 로직, 시뮬레이션, 저장/이력 함수 추가 |

> **주의:** `viewClaims`는 `hidden` 속성이 없어 기본 표시된다. 신규 `viewAssign`은 **반드시 `hidden`** 을 부여하고, `switchView`에 토글 라인을 추가한다(누락 시 뷰 겹침).

---

## 2. 신규 화면 레이아웃 구조 (모던 톤)

`#viewAssign` 내부 구성 (위→아래, 우측 패널은 그리드와 2단):

```
┌ page-head ───────────────────────────────────────────────┐
│  전결권한 및 순환배당 관리 / 관리자 전용 설명                │
├ 조회조건  section.card.appr-toolbar ─────────────────────┤
│  권역▾  부서▾  센터▾  직원명[search]  적용일자[date]        │
│                         [검색] [시뮬레이션] [저장]          │
├ 요약카드  section.appr-cards  (#assignSummary) ──────────┤
│  전체14 · 배당가능9 · 부재2 · 배당중지1 · 결재권자2 · 한도초과1 │
├ 본문 2단  div.sa-workspace ──────────────────────────────┤
│  ┌ 그리드 list-card.card (#assignGrid, 가로스크롤) ─┐ ┌우측┐ │
│  │  ☑ 담당자 사번 직급 레벨 … 배당상태 부재유형 …    │ │패널│ │
│  └──────────────────────────────────────────────────┘ └────┘ │
└──────────────────────────────────────────────────────────┘
```

**조회조건(상단):** 기존 `.appr-toolbar`/`.appr-field` 재사용. 권역·부서·센터는 `<select>`, 직원명은 `input[type=search]`, 적용일자는 `input[type=date]`. 버튼 3종(`검색`/`시뮬레이션`/`저장`)은 `.appr-actions` 그룹에 `.btn`/`.btn.primary`.

**요약카드(6개):** 기존 `.appr-cards`/`.appr-card` 패턴 재사용. 라벨+숫자. 클릭 시 해당 그룹 필터(선택 구현, 최소 표시만이라도).

**메인 그리드(18컬럼):** `.claim-table` 재사용 + 가로 스크롤 래퍼(`.sa-grid-wrap`, `overflow-x:auto`).
컬럼: `선택(체크)` · 담당자 · 사번 · 직급 · 결재레벨 · 추산한도 · 지급한도 · 종결권한 · 일배당한도 · 현재배당 · 잔여배당 · 배당방식 · 지역그룹 · 업체그룹 · 배당상태 · 부재유형 · 직무대행자 · 적용여부.
행 클릭 시 우측 패널에 해당 직원 로딩, 행 `.selected` 표시.

**우측 상세 패널:** 기존 `.panel`/`.panel-head`/`.panel-body`/`.panel-foot` + `.sec`/`.sec-title` 재사용. 미선택 시 `.panel-empty`("직원을 선택하세요"). 4개 섹션(스크롤 구분):
- **섹션 1 권한/한도:** 결재레벨(라디오: 1레벨 일반직원 / 3레벨 센터장·부장), 추산한도(입력), 지급한도(입력), 면책종결(체크), 지급종결(체크)
- **섹션 2 순환배당:** 일 배당한도(입력), 배당방식(select: 배당제외/지역순환/업체순환/지역+업체순환), 지역그룹(select), 업체그룹(select), 현재배당(읽기), 잔여배당(읽기·자동계산)
- **섹션 3 부재/직무대행:** 배당상태(select 5종), 부재일자(date), 직무대행자(select), 안내문("부재/반차 설정 시 기존 배당건은 유지되며, 신규 배당만 제한됩니다.")
- **섹션 4 변경이력:** 변경일시·변경자·변경항목·변경 전·변경 후·변경사유 (`.sa-history` 소형 표)

패널 하단(`.panel-foot`): `[이 직원 저장]` `[되돌리기]`.

---

## 3. 추가할 데이터 구조 (mock, in-memory)

기존 목업(`CLAIMS`, `APPROVALS`)과 동일하게 전역 상수/배열로 추가. 직원명은 기존 `manager` 값(박지현·최도윤·김하늘·오세린·문태호·유나래) 재사용 + 신규 보강하여 **12~14명**.

```javascript
// 상수(선택지)
const ASSIGN_MODES     = ["배당제외","지역순환","업체순환","지역+업체순환"];
const ASSIGN_STATUSES  = ["정상","오전반차","오후반차","종일부재","배당중지"]; // 섹션3 단일 셀렉터
const ASSIGN_REGION_GROUPS = ["경기남부","경기북부","서울강남","서울강북","인천"];
const ASSIGN_VENDOR_GROUPS = ["수원협력업체","분당협력업체","강서협력업체","송파협력업체","일산협력업체"];
const ORG_REGIONS = ["수도권","중부권"];      // 조회조건 '권역'
const ORG_DEPTS   = ["Claim운영1팀","Claim운영2팀"]; // 조회조건 '부서'
const ORG_CENTERS = ["강남센터","분당센터"];  // 조회조건 '센터'

// 직원별 설정 (사용자 제시 구조 기반 + 조직/부재 필드 보강)
let staffAssignmentSettings = [
  {
    id:"EMP001", name:"최도윤", employeeNo:"12345678", position:"직원",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000,
    canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:15, todayAssignedCount:7,
    assignmentMode:"지역+업체순환", regionGroup:"경기남부", vendorGroup:"수원협력업체",
    assignmentStatus:"정상",   // {정상, 배당중지}
    absenceType:"없음",        // {없음, 오전반차, 오후반차, 종일부재}
    absenceDate:null, deputyEmployeeId:null, isActive:true
  },
  // … 센터장/부장(approvalLevel:3, assignmentMode:"배당제외") 2명 포함,
  //    오전반차/오후반차/종일부재/배당중지/한도초과 각 케이스를 담은 직원 배치
];

// 변경이력 (직원 id별 로그)
let assignChangeHistory = {
  "EMP001": [
    { at:"2026-07-01 09:12", by:"센터장 김본부", field:"지급한도",
      before:"1,500,000", after:"1,999,000", reason:"분기 권한 상향" }
  ]
};
```

**설계 결정 — 배당상태 2필드 모델(왜):** 그리드는 `배당상태`/`부재유형` 두 컬럼을 요구하고, 섹션3은 5종 단일 셀렉터를 요구한다. 데이터는 사용자 예시대로 `assignmentStatus`(정상/배당중지) + `absenceType`(없음/오전반차/오후반차/종일부재) **2필드**로 저장하고, 섹션3 셀렉터(5종)를 두 필드로 매핑한다.
- `정상` → status=정상, absence=없음
- `오전반차`/`오후반차`/`종일부재` → status=정상, absence=해당
- `배당중지` → status=배당중지 (absence 무관)

이렇게 하면 배제 로직(§4)이 두 필드를 독립 검사할 수 있어 예측 가능하다.

**종결권한 표기(파생):** `canCloseWaiver`/`canClosePayment` → `면책` / `지급` / `면책/지급` / `없음`.
**잔여배당(파생):** `dailyAssignmentLimit - todayAssignedCount`.

---

## 4. 순환배당 판단 로직

배당 엔진은 **순수 함수**(부작용 없음)로 작성해 그리드 요약·시뮬레이션에서 공용. 접두사 `assign*`으로 전역 충돌 방지.

```javascript
// 신규 배당 1건에 대한 후보 산출
function getAssignmentResult({ regionGroup, vendorGroup, period /* "오전"|"오후" */, date }) {
  const excluded = [], pool = [];
  for (const s of staffAssignmentSettings) {
    if (!s.isActive) { excluded.push({ staff:s, reason:"적용안함" }); continue; }
    const reason = assignExcludeReason(s, { regionGroup, vendorGroup, period });
    reason ? excluded.push({ staff:s, reason }) : pool.push(s);
  }
  const ordered = assignOrderCandidates(pool, { regionGroup, vendorGroup });
  return { candidates: ordered, excluded, finalAssignee: ordered[0] || null };
}

// 배당 후보 제외 조건 (요구사항 순서 그대로)
function assignExcludeReason(s, ctx) {
  if (s.assignmentMode === "배당제외")               return "배당제외 설정"; // §7 (센터장/부장 자연 제외)
  if (s.assignmentStatus === "배당중지")             return "배당중지";       // §1
  if (s.absenceType === "종일부재")                  return "종일부재";       // §2
  if (ctx.period === "오전" && s.absenceType === "오전반차") return "오전반차"; // §3
  if (ctx.period === "오후" && s.absenceType === "오후반차") return "오후반차"; // §4
  if (s.todayAssignedCount >= s.dailyAssignmentLimit) return "일 배당한도 초과"; // §5
  const tier = assignGroupTier(s, ctx);              // §6 그룹 매칭
  if (tier === null) {
    if (s.assignmentMode === "지역순환") return "지역그룹 불일치";
    if (s.assignmentMode === "업체순환") return "업체그룹 불일치";
    return "지역·업체그룹 불일치"; // 지역+업체순환
  }
  return null; // 후보
}

// 우선순위 tier: 업체 매칭=0, 지역 매칭=1, 공통/관리자확인=2, 불일치=null
function assignGroupTier(s, ctx) {
  const vMatch = s.vendorGroup === ctx.vendorGroup;
  const rMatch = s.regionGroup === ctx.regionGroup;
  switch (s.assignmentMode) {
    case "업체순환":       return vMatch ? 0 : null;
    case "지역순환":       return rMatch ? 1 : null;
    case "지역+업체순환":  return vMatch ? 0 : (rMatch ? 1 : 2); // 둘 다 불일치도 공통그룹(2)로 후보 유지
    default:               return null;
  }
}

// 정렬: 우선순위 tier ↑, 동일 tier 내 현재배당건수 ↑(적은 순), 사번으로 안정 정렬
function assignOrderCandidates(pool, ctx) {
  return pool
    .map(s => ({ s, tier: assignGroupTier(s, ctx) }))
    .sort((a,b) => a.tier - b.tier
      || a.s.todayAssignedCount - b.s.todayAssignedCount
      || a.s.employeeNo.localeCompare(b.s.employeeNo))
    .map(x => x.s);
}
```

> **배당 우선순위(지역+업체순환):** 업체그룹 매칭(0) → 지역그룹 매칭(1) → 공통/관리자확인(2). 지역+업체순환은 둘 다 불일치라도 "공통 배당그룹 또는 관리자 확인대상"(tier 2)으로 후보에 남긴다.
> **배당순번:** 동일 tier 내 `todayAssignedCount` 오름차순(현재 배당건수 적은 순, 사용자 확정) → 최종 배당 예정자 = `candidates[0]`.
> **긴급도 미사용:** 어떤 분기에도 긴급도/중요도 기반 정렬·이관을 넣지 않는다.

---

## 5. 반차/부재 처리 로직

- **신규 배당만 제한**한다. 기존 배당건 자동 이관 로직은 **넣지 않는다.**
- `period`(오전/오후) 산출: 시뮬레이션 입력의 "현재 시간"을 사용(오전/오후 토글, 또는 `HH:MM`이면 `< 12:00 → 오전`, 그 외 → 오후).
- 배제 규칙(§4 재확인):
  - 오전반차 → **오전** 신규 배당 제외, **오후** 복귀
  - 오후반차 → **오전** 배당 가능, **오후** 신규 배당 제외
  - 종일부재 → 해당일 신규 배당 제외
- 섹션3 안내문 상시 노출: "부재/반차 설정 시 기존 배당건은 유지되며, 신규 배당만 제한됩니다."
- **직무대행자**(`deputyEmployeeId`)는 **표시·저장만** 한다(자동 재배당 트리거 없음). 배당 로직에는 개입하지 않는다(요구사항 범위).

---

## 6. 시뮬레이션 기능 설계

`[시뮬레이션]` 버튼 → `#assignSimRoot` 모달 오픈(기존 `.modal-root`/`.open` 패턴, `.action-modal` 톤).

**입력:** 지역(select=ASSIGN_REGION_GROUPS), 업체(select=ASSIGN_VENDOR_GROUPS), 현재 시간(오전/오후 토글), 적용일자(date, 상단 조회조건 기본값 프리필). `[시뮬레이션 실행]` 클릭 시 `getAssignmentResult()` 호출.

**결과(모달 본문):**
- **배당 후보자 목록** — 순번(1,2,3…) + 담당자 + 우선순위 tier(업체/지역/공통) + 현재/잔여배당
- **최종 배당 예정자** — `finalAssignee` 강조(`.sa-sim-final`)
- **제외된 직원 + 제외 사유** — 사유 배지: 오전반차/오후반차/종일부재/일 배당한도 초과/배당중지/지역그룹 불일치/업체그룹 불일치/배당제외 설정

**동작 원칙:** 시뮬레이션은 **미리보기 전용**(저장 안 함). 현재 `staffAssignmentSettings`(마지막 저장 상태) 기준으로 계산한다. 상세 패널의 미저장 편집은 `저장` 후 시뮬레이션을 권장(안내 문구 표기).

---

## 7. 필요한 CSS 클래스 설계 (모던 톤)

**재사용(신규 CSS 불필요):** `.card` · `.appr-toolbar`/`.appr-field`/`.appr-actions` · `.appr-cards`/`.appr-card`/`.ac-count` · `.claim-table`/`.rows` · `.badge` · `.panel`/`.panel-head`/`.panel-body`/`.panel-foot`/`.panel-empty` · `.sec`/`.sec-title`/`.info-grid` · `.btn`/`.btn.primary` · `.modal-root`/`.action-modal`/`.modal-head`/`.modal-body`/`.modal-foot` · `.toast`.

**신규 추가(뷰 루트 하위로 스코프, `--blue`/`--line` 등 기존 토큰 사용):**

| 클래스 | 용도 |
|--------|------|
| `.sa-workspace` | 그리드 + 우측 패널 2단 그리드 레이아웃 |
| `.sa-grid-wrap` | 18컬럼 표 가로 스크롤(`overflow-x:auto`) |
| `.sa-form`, `.sa-row`, `.sa-input`, `.sa-select`, `.sa-check` | 상세 패널 폼 컨트롤(모던 톤 입력/셀렉트/체크) |
| `.badge.assign-normal`(green) / `.assign-stop`(red) | 배당상태 배지 |
| `.badge.absence-am` / `.absence-pm` / `.absence-full`(amber) | 부재유형 배지 |
| `.badge.limit-over`(red) | 한도초과 표시 |
| `.sa-sim-input`, `.sa-sim-cand`, `.sa-sim-excluded`, `.sa-sim-final` | 시뮬레이션 모달 결과 레이아웃 |
| `.sa-history` | 섹션4 변경이력 소형 표 |

> 배지 색은 기존 `--green/-soft`, `--red/-soft`, `--amber/-soft` 토큰 재사용. `.lg-*` 레거시 스코프는 침범하지 않는다.

---

## 8. 구현 순서

1. **데이터**: `staffAssignmentSettings`(12~14명) + 상수/그룹/`assignChangeHistory` mock 추가
2. **CSS**: 신규 클래스 블록 추가(`</style>` 앞)
3. **네비**: `data-view="assign"` 메뉴 항목 추가('메뉴' 섹션 하단)
4. **뷰 컨테이너**: `#viewAssign`(조회조건·요약·그리드·패널 root) 추가
5. **모달 root**: `#assignSimRoot` 추가
6. **라우팅**: `VIEW_TITLES` + `switchView`에 `assign` 분기/`hidden` 토글 추가
7. **로직 함수**: `getAssignmentResult`/`assignExcludeReason`/`assignGroupTier`/`assignOrderCandidates` + 종결권한·잔여배당·요약집계 헬퍼
8. **렌더 함수**: `renderAssign()` → `renderAssignSummary()`/`renderAssignGrid()`/`renderAssignPanel()` + 조회조건 필터·행 선택 이벤트 바인딩
9. **시뮬레이션**: `openAssignSim()`/`renderAssignSimResult()`
10. **저장/이력**: `saveAssignStaff()`(in-memory 반영 + `pushAssignHistory()` + 재렌더 + `showToast`)
11. **회귀 점검**: 기존 4개 뷰 전환·동작 정상 확인, 콘솔 에러 0

---

## 9. 테스트 시나리오 (수동, 브라우저)

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 일반직원 1레벨 권한 표시 | 그리드/패널 `결재레벨=1`, "1레벨 일반직원" 선택 |
| 2 | 센터장/부장 3레벨 권한 표시 | `결재레벨=3`, 배당방식=배당제외 기본, 배당대상 아님 |
| 3 | 추산/지급 한도 표시 | 그리드·패널에 금액(천단위 콤마) 정확 표시 |
| 4 | 면책/지급 종결권한 표시 | 종결권한 컬럼 `면책`/`지급`/`면책/지급`/`없음` 정확 |
| 5 | 지역순환 대상자 조회 | 지역순환 직원이 지역그룹 일치 시 후보로 표시 |
| 6 | 업체순환 대상자 조회 | 업체순환 직원이 업체그룹 일치 시 후보로 표시 |
| 7 | 지역+업체 우선순위 | 업체매칭 → 지역매칭 → 공통 순서로 순번 정렬 |
| 8 | 오전반차 + 오전 배당 | 시뮬 "현재시간=오전" 시 후보 제외, 사유 "오전반차" |
| 9 | 오전반차 + 오후 배당 | 시뮬 "현재시간=오후" 시 후보 **복귀** |
| 10 | 오후반차 + 오후 배당 | "현재시간=오후" 시 후보 제외, 사유 "오후반차" |
| 11 | 종일부재 신규 배당 | 오전/오후 무관 제외, 사유 "종일부재" |
| 12 | 기존 배당 자동 이관 없음 | 부재 설정해도 `현재배당` 값 불변(이관 코드 부재 확인) |
| 13 | 일 배당한도 초과 | `현재배당≥한도` 직원 제외, 사유 "일 배당한도 초과" |
| 14 | 직무대행자 표시 | 지정 시 그리드/패널에 대행자명 표시(로직 개입 없음) |
| 15 | 시뮬레이션 제외 사유 명확 | 제외 목록에 직원별 사유 배지 정확 표기 |

추가 회귀: (R1) Smart업무관리·Smart접수지·이미지시스템·결재 LIST 전환/렌더 정상, (R2) 콘솔 에러 없음.

---

## 10. 코드 수정 시 주의점

- **전역 스코프 공유**: 단일 파일·전역 변수. 신규 식별자는 `assign*`/`sa*` 접두사로 `selectedId`/`activeView` 등 기존과 충돌 방지.
- **뷰 hidden 필수**: `#viewAssign`에 `hidden` 부여 + `switchView`에 토글 추가. 기존 4개 뷰 토글 라인 유지(제거 금지).
- **긴급도 로직 금지**: 배당/정렬/이관 어디에도 긴급도·중요도 반영 안 함. 기존 `CLAIMS.urgency`는 표시용으로만 두고 배당 로직과 분리.
- **자동 이관 금지**: 반차/부재는 신규 배당 후보 제외만. 기존 배당 재배분/이관 코드 작성 금지(시나리오 12).
- **금액 처리**: 입력값은 콤마 제거 후 `Number` 파싱, 표시는 `toLocaleString`. 음수/공백 방어.
- **재렌더 이벤트**: `root.innerHTML` 재할당 → `addEventListener` 재바인딩 패턴 유지(기존 방식). 이벤트 중복 주의.
- **데모 한계**: 저장은 in-memory만(새로고침 시 초기화) — 기존 데모와 동일 정책. 사용자에게 명시.
- **디자인 스코프**: 모던 톤 유지, `.lg-*` 레거시 스코프 미침범. 신규 클래스는 `#viewAssign` 하위로 제한.
- **CLAUDE.md 규칙**: 한국어 주석은 "왜" 중심, dead code·미사용 import 정리, 기존 구조 재사용 우선.

---

## 검증(Verification)

1. `index.html`을 브라우저로 열고 좌측 '메뉴'에서 **전결권한 및 순환배당 관리** 진입 → §9 시나리오 1~15 순차 확인.
2. `[시뮬레이션]`으로 오전/오후·그룹 조합을 바꿔 후보/제외/최종 배당자/순번 검증(시나리오 7~15).
3. 상세 패널 편집 → `저장` → 그리드·요약·변경이력 반영 및 토스트 확인.
4. 기존 4개 화면 전환·렌더 회귀 확인, 콘솔 에러 0 확인.
