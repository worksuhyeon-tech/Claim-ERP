# Smart접수지 개선 작업계획서 (Claim-ERP)

> **문서 성격**: Smart접수지 3개 탭을 Smart업무관리 프로세스·결재LIST Flow에 맞게 개선하기 위한 설계 계획서.
> **현 시점 `index.html`은 아직 수정하지 않았다.** 이 문서를 실행 권위로 삼아 이후 구현 단계에서 반영한다.

---

## Context — 왜 이 작업을 하는가

현재 Smart접수지 상세 화면의 3개 탭(계약 사고 정보 / 피해 진행 정보 / 청구 견적 정보)은 **모두 읽기 전용**이다. 데이터는 사고번호 시드(`defaultDetail`)로 매 렌더마다 결정론적으로 재생성되고, 화면 하단 버튼은 `보류 / 처리완료`뿐이다. 결재 화면(결재LIST / Speed결재)은 이미 존재하지만 **결재 건을 신규로 상신(생성)하는 경로가 없다** — `APPROVALS` 20건은 시드로만 존재하고, 화면에서 하는 일은 승인/반려(상태 변경)뿐이다.

이번 개선의 목표는 Smart접수지를 **"실무자가 정보를 보정하고 결재를 상신하는 작업 화면"**으로 바꾸는 것이다.

- **탭1 계약 사고 정보**: 외부 연동(웹스크래핑/IF)으로 자동 반영될 항목을 실무자가 보정·저장.
- **탭2 피해 진행 정보**: 피해·수리·렌트·탁송 정보를 보정·저장.
- **탭3 청구 견적 정보**: 추산/지급 결재의 **상신 시작점**. 여기서 상신한 건이 결재LIST에 적재되고 Speed결재에서 승인/반려된다.

Smart업무관리 프로세스(접수·선견적 → 수리 승인 → 손해사정 → 지급/정산)와 결재LIST Flow를 하나의 데이터 흐름으로 잇는 것이 핵심이다.

**제약**: `index.html` 단일 파일 유지, 외부 라이브러리 금지, 기존 `.lg-*` 레거시 폼 톤 유지, 기존 Smart업무관리/결재LIST/Speed결재/전결·순환배당 화면이 깨지지 않을 것. 결재이력에 "비밀번호 인증 완료" 문구를 화면·데이터 어디에도 남기지 않는다.

---

## 1. 현재 Smart접수지 화면 구조 분석

- **진입**: `openIntake(claimId)` (index.html:3991) → `switchView("intake")` → `renderIntake()` (4762–4826). 독립 목록 없이 Smart업무관리(`CLAIMS`)를 공유하며, "목록으로"는 `claims` 뷰로 복귀.
- **데이터 병합**: `getIntakeData(claimId)` (4346) = `CLAIMS[i]` + `defaultDetail(c,w)` (4197, 사고번호 시드 결정론 생성) + `INTAKE_DETAIL[id]` 오버라이드(4018). **시드 재계산 방식이라 영구 저장이 없다.** 사용자 입력만 `INTAKE_DETAIL` / `intakeProgressLogs`(2931) / `intakePropertyState`(2938) / `memos`(2926)에 보관.
- **탭 전환**: 상태 `intakeTab`(2924, `"contract"|"damage"|"estimate"`) → `renderIntakeTab(name,d)` (4592) → `intakeContractTab(d)` (4489) / `intakeDamageTab(d)` (4554) / `intakeEstimateTab(d)` (4609). 탭 클릭 시 `renderIntake()` **전체 재렌더**.
- **레거시 폼 렌더 헬퍼**: `lgTable(entries)` (4407) — `{k, v, full?, blue?}` 배열을 4열 폼 테이블로. 값은 `iEsc()`로 escape → **현재는 입력 컨트롤 주입 불가**. `lgSect(title,note)` (4424) 섹션 헤더.
- **상단**: `lgIdBand(d)` (4428, procStatus 태그·사고번호·과실·차명·고객구분) + `lgRow2(d)` (4438, 담당/청구진행 체크칩) + `intakeWorkbenchHtml(d)` (4454, 진행이력/메모/미결속성 3패널).
- **하단 액션바**: `#intakeHold`(보류) / `#intakeComplete`(처리완료) → `setProcStatus(id, status)` (3761).
- **탭3 견적**: `estimateDoc {payTo, paidAmount, finalPaid, pre[], claim[]}`, 요약밴드 `.lg-est-band`(선견/청구/지급/지급처), 스텝퍼 `ESTIMATE_STAGES`(4600), 선견적↔청구서 토글 `bindIntakeEstimate(d)` (4691). `estSum(rows, field)` (4606)로 합계. **`flowStage`가 "접수·선견적"(idx 0)이면 `estimateDoc`이 null** → "등록된 청구 견적 정보가 없습니다." 표시.

### 결재 측 구조 (연계 대상)

- **`APPROVALS`** (4842, 20건): `{id, claimNo, resolutionNo, approvalType, requesterId, requesterName, damagedObjectName, damageInfo, repairShopName, approvalAmount, approvalStatus, requestedAt, completedAt, requesterComment, approverId, approverName, approverComment}`. `seedApprovals()` (5070)가 최초 렌더 시 `coreInfo`(품의서, `apprBuildCoreInfo` 4972)와 `histories[]`를 **무조건 주입**.
- **`histories[]` 항목**: `{id, claimNo, resolutionNo, approvalType, actionType, actorId, actorName, actorEmployeeNo, actedAt, status, comment, statusBefore, statusAfter}`. `actionType` = `"상신"|"승인"|"반려"`.
- **상태**: `approvalStatus` = `"상신중"|"결재완료"|"반려"` (`APPR_STATUS_CLASS` 4831). ("결재중"이라는 값은 존재하지 않음.)
- **상수**: `APPR_TYPES=["추산","지급(종결)","면책종결","추가지급","VOC"]`(4829), `APPR_PAY_TYPES=["지급(종결)","추가지급"]`(4830, 비밀번호 대상), `APPR_PASSWORD="1234"`(4834), `currentApproverId="EMP013"`(4837), `apprIsPayType(type)`(4838).
- **Speed결재**: `renderApprPanel()` (5293, 우측 고정 패널). 승인 `apprApprove(id)` (5373) — 지급성이면 `openApprPw(id)` (5399, `#apprPwRoot` 모달) → `submitApprPw()` (5439, 불일치 시 `showToast("비밀번호가 불일치합니다.")` 후 상태 불변) → `apprFinalizeApprove(item, approver)` (5363). 반려 `apprReject(id)` (5381, 사유 필수). 이력 push는 `pushApprHistory(...)` (5355).
- **결재 신규 생성(상신) 로직은 현재 없음** — `APPROVALS.push/unshift` 코드 부재.
- **공통 UI**: `showToast(msg)` (6457), 모달은 `#…Root`에 `.modal-backdrop`+`.action-modal` innerHTML 주입 패턴, ESC 전역 핸들러 (5641–5648).
- **전결·순환배당**: `staffAssignmentSettings` (5783, EMP001~014). `assignStaffById(id)`, `assignWon(n)` 헬퍼 재사용 가능. `CLAIMS[].manager` 이름이 이 목록 이름과 일치 → 저장자/상신자 신원 소스로 사용.

---

## 2. 개선 후 최종 화면 구조

```
Smart접수지 (물)   [대외비] [✕]
────────────────────────────────────────────────
조회구분 [사고번호 ▾] [CLM-2026-0034] 🔍검색 대기 ↻재설정
────────────────────────────────────────────────
[procStatus] CLM-2026-0034 · 과실 · 차명/번호 · 고객구분     ← lgIdBand (기존)
┌─ 상태 밴드 (신규) ─────────────────────────────────────┐
│ 사고번호 │ 피해물 │ 업무단계 │ 계약정보 │ 피해진행 │ 최종결재 │
│ CLM-…034 │ 자차1  │ 손해사정 │ 저장완료 │ 수정완료 │ 지급 상신중│
└────────────────────────────────────────────────────────┘
[담당/청구진행 체크칩]  [진행이력 · 진행메모 · 미결속성 3패널]  ← 기존 유지
────────────────────────────────────────────────
[계약 사고 정보] [피해 진행 정보] [청구 견적 정보]   ← 탭
────────────────────────────────────────────────
<탭 본문 (intakeBody)>
  · 탭1/탭2: 수정 가능 항목은 입력 컨트롤, 나머지는 read-only
            하단 [저장이력 (n)] [저장/수정] 바
  · 탭3: 요약(선견/청구/지급예정/지급처/결재상태/최종순번)
        [추산 결재] [지급 결재] [결재이력] 버튼
────────────────────────────────────────────────
미결 태그: …            [보류] [처리완료]   ← 기존 유지
```

신규 모달: 상신 의견 입력(`#srApprRoot`), 결재이력 조회(`#srApprRoot` 재사용), 비밀번호 인증(기존 `#apprPwRoot` 재사용).

---

## 3. 탭별 역할 정의

| 탭 | 역할 | 하단 액션 |
|---|---|---|
| **계약 사고 정보** | 외부 연동값(생년월일·면허) 자동 반영 + 사고정보 실무자 보정 후 저장 | `[저장]` → 저장 후 `[수정]`, `[저장이력]` |
| **피해 진행 정보** | 피해·수리·렌트·탁송 정보를 시드 기본값에서 보정 후 저장 | `[저장]` → 저장 후 `[수정]`, `[저장이력]` |
| **청구 견적 정보** | 추산/지급 결재 상신의 시작점. 결재LIST로 적재 | `[추산 결재]` `[지급 결재]` `[결재이력]` |

**탭1/탭2 편집 정책 (확정)**: 저장 후에도 입력 필드는 **항상 수정 가능**한 상태로 유지한다. 버튼 라벨만 최초 저장 전 `저장` → 저장 후 `수정`으로 바뀐다. (별도 잠금/편집모드 토글 없음 → 로직 단순.)

---

## 4. 계약 사고 정보 탭 — 수정 가능/불가 항목

**수정 가능 (입력 컨트롤)**
| 필드 | 데이터 경로 | 사유 |
|---|---|---|
| 운전자 생년월일 | `d.parties.driver.birth` | 웹스크래핑/IF 자동반영, 실패 시 직접 입력 |
| 운전자 면허정보 | `d.parties.driver.license` | 웹스크래핑/IF 자동반영, 실패 시 직접 입력 |
| 사고일시 | `d.accident.datetime` | 실무자 확인 후 보정 |
| 사고장소 | `d.accident.place` | 실무자 확인 후 보정 |
| 사고내용 | `d.accident.content` (textarea) | 실무자 확인 후 보정 |

**수정 불가 (read-only, `.blue`/기본 셀 유지)**: 계약자, 계약번호, 계약기간, 차량 계약정보(차명/번호/차종/가액), 보험/담보 조건(면부책·자차·계약정보 섹션 전체), 소유자·피보험자·통보자 정보, 출동 정보 등 원천시스템 기준 항목.

---

## 5. 계약 사고 정보 저장/수정 Flow

```
계약 사고 정보 조회 → (외부 연동값 자동 반영: 시드 기본값 표시)
  → 직원이 수정 가능 5개 항목만 보정
  → [저장] 클릭
  → smartReceipts[id].contractAccidentInfo 저장
     (isSaved=true, savedAt, savedBy, fields, histories에 "저장" 이력)
  → 버튼 라벨 [저장] → [수정]
  → 이후 변경 → [수정] 클릭
  → 변경 전후값 diff 계산 → histories에 "수정" 이력(before/after 포함)
```

이력 항목: `{seq, action:"저장"|"수정", savedAt, savedBy, changes:[{field, label, before, after}]}` (최신순 unshift). 변경 없이 수정 클릭 시 `showToast("변경된 항목이 없습니다.")` 후 이력 미기록.

---

## 6. 피해 진행 정보 탭 — 수정 가능 항목

기본값은 기존 시드 데이터에서 자동 세팅하고 모두 수정 가능.

| 필드 | 컨트롤 | 시드 기본값 소스 |
|---|---|---|
| 피해물 | text | `d.damage.object` |
| 수리업체 | text | `d.repairShop` / `d.repair.shop` |
| 수리 진행상태 | select(입고대기/수리중/수리완료/출고완료) | `d.repair.estimatePay` 등에서 파생 |
| 입고일 | date/text | `d.inDate` |
| 출고예정일 | date/text | `d.outDate` |
| 출고완료일 | date/text | (신규, 기본 공란) |
| 렌트 여부 | select(Y/N) | `d.damage.rentClaim`("청구"→Y) |
| 탁송 여부 | select(Y/N) | (신규, 기본 N) |
| 면책금 여부 | select(Y/N) | `d.deductible` 파생 |
| 피해물 상태 | text | `d.damage.info` |

**주의**: 기존 탭2의 `교통비청구 / 렌트청구` 행을 **`렌트 여부 / 탁송 여부`로 교체**한다 (SK Claim-ERP 용어 정합). "공업사·수리" 테이블에 진행상태/입고일/출고예정일/출고완료일/면책금 여부/피해물 상태를 반영. 차량 부위 손상·고객안내 진행현황·피해물 목록은 기존 유지.

---

## 7. 피해 진행 정보 저장/수정 Flow

탭1과 동일 패턴. `smartReceipts[id].damageProgressInfo`에 저장. 저장 시 `savedAt/savedBy` 기록, `histories`에 "저장"/"수정" + 변경 전후값. 저장이력 섹션도 탭1과 동일한 인라인 접이식 테이블.

---

## 8. 청구 견적 정보 탭 — 추산/지급 결재 Flow

### 요약 표시 (탭3 상단)
- 선견 금액 = `estSum(doc.pre, "base")`, 청구 금액 = `estSum(doc.claim, "base")`, 지급 예정 금액 = `estSum(doc.claim, "adjust")` 또는 `doc.paidAmount`, 지급처 = `doc.payTo`.
- **현재 결재상태** = 해당 사고번호 최신 결재건 `approvalStatus`, **최종 추산 결재순번** / **최종 지급 결재순번** = 종류별 최대 `resolutionNo` (`srApprovalsFor(claimNo)` 계산).

### 추산 결재 Flow (비밀번호 없음)
```
견적/청구 내역 확인 → 추산금액 산정/정정
  → [추산 결재] 클릭 → 상신 의견 입력 모달(#srApprRoot)
  → [상신] → createIntakeApproval(claimId, "추산", comment)
  → APPROVALS.unshift(신규건) → 결재LIST 상단 노출
  → 결재자가 Speed결재에서 승인/반려
```

### 지급 결재 Flow (지급성 → 비밀번호)
```
청구금액/지급처/면책금 확인 → [지급 결재] 클릭
  → 상신 의견 입력 모달 → [상신]
  → 지급성이므로 비밀번호 모달(기존 #apprPwRoot 재사용)
  → 일치 시 createIntakeApproval(claimId, "지급(종결)", comment)
  → 불일치 시 "비밀번호가 불일치합니다." 토스트, 상신 중단(상태 불변)
  → 결재자가 Speed결재에서 승인 (지급성 → 최종승인 시에도 비밀번호)
  → 최종승인 시 해당 CLAIMS.flowStage = "지급 / 정산" 반영
```

**버튼 노출 권장안 (추가지급/면책종결/VOC)**:
- 기본 노출은 **`[추산 결재] [지급 결재] [결재이력]` 3개 유지**.
- **지급 버튼 동적 전환**: 같은 사고번호+피해물의 "지급(종결)" **결재완료** 건이 이미 있으면 라벨을 "추가지급 결재"로 바꾸고 `approvalType="추가지급"`으로 생성. `추가지급`도 `APPR_PAY_TYPES`라 비밀번호 흐름이 그대로 적용됨(분기 최소).
- **면책종결/VOC는 버튼 미노출**. 단 `createIntakeApproval(claimId, type, comment)`이 종류를 매개변수로 받으므로 데이터 구조상 5종 모두 지원 — 추후 버튼 1개 추가로 확장 가능하도록 주석 명시.
- **활성 조건**: `estimateDoc`이 null(접수·선견적 단계)이면 추산/지급 버튼 disabled + 결재이력만 활성. 이미 동일 종류 "상신중" 건이 있으면 중복 상신 방지로 disabled(툴팁 "상신중인 건이 있습니다").

---

## 9. 결재순번 생성/증가 기준

순번 키 = **사고번호 + 피해물 + 결재종류**. 3자리 zero-pad, 종류별 독립 증가.

```js
function srNextResolutionNo(claimNo, objectName, approvalType) {
  const max = APPROVALS
    .filter(a => a.claimNo === claimNo && a.damagedObjectName === objectName && a.approvalType === approvalType)
    .reduce((m, a) => Math.max(m, parseInt(a.resolutionNo, 10) || 0), 0);
  return String(max + 1).padStart(3, "0");
}
```

예시(요구 명세와 일치):
- 최초 추산 상신 → 추산 001 / 견적 정정 재상신 → 추산 002
- 최종 청구 후 지급 상신 → 지급 001 / 추가 청구 → 추가지급 001

**기존 `resolutionNo`와의 정합**: 기존 시드 20건도 동일 필터의 max 계산에 포함된다. 예로 CLM-2026-0004 "추산"은 시드 001이 있어 신규가 002가 됨 → 기존 체계와 자연스럽게 이어지고 충돌 없음. `smartReceipts[id].estimateClaimInfo.approvalSequences`는 참조 캐시로만 두고, **화면 표시는 항상 `APPROVALS`를 진실 원천으로 계산**(정합성 단일화).

---

## 10. 결재이력 테이블 구조와 정렬 기준

**표시 UI = 모달** (`#srApprRoot` 재사용). 접수지는 전폭 레거시 폼이라 우측 패널 신설은 `.lg-body` 그리드 대수술이 필요 → 모달이 최소 침습.

- `openSrApprHistory(claimId)`: `srApprovalsFor(claimId)` = `APPROVALS.filter(a => a.claimNo === claimId)` → 각 건의 `histories[]`를 flatten → **`actedAt` 내림차순(최신 위, 최초 아래)** 정렬.
- **컬럼**: 순번 / 결재자 / 결재구분(상신·승인·반려) / 결재시간 / 결재의견. (요구 명세의 5컬럼. 결재종류·결의순번도 부가 표시 가능.)
- 결재금액 변경 전후값이 있으면 함께 표시.
- **비밀번호 인증 여부는 절대 표시하지 않음** — histories/coreInfo/토스트 어디에도 인증 관련 텍스트 미기록.
- 건 없으면 "결재 이력이 없습니다." empty. ESC 전역 핸들러(5643 부근)에 `#srApprRoot` 분기 추가.

예시 정렬:
```
003 | 김본부 | 최종결재 | 2026-07-06 10:25 | 대사고 보고완료건
002 | 오세린 | 상신     | 2026-07-06 09:12 | 대사고 기보고완료건
001 | 오세린 | 최종결재 | 2026-07-05 17:35 | -
```

---

## 11. 비밀번호 인증 적용 기준

| 대상 | 비밀번호 |
|---|---|
| 지급(종결) 상신 | ✅ |
| 지급(종결) 최종승인 | ✅ (기존 로직 이미 존재) |
| 추가지급 상신 | ✅ |
| 추가지급 최종승인 | ✅ (기존 로직) |
| 추산 / 면책종결 / VOC / 반려 | ❌ |

- 판정: `apprIsPayType(type)` (기존 `APPR_PAY_TYPES` 재사용).
- 처리: 지급성 상신/최종승인 클릭 → 비밀번호 모달 → 일치 시 진행, **불일치 시 `showToast("비밀번호가 불일치합니다.")` + 상태 불변**.
- 비밀번호는 **결재 진행 전 화면 검증용**으로만 사용(`APPR_PASSWORD="1234"`).
- **결재이력에 "비밀번호 인증 완료" 문구를 화면·데이터 어디에도 남기지 않는다.** (코드 리뷰 체크포인트로 명시.)

---

## 12. 결재LIST / Speed결재와의 데이터 연계 방식

- **상신 생성**: `createIntakeApproval(claimId, approvalType, comment)`이 `APPROVALS`에 신규 항목을 `unshift`(상단 노출). 이때 `coreInfo`(`apprBuildCoreInfo(item)`)와 `histories[]`(상신 1건)를 **즉시 함께 주입** → 결재LIST/Speed결재 패널이 바로 정상 동작.
- **`seedApprovals` 가드 (필수)**: `seedApprovals()` (5071) forEach 첫 줄에 `if (item.coreInfo) return;` 추가. 접수지에서 먼저 생성한 건이 결재LIST 최초 진입 시 이력·품의서가 재생성되어 덮이는 것을 방지. 기존 20건은 `coreInfo`가 없어 기존 동작 그대로.
- **필수 필드 채우기**: `id`(`srNextApprId()` = APR-nnn 최대+1), `claimNo`, `resolutionNo`(9항), `approvalType`, `requesterId/Name`(`srCurrentStaff` = `CLAIMS.manager` 매칭 직원), `damagedObjectName`(피해물), `damageInfo`(`carModel / car`), `repairShopName`, `approvalAmount`(추산→`estSum(pre,"base")` / 지급→`estSum(claim,"adjust")` 또는 `paidAmount`), `approvalStatus="상신중"`, `requestedAt=apprNow()`, `requesterComment=comment`.
- **최종승인 → 단계 반영**: `apprFinalizeApprove(item, approver)` (5363)의 `renderClosingView()` 직전에, 지급성이면 해당 `CLAIMS[].flowStage="지급 / 정산"` + `work=deriveWork(c)` 세팅 후 `renderAll()` 호출(Smart업무관리 카운트 갱신).
- **점프**: 기존 `apprJump("intake", item)` (5349)로 결재→접수지 이동 이미 지원.

---

## 13. 추가/변경할 더미 데이터 구조

**신규 저장소** (상태 선언 블록 끝, `intakePropertyState` 아래 ~2944):

```js
const smartReceipts = {};   // 사고번호 키 — 시드/INTAKE_DETAIL보다 항상 우선
function getSmartReceipt(id) {
  if (!smartReceipts[id]) smartReceipts[id] = {
    contractAccidentInfo: { isSaved:false, savedAt:null, savedBy:null, fields:null, histories:[] },
    damageProgressInfo:   { isSaved:false, savedAt:null, savedBy:null, fields:null, histories:[] },
    estimateClaimInfo:    { approvalSequences: [] },  // {apprId, approvalType, resolutionNo, requestedAt} 참조 캐시
  };
  return smartReceipts[id];
}
const intakeDrafts = {};    // claimId → {fieldKey: value} — 재렌더 시 입력값 보존
```

- `fields`: 편집 대상 평면 객체(키는 `SR_FIELD_DEFS`의 key). `isSaved=false`면 `fields=null` → 시드값 표시.
- **병합 지점**: `getIntakeData()`의 `return d;` 직전(~4378)에 `applySmartReceiptOverrides(d)` 한 줄 추가. 시드 < `INTAKE_DETAIL` < `smartReceipts` 순서로, **저장값이 시드값을 항상 덮음**. 기존 `INTAKE_DETAIL` 메커니즘은 손대지 않음(CLM-2026-0004 풀데이터 유지).
- **필드 메타** `SR_FIELD_DEFS = { contract:[...], damage:[...] }`: 각 항목 `{key, label, get:(d)=>시드기본값, type?, options?}`. 4·6항 필드 목록대로.
- `estimateClaimInfo.approvalSequences`는 참조 캐시 — 진실 원천은 `APPROVALS`.

**참고 — 사용자 제안 구조와의 매핑**: 사용자가 제시한 `smartReceipt` 예시(`contractAccidentInfo.editableFields/readonlyFields`, `estimateClaimInfo.approvalSequences[].histories`)는 위 구조로 정규화한다. `editableFields`는 `fields`(평면)로, `readonlyFields`는 시드에서 그대로 오므로 별도 저장하지 않음, `approvalSequences[].histories`는 `APPROVALS[].histories`를 진실 원천으로 삼아 중복 저장하지 않음.

**`APPROVALS` 항목 구조는 변경 없음** — 기존 필드를 그대로 채워 신규 건 생성(구조 확장성 유지). 추가지급/면책종결/VOC도 `approvalType` 값만 다를 뿐 동일 구조.

---

## 14. 필요한 CSS 클래스 설계 (기존 `.lg-*` 톤 연장, ~1658 `@media` 앞 삽입)

| 클래스 | 용도 | 베이스 톤 |
|---|---|---|
| `.lg-srband`, `.lg-srband .k/.v` | 상단 상태 밴드 6칸 | `.lg-est-band`(테두리 #90B1DE, 흰 배경) |
| `.lg-sr-pill` + `.ok/.none/.ing/.done/.reject` | 저장/결재 상태 pill | `.lg-est-band .tag` 변형 |
| `.lg-sr-bar` | 탭 하단 저장/수정/이력 버튼 바 | `.lg-actionbar` 변형(버튼은 `.lg-abtn` 재사용) |
| `.lg-sr-hist` | 저장이력 인라인 테이블 | `.lg-log` 톤(sticky th, 11.5px) |
| `.lg-est-appr` | 탭3 결재상태 요약줄 + 버튼 그룹 | `.lg-est-band`/`.lg-est-toggle` 조합 |
| `.lg-appr-hist` | 결재이력 모달 테이블 래퍼 | `.lg-tbl` 재사용 + 뱃지색 `APPR_TYPE_COLOR` |

- 입력 컨트롤은 기존 `.lg-in/.lg-sel/.lg-ta` 그대로 재사용, 모달은 기존 `.action-modal/.modal-*` 재사용 → 신규 모달 CSS 불필요.
- `lgTable()`에 `raw:true` 옵션 추가(있으면 `iEsc` 대신 값 그대로 삽입 → 입력 컨트롤 HTML 주입 가능). 기존 호출부는 `raw` 미지정이라 무영향. **value 속성에는 반드시 `iEsc` 적용**(따옴표 포함 입력 파손·XSS 방지).
- `@media (max-width:980px)`에 `.lg-srband { flex-wrap:wrap; }` 추가.

---

## 15. 구현 순서 (단계별로 화면 확인 가능)

1. **저장소 + 상태 밴드**: `smartReceipts`/`getSmartReceipt`/`intakeDrafts`(~2944), `applySmartReceiptOverrides` + `getIntakeData` 병합(4378), `srStatusBandHtml` + `renderIntake` 삽입(4783), `.lg-srband` CSS. → 확인: 상단에 "미저장/결재 없음" 밴드, 기존 화면 무변화.
2. **탭1 편집화**: `lgTable` raw 옵션(4407), `SR_FIELD_DEFS.contract`, `srInputHtml`, `intakeContractTab` 5개 필드 교체, `intakeDrafts` 캡처/복원(`renderIntake` 최상단 `captureIntakeDrafts()`), `saveSmartReceiptTab` + `srSaveBarHtml` + 저장이력 인라인 섹션 + `bindIntakeSrBar`. → 확인: 저장→수정 전환, diff 이력, 메모 저장 후에도 입력 유지.
3. **탭2 편집화**: `SR_FIELD_DEFS.damage`, `intakeDamageTab`의 렌트/탁송 행 교체 + 수리 진행 필드 반영(동일 패턴 재사용). → 확인.
4. **탭3 요약 + 결재이력**: `srApprovalsFor`, `.lg-est-appr` 줄(현재 결재상태/최종 추산·지급 순번/버튼 3개), `estimateDoc` null 분기에도 버튼 영역 노출, `#srApprRoot` 모달 루트(2128 부근) + ESC 분기(5643) + `openSrApprHistory`. → 확인: CLM-2026-0004에서 시드 APR-001 이력 조회.
5. **추산 상신**: `seedApprovals` 가드(5071), `srNextApprId`/`srNextResolutionNo`/`createIntakeApproval`(~5463), `openSrSubmit`/`submitSrApproval`. → 확인: 상신 후 결재LIST/Speed결재 정상, 결의순번 002 증가.
6. **지급 상신**: `apprPwContext` 도입(승인/상신 target 구분), `openApprPw` 내부 컨텍스트 치환 + 문구 분기, `openIntakePw`, `submitApprPw` 분기. → 확인: 불일치 토스트·상태 불변, 일치 시 지급(종결) 생성, 기존 Speed결재 승인 흐름 회귀 없음.
7. **flowStage 연계**: `apprFinalizeApprove` 수정(5369 부근). → 확인: 지급 상신→승인→Smart업무관리 "지급 / 정산" 이동 + 상단 밴드 반영.
8. **마감 점검**: 17항 회귀 시나리오 일괄 확인.

---

## 16. 테스트 시나리오

`index.html` 더블클릭 후 CLM-2026-0034(손해사정 단계) 위주로:

1. 계약 사고 정보 탭 하단에 `[저장]` 버튼 표시.
2. 저장 후 버튼명이 `[수정]`으로 변경.
3. 운전자 생년월일/면허정보 수정 가능(입력 필드).
4. 사고일시/사고장소/사고내용 수정 가능.
5. 계약자/계약번호/계약정보는 read-only 표시.
6. 계약 저장 시 저장자/저장일시 이력 기록(저장이력 섹션).
7. 피해 진행 정보 탭 하단에 `[저장]` 표시.
8. 피해 진행 저장 후 버튼명 `[수정]` 전환.
9. 렌트 여부/탁송 여부 표시 + 수정 가능(Y/N).
10. 피해 진행 기본값 자동 세팅(시드값).
11. 청구 견적 탭에 `[추산 결재]` 버튼 표시.
12. 청구 견적 탭에 `[지급 결재]` 버튼 표시.
13. 추산 상신 시 비밀번호 없이 결재LIST 적재.
14. 지급 상신 시 비밀번호 모달 표시.
15. 비밀번호 불일치 시 "비밀번호가 불일치합니다." + 상신 안 됨.
16. 비밀번호 일치 시 지급 결재건 결재LIST 적재.
17. 결재순번이 사고번호/피해물/결재종류 기준 생성(002 증가 확인).
18. 결재순번 이력 최신순 표시.
19. 결재이력에 순번/결재자/결재구분/결재시간/결재의견 표시.
20. 결재이력에 "비밀번호 인증 완료" 문구 미표시.
21. 기존 Smart업무관리/결재LIST/Speed결재/전결·순환배당 화면 무결.

---

## 17. 코드 수정 시 주의할 점

1. **`seedApprovals` 덮어쓰기(최고 위험)**: `if (item.coreInfo) return;` 가드 없으면 접수지 선-상신 건의 이력·품의서가 결재LIST 최초 진입 시 재생성됨. 필수.
2. **`renderIntake` 전체 재렌더 경로**: 메모 저장(4722)·미결속성 저장(4742)·`setProcStatus`(3767)·탭 클릭(4805) 모두 재렌더 → draft 캡처/복원 없으면 편집값 소실. `captureIntakeDrafts()`를 `renderIntake()` 첫 줄에. 단, `intakeClaimId`가 바뀌면(다른 건 진입) draft 폐기.
3. **`lgTable` raw 옵션**: additive라 기존 무영향. raw 값 내부 사용자 데이터(value)는 반드시 `iEsc`.
4. **`openApprPw`/`submitApprPw` 리팩터**: 기존 Speed결재 승인 경로(`apprApprove`→`openApprPw(id)`) 시그니처 유지, 내부 상태만 `apprPwContext`로 교체. `closeApprPw`에서 컨텍스트 초기화 누락 시 다음 모달 오분기. **불일치 분기(5441)는 한 글자도 수정 금지.**
5. **`APPROVALS.unshift`**: 필터/카드 카운트/목록은 전부 배열 순회라 안전.
6. **`estimateDoc` null 케이스**: 접수·선견적 단계 건(CLM-2026-0004 포함)에서도 탭3 버튼 영역·결재이력 접근 가능하도록 렌더. `estSum` 호출 전 null 가드.
7. **금액 계산**: `won()`은 null에서 예외 가능 → `Number(x||0)` 캐스팅.
8. **flowStage 변경 부작용**: 초기화 블록(2900–2910) 파생 로직은 로드 1회라 재실행 안 됨 → `work` 등 직접 세팅 후 `renderAll()`.
9. **`lgIdBand`/`lgRow2`/진행 3패널 불변**: 상태 밴드는 별도 함수 추가 방식이라 기존 마크업 유지.
10. **ESC 핸들러 순서**: 비밀번호 모달(`#apprPwRoot`)이 상신 모달 위에 겹칠 수 있으므로 `#apprPwRoot` 분기(기존 5644)가 `#srApprRoot`보다 앞.
11. **CLAUDE.md 규칙**: 수정 범위 내 dead code 정리, 주석은 "왜", 한국어 주석, controlled component 지향, `any` 지양(본 프로젝트는 순수 JS라 해당 없음).

---

## Critical Files

단일 파일 프로젝트. **이번 산출물은 `plan.md`(본 문서)이며, `index.html`은 미수정.** 실제 구현 시 수정 핵심 구간:

- `index.html:1450–1667` — `.lg-*` CSS(신규 클래스 ~1658)
- `index.html:2918–2959` — 상태 선언(`smartReceipts`/`intakeDrafts`), `2128` 부근 `#srApprRoot` 모달 루트
- `index.html:4346–4826` — `getIntakeData` 병합(4378), `lgTable`(4407), 탭 렌더(4489/4554/4609), `renderIntake`(4762)
- `index.html:5070–5094` — `seedApprovals` 가드 / `5355–5446` — `apprFinalizeApprove`·`openApprPw`·`submitApprPw` / `~5463` — `createIntakeApproval` 신설
- `index.html:5641–5648` — ESC 전역 핸들러 분기 추가
