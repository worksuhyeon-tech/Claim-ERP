# 작업 인계 노트 (Handoff)

> 작성일: 2026-06-29
> 대상 파일: `index.html` (외부 라이브러리 없는 단일 정적 웹 데모)
> 작업 브랜치: `claude/github-structure-review-92rm88`
> PR: [#4](https://github.com/worksuhyeon-tech/Claim-ERP/pull/4) (draft, base=`main`)
> 목적: 다른 환경(codex 등)에서 이어 작업할 때 흐름이 끊기지 않도록 현재 상태를 정리한다.

---

## 1. 현재 브랜치 / 배포 상태

- `main` = `bf3f3c4` (이전 세션까지의 작업이 fast-forward 머지되어 최신)
- `claude/github-structure-review-92rm88` = `ca6e6b7` (이번 세션 작업 2건이 main 위에 추가됨)
- PR #4가 위 작업 브랜치 → `main` 으로 열려 있음 (draft). **아직 머지하지 않음.**

이어서 작업하려면:

```bash
git fetch origin claude/github-structure-review-92rm88
git checkout claude/github-structure-review-92rm88
# 또는 codex에서 같은 브랜치를 체크아웃해 이어서 커밋
```

---

## 2. 이번 세션에서 반영한 내용

### 2.1 리스트에서 고객명 제거 → 정비공장명 / 차량번호 표시 (커밋 `6e1a429`)

배경: 업무상 고객 이름보다 정비공장명이 중요하여 리스트 표시 기준을 바꿈.

- **Smart업무관리 리스트** (`renderList()`, 약 `index.html:2639`)
  - 기존 `고객·차량` 컬럼 → `차량번호` 컬럼으로 교체 (고객명 제거)
  - 기존 `정비공장` 컬럼과 함께 **정비공장 | 차량번호** 2개 컬럼으로 분리
  - 행 셀: `.cidcar`(고객명+차량 스택) → `.ccaronly`(차량번호 단일)로 변경
- **결재/종결 리스트**: 정비공장명(상단)/차량번호(하단) 스택으로 변경 (이후 2.2에서 화면 자체가 결재LIST로 개편됨)
- 검색 placeholder·빈 결과 안내문의 `고객명` → `정비공장`, 검색 대상 필드에 `repairShop` 추가
- 입고 전(정비공장 미배정) 건은 `미입고`로 표시
- 정비공장명 데이터는 신규 추가가 아니라 기존 `SHOPS` 배열(`index.html:2380`) + `CLAIMS.forEach` 파생 로직(`repairShop` 자동 배정)을 그대로 사용

### 2.2 종결요청 리스트 → "결재 LIST" 전면 개편 (커밋 `ca6e6b7`)

- **화면명 변경**: `종결 요청 리스트` → `결재 LIST`
  - 네비 라벨(`index.html:1450` 부근), 페이지 `<h1>`, `VIEW_TITLES.closing`(`index.html:3538`)
  - 단, **DOM id/뷰 키는 기존 `viewClosing` / `"closing"` 를 그대로 유지**했다 (switchView 연동 유지 목적). 함수명도 `renderClosingView()`를 재사용.
- **검색/조회** (툴바, `index.html:1602` 섹션 내):
  - 담당자·사고번호 통합 검색 (`#apprSearch`)
  - 결재상태 필터 (`#apprStatus`: 전체 / 상신중 / 결재완료)
  - 결재상태가 `결재완료`일 때만 **조회기간(시작~종료일, 결재완료일 기준)** 입력 활성화 (`#apprFrom`, `#apprTo`)
  - `초기화` 버튼 (`#apprReset`)
- **Task 업무함 카드** (`#apprCards`): 추산 / 지급 / 종결 / VOC 4개
  - 각 카드는 검색·상태·기간 조건이 반영된 건수를 표시
  - 카드 클릭 → 해당 Task 목록만 표시(선택 강조), 재클릭 시 전체로 복귀
- **목록** (`#apprRows`): 사고번호 · Task · 담당자 · 결재상태(뱃지) · 상신일 · 결재완료일

---

## 3. 데이터 모델 / 핵심 로직 (codex가 알아야 할 것)

### 3.1 결재 더미 데이터 `APPROVALS` (`index.html:3560`)

- 총 **23건**, 필드: `{ id(사고번호), task(추산|지급|종결|VOC), manager(담당자), status(상신중|결재완료), submittedAt(상신일 YYYY-MM-DD), completedAt(결재완료일, 상신중은 "") }`
- 분포: 추산 6 / 지급 7 / 종결 6 / VOC 4
- **CLAIMS와는 별도의 독립 배열**이다. 사고번호(id)는 CLAIMS와 일부 겹치지만 참조 관계는 없음(데모용).
- 향후 실제 연동 시: CLAIMS와 결합하거나 별도 결재 엔티티로 분리하는 설계가 필요.

### 3.2 결재 LIST 상태 변수 (`renderClosingView` 위쪽)

`apprQuery` / `apprStatus` / `apprFrom` / `apprTo` / `apprTask`(선택 Task, null=전체) / `apprBound`(툴바 이벤트 1회 바인딩 플래그)

### 3.3 필터 합성 규칙 (중요)

- `apprFilteredBase()` (`index.html:3599`): 검색 + 상태 + 기간 필터만 적용 (**Task 필터 제외**) → 카드 건수 산출용
- 목록 = `apprFilteredBase()` 결과에 **선택 Task 필터를 추가**로 적용
- 즉, 카드는 "각 Task의 현재 검색조건 건수"를, 목록은 "선택 Task로 좁힌 결과"를 보여줌
- 날짜 비교는 `YYYY-MM-DD` 문자열 사전식 비교(`<=`, `>=`)로 처리 (별도 Date 파싱 없음)

### 3.4 이벤트 바인딩 주의

- 툴바(검색창/셀렉트/날짜/초기화)는 정적 DOM이라 `bindApprToolbar()`에서 `apprBound` 플래그로 **1회만** 바인딩
- 카드·행은 매 렌더마다 새로 그려지므로 리스너를 매번 재부착 (중복 누적 없음)

### 3.5 CSS

- 결재 LIST 전용 스타일: `.appr-toolbar`, `.appr-field`, `.appr-cards`, `.appr-card(.active)`, `.appr-thead/.appr-row`
- 결재상태 뱃지: `.badge.appr-ing`(상신중/amber), `.badge.appr-done`(결재완료/green)
- 기존 `.closing-thead`/`.closing-row`/`.btn-cancel` CSS는 현재 **미사용**(잔존). 정리해도 무방.

---

## 4. 검증 기록

- `node --check`로 인라인 스크립트 JS 문법 통과
- 헤드리스 Chromium(Playwright)으로 결재 LIST 렌더링 확인:
  - 카드 건수: 추산 6 / 지급 7 / 종결 6 / VOC 4 (총 23)
  - 결재완료 + 기간(06/20~06/29) 필터 → 추산 2 / 지급 1 / 종결 2 / VOC 1
  - 종결 카드 클릭 → "종결 결재 건" 2건
  - 콘솔 에러 없음
- 로컬 확인 방법: `index.html`을 브라우저로 열고 좌측 네비 `결재 LIST` 클릭

---

## 5. 다음 작업 후보 (열린 항목)

우선순위 없이 나열. codex에서 이어갈 때 참고.

1. 결재 LIST 행 클릭 시 상세 패널/모달 (현재 행은 표시 전용, 클릭 동작 없음)
2. 결재 액션(상신 취소/반려/승인 등) 버튼 — 기존 "상신 취소" 기능이 결재LIST 개편으로 빠진 상태
3. `APPROVALS`를 CLAIMS와 연동하거나 실제 결재 엔티티로 재설계
4. Smart업무관리 우측 빠른처리 패널·대차 신청 모달의 `고객명` 표기 처리 방향 결정 (이번 세션 범위에서 제외함)
5. 미사용 CSS(`.closing-*`, `.btn-cancel`) 정리
6. PR #4 머지 여부 결정

---

## 6. 참고 문서

- 프로젝트 규칙: `AGENTS.md` (한국어 응답, 단일 HTML 유지, 외부 라이브러리 금지 등)
- 기획: `plan.md`, `docs/01-plan/features/`
- 설계: `docs/02-design/features/`
- 진행 상태: `docs/.pdca-status.json`
