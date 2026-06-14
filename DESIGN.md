---
id: sk-claim-erp
name: SK렌탈 Claim ERP
country: KR
category: b2b-saas
homepage: ""
primary_color: "#2563EB"
ds:
  name: Claim ERP Design System
  type: internal
  description: SK렌탈 Claim Flow 관리 화면을 위한 B2B SaaS형 ERP 데자인 시스템. 신뢰감 있는 블루를 단일 포인트 컬러로 사용한다.
tokens:
  source: index.html-derived
  extracted: "2026-06-14"
  colors:
    bg: "#F6F8FB"
    card: "#FFFFFF"
    line: "#E6EAF2"
    line-strong: "#D4DAE6"
    text: "#1B2430"
    text-sub: "#5B6678"
    text-dim: "#8A94A6"
    blue: "#2563EB"
    blue-dark: "#1D4ED8"
    blue-soft: "#EFF6FF"
    blue-line: "#BFDBFE"
    red: "#DC2626"
    red-soft: "#FEE2E2"
    amber: "#B45309"
    amber-soft: "#FEF3C7"
    green: "#15803D"
    green-soft: "#DCFCE7"
  typography:
    family: { sans: "Pretendard", fallback: "Apple SD Gothic Neo, Malgun Gothic, Segoe UI, system-ui" }
    page-title:   { size: 24, weight: 800, lineHeight: 1.3, tracking: "-0.3px", use: "페이지 제목 (h1)" }
    section:      { size: 16, weight: 800, lineHeight: 1.4, use: "리스트/패널 섹션 헤더 (h2)" }
    flow-num:     { size: 24, weight: 800, lineHeight: 1, tracking: "-0.5px", use: "Flow 카드 미결 건수" }
    body:         { size: 14, weight: 400, lineHeight: 1.5, use: "기본 본문" }
    table:        { size: 12.5, weight: 400, lineHeight: 1.5, use: "리스트 테이블 셀" }
    label:        { size: 12, weight: 700, lineHeight: 1.4, use: "섹션 라벨, 탭 타이틀" }
    caption:      { size: 11.5, weight: 600, use: "뱃지, 메타데이터" }
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, section: 28 }
  rounded: { sm: 8, md: 10, card: 14, pill: 99 }
  shadow:
    card: "0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.06)"
    blue: "0 2px 8px rgba(37,99,235,.3)"
    toast: "0 8px 24px rgba(16,30,54,.3)"
  components:
    btn-primary:  { type: button, bg: "#2563EB", fg: "#ffffff", radius: "10px", font: "13px / 700", hover: "bg #1D4ED8", shadow: "0 2px 8px rgba(37,99,235,.3)", use: "주요 액션 (처리완료, 빠른 액션 대표)" }
    btn-neutral:  { type: button, bg: "#ffffff", fg: "#5B6678", border: "1px solid #D4DAE6", radius: "10px", hover: "border #2563EB, fg #2563EB, bg #EFF6FF", use: "보조 액션" }
    btn-alert:    { type: button, bg: "#FFF7F7", fg: "#DC2626", border: "1px solid #FCA5A5", radius: "10px", hover: "bg #FEE2E2", use: "관리자 확인/검토요청 등 주의 액션" }
    card:         { type: card, bg: "#ffffff", border: "1px solid #E6EAF2", radius: "14px", shadow: "0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.06)", use: "Flow 카드, 본문 3단 카드" }
    badge:        { type: badge, radius: "99px", font: "11.5px / 700", padding: "3px 9px", dot: "5px currentColor", use: "긴급도, 처리상태" }
    tab:          { type: tab, fg: "#5B6678", radius: "10px", active: "bg #EFF6FF fg #1D4ED8", count: "pill #EEF1F6", use: "좌측 조치유형 필터 탭" }
    input:        { type: input, bg: "#FBFCFE", fg: "#1B2430", border: "1px solid #D4DAE6", radius: "10px", focus: "2px solid #BFDBFE, border #2563EB, bg #fff", use: "처리 메모 textarea" }
    toast:        { type: toast, bg: "#1B2430", fg: "#ffffff", radius: "99px", use: "액션 완료 피드백" }
---

## 1. Visual Theme & Atmosphere

SK렌탈 Claim ERP는 자동차 렌탈사의 Claim(사고/수리/정산) 업무 흐름을 한 화면에서 관리하는 **B2B SaaS형 운영 대시보드**다. 화면은 옅은 청회색 캔버스(`#F6F8FB`) 위에 흰색 카드를 얹어, 정보 밀도가 높으면서도 복잡한 보험사 업무시스템처럼 보이지 않는 **정돈된 SaaS 느낌**을 목표로 한다.

핵심 사용자는 Claim 담당자, 운영 관리자, 신사업 영업직원, 고객사 임원이다. 따라서 실무 흐름(접수 → 입고/선견적 → 수리 승인 → 손해사정 → 지급/정산)은 그대로 유지하되, 임원과 영업직원이 한눈에 이해할 수 있도록 **시각적 위계를 단순하게** 유지한다.

포인트 컬러는 **신뢰감 있는 블루(`#2563EB`)** 하나로 통일한다. 블루는 선택 상태, 주요 CTA, 진행 단계 강조에만 쓰고, 나머지는 중립 회색 스케일로 처리해 화면이 차분하게 보이도록 한다. 긴급도와 상태 구분에만 빨강/주황/초록의 시맨틱 컬러를 절제해서 사용한다.

**Key Characteristics:**
- 단일 포인트 컬러 블루(`#2563EB`) — 선택·CTA·진행 강조에만 사용
- 옅은 청회색 배경(`#F6F8FB`) + 흰색 카드 + 부드러운 그림자로 SaaS 레이어링
- Pretendard 시스템 폰트 스택, 한국어 본문 가독성 우선
- 정보 밀도 높은 3단 워크스페이스(탭 / 리스트 / 빠른처리 패널)
- 시맨틱 컬러(빨강/주황/초록/회색)는 긴급도·처리상태에만 절제 사용
- 둥근 모서리: 카드 14px, 버튼/입력 10px, 뱃지/칩 99px(pill)
- 이모지 미사용, 인라인 SVG 아이콘만 사용

## 2. Color Palette & Roles

### Primary (Blue)
- **Point Blue** (`#2563EB`): 주요 CTA, 선택 상태, 활성 탭/카드, 진행 단계. 화면의 유일한 브랜드 액센트.
- **Deep Blue** (`#1D4ED8`): 버튼 hover/pressed, 활성 텍스트 강조.
- **Blue Soft** (`#EFF6FF`): 선택 행/탭 배경, 연한 강조 영역.
- **Blue Line** (`#BFDBFE`): 강조 영역 테두리, 포커스 링.

### Neutral Scale
- **Background** (`#F6F8FB`): 페이지 캔버스.
- **Card** (`#FFFFFF`): 카드/패널 표면.
- **Line** (`#E6EAF2`): 기본 구분선, 카드 테두리.
- **Line Strong** (`#D4DAE6`): 입력/버튼 테두리, 강한 구분선.
- **Text** (`#1B2430`): 제목·본문 기본 텍스트 (순흑 대신 따뜻한 근흑).
- **Text Sub** (`#5B6678`): 보조 텍스트, 버튼 라벨.
- **Text Dim** (`#8A94A6`): 캡션, 메타데이터, 비활성 라벨.

### Semantic (긴급도 · 상태)
- **Red** (`#DC2626`) / **Red Soft** (`#FEE2E2`): 긴급 뱃지, 위험 액션, 경과시간 경고.
- **Amber** (`#B45309`) / **Amber Soft** (`#FEF3C7`): 주의 뱃지, 보류 상태.
- **Green** (`#15803D`) / **Green Soft** (`#DCFCE7`): 정상 뱃지, 완료 상태, 권장 액션.
- **Slate** (`#475569` on `#F1F5F9`): 미처리 등 중립 상태 뱃지.

### 색상 사용 원칙
- 블루는 **한 화면에서 과하게 쓰지 않는다** — 선택/CTA/진행 강조에 한정.
- 긴급도·처리상태 색상은 **색상만으로 구분하지 않고 텍스트 라벨을 병기**한다(접근성).
- 순흑(`#000000`)을 텍스트에 쓰지 않고 `#1B2430`을 사용한다.

## 3. Typography Rules

### Font Family
- **Primary**: `"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", "Segoe UI", system-ui, -apple-system, sans-serif`
- 별도 브랜드 웹폰트를 임베드하지 않고 시스템 폰트 스택을 사용한다.
- 기본: 14px / line-height 1.5 / `-webkit-font-smoothing: antialiased`.

### Hierarchy

| Role | Size | Weight | 비고 |
|------|------|--------|------|
| Page Title (h1) | 24px | 800 | letter-spacing -0.3px, 페이지 제목 |
| Section (h2) | 16px | 800 | 리스트/패널 섹션 헤더 |
| Flow 미결 수 | 24px | 800 | letter-spacing -0.5px, line-height 1 |
| Body | 14px | 400 | 기본 본문 |
| Table cell | 12.5px | 400 | 리스트 테이블 |
| Label | 12px | 700 | 섹션 라벨/탭 타이틀, letter-spacing 0.3px |
| Caption / Badge | 11.5px | 600~700 | 뱃지, 메타데이터 |

### Principles
- 굵기는 **400 / 600 / 700 / 800** 위주로 사용한다. 제목·강조는 800.
- 숫자(사고번호, 경과시간 등)는 `font-variant-numeric: tabular-nums`로 정렬한다.
- 한 줄 유지가 필요한 셀은 `text-overflow: ellipsis`로 잘라낸다.

## 4. Component Stylings

### Buttons
**Primary (주요 CTA)** — 처리완료, 단계별 대표 액션
- 배경 `#2563EB`, 텍스트 `#ffffff`, radius 10px, font 13px/700
- shadow `0 2px 8px rgba(37,99,235,.3)`, hover 배경 `#1D4ED8`
- disabled: 배경 `#C9D4E8`, shadow 제거

**Neutral (보조)**
- 배경 `#ffffff`, 텍스트 `#5B6678`, 1px `#D4DAE6` 테두리, radius 10px
- hover: 테두리·텍스트 `#2563EB`, 배경 `#EFF6FF`

**Alert (주의 액션)** — 관리자 확인/검토요청 등
- 배경 `#FFF7F7`, 텍스트 `#DC2626`, 1px `#FCA5A5` 테두리
- hover: 배경 `#FEE2E2`, 테두리 `#DC2626`

**Pill 버튼** — 전체보기 등 필터형
- radius 99px, font 12.5px/700. active: 배경 `#2563EB`, 텍스트 흰색.

### Cards & Containers
- 배경 `#ffffff`, 1~1.5px `#E6EAF2` 테두리, radius **14px**
- shadow `0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.06)`
- Flow 카드 active: 테두리 `#2563EB`, 배경 `linear-gradient(180deg,#EFF6FF,#fff 70%)`
- 병목 카드: 상단 우측 "병목" 빨강 pill 라벨 + `#FCA5A5` 테두리

### Badges (긴급도 · 처리상태)
- 인라인 flex, 앞에 5px `currentColor` 점(dot), radius 99px, font 11.5px/700, padding 3px 9px
- 긴급(`u-urgent`): `#FEE2E2`/`#DC2626` · 주의(`u-warn`): `#FEF3C7`/`#B45309` · 정상(`u-normal`): `#DCFCE7`/`#15803D`
- 미처리(`s-todo`): `#F1F5F9`/`#475569` · 처리중(`s-doing`): `#EFF6FF`/`#2563EB` · 완료(`s-done`): 초록 · 보류(`s-hold`): 주황

### Tabs (좌측 조치유형 필터)
- 기본: 투명 배경, 텍스트 `#5B6678`, radius 10px, hover 배경 `#F2F5FA`
- active: 배경 `#EFF6FF`, 텍스트 `#1D4ED8`
- 카운트 pill: 배경 `#EEF1F6`(active 시 `#2563EB`/흰색)

### Inputs (처리 메모)
- 배경 `#FBFCFE`, 1px `#D4DAE6` 테두리, radius 10px
- focus: `outline: 2px solid #BFDBFE`, 테두리 `#2563EB`, 배경 `#fff`

### Toast
- 배경 `#1B2430`, 텍스트 흰색 13.5px/600, radius 99px, shadow `0 8px 24px rgba(16,30,54,.3)`
- 화면 하단 중앙, 체크 SVG 아이콘 + 메시지, 2.6초 후 자동 소멸

## 5. Layout Principles

### 전체 구조
- **상단 글로벌 바**(56px, sticky): 브랜드 + 사용자 칩
- **페이지 헤드**: h1 제목 + 보조 설명
- **업무 Flow 카드 행**: 5단계 카드 가로 배치 + 화살표 연결
- **보조 성과 지표 라인**: 작은 글씨 KPI (강조하지 않음)
- **워크스페이스 3단 그리드**: `216px / minmax(0,1fr) / 366px`
  - 좌: 조치유형 탭 (sticky) · 중앙: Claim 리스트 · 우: 빠른 처리 패널 (sticky)

### Spacing
- 컨테이너 max-width **1680px**, 좌우 패딩 28px
- 카드 간 gap 16px, 카드 내부 패딩 14~20px
- 주 간격 단위: 4 / 8 / 12 / 16 / 20 / 24 / 28px

### Border Radius
- 카드/패널: 14px · 버튼·입력·탭: 10px · 작은 라벨: 6~8px · 뱃지·칩·pill 버튼: 99px

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | 그림자 없음 | 배경, 인라인 요소 |
| Card | `0 1px 2px rgba(16,30,54,.04), 0 6px 20px rgba(16,30,54,.06)` | 카드, 패널 |
| Blue lift | `0 2px 8px rgba(37,99,235,.3)` | 활성 Primary 버튼, 선택 Flow 카드 |
| Toast | `0 8px 24px rgba(16,30,54,.3)` | 토스트, 툴팁 |

그림자는 청회색 톤(`rgba(16,30,54,...)`)으로 통일해 배경과 자연스럽게 어울리게 한다. hover 시 카드는 `translateY(-2px)`로 가볍게 들어올린다.

## 7. Do's and Don'ts

### Do
- 블루(`#2563EB`)는 선택·CTA·진행 강조에만 사용한다.
- 긴급도·처리상태는 색상과 텍스트 라벨을 함께 제공한다.
- 카드 14px / 버튼·입력 10px / 뱃지 99px 라운드를 일관되게 적용한다.
- 숫자 데이터에 `tabular-nums`를 적용한다.
- 그림자는 청회색 톤으로 통일한다.

### Don't
- 블루를 배경·테두리에 남발하지 않는다(차분함 유지).
- 보조 KPI 지표를 과하게 강조하지 않는다.
- 순흑(`#000000`) 텍스트를 쓰지 않는다 — `#1B2430` 사용.
- 이모지를 UI에 쓰지 않는다 — 인라인 SVG 아이콘만.
- 한 화면에 경쟁하는 Primary 버튼을 여러 개 두지 않는다.

## 8. Responsive Behavior

| Breakpoint | 주요 변화 |
|------|------|
| ~1440px | 테이블 컬럼·폰트 축소, Flow 카드 텍스트 축소 |
| ~1220px | 워크스페이스 2단(탭+리스트), 빠른처리 패널 하단 풀폭 이동 |
| ~980px | Flow 카드 2열 wrap·화살표 숨김, 1단 세로 스택, sticky 해제 |

- 좌측 탭/우측 패널은 데스크톱에서 `top:76px` sticky, 좁아지면 static으로 전환한다.
- 테이블은 grid-template-columns로 컬럼 폭을 단계적으로 축소한다.

## 9. Agent Prompt Guide

### Quick Color Reference
- 포인트 블루: `#2563EB` / hover: `#1D4ED8` / 연한 배경: `#EFF6FF` / 테두리: `#BFDBFE`
- 배경: `#F6F8FB` / 카드: `#FFFFFF` / 구분선: `#E6EAF2`
- 제목 텍스트: `#1B2430` / 보조: `#5B6678` / 캡션: `#8A94A6`
- 긴급 빨강: `#DC2626` / 주의 주황: `#B45309` / 정상 초록: `#15803D`

### Example Component Prompts
- "Flow 카드: 흰색 배경, 1.5px `#E6EAF2` 테두리, 14px radius, 카드 그림자. 좌상단 번호 칩(20px, `#EEF1F6`) + 단계명 14px/800. 미결 건수 24px/800. hover 시 translateY(-2px)."
- "Primary 버튼: `#2563EB` 배경, 흰 텍스트 13px/700, 10px radius, `0 2px 8px rgba(37,99,235,.3)` 그림자. hover `#1D4ED8`."
- "긴급도 뱃지: 앞에 5px 점, 99px radius, 11.5px/700. 긴급=`#FEE2E2`/`#DC2626`, 주의=`#FEF3C7`/`#B45309`, 정상=`#DCFCE7`/`#15803D`."
- "토스트: `#1B2430` 배경, 흰 텍스트 13.5px/600, 99px radius, 하단 중앙, 체크 SVG 아이콘 동반, 2.6초 자동 소멸."

### Iteration Guide
1. 포인트 컬러는 블루 `#2563EB` 하나 — 보조 브랜드 색 없음.
2. 배경은 `#F6F8FB`, 카드는 흰색 + 청회색 그림자.
3. 라운드 기본값: 카드 14px, 버튼/입력 10px, 뱃지 99px.
4. 제목 `#1B2430`, 본문 `#5B6678`, 캡션 `#8A94A6`.
5. 시맨틱 컬러는 긴급도·상태에만, 텍스트 라벨과 병기.
6. 데스크톱 우선(1680px) → 1220px → 980px 단계 축소.
7. Pretendard 시스템 폰트 — 별도 웹폰트 임베드 금지.

---

## 10. Iconography & SVG Guidelines

- 모든 아이콘은 **인라인 SVG**로 작성한다(`<img>` 금지). `stroke="currentColor"`, `fill="none"` 기본.
- stroke-width 2~2.5px, `stroke-linecap/linejoin: round`로 통일한다.
- 아이콘 크기: 인라인 15~16px, 화살표 16px, 토스트 체크 10px.
- 색상은 부모로부터 상속(`currentColor`)받아 하드코딩하지 않는다.

## 11. Document Policies

### No Emojis
UI·라벨·상태 표시·문서 어디에도 이모지를 사용하지 않는다. 상태는 색상 점(dot)/뱃지/SVG 아이콘으로 표현한다.

### 출처
이 문서의 모든 토큰은 실제 구현물 `index.html`의 `:root` 변수와 컴포넌트 스타일, 그리고 `plan.md` 13장(디자인 방향) 및 PDCA 설계서(`docs/archive/.../SK렌탈 Claim Flow 관리.design.md`)에서 도출했다.

**Derived:** 2026-06-14 (index.html `:root` 토큰 기준)
**기준 문서:** `plan.md` §13 디자인 방향, `docs/archive/2026-06/SK렌탈 Claim Flow 관리/SK렌탈 Claim Flow 관리.design.md`
