# SK렌탈 Claim Flow 관리 설계서

## 1. 설계 기준

- 기준 문서: `plan.md`
- 구현 대상: 루트의 기존 `index.html`을 새 설계 기준으로 교체
- 구현 방식: 외부 서버 없이 동작하는 단일 HTML 파일
- 기술 구성: HTML, CSS, JavaScript
- 프로젝트 레벨: Starter
- 우선 목표: 자동차 렌탈사 및 Claim 서비스 운영사 대상 B2B SaaS형 ERP 데모 화면

## 2. 화면 목적

`SK렌탈 Claim Flow 관리` 화면은 Claim 접수부터 지급/정산까지의 처리 흐름을 한 화면에서 보여주고, 담당자가 오늘 처리해야 할 건을 빠르게 선택하고 조치할 수 있도록 설계한다.

핵심 사용자는 SK렌탈 Claim 담당자, Claim 운영 관리자, 신사업 영업직원, 고객사 임원이다. 따라서 실제 운영 업무의 흐름은 유지하되, 복잡한 보험사 업무시스템처럼 보이지 않도록 화면 구조와 문구를 정돈한다.

## 3. 정보 구조

화면은 4개 영역으로 구성한다.

1. 상단 업무 Flow 카드
2. 상단 보조 성과 지표
3. 좌측 조치유형 탭
4. 중앙 Claim 리스트 + 우측 빠른 처리 패널

본문은 3단 레이아웃이다.

- 좌측: 조치유형 탭과 현재 선택된 Flow 단계
- 중앙: Claim 리스트 테이블
- 우측: 선택 Claim 상세와 빠른 액션

## 4. HTML 구조 설계

단일 `index.html` 파일 안에 아래 구조를 둔다.

```html
<body>
  <div class="app-shell">
    <header class="page-header"></header>
    <section class="flow-section"></section>
    <section class="metric-strip"></section>
    <main class="workbench">
      <aside class="action-tabs"></aside>
      <section class="claim-list-panel"></section>
      <aside class="quick-panel"></aside>
    </main>
    <div class="toast" aria-live="polite"></div>
  </div>
</body>
```

주요 렌더링 대상:

- `.flow-section`: 5개 Flow 카드와 카드 사이 화살표
- `.metric-strip`: 오늘 발생, 면책, 종결, 평균 리드타임
- `.action-tabs`: 전체보기, 현재 Flow 표시, 조치유형 탭
- `.claim-list-panel`: Claim 테이블
- `.quick-panel`: 선택 건 상세 및 액션 버튼
- `.toast`: 액션 결과 메시지

## 5. CSS 설계

### 레이아웃

- 전체 배경: `#F6F8FB`
- 최대 너비: 데스크톱 기준 `1440px`
- 상단 Flow: 5개 카드를 가로 배치
- 본문 그리드: `220px 1fr 340px`
- 화면 폭이 좁아질 경우 본문은 세로로 쌓이도록 반응형 처리

### 시각 스타일

- 메인 카드 배경: `#FFFFFF`
- 기본 선: `#E3E8F0`
- 주요 텍스트: `#172033`
- 보조 텍스트: `#667085`
- 포인트 블루: `#2563EB`
- 연한 블루 배경: `#EFF6FF`
- 긴급: `#DC2626`
- 주의: `#F97316`
- 정상: `#16A34A` 또는 `#64748B`

### 컴포넌트 규칙

- 카드 radius는 8px 이하를 기본으로 한다.
- 버튼은 주요 액션만 파란색으로 강조한다.
- 보조 액션은 회색 테두리 버튼으로 정리한다.
- 선택된 Flow 카드, 탭, 테이블 행은 배경색과 테두리로 명확히 구분한다.
- 텍스트가 버튼이나 카드 안에서 넘치지 않도록 `min-width`, `line-height`, `white-space`를 조정한다.

## 6. JavaScript 상태 모델

전역 상태는 단순 객체로 관리한다.

```js
const state = {
  selectedFlow: 'all',
  selectedActionType: 'all',
  selectedClaimId: null
};
```

상태 의미:

- `selectedFlow`: `all`, `접수 확인`, `입고 / 선견적`, `수리 승인`, `손해사정`, `지급 / 정산`
- `selectedActionType`: `all` 또는 조치유형명
- `selectedClaimId`: 선택된 사고번호

## 7. 데이터 모델

### Flow 단계 데이터

```js
const flowStages = [
  {
    id: 'reception',
    name: '접수 확인',
    tasks: ['차량 및 계약정보 확인', '이전 접수이력 확인', '운전자/사고정보 확인']
  }
];
```

전체 단계:

1. 접수 확인
2. 입고 / 선견적
3. 수리 승인
4. 손해사정
5. 지급 / 정산

### 조치유형 데이터

```js
const actionTypes = [
  '고객 미응답',
  '고객 연락요청',
  '사진 미등록',
  '업체 미회신',
  '입고/수리 지연',
  '정산 대기'
];
```

### Claim 데이터 필드

```js
{
  id: 'CLM-2026-0004',
  customerName: '박민재',
  carNumber: '12하3456',
  customerType: '법인 장기렌탈',
  flowStage: '입고 / 선견적',
  actionType: '업체 미회신',
  statusText: 'AOS 선견적 수신 대기',
  urgency: '주의',
  elapsedTime: '18시간',
  manager: '이서연',
  processStatus: '미처리',
  actionRequired: '공업사 선견적 회신이 지연되어 입고 이후 승인 단계로 넘어가지 못하고 있습니다.',
  nextAction: '공업사 요청'
}
```

필수 값:

- `urgency`: `긴급`, `주의`, `정상`
- `processStatus`: `미처리`, `처리중`, `완료`, `보류`
- `flowStage`: `접수 확인`, `입고 / 선견적`, `수리 승인`, `손해사정`, `지급 / 정산`

## 8. 더미 데이터 구성 기준

최소 12건을 작성한다.

- 접수 확인: 2건 이상
- 입고 / 선견적: 3건 이상
- 수리 승인: 2건 이상
- 손해사정: 2건 이상
- 지급 / 정산: 3건 이상

테스트 고정 데이터:

- 사고번호: `CLM-2026-0004`
- Flow 단계: `입고 / 선견적`
- 조치유형: `업체 미회신`
- 현재상태: `AOS 선견적 수신 대기`
- 다음 권장 액션: `공업사 요청`

## 9. 렌더링 함수 설계

아래 함수 단위로 구현한다.

```js
function renderFlowCards() {}
function renderMetrics() {}
function renderActionTabs() {}
function getFilteredClaims() {}
function renderClaimList() {}
function renderQuickPanel() {}
function renderAll() {}
```

역할:

- `renderFlowCards`: Flow 카드, 미결 건수, 지연/주의 건수, 핵심 업무 렌더링
- `renderMetrics`: 보조 성과 지표 렌더링
- `renderActionTabs`: 현재 선택 Flow와 조치유형 탭 렌더링
- `getFilteredClaims`: 현재 상태 기준으로 Claim 배열 필터링
- `renderClaimList`: 중앙 테이블 렌더링
- `renderQuickPanel`: 선택 Claim 상세와 액션 버튼 렌더링
- `renderAll`: 상태 변경 후 전체 UI 재렌더링

## 10. 필터링 규칙

### Flow 카드 클릭

- `selectedFlow`를 클릭한 Flow 단계로 변경한다.
- `selectedActionType`은 유지한다.
- 필터 결과가 없으면 중앙 리스트에 빈 상태 메시지를 표시한다.

### 전체보기 클릭

- `selectedFlow`를 `all`로 변경한다.
- `selectedActionType`은 `all`로 초기화한다.
- 전체 Claim 데이터를 표시한다.

### 조치유형 탭 클릭

- `selectedActionType`을 클릭한 조치유형으로 변경한다.
- `selectedFlow`가 특정 단계이면 해당 단계 안에서 조치유형 필터링을 적용한다.
- `selectedFlow`가 `all`이면 전체 데이터 중 해당 조치유형만 표시한다.

### 전체 조치유형 클릭

- `selectedActionType`을 `all`로 변경한다.
- 현재 Flow 조건은 유지한다.

## 11. 선택 상태 규칙

- 최초 진입 시 `selectedFlow`는 `all`이다.
- 최초 진입 시 첫 번째 Claim을 자동 선택한다.
- 필터 변경 후 기존 선택 건이 필터 결과에 없으면 필터 결과의 첫 번째 Claim을 선택한다.
- 필터 결과가 없으면 우측 패널에는 선택 건 없음 상태를 표시한다.
- 중앙 리스트 행 클릭 시 `selectedClaimId`를 해당 사고번호로 변경하고 우측 패널을 갱신한다.

## 12. 우측 빠른 처리 패널 설계

우측 패널에는 아래 순서로 정보를 배치한다.

1. 사고번호와 처리상태 뱃지
2. 고객명, 차량번호, 고객구분
3. 현재 Flow 단계, 현재상태, 조치유형
4. 경과시간, 담당자
5. 조치 필요 내용
6. 다음 권장 액션
7. Flow 단계별 빠른 액션 버튼
8. 처리 메모 입력창
9. 처리완료 버튼
10. 보류 처리 버튼

## 13. Flow 단계별 액션 버튼 매핑

```js
const stageActions = {
  '접수 확인': ['고객 정보요청', '계약정보 확인', '사고이력 조회', '처리완료'],
  '입고 / 선견적': ['입고지 확인', '선견적 확인', '사진요청 발송', '공업사 요청'],
  '수리 승인': ['수리 승인', '공업사 오더', '고객 안내발송', '관리자 확인요청'],
  '손해사정': ['AOS 청구 확인', '손해사정 등록', '면부책 확인', '관리자 검토요청'],
  '지급 / 정산': ['손해액 확정', '공업사 안내', 'SK전산 입력', '월정산 반영']
};
```

액션 버튼 클릭 시 실제 데이터 처리 대신 토스트 메시지를 표시한다.

예시:

- `CLM-2026-0004 공업사 요청 액션을 실행했습니다.`

## 14. 상태 변경 규칙

### 처리완료

- 선택 Claim의 `processStatus`를 `완료`로 변경한다.
- 토스트 메시지: `처리상태가 완료로 변경되었습니다.`
- 중앙 리스트와 우측 패널을 다시 렌더링한다.

### 보류 처리

- 선택 Claim의 `processStatus`를 `보류`로 변경한다.
- 토스트 메시지: `처리상태가 보류로 변경되었습니다.`
- 중앙 리스트와 우측 패널을 다시 렌더링한다.

## 15. 접근성 및 사용성 기준

- 버튼에는 실제 `button` 요소를 사용한다.
- 테이블 행은 클릭 가능함을 `cursor: pointer`로 표현한다.
- 토스트는 `aria-live="polite"`를 사용한다.
- 긴급도와 처리상태는 색상뿐 아니라 텍스트로도 구분한다.
- 작은 화면에서는 테이블이 가로 스크롤되도록 한다.

## 16. 구현 순서

1. 기존 루트 `index.html`을 새 단일 파일 구조로 교체한다.
2. 기본 HTML 구조를 작성한다.
3. CSS 변수와 공통 카드/버튼/뱃지 스타일을 작성한다.
4. Flow 단계, 조치유형, Claim 더미 데이터를 작성한다.
5. `renderFlowCards`를 구현한다.
6. `renderMetrics`를 구현한다.
7. `renderActionTabs`를 구현한다.
8. `getFilteredClaims`를 구현한다.
9. `renderClaimList`를 구현한다.
10. `renderQuickPanel`을 구현한다.
11. Flow 카드, 조치유형 탭, 테이블 행 이벤트를 연결한다.
12. 액션 버튼 토스트를 구현한다.
13. 처리완료/보류 상태 변경을 구현한다.
14. 테스트 시나리오를 실행한다.

## 17. 테스트 계획

수동 테스트 기준:

1. `index.html`을 브라우저에서 연다.
2. 상단 Flow 카드 중 `입고 / 선견적`을 클릭한다.
3. 중앙 리스트에 `입고 / 선견적` 단계 건만 표시되는지 확인한다.
4. 좌측 탭에서 `업체 미회신`을 클릭한다.
5. `CLM-2026-0004` 행을 선택한다.
6. 우측 패널에서 `AOS 선견적 수신 대기` 내용이 표시되는지 확인한다.
7. `공업사 요청` 버튼 클릭 시 토스트 메시지를 확인한다.
8. `처리완료` 클릭 시 처리상태가 `완료`로 변경되는지 확인한다.
9. `전체보기` 클릭 시 전체 데이터가 다시 표시되는지 확인한다.

추가 점검:

- 선택된 Flow 카드, 탭, 행이 모두 시각적으로 강조되는지 확인한다.
- 필터 결과가 없을 때 빈 상태가 깨지지 않는지 확인한다.
- 작은 화면에서 본문이 세로로 쌓이고 테이블이 가로 스크롤되는지 확인한다.

## 18. 완료 기준

- 기존 `index.html`이 본 설계 기준의 단일 HTML 데모로 교체되어 있다.
- 5개 Flow 카드가 모두 렌더링된다.
- 6개 조치유형 탭이 모두 렌더링된다.
- 12건 이상의 Claim 더미 데이터가 표시된다.
- `CLM-2026-0004` 테스트 시나리오가 통과한다.
- 처리완료와 보류 상태 변경이 화면에 즉시 반영된다.
- 토스트 메시지가 액션 클릭 시 표시된다.
- 전체 화면이 B2B SaaS 데모로 보이며 임원과 영업직원이 흐름을 이해할 수 있다.
