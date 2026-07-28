# Claim ERP 화면 → Figma "화면 설명서"

`claim-erp-split/*.html` 화면들을 1440×900 뷰포트로 캡처하고, 각 UI 요소의 의미·동작 로직을
주석으로 얹은 Figma "화면 설명서"를 생성하는 파이프라인 산출물입니다.

**원본 HTML/JS는 수정하지 않았습니다(읽기 전용).**

## Figma 파일

- URL: https://www.figma.com/design/QeoPJl1IPQtNbCaKxW5uAC
- 프레임 구성: 화면당 프레임 1개(`{화면명} / 설명서`), 좌측에 캡처 배경(잠금),
  좌표 기반 번호 마커(①②③…), 우측에 번호별 설명 패널(요소명 / 역할 / 동작 / 조건·예외).
- 프레임은 캔버스에 가로로 나란히 배치.

### 현재 진행 상태 (중요)

| # | 화면 | 프레임 | 마커 | 배경 |
|---|------|:---:|:---:|:---:|
| 1 | 화면 선택(Hub) `index` | ✅ | 8 | ✅ |
| 2 | 미결일괄조회 `smart-claims` | ✅ | 17 | ✅ |
| 3 | 이미지시스템 `image-system` | ✅ | 9 | ✅ |
| 4 | 결재 LIST `approval-list` | ⏳ | 10 | ⏳ |
| 5 | 전결·순환배당 관리 `assignment-management` | ⏳ | 12 | ⏳ |
| 6 | 협력업체조회 `vendor-inquiry` | ⏳ | 21 | ⏳ |
| 7 | 협력업체 평가 `vendor-eval` | ⏳ | 12 | ⏳ |
| 8 | 메시지 발송 `message-send` | ⏳ | 9 | ⏳ |
| 9 | AI 통합대시보드 `ai-dashboard` | ⏳ | 12 | ⏳ |
| 10 | Smart업무처리 `smart-intake` | ⏳ | 37 | ⏳ |
| 11 | 미결일괄조회(시연) `smart-claims-demo` | ⏳ | 17 | ⏳ |

**⏳ 미완 사유:** Figma **Starter 플랜의 MCP tool-call 한도**에 도달하여 남은 8개 프레임을
Figma에 기록하지 못했습니다(코드/데이터 문제 아님). 한도가 초기화되거나 상위 플랜에서
아래 "남은 프레임 완성 방법"대로 이어서 생성하면 됩니다. 11개 화면의 캡처·좌표·설명 데이터는
모두 준비되어 있습니다.

## 산출물

- `*.png` — 화면별 full-page 캡처(1440 폭, deviceScaleFactor=1 → 좌표 1:1).
- `*.json` — DOM 파싱 결과. 상호작용 요소(button/a/input/select/onclick 등)의 표시 텍스트,
  id/class, 화면 좌표(x/y/w/h), 인라인 핸들러/함수명.
- `*.curated.json` — 마커용으로 정리한 대표 요소 집합(오프캔버스 사이드바 제외, 반복 요소는
  첫 항목만 대표로 유지).
- `annotations.js` — 화면·요소별 설명(역할/동작/조건·예외). 코드에서 확인한 내용 기준,
  추정은 `(추정)` 표기.
- `scripts/` — 재현용 스크립트(아래 파이프라인 참고).
- `b64/`, `build-*.json`, `figcode/`, `frameA/`, `frameOnly/`, `embed/` — Figma 기록용 중간
  산출물(남은 프레임 완성에 사용).

## 파이프라인 (scripts/)

의존성: `npm i`(playwright). 브라우저는 환경에 사전 설치된 Chromium 사용.

1. `node scripts/capture.js` — Playwright(headless)로 각 HTML을 1440×900로 열어 full-page PNG
   캡처 + DOM 상호작용 요소 추출 → `{화면명}.png`, `{화면명}.json`.
2. `node scripts/curate.js` — 요소를 대표 마커 집합으로 정리 → `{화면명}.curated.json`.
3. `node scripts/gendata.js` — 마커 좌표 + `annotations.js` 병합 → `build-data.json`.
4. `node scripts/compress.js` — 배경 캡처를 저용량 JPEG(base64)로 변환 → `b64/`.
   (Figma 업로드 엔드포인트가 이 환경의 egress 정책으로 차단되어, 이미지는 MCP 채널을 통해
   `figma.createImage(base64Decode(...))`로 삽입합니다. 그래서 저해상도 참조용 배경입니다.)
5. `node scripts/genfigcode.js` / `node scripts/genv2.js` — Figma `use_figma`용 코드 생성
   (`figcode/` = 단일 호출, `frameA/`+`embed/` = 2-chunk 안정 삽입).

## 남은 프레임 완성 방법

각 미완 화면(`approval-list`, `assignment-management`, `vendor-inquiry`, `vendor-eval`,
`message-send`, `ai-dashboard`, `smart-intake`, `smart-claims-demo`)에 대해:

1. `frameA/{화면명}.js` 실행 → 프레임+마커+설명패널 생성 및 배경 chunk A 저장(`storeOk:true` 확인).
2. `embed/{화면명}.b.js` 실행 → chunk B 이어붙여 배경 이미지 삽입·잠금(`jpegOk:true` 확인).

배경 없이 마커·설명만 필요하면 `frameOnly/{화면명}.js` 하나만 실행해도 됩니다.
대안: 프레임을 `frameOnly`로 만든 뒤, 고해상도 `*.png`를 각 배경 사각형에 직접 드롭해도
됩니다(사각형은 1440×페이지높이로 정확히 배치되어 있어 그대로 채워집니다).

## 코드만으로 판단이 안 된 항목 (추정 표기)

이벤트가 위임 핸들러/데이터 속성으로 연결되어 정확한 동작을 단정하기 어려운 항목들입니다.
설명 패널·`annotations.js`에서 `(추정)`으로 표기했습니다.

- **Smart업무처리**: ← 목록으로 / ↻ 재설정 / 미결속성 라디오 / 재통화 날짜 / 조치 체크박스 /
  속성 입력 필드(탁송 메모 등) / 지도에서 사고장소 검색 / 운전자 정보 조회 / 나이 필드 /
  직접입력 / 종결(종결 조건).
- **결재 LIST**: 결재 행 선택 체크박스.
- **전결·순환배당 관리**: 검색 버튼 / 담당자 행 선택·속성 체크박스.
- **협력업체조회**: 섹션별 저장 / 정보수정 / ＋행추가 / 선택·여부 체크박스 / 일괄적용 /
  비밀번호 입력 / 상신.
- **협력업체 평가**: ▲ 순서 이동.
- **AI 통합대시보드**: 이동 버튼(행 → data-move 대상).
- **미결일괄조회(시연)**: 반복 재생 체크박스.
