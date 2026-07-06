# 결재 LIST 화면 전면 개선 — 구현 계획

> 코드 수정 없이 작성한 설계 계획서입니다. index.html은 별도 지시 전까지 수정하지 않습니다.
> (전결권한 화면이 `plan-전결권한-순환배당관리.md`를 둔 선례와 동일하게, 기존 `plan.md` 마스터 기획서는 보존)

---

## Context (배경)

현재 결재 LIST(`#viewClosing`)는 화면 전환·검색은 되지만, 레거시 보험시스템 톤에 가깝고 정보가 빈약하다. 결재 데이터(`APPROVALS`)가 `{id, task, manager, status, submittedAt, completedAt}` 6필드뿐이라 결재자가 실제로 판단할 정보(금액·피해·계약·지급내역·전결권한)가 없다. 결재종류도 추산/지급/종결/VOC 4종에 그치고, 상태는 상신중/결재완료만 있으며(반려 없음), 우측 상세 패널이 아예 없다.

목표는 결재 LIST를 **전결권한 및 순환배당 관리 화면과 동일한 구조**(회색 헤더 그리드 + 좌측 리스트/우측 패널 2단)로 개선하고, 리스트에서 한 건을 클릭하면 우측에 **Speed결재 패널**이 열려 결재자가 Smart접수지·지급결의로 이동하지 않고도 핵심정보를 훑고 **승인/반려**할 수 있게 하는 것이다. 지급성 결재는 비밀번호 인증을 거치며, 모든 처리는 결재이력에 남는다. 기존 4개 화면(Smart업무관리·Smart접수지·이미지시스템·전결권한/순환배당)의 동작은 깨뜨리지 않는다.

**확정된 설계 방향(사용자 선택):**
- 결재자 판정: **패널 상단 결재자 선택 드롭다운**(기본 김본부 센터장 EMP013). 결재자 전환으로 "권한 없음/한도 초과/상위결재 필요" 상태를 모두 시연.
- 계획 문서: **신규 `plan-결재LIST.md`** (기존 `plan.md` 보존).
- 보류 기능 없음. 결재처리는 **승인/반려**만.
- 외부 라이브러리 추가 없음. 저장은 in-memory(새로고침 시 초기화, 기존 데모 정책 동일).

---

## 참고 코드 앵커 (index.html, 약 5,869줄 단일 SPA)

| 영역 | 위치 | 비고 |
|------|------|------|
| 결재 LIST 뷰 HTML | `#viewClosing` 1920–1968 | 툴바·요약카드·6열 div-grid 표 → 교체 대상 |
| 결재 CSS | `.appr-*` 465–499, 요약 479–487 | 재사용 + 확장 |
| 우측 패널 CSS | `.panel*`/`.sec`/`.sec-title`/`.info-grid` 512–616 | 그대로 재사용 |
| 2단 레이아웃·회색헤더 표 | `.sa-workspace` 1685, `.sa-table` 1690–1703, `.sa-grid-wrap` 1687, `.sa-summary`(6열) 1682 | 그대로 재사용 |
| 폼 컨트롤 | `.sa-form/.sa-row/.sa-input/.sa-select/.sa-check` 1713–1738, `.sa-history` 1741 | 재사용 |
| 모달 | 플레이스홀더 `#actionModalRoot`/`#assignSimRoot` 2036–2038, `.action-modal`/`.modal-head/body/foot` 654–807, ESC 처리 ~5035 | 비밀번호 모달에 동일 패턴 |
| 라우팅 | `VIEW_TITLES` 3880, `switchView` 3881–3893, nav 1790–1810, 클릭 바인딩 5042 | closing 분기만 교체 |
| 결재 데이터/로직 | `APPR_TASKS` 4735, `APPR_STATUS_CLASS` 4741, `APPROVALS` 4744–4772, 상태 4775–4780, `apprFilteredBase` 4783, `renderClosingView` 4796, `bindApprToolbar` 4839 | 전면 재작성 |
| 전결권한 데이터 | `staffAssignmentSettings` 5173–5245(EMP001~014), 헬퍼 `assignWon`/`assignStaffById`/`assignRemaining` 5260–5264 | 결재자·한도·권한 참조 |
| 접수지 시드 생성 | intake 더미 생성기 `p.pick([...])` ~4179 | coreInfo 시드 생성기 참고 |
| 공통 유틸 | `showToast(msg)` 5847, `openIntake(claimId)` 3897, `init()` 5860 | 재사용 |
| 헤더 로그인 사용자 | topbar 1823–1838 (박지현 매니저) | 결재자 셀렉터와 별개 |

---

## 1. 현재 결재 LIST 화면의 문제점

1. **정보 부족**: `APPROVALS`가 6필드뿐 — 결의순번·상신자·피해물명·피해정보·수리업체·결재금액·핵심정보·이력이 없어 결재 판단 근거가 화면에 없다.
2. **결재종류 불일치**: 추산/지급/종결/VOC 4종 → 요구 5종(추산/지급(종결)/면책종결/추가지급/VOC)과 다르고 "지급/종결" 명칭이 모호.
3. **금액 표현 부재**: "추산/지급금액"이 없고, 결재금액 컬럼 자체가 없다.
4. **상태 부족**: 상신중/결재완료만 있고 **반려**가 없다.
5. **상세 패널 없음**: 행을 클릭해도 아무 일도 없다. 결재자는 Smart접수지/지급결의로 이동해야 정보를 본다.
6. **결재 처리 불가**: 승인/반려·전결권한 체크·비밀번호 인증·결재의견·결재이력이 전무.
7. **헤더 톤 약함**: 6열 div-grid(`.appr-thead`)로 컬럼이 적고, 전결권한 화면의 회색 sticky 헤더(`.sa-table`) 톤과 이질적.

---

## 2. 개선할 최종 레이아웃

`#viewClosing` 내부를 전결권한 화면(`#viewAssign`)과 동일 골격으로 재구성:

```
┌ page-head ─ 결재 LIST / 설명 ─────────────────────────────────┐
├ 조회조건  section.card.appr-toolbar ─────────────────────────┤
│ 담당자·사고번호[search] 결재종류▾ 결재상태▾ 조회기간[date~date] │
│                                            [검색] [초기화]     │
├ 요약카드 section.appr-cards.appr-cards6 (#apprCards) ─────────┤
│  전체 · 추산 · 지급(종결) · 면책종결 · 추가지급 · VOC (6장)     │
├ 본문 2단  div.sa-workspace ──────────────────────────────────┤
│ ┌ 리스트 list-card.card.sa-grid-card ─┐  ┌ Speed결재 패널 ──┐ │
│ │ .sa-grid-wrap > table.sa-table       │  │ aside.panel      │ │
│ │  ☑ 상신자 결재종류 사고번호 결의순번  │  │ #apprPanel(420px)│ │
│ │  피해물명 피해정보 수리업체 결재금액  │  │  결재자▾          │ │
│ │  결재상태 상신일 결재완료일           │  │  요약/전결체크/    │ │
│ │  (회색 sticky 헤더 + 가로 스크롤)     │  │  핵심정보7/의견/   │ │
│ └──────────────────────────────────────┘  │  이력/빠른이동     │ │
│                                            │  [승인] [반려]    │ │
│                                            └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

`.sa-workspace`는 기본 `minmax(0,1fr) 380px` → 결재 LIST는 패널 폭이 넓어야 하므로 **뷰 스코프 오버라이드**로 우측 420px 적용(`#viewClosing .sa-workspace { grid-template-columns: minmax(0,1fr) 420px; }`). 미선택 시 `.panel-empty`("결재 건을 선택하세요").

---

## 3. 수정/추가해야 할 index.html 영역

| # | 영역 | 위치(앵커) | 작업 |
|---|------|-----------|------|
| A | 뷰 HTML | `#viewClosing` 1920–1968 | 툴바(결재종류 셀렉트 추가)·요약카드(6장)·`.sa-table` 리스트·`#apprPanel` 우측 패널 root로 교체 |
| B | 비밀번호 모달 root | `#assignSimRoot` 뒤 2038 | `<div class="modal-root" id="apprPwRoot" aria-hidden="true">` 추가 |
| C | CSS | `</style>` 앞 | `/* ===== 결재 LIST / Speed결재 패널 ===== */` 신규 블록(뷰 스코프) |
| D | 데이터 | `APPROVALS` 4744–4772 교체 | 확장 `APPROVALS`(리스트필드+requesterComment+histories) + 상수(`APPR_TYPES`/`APPR_STATUS_CLASS`/`APPR_PAY_TYPES`/`APPR_APPROVERS`/`APPR_PASSWORD`/`VOC_MIN_LEVEL`) + coreInfo 시드 생성기 |
| E | 라우팅 | `switchView` 3893 | `if(name==="closing") renderClosingView();` 유지(교체 렌더 함수명 동일) |
| F | 로직/렌더 | 4735–4855 전면 재작성 | 전결체크·비밀번호·승인/반려·이력 push + `renderClosingView`/`renderApprList`/`renderApprPanel`/`bindApprToolbar` |

> **주의:** `#viewClosing`은 이미 `hidden` 속성과 `switchView` 토글 라인이 있어 라우팅 변경 최소. 렌더 진입점 함수명 `renderClosingView()`는 유지해 `switchView` 분기를 건드리지 않는다.

---

## 4. 결재 LIST 그리드 헤더 구조 (12컬럼, 회색 헤더)

`<div class="sa-grid-wrap"><table class="sa-table">` 로 렌더(전결권한 화면과 동일한 sticky `#F4F7FC` 회색 헤더 + 가로 스크롤).

| # | 컬럼 | 데이터 | 표기 |
|---|------|--------|------|
| 1 | 선택 | checkbox | 행 선택 표시(단일). 행 클릭 시 패널 오픈 |
| 2 | 상신자 | `requesterName` | 텍스트 |
| 3 | 결재종류 | `approvalType` | 5종 배지/텍스트 |
| 4 | 사고번호 | `claimNo` | tabular-nums |
| 5 | 결의순번 | `resolutionNo` | 예: 002 |
| 6 | 피해물명 | `damagedObjectName` | 예: 자차1 |
| 7 | 피해정보 | `damageInfo` | 예: 제네시스 G80 / 299너1997 |
| 8 | 수리업체명 | `repairShopName` | 예: 수원협력업체 |
| 9 | 결재금액 | `approvalAmount` | 우측정렬 `toLocaleString` + "원" |
| 10 | 결재상태 | `approvalStatus` | 배지(상신중/결재완료/반려) |
| 11 | 상신일 | `requestedAt` | 날짜 |
| 12 | 결재완료일 | `completedAt` | 없으면 "-" |

**결재금액 규칙(요구사항):** "추산/지급금액" 표현 폐기 → **결재금액**으로 통일.
- 결재종류 = **추산** → 추산액을 결재금액으로 저장/표시
- 결재종류 = **지급(종결)·추가지급** → 지급액(실지급액)을 결재금액으로 저장/표시
- **면책종결** → 면책금, **VOC** → 청구액(또는 0)을 결재금액으로 사용
- 저장은 `approvalAmount` 단일 필드, 파생 근거는 `coreInfo.damage`에 함께 보존. 패널 요약에서는 "결재금액(추산)"처럼 근거 라벨 병기.

**결재상태 3종:** 상신중 / 결재완료 / 반려. `APPR_STATUS_CLASS = {상신중:"appr-ing", 결재완료:"appr-done", 반려:"appr-reject"}` (반려 = red 신규 배지).

---

## 5. Speed결재 패널 구조 (`#apprPanel`, `aside.panel`)

미선택: `.panel-empty`. 선택 시 위→아래:

1. **패널 헤더(`.panel-head`)**: 사고번호 + 결재종류 배지 + 결재상태 배지. 우측 상신자.
2. **결재자 선택(`.spd-approver`)**: `<select id="apprApprover">` — `APPR_APPROVERS`(김본부 센터장 기본, 이지사 부장, 김하늘 대리, 박지현·오세린 매니저 등) 중 선택. 변경 시 전결체크 재계산.
3. **① 결재 요약(`.sec` + `.info-grid`)**: 사고번호 · 결재종류 · 결의순번 · 상신자 · 결재상태 · 결재금액 · 상신일.
4. ~~**② 전결권한/한도 체크**~~ — **제거됨(3차 피드백)**. 화면이 번잡하고 승인 차단이 혼란을 준다는 의견으로 표시 섹션·승인 차단 로직·`apprAuthCheck`/`apprAuthDetail`/`.spd-auth`를 모두 삭제. 결재자 선택·지급성 비밀번호는 유지.
5. **③ 지급 품의서(§6)**: 품의서 스타일 요약 카드(문서헤더 + 결재금액 강조밴드 + 핵심 그리드 + 결재란 도장). `[품의서 전체보기]` 버튼으로 2단 전체 양식 모달 오픈.
6. **④ 결재의견(`.sec`)**: 상신자 의견(읽기전용) + 결재자 의견(`textarea.memo#apprApproverComment`).
7. **⑤ 결재이력(`.spd-hist`)**: 시간·처리자·처리구분 + 의견(§11).
8. **⑥ 빠른 이동(`.spd-jump` = `.btn-grid`)**: Smart접수지 보기 · 지급결의 화면 · 고객 컨택이력 · 첨부/이미지 확인.
9. **패널 푸터(`.panel-foot`)**: `[승인]`(`.btn-complete`) · `[반려]`(`.btn-hold` alert 톤). 상태가 결재완료/반려면 버튼 비활성 + "처리 완료된 건" 안내.

---

## 6. 결재 핵심정보 — 품의서 스타일 (IF 연동 반영)

> 개선(2차): 잘게 쪼갠 접이식 7섹션이 "짜잘짜잘"하다는 피드백 → `reference/품의서.jpg`(삼성화재 '자동차 보험금 지급 품의서')를 참고해 **한 장의 문서처럼 핵심을 한눈에** 보는 구조로 변경.

- **패널 요약 품의서(`apprDocSummaryHtml`)**: 문서헤더(제목 + 문서번호=사고번호-결의순번) → **결재금액 강조밴드**(근거 라벨 병기) → key strip(수리업체·피해물·종결번호) → 핵심 그리드 4묶음(사고사항/계약사항/피해·지급금액/종결사항, 실지급액 강조) → **결재란**(담당자·결재자·결재완료 도장). 결재자가 가장 먼저 보는 금액·전결 판단을 상단에 배치.
- **품의서 전체보기(`apprDocFullHtml` + `#apprDocRoot` 모달)**: `[품의서 전체보기]` 클릭 시 2단(좌: 사고·계약·종결·종결안내 / 우: 피해·지급·기존지급) 전체 필드를 품의서 양식으로 렌더. 아래 A~G 전체 필드가 여기에 표시된다.

데이터는 `item.coreInfo.{키}`. `reference/SK렌터카 IF연동 필요 항목_260626.xlsx`의 연동항목을 반영해 필드를 모델링(값은 사고번호 시드 기반 더미). A~G 7개 그룹:

- **A. 사고사항 `accident`**: 사고번호 · 사고일시 · 사고장소 · 사고구분 · 사고내용 · 사고담당자 · 과실률 · 접수일시
- **B. 계약사항 `contract`**: 계약번호 · 고객명 · 계약기간 · 차량번호 · 차량명 · 렌트/리스구분 · 면책약정금액 · 운전자범위 · 임직원특약여부
- **C. 종결사항 `closing`**: 종결구분 · 종결번호 · 종결요청일시 · 종결요청자 · 종결승인자 · 종결일 · 미처리사유 · 비고
- **D. 종결안내 `closingNotice`**: 안내대상 · 안내일시 · 안내방법 · 안내내용 · 고객반응 · 비고
- **E. 피해사항 `damage`**: 피해물명 · 피해자명 · 피해구분 · 담보구분 · 수리업체명 · 입고일 · 출고예정일 · 청구액 · 추산액 · 손해사정액 · 면책금 · 실지급액
- **F. 보험금 지급 내역 `payment`**: 지급처 · 사업자번호 · 공급가액 · 부가세 · 지급금액 · 지급처구분 · 지급예정일자 · 전표번호 · 분리지급사유
- **G. 기존 지급/면책종결 내역 `previousPayment`**: 기존지급일 · 기존지급유형 · 기존지급금액 · 기존지급처 · 기존전표번호 · 면책종결여부 · 면책종결일 · 면책종결사유 · 기존종결번호

**생성 방식:** `apprBuildCoreInfo(item)` 시드 생성기 — `claimNo` 문자열 해시로 결정적(deterministic) 값 선택(intake 화면 `p.pick([...])` 패턴 참고). 결재종류에 따라 대표 금액 정합(추산 건은 추산액↔결재금액, 지급 건은 실지급액↔결재금액 일치). 초기화 시 `APPROVALS`에 `coreInfo` 주입.

---

## 7. 전결권한/한도 체크 로직 — ⚠️ 제거됨(3차 피드백)

> 아래는 초기 설계 기록이다. **실제 구현에서는 전결권한/한도 체크(표시 + 승인 차단)를 전면 제거**했다. 사유: 결재 화면이 번잡하고, 승인 시 한도/권한 초과로 조용히 차단되면 오히려 혼란. 이에 따라 `apprAuthCheck`/`apprAuthDetail`/`.spd-auth` 및 `apprApprove`의 재검증 블록·`VOC_MIN_LEVEL` 상수를 삭제했다. 승인은 지급성 결재의 비밀번호 인증(§8)만 거치며, 결재자 선택은 결재란·이력의 서명자 기록 용도로만 남는다. (아래 로직 명세는 히스토리 참고용)

선택 결재자(`currentApproverId` → `staffAssignmentSettings`의 해당 직원)를 기준으로 판정하던 순수 함수 `apprAuthCheck(item, approver)` → `{ok, label, tone}`:

```
결재종류별:
  추산       : amount ≤ approver.estimateLimit → "결재 가능"(ok) / 초과 → "상위결재 필요"(warn)
  지급(종결) : !canClosePayment → "지급종결 권한 없음"(block)
               else amount > paymentLimit → "지급한도 초과"(warn)
               else "결재 가능"(ok)
  추가지급   : amount > paymentLimit → "지급한도 초과"(warn) / else "결재 가능"(ok)
  면책종결   : !canCloseWaiver → "면책종결 권한 없음"(block) / else "결재 가능"(ok)
  VOC        : approvalLevel ≥ VOC_MIN_LEVEL(=1) → "결재 가능"(ok) / else "VOC 결재 권한 없음"(block)
ok = (label === "결재 가능")
```

- 패널 ②에 배지로 표시(색: ok=green, warn=amber, block=red).
- **승인 시 재검증(§9)**: `ok`가 아니면 승인 차단 + `showToast(label)`. 결재상태 불변. (전결한도/종결권한 재검증)
- 참조 필드: `estimateLimit`(추산한도)·`paymentLimit`(지급한도)·`canClosePayment`(지급종결)·`canCloseWaiver`(면책종결)·`approvalLevel`(결재레벨) — 전결권한 화면 데이터와 동일 소스.
- 기본 결재자 **김본부 센터장**(전권·9,999,000 한도)이라 대부분 "결재 가능" → 지급(종결)/추가지급 승인·비밀번호 시나리오 정상. 결재자를 **박지현(지급종결 권한 없음)**·**오세린(면책종결 권한 없음)** 등으로 바꾸면 block/warn 상태 시연.

---

## 8. 비밀번호 인증 적용 기준

- **대상(지급성 결재의 최종승인):** 지급(종결) 승인 · 추가지급 승인. `APPR_PAY_TYPES = ["지급(종결)","추가지급"]`, `apprIsPayType(type)`.
- **미적용:** 추산 · 면책종결 · VOC · **모든 반려**.
- **처리 방식:** 승인 클릭 → 전결 재검증 통과 → 지급성이면 `#apprPwRoot` 비밀번호 모달 오픈 → 입력 일치 시 승인 진행 / 불일치 시 `showToast("비밀번호가 불일치합니다.")` + **결재상태 불변**.
- 데모 비밀번호 상수 `APPR_PASSWORD = "1234"` (모달에 "데모 비밀번호: 1234" 힌트). 화면 검증용으로만 사용.
- **범위 주의:** 본 화면은 결재자 관점의 **최종승인**만 처리한다. 요구사항의 "지급(종결)/추가지급 **상신** 시 비밀번호"는 상신 화면(지급결의) 소관이라 본 화면 범위 외 — 계획서에 명시하고 승인 시에만 적용.
- **이력 금지:** "비밀번호 인증 완료" 문구를 패널·이력 어디에도 **표시/저장하지 않는다**.

---

## 9. 승인/반려 처리 Flow

**승인 (`apprApprove`)**
1. 승인 버튼 클릭 → 현재 선택 건 + 선택 결재자 확보
2. 결재자 의견은 선택 입력(빈 값 허용)
3. **전결한도/종결권한 재검증**(`apprAuthCheck`) → `ok` 아니면 `showToast(label)` 후 **중단**(상태 불변)
4. 지급성 결재면 비밀번호 모달 → 일치해야 계속(불일치 시 중단·상태 불변)
5. 상태 `결재완료`, `completedAt`=현재시각, `approverId/Name`=선택 결재자, `approverComment` 저장
6. 결재이력에 **승인** 이력 push (statusBefore=상신중, statusAfter=결재완료)
7. 리스트·패널 재렌더, `showToast("결재완료 처리되었습니다.")`

**반려 (`apprReject`)**
1. 반려 버튼 클릭
2. **반려사유(결재자 의견) 필수** — 비었으면 `showToast("반려사유를 입력해 주세요.")` 후 **중단**
3. 비밀번호 없음
4. 상태 `반려`, `completedAt`=현재시각(반려일시), `approverId/Name`, `approverComment`(반려의견) 저장
5. 결재이력에 **반려** 이력 push (statusBefore=상신중, statusAfter=반려)
6. 리스트·패널 재렌더, `showToast("반려 처리되었습니다.")`

보류 기능 없음. 이미 처리(결재완료/반려)된 건은 승인/반려 버튼 비활성.

---

## 10. 결재의견 처리 방식

- **상신자 의견(`requesterComment`)**: 데이터에 미리 존재(상신 시 입력 가정). 패널 ④에 **읽기 전용**으로 표시.
- **결재자 의견(`approverComment`)**: `textarea#apprApproverComment`. **승인 시 선택 입력 / 반려 시 필수 입력**.
- 반려 클릭 시 값이 비어 있으면 `"반려사유를 입력해 주세요."` 토스트로 안내하고 상태 미변경.
- 처리 후 결재자 의견은 이력 `comment`로 함께 저장.

---

## 11. 결재이력 데이터 구조와 화면 표시

**데이터(`item.histories[]`):**
```
{ id, claimNo, resolutionNo, approvalType,
  actionType,        // "상신" | "승인" | "반려"
  actorId, actorName, actorEmployeeNo,
  actedAt,           // "YYYY-MM-DD HH:mm"
  status,            // 처리 후 결재상태
  comment,           // 결재의견 (없으면 "")
  statusBefore, statusAfter }
```
- 초기 데이터: 각 건에 **상신** 이력 1건 시드(actor=상신자, comment=requesterComment).
- 승인/반려 시 이력 push.

**화면 표시(패널 ⑤, `.spd-hist`):** 시간순. 각 항목:
```
2026-07-06 09:12  오세린  상신
  수리비 청구 내역 및 지급처 확인 완료. 지급 결재 요청드립니다.
2026-07-06 10:25  김본부  승인
  청구금액 및 지급처 확인 완료. 지급 승인합니다.
```
처리구분 배지 색: 상신(회색)·승인(green)·반려(red). **비밀번호 인증 완료 문구는 표시/저장하지 않음.**

---

## 12. 추가/변경할 더미 데이터 구조

기존 `APPROVALS`(4744–4772)를 **확장 구조로 교체**. 기존 24건을 5종으로 정리(추산→추산, 지급→지급(종결), 종결→면책종결, VOC→VOC) + **추가지급 신규 3~4건** 보강 → 총 16~20건. 상태에 **반려** 케이스 2~3건 포함. 상신자는 기존 manager(오세린·김하늘·유나래·최도윤·박지현·문태호) 재사용.

```javascript
const APPR_TYPES = ["추산","지급(종결)","면책종결","추가지급","VOC"];
const APPR_PAY_TYPES = ["지급(종결)","추가지급"];      // 비밀번호 대상
const APPR_STATUS_CLASS = { "상신중":"appr-ing", "결재완료":"appr-done", "반려":"appr-reject" };
const VOC_MIN_LEVEL = 1;
const APPR_PASSWORD = "1234";                          // 데모 검증용
// 결재자 후보(전결권한 데이터 참조). 기본 김본부 센터장.
const APPR_APPROVERS = ["EMP013","EMP014","EMP003","EMP002","EMP004"];
let currentApproverId = "EMP013";

let APPROVALS = [
  {
    id:"APR-001", claimNo:"CLM-2026-0010", resolutionNo:"002",
    approvalType:"지급(종결)", requesterId:"EMP004", requesterName:"오세린",
    damagedObjectName:"자차1", damageInfo:"제네시스 G80 / 299너1997",
    repairShopName:"수원협력업체", approvalAmount:1999000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 09:12", completedAt:null,
    requesterComment:"수리비 청구 내역 및 지급처 확인 완료. 지급 결재 요청드립니다.",
    approverId:null, approverName:"", approverComment:"",
    coreInfo:{ accident:{}, contract:{}, closing:{}, closingNotice:{}, damage:{}, payment:{}, previousPayment:{} }, // 초기화 시 시드 주입
    histories:[
      { id:1, claimNo:"CLM-2026-0010", resolutionNo:"002", approvalType:"지급(종결)",
        actionType:"상신", actorId:"EMP004", actorName:"오세린", actorEmployeeNo:"12340004",
        actedAt:"2026-07-06 09:12", status:"상신중",
        comment:"수리비 청구 내역 및 지급처 확인 완료. 지급 결재 요청드립니다.",
        statusBefore:"작성중", statusAfter:"상신중" }
    ]
  },
  // … 추산/면책종결/추가지급/VOC × 상신중/결재완료/반려 케이스
];
```
- `coreInfo`는 §6 `apprBuildCoreInfo(item)`로 초기화 시 채움(수기 최소화, DRY).
- 결재금액↔coreInfo 금액 정합: 추산 건 `approvalAmount == coreInfo.damage.추산액`, 지급성 건 `== coreInfo.damage.실지급액`.
- 헬퍼: `apprStaffById(id)`(=`assignStaffById` 재사용), `apprWon(n)`(=`assignWon` 재사용), `apprNow()`(현재시각 문자열).

---

## 13. 필요한 CSS 클래스 설계 (뷰 스코프, 기존 토큰 재사용)

**재사용(신규 CSS 최소):** `.appr-toolbar`/`.appr-field` · `.appr-cards`/`.appr-card`/`.ac-*` · `.sa-workspace`/`.sa-grid-card`/`.sa-grid-wrap`/`.sa-table` · `.panel`/`.panel-head`/`.panel-body`/`.panel-foot`/`.panel-empty` · `.sec`/`.sec-title`/`.info-grid` · `.badge`(+`appr-ing`/`appr-done`) · `.btn`/`.btn.primary`/`.btn.alert`/`.btn-grid`/`.btn-complete`/`.btn-hold` · `.memo` · `.modal-root`/`.action-modal`/`.modal-head`/`.modal-body`/`.modal-foot` · `.sa-history`.

**신규 추가(모두 `#viewClosing` 하위로 스코프):**

| 클래스 | 용도 |
|--------|------|
| `.appr-cards6` | 요약카드 6열 그리드(`repeat(6,minmax(0,1fr))`) |
| `#viewClosing .sa-workspace` | 우측 패널 폭 420px 오버라이드 |
| `.badge.appr-reject` | 반려 상태 배지(red-soft/red) |
| `.appr-amt` | 결재금액 우측정렬·tabular-nums |
| `.spd-approver` | 결재자 셀렉터 영역 |
| `.spd-auth`, `.spd-auth.ok/.warn/.block` | 전결체크 결과 박스(green/amber/red) |
| `.appr-doc` 및 `.doc-*`(head/amt/strip/grp/rows) | 품의서 스타일 요약/전체 문서 |
| `.appr-sign`, `.stamp` | 결재란(담당자·결재자·결재완료 도장) |
| `.appr-doc-modal`, `.df-cols` | 품의서 전체보기 모달(2단) |
| `.spd-hist`, `.spd-hist .h-row`, `.h-badge` | 결재이력 리스트 |
| `.spd-pw` | 비밀번호 모달 입력 영역 |

> 배지 색은 기존 `--green/-soft`·`--amber/-soft`·`--red/-soft` 토큰 재사용. `.lg-*` 레거시 스코프·`.sa-*` 정의는 침범하지 않는다(공유 재사용만).

---

## 14. 구현 순서

1. **데이터**: `APPROVALS` 확장 교체 + 상수(`APPR_TYPES`/`APPR_PAY_TYPES`/`APPR_STATUS_CLASS`/`APPR_APPROVERS`/`APPR_PASSWORD`/`VOC_MIN_LEVEL`/`currentApproverId`) + `apprBuildCoreInfo` 시드 생성기 + 초기화 시 coreInfo·histories 시드 주입.
2. **CSS**: 신규 블록 추가(`</style>` 앞), 뷰 스코프 준수.
3. **HTML**: `#viewClosing` 교체(툴바에 결재종류 셀렉트 추가, 요약카드 6장, `.sa-table` 리스트, `#apprPanel`) + `#apprPwRoot` 모달 root 추가.
4. **로직 함수**: `apprAuthCheck`/`apprIsPayType`/`apprAmountLabel`/`apprNow` 순수·헬퍼.
5. **렌더 함수**: `renderClosingView()`(유지 진입점) → `renderApprSummary()`/`renderApprList()`/`renderApprPanel()` + `bindApprToolbar()`(검색·결재종류·상태·기간·초기화).
6. **선택/패널**: 행 클릭 → `apprSelectedId` 세팅·`.selected` → `renderApprPanel()`. 결재자 셀렉터 change → 전결체크 재계산.
7. **처리 함수**: `apprApprove()`/`apprReject()` + 비밀번호 모달 `openApprPw()`/`closeApprPw()`/`submitApprPw()` + `pushApprHistory()`.
8. **빠른 이동**: Smart접수지 = `openIntake(claimNo)`, 그 외(지급결의·컨택이력·첨부) = `showToast("해당 화면으로 이동합니다.")`.
9. **회귀 점검**: 기존 4개 뷰 전환·렌더 정상, ESC/오버레이 모달 닫힘, 콘솔 에러 0.

---

## 15. 테스트 시나리오 (수동, 브라우저)

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 결재 LIST 진입 | 회색 sticky 헤더(`.sa-table`) 리스트 표시 |
| 2 | 리스트 컬럼 | 상신자/결재종류/사고번호/결의순번/피해물명/피해정보/수리업체명/결재금액/결재상태 표시 |
| 3 | 결재건 클릭 | 우측 Speed결재 패널 오픈, 행 `.selected` |
| 4 | 결재 요약 | 사고번호·결재종류·결의순번·상신자·결재상태·결재금액·상신일 표시 |
| 5 | 핵심정보 7섹션 | A~G 접이식 섹션 표시·펼침 동작 |
| 6 | 추산 결재 | 추산한도 기준 결재 가능 여부 표시 |
| 7 | 지급(종결) | 지급한도 + 지급종결 권한 체크(권한 없는 결재자 선택 시 "지급종결 권한 없음") |
| 8 | 면책종결 | 면책종결 권한 체크(오세린 선택 시 "면책종결 권한 없음") |
| 9 | 추가지급 | 지급한도 기준 체크 |
| 10 | VOC | VOC가 별도 결재종류로 표시 |
| 11 | 지급(종결) 승인 | 비밀번호 입력 모달 표시 |
| 12 | 추가지급 승인 | 비밀번호 입력 모달 표시 |
| 13 | 비밀번호 불일치 | "비밀번호가 불일치합니다." + 결재상태 불변 |
| 14 | 비밀번호 일치 | 결재완료 처리 |
| 15 | 추산/면책종결/VOC 승인 | 비밀번호 없이 처리 |
| 16 | 반려 | 비밀번호 모달 미표시 |
| 17 | 반려 사유 필수 | 빈 값이면 "반려사유를 입력해 주세요." + 미변경 |
| 18 | 승인/반려 후 | 결재이력에 이력 추가 |
| 19 | 이력 문구 | "비밀번호 인증 완료" 문구 미표시 |
| 20 | 회귀 | Smart업무관리·전결권한/순환배당 등 기존 화면 정상 |

---

## 16. 코드 수정 시 주의점

- **전역 스코프 공유(단일 파일):** 신규 식별자는 `appr*`/`spd*` 접두사로 `selectedId`/`activeView` 등 기존과 충돌 방지. `apprSelectedId`는 전결권한 화면의 `assignSelectedId`와 별개.
- **렌더 진입점 유지:** `switchView`의 `if(name==="closing") renderClosingView();`를 유지하도록 함수명 `renderClosingView()` 보존(라우팅 미변경).
- **뷰 스코프 CSS:** 신규 클래스는 `#viewClosing` 하위로 스코프. `.sa-*`/`.lg-*` 원 정의 수정 금지(공유 재사용만).
- **데이터 교체 위생:** 기존 `APPR_TASKS`/`APPROVALS`/`apprFilteredBase` 등 미사용 잔재는 남기지 말고 정리(dead code 제거, CLAUDE.md §5).
- **금액 처리:** 표시는 `toLocaleString`, 파싱은 콤마 제거 후 `Number`. 음수/공백 방어.
- **재렌더 이벤트:** `innerHTML` 재할당 → 이벤트 재바인딩(툴바는 `apprBound` 1회 바인딩 유지). 중복 리스너 주의.
- **모달 패턴 준수:** `#apprPwRoot`는 기존 `.action-modal`/`.open`/`aria-hidden`/ESC(~5035) 패턴 재사용. 새 라이브러리·오버레이 방식 금지.
- **비밀번호:** 화면 검증 전용. 이력/패널에 인증 문구 미기록. 값은 코드 상수(데모 한계 명시).
- **보류 금지:** 승인/반려만. 보류 상태·버튼·이력 추가하지 않음.
- **데모 한계:** in-memory 저장(새로고침 시 초기화) — 기존 데모 정책과 동일, 사용자에게 명시.

---

## 검증 (Verification)

1. `index.html`을 브라우저로 열고 좌측 메뉴 **결재 LIST** 진입 → §15 시나리오 1~20 순차 확인.
2. 결재자 셀렉터를 **김본부(전권)↔박지현(지급종결 권한 없음)↔오세린(면책종결 권한 없음)** 로 바꿔 전결체크 배지(결재 가능/상위결재 필요/지급한도 초과/지급종결·면책종결 권한 없음) 검증.
3. 지급(종결)·추가지급 승인 시 비밀번호 모달 → `1234` 일치(결재완료)·불일치(미변경) 확인. 추산·면책종결·VOC·반려는 비밀번호 없이 처리.
4. 반려 사유 미입력 차단, 승인/반려 후 이력 추가·"비밀번호 인증 완료" 문구 부재 확인.
5. 기존 4개 화면 전환·렌더 회귀, 콘솔 에러 0 확인.

---

## 산출물 처리 (Deliverable)

- 본 계획은 프로젝트 루트 **`plan-결재LIST.md`** 로 저장(기존 `plan.md` 마스터 기획서 보존).
- **index.html은 이 단계에서 수정하지 않는다.** 실제 구현은 별도 지시(§14 구현 순서)에 따라 진행.
