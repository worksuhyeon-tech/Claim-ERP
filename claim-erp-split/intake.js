"use strict";
const activeView = "intake";

let intakeClaimId = null;   // Smart업무처리에 바인딩된 사고건
let intakeTab = "contract"; // "contract"(계약·사고정보) | "damage"(피해 진행정보) | "estimate"(청구 견적 정보)
let estimateDocType = "claim"; // 청구 견적 문서 전환: "pre"(선견적) | "claim"(청구서)
const intakeCloseType = {};    // 사고번호별 종결 구분: "면책" | "지급" (기본 지급)

// 진행 메모 '구분' = 진행 이력 채널 분류 (라디오 필터와 동일 값)
const INTAKE_MEMO_TYPES = ["피보/운전", "정비공장", "타사담당자", "담당자", "콜센터"];
// 미결 속성 — 항목별 부가 입력필드(date/text) 정의
const INTAKE_ATTRS = [
  { key: "재통화", field: "date", ph: "재통화 예정일" },
  { key: "VOC",   field: null },
  { key: "탁송",  field: "text", ph: "탁송 메모 (최대 20자)" },
  { key: "렌트",  field: "text", ph: "렌트 메모 (최대 20자)" },
  { key: "기타",  field: "text", ph: "기타 메모 (최대 20자)" },
];
const INTAKE_ATTR_KEYS = INTAKE_ATTRS.map(a => a.key);
let intakeLogFilter = "전체";   // 진행 이력 채널(구분) 필터
// Smart업무처리 조회구분 (참조: reference/조회구분값.png)
const INTAKE_QUERY_TYPES = ["사고번호", "차량번호", "피해차량번호", "피보험자 휴대폰", "통보자 휴대폰", "피해자 휴대폰", "운전자 휴대폰", "소유자 휴대폰"];
let intakeQueryType = INTAKE_QUERY_TYPES[0];

// 사고 접수 목록 상태 (차량번호·휴대폰 조회 시 동일 차량의 여러 접수건 표시)
let intakeResults = null;   // 조회된 사고 접수건 id 배열
let intakeListPage = 0;     // 목록 페이지 (3줄/페이지)
const INTAKE_LIST_SIZE = 3;

/* 동일 차량 다건 접수 데모 — 이 화면(접수지)에서만 사용.
   · 6번(23허6789): 부모 포함 2건 모두 진행중
   · 11번(22하9900): 부모 포함 서로 다른 접수번호 5건 (과거건 포함) */
(function seedIntakeSiblings() {
  if (typeof CLAIMS === "undefined") return;
  const addSiblings = (parentId, extras) => {
    const parent = CLAIMS.find(c => c.id === parentId);
    if (!parent) return;
    extras.forEach(ex => {
      if (CLAIMS.some(c => c.id === ex.id)) return;
      const sib = Object.assign({}, parent, ex);  // car·carModel·name·custType 등 동일 차량 승계
      delete sib.work; delete sib.reviewState; delete sib.submitState; // 단계에 맞게 재도출
      CLAIMS.push(sib);
    });
  };
  addSiblings("CLM-2026-0006", [
    { id:"CLM-2026-0043", flowStage:"손해사정", procStatus:"처리중", urgency:"주의",
      actionType:"업체 미회신", status:"AOS 청구 수신 대기", elapsed:"4시간 10분", manager:"유나래",
      actionDesc:"동일 차량 별건 사고 — 공업사 청구서 수신 대기 중",
      nextAction:"공업사에 청구 등록을 요청하세요." },
  ]);
  addSiblings("CLM-2026-0011", [
    { id:"CLM-2026-0044", flowStage:"지급 / 정산", procStatus:"완료", urgency:"정상",
      actionType:"정산 완료", status:"정산 종결", elapsed:"종결", manager:"유나래",
      actionDesc:"과거 사고건 — 정산 종결 완료", nextAction:"-" },
    { id:"CLM-2026-0045", flowStage:"손해사정", procStatus:"완료", urgency:"정상",
      actionType:"계약 조사", status:"손해사정 종결", elapsed:"종결", manager:"최도윤",
      actionDesc:"과거 사고건 — 손해사정 종결", nextAction:"-" },
    { id:"CLM-2026-0046", flowStage:"수리 승인", procStatus:"처리중", urgency:"정상",
      actionType:"업체 미회신", status:"공업사 수리 오더 대기", elapsed:"6시간", manager:"유나래",
      actionDesc:"동일 차량 별건 사고 — 수리 진행 중",
      nextAction:"공업사에 수리 오더 확인을 요청하세요." },
    { id:"CLM-2026-0047", flowStage:"접수·선견적", procStatus:"미처리", urgency:"주의",
      actionType:"고객 미응답", status:"사고정보 확인", elapsed:"1시간 30분", manager:"박지현",
      actionDesc:"동일 차량 신규 접수 — 사고경위 확인 요청 후 미응답",
      nextAction:"고객 전화로 사고경위를 확인하세요." },
  ]);
})();

const intakeProgressLogs = {
  "CLM-2026-0004": [
    { at:"06.18 09:12", type:"피보/운전", text:"운전자 통화 완료. 사고 경위와 입고 희망 공업사 확인." },
    { at:"06.18 10:05", type:"정비공장", text:"탑모터스 입고 가능 여부 확인, 선견적 회신 대기." },
    { at:"06.18 11:20", type:"담당자", text:"피해담당자와 로그 기준 사고 내용 상이. 추가 확인 필요." },
  ],
};
const intakePropertyState = {
  "CLM-2026-0004": {
    attrs:["재통화", "VOC"],
    note:"피해담당자와 로그의 사고내용이 서로 다름",
  },
};
// 사고번호별 담당자 입력 파손부위 (차량 부위 손상 · 담당자 대조용, 클릭 선택)
const intakeStaffParts = {};
// 사고번호별 접수지 저장 여부 — 저장해야 추산 등록·종결 가능
const intakeSaved = {};

const CLAIM_CHIP_KEYS = ["정비", "부품", "유리", "실런트", "운반", "기타", "렌트", "교통"];
const CHIP_STATE_TEXT = { none:"미청구", recv:"청구접수", review:"검토", done:"완료" };
// 차량 부위 손상 체크 목록
const PART_LIST = ["앞범퍼","헤드램프L","헤드램프R","본네트","앞휀다L","앞휀다R","사이드미러L","사이드미러R",
  "앞도어L","앞도어R","루프","사이드스텝L","사이드스텝R","뒤도어L","뒤도어R","트렁크","테일램프L","테일램프R",
  "뒤범퍼","앞휠L","앞휠R","뒤휠L","뒤휠R","기타"];
// 차량 상면도(도식) — 부위 체크 옆 참고용
const CAR_DIAGRAM_SVG = `<svg viewBox="0 0 120 220" fill="none" stroke="#9AA6B8" stroke-width="2">
  <rect x="24" y="10" width="72" height="200" rx="26" fill="#EEF2F8"/>
  <rect x="34" y="40" width="52" height="38" rx="10" fill="#DCE4F0"/>
  <rect x="34" y="142" width="52" height="38" rx="10" fill="#DCE4F0"/>
  <rect x="14" y="70" width="10" height="26" rx="4" fill="#CBD5E6"/>
  <rect x="96" y="70" width="10" height="26" rx="4" fill="#CBD5E6"/>
  <rect x="14" y="128" width="10" height="26" rx="4" fill="#CBD5E6"/>
  <rect x="96" y="128" width="10" height="26" rx="4" fill="#CBD5E6"/>
  <text x="60" y="27" text-anchor="middle" font-size="9" fill="#8A94A6" stroke="none">앞</text>
  <text x="60" y="204" text-anchor="middle" font-size="9" fill="#8A94A6" stroke="none">뒤</text>
</svg>`;

// 섹션별 mock — CLM-2026-0004만 풀데이터(참조 이미지 기반), 나머지는 defaultDetail에서 경량 파생
const INTAKE_DETAIL = {
  "CLM-2026-0004": {
    regDate:"2021-06-28", displacement:"1999cc (승용 1901~2000)",
    estimate:"15,420,000원", inDate:"2026-05-19", outDate:"2026-05-26",
    damageManager:"이다희", reviewReply:"회신완료",
    chips:{ 정비:"done", 부품:"done", 유리:"none", 실런트:"review", 운반:"recv", 기타:"none", 렌트:"none", 교통:"none" },
    unresolved:["재통화", "VOC"],
    parties:{
      driver:{ name:"서명희", birth:"64****-2 (만61세)", phone:"010-5065-2187", license:"2종보통 / 유효", rel:"피보험자 본인" },
      owner:{ name:"서명희", phone:"010-5065-2187" },
      insured:{ name:"서명희", phone:"010-5065-2187" },
      notifier:{ name:"정문수", rel:"자녀", phone:"010-4772-0511" },
    },
    accident:{ datetime:"2026-05-18 18:00", place:"충남 천안시 서북구 성거읍 삼곡리", placeDetail:"삼거리 부근",
      content:"자차 차선 변경 중 대차와 충돌, 육안상 경미, 조)앞범퍼 손상", note:"블랙박스 요금 가입건", task:"사고조사 활용", police:"미신고", otherDrive:"해당없음" },
    dispatch:{ manager:"-", driver:"서명희", majorAcc:"//", content:"-", delivery:"-",
      etc:["입고공장 미정","견인 미실시","렌트 미사용","블랙박스 N","영상등재 無"] },
    liability:{ driveLimit:"만48세이상 / 기명1인", ageLimit:"만48세이상", selfPay:"20% / 20만~50만원", propertySurcharge:"물적할증 200만원" },
    ownDamage:{ joined:"가입(Y)", faultRate:"자차 0% (미확정)" },
    insuredCar:{ kind:"승용(1901~2000cc)", code:"61T11 (2021년)", priceAB:"17,180,000 (사고시 15,666,000)",
      totalJoin:"17,180,000 (일부보험 100%)", addCover:"부속B 270,000", detail:"블랙박스",
      special:"차량단독사고보상 / 애니카서비스 / 시니어홀케어특약 / 다른자동차운전담보특약 III / 긴급견인서비스 확대 외" },
    contract:{ propertyDuty:"2025-07-25~2026-07-25 (정상) 20,000,000", propertyAny:"2025-07-25~2026-07-25 (정상) 980,000,000",
      carPeriod:"2025-07-25~2026-07-25 (정상) 17,180,000", threeYear:"1회", discount:"11Z", insType:"애니카다이렉트_개인용",
      joinCover:"인 I·II 물 I·II 상 무 차", change:"1건", premium:"1,208,120 (영수일 2025-06-17)",
      contractor:"서명희 / 64****-2 / 010-5065-2187", rc:"자동차다이렉트영업부 1577-7233" },
    damage:{ info:"-", transport:"청구없음", rentClaim:"미청구", vatTarget:"해당없음", custInfo:"-" },
    repair:{ shop:"[A] 탑모터스 041-558-9432 (우수)", period:"입고 2026-05-19 ~ 출고 2026-05-26 (7일)",
      accAmount:"15,420,000 (추가담보 270,000)", paySpecial:"-", estimatePay:"추산 0 / 지급 2,898,420",
      payResource:"정비, 부품", closeDate:"2026-05-22" },
    guideRows:[
      { label:"피보/운전", cells:{ 개인정보:"done", 사고접수:"done", 안심콜:"call", 과실안내:"done", 진행안내:"done", 보험금:"done", 종결:"done" } },
      { label:"자차1", cells:{ 개인정보:"done", 사고접수:"done", 안심콜:"call", 과실안내:"done", 진행안내:"done", 보험금:"done", 종결:"done" } },
    ],
    handlers:{ propertyAcc:"이다희 / 대물보상2 SAC / 010-2078-4645", personAcc:"해당없음", propertyTotal:"자차 1건", personTotal:"-" },
    damageList:[
      { cover:"차량", seq:"001", payAmount:"2,898,420", progress:"종결", ownerPhone:"서명희 010-5065-2187",
        handler:"대물보상2 SAC 이다희 010-2078-4645", assignDate:"2026-05-19", receiptDate:"2026-05-18" },
    ],
    parts:{ checked:["앞범퍼","헤드램프L","앞휀다L","사이드스텝L"] },
    // ※ 0004는 '접수·선견적' 단계 → 청구 견적 정보 없음 (estimateDoc 미보유)
  },
};

// 견적 라인 1건 생성 — adj 미지정 시 손해사정=청구내역 그대로 인정
function estRow(g, n, it, unit, amount, adj) {
  const base = { unit, amount };
  let adjust;
  if (!adj) adjust = { denied:false, unit, amount };
  else if (adj.denied) adjust = { denied:true, unit:0, amount:0 };
  else adjust = { denied:false, unit:(adj.unit ?? unit), amount:(adj.amount ?? amount) };
  return { g, n, it, base, adjust };
}

/* ===== 접수지 상세 자동 생성용 데이터 풀 (사고번호 시드 기반 → 렌더마다 동일 결과) ===== */
const GEN_NAMES = ["김서준","이도현","박하준","최지우","정예은","한서윤","오지호","임하은","윤도윤","강시우","조은서","신유진","권민재","황서아","안하율","송지안","배준서","문가온"];
const GEN_PLACES = [
  ["서울 강남구 테헤란로", "사거리 부근"],
  ["경기 성남시 분당구 판교로", "지하주차장 입구"],
  ["인천 남동구 논현동", "이면도로 진입 중"],
  ["충남 천안시 서북구 성거읍", "삼거리 부근"],
  ["부산 해운대구 센텀중앙로", "교차로 진입 중"],
  ["대전 유성구 대학로", "신호 대기 중"],
  ["경기 수원시 영통구 광교로", "주차장 진출입로"],
  ["광주 서구 상무대로", "우회전 구간"],
  ["대구 수성구 달구벌대로", "정체 구간"],
];
const GEN_ACC_CONTENT = [
  "차선 변경 중 후측방 차량과 접촉, 육안상 경미, 조)우측 도어 손상",
  "신호 대기 중 후미 추돌, 조)뒤범퍼·트렁크 손상",
  "주차 중 구조물 접촉, 조)앞범퍼·헤드램프 손상",
  "교차로 진입 중 측면 충돌, 조)좌측 펜더 손상",
  "후진 중 벽면 접촉, 조)뒤범퍼 긁힘",
  "빗길 미끄러짐으로 가드레일 접촉, 조)좌측 패널 전반 손상",
];
const GEN_LICENSE = ["1종보통 / 유효", "2종보통 / 유효", "1종대형 / 유효", "2종소형 / 유효"];
const GEN_REL = ["피보험자 본인", "배우자", "자녀", "형제/친인척", "지정운전자"];
const GEN_SPECIAL = [
  "차량단독사고보상 / 애니카서비스 / 다른자동차운전담보특약 III / 긴급견인서비스 확대",
  "대물확장 / 자녀할인 / 마일리지특약 / 블랙박스할인",
  "무사고할인 / 애니카서비스 / 긴급출동 확대 / 형사합의금지원",
  "차량단독사고보상 / 다른자동차운전담보특약 / 대인확장 / 자기신체사고 확대",
];
const GEN_INS_TYPE = ["애니카다이렉트_개인용", "다이렉트_업무용", "법인종합_플릿", "개인용자동차보험"];
// 차종별 배기량/차종구분/차량가액(만원) — 접수 데이터에 상세가 없어 모델 기준 배정
const MODEL_SPEC = {
  "쏘나타":{ cc:1999, kind:"승용 중형(1901~2000cc)", price:2380 },
  "아반떼":{ cc:1598, kind:"승용 준중형(1501~1600cc)", price:1920 },
  "그랜저":{ cc:2497, kind:"승용 대형(2401~2500cc)", price:3650 },
  "K5":{ cc:1999, kind:"승용 중형(1901~2000cc)", price:2540 },
  "스포티지":{ cc:1598, kind:"SUV 준중형(1501~1600cc)", price:2780 },
  "싼타페":{ cc:2151, kind:"SUV 중형(2101~2200cc)", price:3520 },
  "쏘렌토":{ cc:2151, kind:"SUV 중형(2101~2200cc)", price:3680 },
  "셀토스":{ cc:1598, kind:"SUV 소형(1501~1600cc)", price:2210 },
  "G80":{ cc:2497, kind:"승용 대형(2401~2500cc)", price:6240 },
  "레이":{ cc:998, kind:"경형 승용(1000cc 이하)", price:1480 },
  "캐스퍼":{ cc:998, kind:"경형 SUV(1000cc 이하)", price:1620 },
  "투싼":{ cc:1598, kind:"SUV 준중형(1501~1600cc)", price:2760 },
  "카니발":{ cc:2199, kind:"승합 대형(2101~2200cc)", price:3820 },
  "모닝":{ cc:998, kind:"경형 승용(1000cc 이하)", price:1290 },
};
// 견적 라인 풀 — [작업구분, 작업내용, 작업항목, 단위(공임지수), 금액]
const EST_LINE_POOL = [
  ["부수작업","프론트도어트림(좌)","탈착",0.36,13340],
  ["부수작업","프론트도어모듈판넬(좌)","탈착",0.49,18150],
  ["부수작업","리어도어트림(우)","탈착",0.34,12600],
  ["부수작업","콤비네이션램프(좌)","탈착",0.22,8140],
  ["부수작업","라디에이터그릴","탈착",0.28,10360],
  ["부수작업","프론트도어글래스(좌)","탈착",0.57,21120],
  ["주작업","프론트범퍼 교환 3 코트","교환도장",2.01,140370],
  ["주작업","프론트펜더(좌) 교환 3 코트","교환도장",2.18,142370],
  ["주작업","본넷 교환 3 코트","교환도장",2.40,158000],
  ["주작업","프론트도어(좌) 교환 3 코트","교환도장",2.60,168000],
  ["주작업","리어도어(우) 판금 3 코트","판금부분도장",2.20,132000],
  ["주작업","트렁크리드 교환 3 코트","교환도장",2.30,150000],
  ["주작업","쿼터패널(우) 표면보수","판금부분도장",1.90,118500],
  ["주작업","사이드실패널(좌) 표면보수","판금부분도장",1.60,99000],
  ["주작업","엔진룸 1/4 표면보수 3 코트","판금부분도장",1.30,84370],
  ["주작업","컬러매칭 3 코트","도장",1.90,89300],
  ["주작업","가열건조비","도장계산",1,15869],
  ["추가공임","휠하우스 인너 방청","방청",0,21500],
  ["추가공임","언더코팅 보수","방청",0,18000],
  ["추가부품","프론트범퍼 커버","52910",1,138000],
  ["추가부품","헤드램프 어셈블리(좌)","92101",1,286000],
  ["추가부품","본넷 판넬","66400",1,312000],
  ["추가부품","프론트펜더 판넬(좌)","66321",1,132000],
  ["추가부품","도어미러(좌)","87610",1,164000],
  ["추가부품","TPMS 고무밸브","00001",1,7000],
];
const EST_GROUP_ORDER = { "부수작업":0, "주작업":1, "추가공임":2, "추가부품":3 };

// 결정론적 난수 (mulberry32) — 동일 시드는 항상 동일 시퀀스 → 렌더마다 결과 고정
function genRand(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededPicker(id) {
  const n = parseInt((id.replace(/\D/g, "").slice(-4) || "1"), 10) || 1;
  const r = genRand(n * 1103515245 + 12345);
  return {
    int:(min, max) => min + Math.floor(r() * (max - min + 1)),
    pick:(arr) => arr[Math.floor(r() * arr.length)],
    chance:(prob) => r() < prob,
  };
}
function pad2(n) { return String(n).padStart(2, "0"); }
function addDays(iso, days) {
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}
function genPhone(p) { return `010-${p.int(2000, 9999)}-${p.int(1000, 9999)}`; }
function genBirth(p) { const by = p.int(1965, 1999); return `${String(by).slice(2)}****-${p.pick(["1","2"])} (만${2026 - by}세)`; }
function workChip(v) { return v === "완료" ? "done" : v === "요청" ? "review" : (v === "대여" || v === "반납") ? "recv" : "none"; }

// 견적 문서 생성 — 선견적(개략, 부분) + 청구서(정식) + 손해사정 조정 반영
function genEstimateDoc(p, shopShort, idx, done) {
  const pool = EST_LINE_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = p.int(0, i); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  const count = p.int(8, 14);
  const picked = pool.slice(0, count).sort((a, b) => EST_GROUP_ORDER[a[0]] - EST_GROUP_ORDER[b[0]]);
  const claim = picked.map((t, i) => {
    let adj = null;
    if (i === picked.length - 1 && p.chance(0.5)) adj = { denied:true };            // 마지막 추가부품 불인
    else if (i === 1 && p.chance(0.4)) adj = { amount: Math.round(t[4] * 0.85 / 10) * 10 }; // 감액 조정
    return estRow(t[0], t[1], t[2], t[3], t[4], adj);
  });
  const preCount = Math.max(4, Math.floor(count / 2));
  const pre = picked.slice(0, preCount).map(t => estRow(t[0], t[1], t[2], t[3], Math.round(t[4] * 1.05 / 100) * 100));
  const paid = claim.reduce((s, r) => s + r.adjust.amount, 0);
  return { payTo:shopShort, paidAmount: idx >= 2 ? paid : 0, finalPaid: idx === 3 && done, pre, claim };
}

// 기본 상세 — CLM-2026-0004 외 사고건은 사고번호 시드로 리치 가상 데이터 자동 생성
function defaultDetail(c, w) {
  const p = seededPicker(c.id);
  const model = c.carModel, no = c.car;
  const idx = STAGES.indexOf(c.flowStage);   // 0 접수·선견적 → 3 지급/정산
  const done = c.procStatus === "완료";
  const spec = MODEL_SPEC[model] || { cc:1598, kind:"승용", price:2000 };

  const driverPhone = genPhone(p);
  const rel = p.pick(GEN_REL);
  const selfDriving = rel === "피보험자 본인";
  const notifierName = selfDriving ? p.pick(GEN_NAMES) : c.name;
  const notifierPhone = selfDriving ? genPhone(p) : driverPhone;
  const place = p.pick(GEN_PLACES);
  const accDate = `2026-${pad2(p.int(4, 6))}-${pad2(p.int(1, 26))}`;
  const accTime = `${pad2(p.int(8, 20))}:${p.pick(["00","10","20","30","40","50"])}`;
  const inDate = idx >= 1 ? addDays(accDate, p.int(1, 3)) : "-";
  const repairDays = p.int(3, 9);
  const outDate = (idx >= 2 && inDate !== "-") ? addDays(inDate, repairDays) : "-";
  const regYear = p.int(2019, 2024);
  const shopShort = (c.repairShop || "").split(" ")[0] || "-";
  const shopPhone = `0${p.int(2, 64)}-${p.int(200, 999)}-${p.int(1000, 9999)}`;
  const grade = p.pick(["우수","일반","우수","협력"]);

  // 접수·선견적(idx 0) 단계는 아직 견적/청구 문서 수신 전 → 청구 견적 정보 미생성
  const est = idx >= 1 ? genEstimateDoc(p, shopShort, idx, done) : null;
  const claimTotal = est ? est.claim.reduce((s, r) => s + r.base.amount, 0) : 0;
  const preTotal = est ? est.pre.reduce((s, r) => s + r.base.amount, 0) : 0;

  const handlerName = p.pick(GEN_NAMES);
  const handlerPhone = genPhone(p);
  // 과실율은 자차 과실율만 표기 — 손해사정(idx>=2) 이후 확정, 이전은 미확정
  const selfFaultPct = p.pick([0, 0, 20, 30, 50, 70, 100]);
  const faultText = `자차 ${selfFaultPct}% (${idx >= 2 ? "확정" : "미확정"})`;

  const guideCols = ["개인정보","사고접수","안심콜","과실안내","진행안내","보험금","종결","분심위","소송안내","정보요청","구상","기타"];
  const doneCols = Math.min(7, 3 + idx + (done ? 1 : 0));
  const cells = {};
  guideCols.slice(0, doneCols).forEach(col => { cells[col] = col === "안심콜" ? "call" : "done"; });

  const at = c.actionType || "";
  const unresolved = /미응답|연락요청/.test(at) ? ["재통화"] : /VOC/.test(at) ? ["VOC"] : [];

  return {
    fault: faultText,
    regDate: `${regYear}-${pad2(p.int(1, 12))}-${pad2(p.int(1, 28))}`,
    displacement: `${spec.cc}cc (${spec.kind})`,
    estimate: idx >= 2 ? won(claimTotal) + "원" : "-",
    inDate, outDate,
    accidentManager: c.manager,
    damageManager: idx >= 2 ? handlerName : "-",
    reviewReply: idx >= 2 ? "회신완료" : idx >= 1 ? "회신중" : "미회신",
    chips:{
      정비: workChip(w.repair), 부품: workChip(w.part), 유리: workChip(w.glass),
      실런트: workChip(w.sealant), 렌트: workChip(w.rent),
      운반: p.chance(0.3) ? "recv" : "none", 교통:"none", 기타:"none", 복구:"none",
    },
    unresolved,
    parties:{
      driver:{ name:c.name, birth:genBirth(p), phone:driverPhone, license:p.pick(GEN_LICENSE), rel },
      owner:{ name:c.name, phone:driverPhone },
      insured:{ name:c.name, phone:driverPhone },
      notifier:{ name:notifierName, rel: selfDriving ? p.pick(["자녀","배우자","지인"]) : "본인", phone:notifierPhone },
    },
    accident:{
      datetime:`${accDate} ${accTime}`, place:place[0], placeDetail:place[1],
      content:p.pick(GEN_ACC_CONTENT),
      note:p.pick(["블랙박스 영상 확보","특이사항 없음","현장출동 사진 등재","상대차 연락처 확보"]),
      task:"사고조사 활용", police:p.pick(["미신고","신고접수","해당없음"]), otherDrive:"해당없음",
    },
    dispatch:{
      manager:"-", driver:c.name, majorAcc:"//",
      content: idx >= 1 ? "출동 현장 확인 완료" : "-", delivery:"-",
      etc:[ c.repairShop ? `입고공장 ${shopShort}` : "입고공장 미정",
        p.chance(0.5) ? "견인 실시" : "견인 미실시",
        (w.rent === "대여" || w.rent === "반납") ? "렌트 사용" : "렌트 미사용",
        "블랙박스 " + (p.chance(0.6) ? "Y" : "N") ],
    },
    liability:{
      driveLimit:p.pick(["만26세이상 / 가족한정","만48세이상 / 기명1인","누구나운전","만35세이상 / 부부한정"]),
      ageLimit:p.pick(["만26세이상","만48세이상","만35세이상","연령무관"]),
      selfPay:c.deductible || "-",
      propertySurcharge:p.pick(["물적할증 200만원","물적할증 100만원","물적할증 50만원"]),
    },
    ownDamage:{ joined:"가입(Y)", faultRate:faultText },
    insuredCar:{
      name:model, no,
      kind:spec.kind, code:`${p.pick(["61","53","72","44"])}T${String(regYear).slice(2)}`,
      priceAB:`${won(spec.price * 10000)} (사고시 ${won(Math.round(spec.price * 10000 * 0.9))})`,
      totalJoin:`${won(spec.price * 10000)} (일부보험 100%)`,
      addCover:p.pick(["부속B 270,000","해당없음","부속A 150,000"]),
      detail:p.pick(["블랙박스","네비게이션","선루프","-"]),
      special:p.pick(GEN_SPECIAL),
    },
    contract:{
      propertyDuty:"2025-07-25~2026-07-25 (정상) 20,000,000",
      propertyAny:"2025-07-25~2026-07-25 (정상) 980,000,000",
      carPeriod:`2025-07-25~2026-07-25 (정상) ${won(spec.price * 10000)}`,
      threeYear:p.pick(["무사고","1회","2회"]), discount:p.pick(["11Z","14P","08K","20A"]),
      insType:p.pick(GEN_INS_TYPE),
      joinCover:"인 I·II 물 I·II 상 무 차",
      change:p.pick(["없음","1건","2건"]),
      premium:`${won(p.int(80, 160) * 10000 + p.int(0, 9999))} (영수일 2025-06-17)`,
      contractor:`${c.name} / ${genBirth(p).slice(0, 8)} / ${driverPhone}`,
      rc:"자동차다이렉트영업부 1577-7233",
    },
    damage:{
      object:`${no} ${model}`.trim(), owner:c.name,
      info: idx >= 2 ? "수리 완료" : "-",
      transport:p.pick(["청구없음","미청구"]),
      rentClaim:(w.rent === "대여" || w.rent === "반납") ? "청구" : "미청구",
      vatTarget:p.pick(["해당없음","해당(사업자)"]), custInfo:"-",
    },
    repair:{
      shop: c.repairShop ? `[${grade[0]}] ${c.repairShop} ${shopPhone} (${grade})` : "미입고",
      period: (inDate !== "-" && outDate !== "-") ? `입고 ${inDate} ~ 출고 ${outDate} (${repairDays}일)`
        : (inDate !== "-" ? `입고 ${inDate} ~ 수리중` : "-"),
      accAmount: idx >= 2 ? won(claimTotal) : "-",
      paySpecial:"-",
      estimatePay: idx >= 2 ? `추산 ${won(preTotal)} / 지급 ${won(est.paidAmount)}` : "-",
      payResource: idx >= 2 ? "정비, 부품" : "-",
      closeDate: (idx === 3 && done) ? addDays(outDate !== "-" ? outDate : accDate, 2) : "-",
    },
    guideCols,
    guideRows:[ { label:"피보/운전", cells }, { label:"자차1", cells: Object.assign({}, cells) } ],
    handlers:{
      propertyAcc: idx >= 2 ? `${handlerName} / 대물보상${p.int(1, 3)} SAC / ${handlerPhone}` : "-",
      personAcc:"해당없음",
      propertyTotal: idx >= 2 ? "자차 1건" : "-", personTotal:"-",
    },
    damageList: idx >= 2 ? [{
      cover:"차량", seq:"001", payAmount:won(est.paidAmount),
      progress: idx === 3 ? (done ? "종결" : "지급예정") : "손해사정",
      ownerPhone:`${c.name} ${driverPhone}`,
      handler:`대물보상2 SAC ${handlerName} ${handlerPhone}`,
      assignDate: inDate !== "-" ? inDate : accDate, receiptDate: accDate,
    }] : [],
    parts:{ checked: genDamageParts(p) },
    // SK렌터카 연동 수신 항목 (실제 운영 시 SK렌터카 시스템에서 수신)
    skRent:{
      deductAgreed: won(p.pick([300000, 400000, 500000, 700000])),
      deductSurcharge: won(p.pick([0, 0, 0, 50000, 100000])),
      maintProduct: p.pick(["기본정비", "표준정비", "케어플러스"]),
      bizType: p.pick(["Direct", "제휴", "법인"]),
      visitCheck: p.pick(["-", "포함", "미포함"]),
      pickupMaint: p.pick(["N", "Y"]),
      accidentSub: p.pick(["N(미포함)", "Y(포함)"]),
      deductBilling: p.pick(["개별 정액", "통합 청구", "개별 실비"]),
      personalSub: p.pick(["불포함", "포함"]),
    },
    estimateDoc: est,
  };
}
// 손상 부위 2~5개 중복 없이 선택
function genDamageParts(p) {
  const arr = PART_LIST.slice(0, -1); // "기타" 제외
  const n = p.int(2, 5);
  const picks = new Set();
  let guard = 0;
  while (picks.size < n && guard++ < 40) picks.add(p.pick(arr));
  return [...picks];
}

// Claim + INTAKE_DETAIL 병합 → 접수지 표시 데이터
function getIntakeData(claimId) {
  const c = CLAIMS.find(x => x.id === claimId);
  if (!c) return null;
  const w = c.work || deriveWork(c);
  const base = defaultDetail(c, w);
  const ov = INTAKE_DETAIL[claimId] || {};
  const d = {
    id:c.id, name:c.name, car:c.car, carModel:c.carModel, custType:c.custType,
    manager:c.manager, status:c.status, actionType:c.actionType, urgency:c.urgency,
    elapsed:c.elapsed, flowStage:c.flowStage, procStatus:c.procStatus, repairShop:c.repairShop,
    actionDesc:c.actionDesc, nextAction:c.nextAction,
    fault: ov.fault || base.fault, regDate: ov.regDate || base.regDate,
    displacement: ov.displacement || base.displacement, estimate: ov.estimate || base.estimate,
    inDate: ov.inDate || base.inDate, outDate: ov.outDate || base.outDate,
    accidentManager: ov.accidentManager || base.accidentManager,
    damageManager: ov.damageManager || base.damageManager, reviewReply: ov.reviewReply || base.reviewReply,
    chips: Object.assign({}, base.chips, ov.chips || {}),
    unresolved: ov.unresolved || base.unresolved,
    guideCols: ov.guideCols || base.guideCols, guideRows: ov.guideRows || base.guideRows,
  };
  ["accident","dispatch","liability","ownDamage","insuredCar","contract","damage","repair","handlers","skRent"]
    .forEach(s => { d[s] = Object.assign({}, base[s], ov[s] || {}); });
  const op = ov.parties || {};
  d.parties = {
    driver: Object.assign({}, base.parties.driver, op.driver || {}),
    owner: Object.assign({}, base.parties.owner, op.owner || {}),
    insured: Object.assign({}, base.parties.insured, op.insured || {}),
    notifier: Object.assign({}, base.parties.notifier, op.notifier || {}),
  };
  d.parts = ov.parts || base.parts;
  d.estimateDoc = ov.estimateDoc || base.estimateDoc || null; // 청구 견적 정보 (override 우선, 없으면 시드 생성)
  d.damageList = (ov.damageList || base.damageList).map(r => Object.assign({ carNo:c.car, object:c.carModel }, r));
  return d;
}

/* ===================== Smart업무처리 렌더링 ===================== */
function iEsc(v) { return (v === undefined || v === null || v === "") ? "" : escapeHtml(String(v)); }
function joinDot(arr) { return arr.filter(Boolean).join(" · "); }
function intakeNowLabel() {
  const n = new Date();
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const dd = String(n.getDate()).padStart(2, "0");
  const hh = String(n.getHours()).padStart(2, "0");
  const mi = String(n.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}
function getIntakeLogs(id) {
  return intakeProgressLogs[id] || [];
}
function getIntakeProperty(id, d) {
  if (!intakePropertyState[id]) {
    intakePropertyState[id] = {
      attrs: (d.unresolved || []).filter(x => INTAKE_ATTR_KEYS.includes(x)),
      note: d.actionDesc || "",
    };
  }
  const st = intakePropertyState[id];
  if (!st.fields) st.fields = {};                                    // 항목별 입력값(재통화 날짜/탁송·렌트·기타 메모)
  if (!st.custom) st.custom = [{ checked:false, text:"" }, { checked:false, text:"" }]; // 담당자 자유 입력 2행
  return st;
}

/* ---- 레거시 테이블 헬퍼 ---- */
// entries: { k, v, full?, blue? } — full은 값이 3칸 병합, 아니면 k/v 쌍을 2개씩 묶어 4열 배치
function lgTable(entries) {
  const rows = [];
  let buf = [];
  const flush = () => { if (buf.length) { rows.push("<tr>" + buf.join("") + "</tr>"); buf = []; } };
  entries.forEach(e => {
    const hasRaw = e.raw != null;          // raw: 이스케이프하지 않는 입력/컨트롤 HTML
    const val = iEsc(e.v);
    const content = hasRaw ? e.raw : (val || "-");
    const phCls = (!hasRaw && !val) ? "ph" : "";
    if (e.full) {
      flush();
      rows.push(`<tr><th>${e.k}</th><td colspan="3" class="${e.blue ? "blue " : ""}${phCls}">${content}</td></tr>`);
    } else {
      buf.push(`<th>${e.k}</th><td class="${e.blue ? "blue " : ""}${phCls}">${content}</td>`);
      if (buf.length === 2) flush();
    }
  });
  flush();
  return `<table class="lg-tbl"><colgroup><col style="width:14%"><col style="width:36%"><col style="width:14%"><col style="width:36%"></colgroup>${rows.join("")}</table>`;
}
function lgSect(title, note) {
  return `<div class="lg-sect">${title}${note ? `<span class="note">${note}</span>` : ""}</div>`;
}

/* ---- 사고 접수 목록 (조회구분 ↔ 상세 사이, 항상 3줄 표시) ---- */
// 정렬 키: 사고일시(YYYY-MM-DD HH:MM) — 없으면 접수번호로 대체
function intakeSortDate(id) {
  const dd = getIntakeData(id);
  return (dd && dd.accident && dd.accident.datetime) || id;
}
function intakeListHtml() {
  const ids = intakeResults || [];
  const pageCount = Math.max(1, Math.ceil(ids.length / INTAKE_LIST_SIZE));
  if (intakeListPage >= pageCount) intakeListPage = pageCount - 1;
  if (intakeListPage < 0) intakeListPage = 0;
  const start = intakeListPage * INTAKE_LIST_SIZE;
  const pageIds = ids.slice(start, start + INTAKE_LIST_SIZE);
  let rows = "";
  for (let i = 0; i < INTAKE_LIST_SIZE; i++) {
    const id = pageIds[i];
    if (!id) { rows += `<tr class="lg-lrow empty"><td colspan="9">&nbsp;</td></tr>`; continue; }
    const c = CLAIMS.find(x => x.id === id) || {};
    const dd = getIntakeData(id) || {};
    const sel = id === intakeClaimId ? " on" : "";
    const seq = start + i + 1;
    const procCls = (typeof PROC_CLASS !== "undefined" && PROC_CLASS[c.procStatus]) || "";
    rows += `<tr class="lg-lrow${sel}" data-listid="${iEsc(id)}" data-desc="이 사고건을 선택해 아래 상세를 표시합니다.">
      <td class="c-seq">${seq}</td>
      <td class="c-id">${iEsc(id)}</td>
      <td>${iEsc(c.repairShop) || "-"}</td>
      <td>${iEsc(c.car)}</td>
      <td>${iEsc(c.carModel)}</td>
      <td>${iEsc(dd.fault)}</td>
      <td>${iEsc(c.flowStage)}</td>
      <td><span class="lg-lstat ${procCls}">${iEsc(c.procStatus)}</span></td>
      <td>${iEsc(c.manager)}</td>
    </tr>`;
  }
  let pager = "";
  if (pageCount > 1) {
    let nums = "";
    for (let pg = 0; pg < pageCount; pg++) {
      nums += `<button type="button" class="lg-lpg${pg === intakeListPage ? " on" : ""}" data-listpage="${pg}" data-desc="${pg + 1}페이지의 접수건(과거건 포함)을 표시합니다.">${pg + 1}</button>`;
    }
    pager = `<div class="lg-list-pager">${nums}</div>`;
  }
  const listDesc = "차량번호·휴대폰으로 조회하면 동일 차량의 사고 접수건을 최대 3줄씩 표시합니다. 행을 클릭하면 아래 상세가 전환되고, 3건을 넘으면 페이지 번호로 과거건을 조회합니다.";
  return `<div class="lg-list" data-desc="${iEsc(listDesc)}">
    <div class="lg-list-head"><span class="h">사고 접수 목록</span><span class="cnt">${ids.length}건</span></div>
    <table class="lg-list-tbl"><colgroup><col style="width:40px"><col style="width:128px"><col><col style="width:92px"><col style="width:84px"><col style="width:132px"><col style="width:92px"><col style="width:70px"><col style="width:78px"></colgroup>
      <thead><tr><th>순번</th><th>접수번호</th><th>정비공장명</th><th>차량번호</th><th>차량명</th><th>과실</th><th>단계</th><th>상태</th><th>담당자</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>${pager}
  </div>`;
}

function lgIdBand(d) {
  return `<div class="lg-idband">
    <span class="tag">${iEsc(d.procStatus) || "대기"}</span>
    <span class="id">${iEsc(d.id)}</span>
    <span class="seg shop">${iEsc(d.repairShop) || "미입고"}</span>
    <span class="seg fault">${iEsc(d.fault) || "자차 0% (미확정)"}</span>
    <span class="seg car">${joinDot([d.carModel, d.car]) || "-"}</span>
  </div>`;
}

// 수리승인 여부 — 수리 승인 단계 이후면 승인, 단계 내 검토/대기면 미승인
function repairApprovalOf(d) {
  const idx = STAGES.indexOf(d.flowStage);
  const appIdx = STAGES.indexOf("수리 승인");
  if (idx < 0 || appIdx < 0) return "미승인";
  if (idx > appIdx) return "승인";
  if (idx === appIdx) return /수리 승인 대기|관리자|검토/.test(d.status || "") ? "미승인" : "승인";
  return "미승인";
}
function lgRow2(d) {
  const left = lgTable([
    { k: "사고담당", v: d.accidentManager }, { k: "수리승인", v: repairApprovalOf(d) },
    { k: "검토회신", v: d.reviewReply }, { k: "고객구분", v: d.custType },
  ]);
  // 좌: 요약(좁게) / 우: SK렌터카 연동 정보 (요약 오른쪽 빈 공간 채움)
  return `<div class="lg-toprow">
    <div class="lg-toprow-sum">${left}</div>
    <div class="lg-toprow-sk">${intakeSkRentBandHtml(d)}</div>
  </div>`;
}

/* ---- SK렌터카 연동 정보 (전체 폭 가로 밴드) ----
   면책·정비·대차 관련 값은 SK렌터카 시스템과 연동하여 받아와야 하는 항목이다. */
const SK_RENT_FIELDS = [
  { k: "면책약정금액",   key: "deductAgreed" },
  { k: "면책금할증금액", key: "deductSurcharge" },
  { k: "정비상품",       key: "maintProduct" },
  { k: "업무구분",       key: "bizType" },
  { k: "방문점검",       key: "visitCheck" },
  { k: "픽업정비",       key: "pickupMaint" },
  { k: "사고/정비대차",  key: "accidentSub" },
  { k: "면책금통합청구", key: "deductBilling" },
  { k: "개인대차",       key: "personalSub" },
];
function intakeSkRentBandHtml(d) {
  const sk = d.skRent || {};
  const cellDesc = "SK렌터카 시스템과 연동해 받아오는 값입니다. (연동 전에는 예시·미수신 상태)";
  const heads = SK_RENT_FIELDS.map(f => `<th>${f.k}</th>`).join("");
  const vals = SK_RENT_FIELDS.map(f => {
    const v = iEsc(sk[f.key]);
    return `<td class="${v ? "" : "ph"}" data-desc="${iEsc(cellDesc)}">${v || "미수신"}</td>`;
  }).join("");
  const secDesc = "SK렌터카와 연동이 필요한 정보입니다. 이 항목들은 SK렌터카 시스템에서 받아와야 하는 값으로, 연동 시 실제 계약 데이터로 자동 채워집니다.";
  return `<div class="lg-sect" data-desc="${iEsc(secDesc)}">SK렌터카 연동 정보<span class="note">※ SK렌터카 시스템 연동 수신 항목</span></div>`
    + `<div class="lg-scroll"><table class="lg-tbl lg-sk-band"><thead><tr>${heads}</tr></thead><tbody><tr>${vals}</tr></tbody></table></div>`;
}

/* ---- 진행 이력 / 진행 메모 / 미결 속성 ---- */
// 진행 이력 표 — 선택된 구분(채널)으로 필터
function intakeLogTableHtml(logs) {
  const rows = intakeLogFilter === "전체" ? logs : logs.filter(r => r.type === intakeLogFilter);
  if (!rows.length) {
    const label = intakeLogFilter === "전체" ? "데이터가 없습니다." : `'${intakeLogFilter}' 구분의 진행 이력이 없습니다.`;
    return `<div class="empty">${iEsc(label)}</div>`;
  }
  return `<table><thead><tr><th style="width:32px">순번</th><th style="width:78px">일시</th><th style="width:74px">구분</th><th>내용</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${rows.length - i}</td><td>${iEsc(r.at)}</td><td>${iEsc(r.type)}</td><td class="txt">${iEsc(r.text)}</td></tr>`).join("")}</tbody></table>`;
}
// 미결 속성 1행 (체크박스 + 항목명 + 부가 입력필드)
const INTAKE_ATTR_DESC = {
  "재통화": "고객 재통화가 필요한 건으로 표시합니다. 오른쪽에 재통화 예정일을 지정할 수 있습니다.",
  "VOC":   "고객 불만(VOC) 발생 건으로 표시합니다.",
  "탁송":   "차량 탁송(운송)이 필요한 건으로 표시합니다. 오른쪽에 탁송 메모를 남길 수 있습니다.",
  "렌트":   "렌트(대차) 관련 미결 건으로 표시합니다. 오른쪽에 렌트 메모를 남길 수 있습니다.",
  "기타":   "위 분류에 없는 기타 미결 건으로 표시합니다. 오른쪽에 메모를 남길 수 있습니다.",
};
function intakeAttrRowHtml(a, st) {
  const checked = (st.attrs || []).includes(a.key);
  let field = "";
  const fieldDesc = a.field === "date" ? "재통화 예정일을 지정합니다." : "메모를 입력합니다. (최대 20자)";
  if (a.field === "date") field = `<input type="date" class="lg-attr-field" data-attr-field="${iEsc(a.key)}" value="${iEsc(st.fields[a.key] || "")}" aria-label="${iEsc(a.key)} 날짜" data-desc="${iEsc(fieldDesc)}">`;
  else if (a.field === "text") field = `<input type="text" maxlength="20" class="lg-attr-field" data-attr-field="${iEsc(a.key)}" placeholder="${iEsc(a.ph)}" value="${iEsc(st.fields[a.key] || "")}" data-desc="${iEsc(fieldDesc)}">`;
  return `<label class="lg-attr2" data-desc="${iEsc(INTAKE_ATTR_DESC[a.key] || `'${a.key}' 미결 속성으로 표시합니다.`)}"><input type="checkbox" name="intakeAttr" value="${iEsc(a.key)}" ${checked ? "checked" : ""}><span class="nm">${iEsc(a.key)}</span></label><div class="lg-attr-fw">${field}</div>`;
}
// 담당자 자유 입력 1행 (체크박스 + 입력필드)
function intakeCustomRowHtml(row, i) {
  return `<label class="lg-attr2" data-desc="담당자가 직접 정의한 미결 속성입니다. 체크하면 이 항목이 미결로 적용됩니다."><input type="checkbox" data-custom-check="${i}" ${row.checked ? "checked" : ""}><span class="nm muted">추가${i + 1}</span></label><div class="lg-attr-fw"><input type="text" maxlength="20" class="lg-attr-field" data-custom-text="${i}" placeholder="담당자 입력 (최대 20자)" value="${iEsc(row.text)}" data-desc="담당자가 직접 미결 속성명을 입력합니다. (최대 20자)"></div>`;
}
function intakeWorkbenchHtml(d) {
  const prop = getIntakeProperty(d.id, d);
  const logs = getIntakeLogs(d.id);
  const histBtns = [
    { label:"메세지발송", desc:"고객·관련자에게 안내 문자(진행 상황·요청 사항)를 발송합니다." },
    { label:"간편렌트", desc:"대차(렌트) 차량을 간편 신청 절차로 바로 접수합니다." },
  ];
  const filterOpts = ["전체", ...INTAKE_MEMO_TYPES];
  return `<div class="lg-panels">
    <div class="lg-panel">
      <div class="lg-panel-h"><span class="h">진행 이력</span><span class="lg-radio"><label><input type="radio" name="lgHistScope" disabled> MY</label><label><input type="radio" name="lgHistScope" checked disabled> 전체</label></span></div>
      <div class="lg-mini-btns">${histBtns.map(b => `<button class="lg-mini gray" type="button" data-desc="${iEsc(b.desc)}">${iEsc(b.label)}</button>`).join("")}</div>
      <div class="lg-radio lg-hist-filter" style="margin-bottom:6px">${filterOpts.map(t => `<label data-desc="${t === "전체" ? "모든 채널의 진행 이력을 표시합니다." : `'${iEsc(t)}' 채널로 남긴 진행 이력만 골라 표시합니다.`}"><input type="radio" name="lgHistFilter" value="${iEsc(t)}" ${intakeLogFilter === t ? "checked" : ""}> ${iEsc(t)}</label>`).join("")}</div>
      <div class="lg-log" id="intakeLogBox">${intakeLogTableHtml(logs)}</div>
    </div>
    <div class="lg-panel">
      <div class="lg-panel-h"><span class="h">진행 메모</span></div>
      <div class="lg-form">
        <div class="fr"><label class="k" for="intakeMemoType">구분</label><select class="lg-sel" id="intakeMemoType" data-desc="저장할 진행 메모의 구분(채널)을 선택합니다. 진행 이력 필터와 동일한 분류입니다.">${INTAKE_MEMO_TYPES.map(t => `<option value="${iEsc(t)}">${iEsc(t)}</option>`).join("")}</select></div>
        <div class="fr"><label class="k" for="intakeMemoTarget">관련대상</label><input class="lg-in" id="intakeMemoTarget" type="text" value="${iEsc(d.name)}" data-desc="이 메모와 연관된 대상(고객·공업사·상대방 등)을 입력합니다."></div>
        <div class="fr top"><label class="k" for="intakeMemoText">주요내용</label><textarea class="lg-ta" id="intakeMemoText" placeholder="진행 내용을 입력하세요. 예: 공업사 재요청, 고객 재통화 예정" data-desc="진행 내용을 입력합니다. 저장하면 위 진행 이력에 새 항목으로 추가됩니다."></textarea></div>
        <div class="lg-form-foot"><span class="sp"></span><button class="lg-mini" type="button" id="intakeMemoSave" data-desc="입력한 진행 메모를 진행 이력에 추가 저장합니다.">메모 저장</button></div>
      </div>
    </div>
    <div class="lg-panel">
      <div class="lg-panel-h"><span class="h">미결 속성</span><button class="lg-mini" type="button" id="intakeAttrSave" data-desc="체크한 미결 속성과 메모를 저장해 미결일괄조회 목록에 반영합니다.">저장</button></div>
      <div class="lg-attrs2">
        ${INTAKE_ATTRS.map(a => intakeAttrRowHtml(a, prop)).join("")}
        <div class="lg-attr-div"></div>
        ${prop.custom.map((row, i) => intakeCustomRowHtml(row, i)).join("")}
      </div>
    </div>
  </div>`;
}

/* ---- 탭1: 계약 사고 정보 — 담당자 편집 컨트롤 ---- */
const CT_LICENSE_TYPES = ["1종대형", "1종보통", "1종특수", "2종보통", "2종소형", "원동기", "무면허", "해당없음"];
// 운전자-피보험자 '관계' 선택 목록
const CT_REL_TYPES = ["피보험자 본인", "지정운전자", "임직원(직원/대표)", "배우자", "자녀", "부모", "렌터카임차인", "형제/친인척", "며느리", "사위", "대리운전", "취급업자", "기타", "미탑승", "절취운전"];
const CT_ACC_MAJORS = ["차대차", "차량단독", "차대인", "타차일방", "계약위반(음주·약물 등)"];
const CT_ACC_DETAILS = {
  "차대차": ["추돌", "후진사고", "주/정차 중 사고", "차선변경(가해)", "차선변경(피해)", "신호위반", "교차로 진입", "측면 접촉"],
  "차량단독": ["기타 피해물 접촉", "로드킬", "비래/낙하물", "도난", "전복", "전도", "침수", "화재", "가드레일 접촉"],
  "차대인": ["횡단보도", "PM(개인형이동장치) 사고", "무단횡단", "보도 통행 중", "이면도로 사고"],
  "타차일방": ["신호대기 중 추돌 피해", "주정차 중 피해", "상대 중앙선 침범", "상대 신호위반"],
  "계약위반(음주·약물 등)": ["음주운전", "약물운전", "무면허운전", "사고후 미조치(뺑소니)"],
};
const CT_TASKS = ["Moral사고", "당일사고", "근접배서", "심야사고", "범위위배", "무면허운전", "타차운전"];
// 시스템이 사고·계약 데이터로 자동 판단하는 항목(담당자 수정 불가)
const CT_AUTO_TASKS = ["당일사고", "근접배서", "심야사고"];
// 조사 Task 항목별 설명(툴팁)
const CT_TASK_DESC = {
  "Moral사고": "고의·기획 등 도덕적 위험(Moral)이 의심되는 사고. 체크하면 조사내용 입력 팝업이 열립니다.",
  "당일사고": "보험 가입일(계약 개시일)과 사고 발생일이 같은 날인 사고. 시스템이 자동 판단합니다.",
  "근접배서": "사고 직전(30일 이내) 계약 배서(담보 추가·변경)가 있었던 사고. 시스템이 자동 판단합니다.",
  "심야사고": "심야 시간대(22시~06시)에 발생한 사고. 사고일시로 시스템이 자동 판단합니다.",
  "범위위배": "운전 가능 범위(운전자 한정·연령 등)를 벗어난 상태에서 발생한 사고입니다.",
  "무면허운전": "무면허(면허 정지·취소 포함) 상태에서 운전 중 발생한 사고입니다.",
  "타차운전": "다른 자동차 운전 담보로, 다른 차량 운전 중 발생한 사고입니다.",
};

const intakeContractState = {};
function getContractState(id, d) {
  if (!intakeContractState[id]) {
    const P = d.parties || {}, A = d.accident || {}, dr = (P.driver || {});
    const bp = parseBirth(dr.birth);
    intakeContractState[id] = {
      driverName: dr.name || "", driverRel: dr.rel || "", birth: dr.birth || "",
      birthFront: bp.front, birthBack: bp.back, birthAge: bp.age, phone: dr.phone || "",
      licenseNo: dr.licenseNo || "", licenseType: (dr.license || "").split("/")[0].trim() || "2종보통",
      datetime: A.datetime || "", place: A.place || "", placeDetail: A.placeDetail || "",
      content: A.content || "", note: A.note || "",
      accMajor: "차대차", accDetail: CT_ACC_DETAILS["차대차"][0],
      tasks: (A.otherDrive && A.otherDrive !== "해당없음") ? ["타차운전"] : [], moralNote: "",
      police: (A.police === "신고접수") ? "신고" : "미신고", policeStation: "", policeOfficer: "", policeOfficerPhone: "",
      comp: { insurer: "", caseNo: "", staff: "", staffPhone: "", faultRate: "", faultFixed: "미확정", place: A.place || "", accType: "", dispatched: "미출동", content: "" },
    };
  }
  return intakeContractState[id];
}
function ctText(field, val, ph) {
  return `<input type="text" class="lg-cin" data-ct="${iEsc(field)}" value="${iEsc(val)}" placeholder="${iEsc(ph || "")}" data-desc="담당자가 직접 수정하고 저장하는 입력 항목입니다.">`;
}
function ctSel(field, val, opts) {
  return `<select class="lg-csel" data-ct="${iEsc(field)}">${opts.map(o => `<option ${o === val ? "selected" : ""}>${iEsc(o)}</option>`).join("")}</select>`;
}
/* 생년월일(주민번호) 문자열 파싱 — "64****-2 (만61세)" → { front:"64****", back:"2", age:"61" } */
function parseBirth(raw) {
  raw = String(raw || "");
  const ageM = raw.match(/만\s*(\d+)\s*세/);
  const resident = raw.split("(")[0].trim();          // "64****-2"
  const parts = resident.split("-");
  return {
    front: (parts[0] || "").trim().slice(0, 6),
    back: (parts[1] || "").trim().slice(0, 1),
    age: ageM ? ageM[1] : "",
  };
}
/* 주민번호 앞 6자리 + 뒷 1자리(성별·세기 구분)로 만 나이 자동계산 — 계산 불가 시 null */
function calcManAge(front, back) {
  if (!/^\d{6}$/.test(front || "")) return null;      // 앞 6자리가 모두 숫자일 때만 계산
  const yy = +front.slice(0, 2), mm = +front.slice(2, 4), dd = +front.slice(4, 6);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  let century;
  if (back === "1" || back === "2" || back === "5" || back === "6") century = 1900;
  else if (back === "3" || back === "4" || back === "7" || back === "8") century = 2000;
  else if (back === "9" || back === "0") century = 1800;
  else return null;
  const birthY = century + yy;
  const today = new Date();
  let age = today.getFullYear() - birthY;
  const tm = today.getMonth() + 1, td = today.getDate();
  if (tm < mm || (tm === mm && td < dd)) age--;        // 올해 생일이 아직 안 지났으면 -1
  return (age >= 0 && age <= 130) ? age : null;
}
/* 생년월일 입력 셀 — 주민번호 앞자리 / 뒷자리 첫 1자리 / 만 나이(자동계산·비활성) 3개 필드 */
function ctBirthHtml(st) {
  const age = calcManAge(st.birthFront, st.birthBack);
  const ageVal = age != null ? String(age) : (st.birthAge || "");
  return `<div class="lg-birth">`
    + `<input type="text" inputmode="numeric" maxlength="6" class="lg-cin lg-birth-front" data-ct="birthFront" value="${iEsc(st.birthFront)}" placeholder="앞 6자리" data-desc="주민등록번호 앞 6자리(생년월일 YYMMDD)를 입력합니다.">`
    + `<span class="lg-birth-sep">-</span>`
    + `<input type="text" inputmode="numeric" maxlength="1" class="lg-cin lg-birth-back" data-ct="birthBack" value="${iEsc(st.birthBack)}" placeholder="●" data-desc="주민등록번호 뒷자리의 첫 1자리(성별·세기 구분)까지만 입력합니다.">`
    + `<span class="lg-birth-mask">●●●●●●</span>`
    + `<span class="lg-birth-age">만 <input type="text" class="lg-cin lg-birth-ageval" id="ctBirthAge" value="${iEsc(ageVal)}" disabled aria-label="만 나이 자동계산" data-desc="생년월일을 입력하면 만 나이가 자동으로 계산됩니다. 담당자가 직접 입력할 수 없습니다."> 세</span>`
    + `</div>`;
}
/* 개인정보동의 값 + 알림톡·문자 발송 아이콘 버튼 */
function ctAgreeMsgHtml(d, st) {
  const msgIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
  return `<div class="lg-agree">`
    + `<span class="lg-agree-v">운전 Y / 소유 Y</span>`
    + `<button type="button" class="lg-msgbtn" id="ctMsgBtn" title="알림톡·문자메세지 발송" aria-label="알림톡·문자메세지 발송" data-desc="운전자에게 개인정보 수집·이용 동의 안내 등 알림톡/문자메세지를 발송하는 창을 엽니다.">${msgIcon}</button>`
    + `</div>`;
}
/* 사고일시/계약 데이터로 자동판단하는 조사 Task 계산 */
function ctParseDate(s) { const m = String(s || "").match(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
function ctParseHour(s) { const m = String(s || "").match(/(\d{1,2}):(\d{2})/); return m ? +m[1] : null; }
function computeAutoTasks(d, st) {
  const acc = ctParseDate(st.datetime), hour = ctParseHour(st.datetime);
  const contract = (d && d.contract) || {};
  const start = ctParseDate(contract.carPeriod);                 // 계약 개시일
  const endorse = ctParseDate(contract.premium);                 // 영수/배서 근사일
  const hasEndorse = contract.change && contract.change !== "없음";
  const sameDay = (a, b) => !!(a && b && a.getTime() === b.getTime());
  const daysGap = (a, b) => (a && b) ? Math.abs((a - b) / 86400000) : Infinity;
  return {
    "심야사고": hour != null && (hour >= 22 || hour < 6),
    "당일사고": sameDay(acc, start),
    "근접배서": !!hasEndorse && daysGap(acc, endorse) <= 30,
  };
}
function ctTaskChecksHtml(d, st) {
  const auto = computeAutoTasks(d, st);
  st.autoTasks = auto;                                           // 저장용 기록(계약사고정보)
  const items = CT_TASKS.map(t => {
    const desc = CT_TASK_DESC[t] || `'${iEsc(t)}' 조사 항목으로 표시합니다.`;
    if (CT_AUTO_TASKS.includes(t)) {                             // 시스템 자동판단 — 담당자 수정 불가
      return `<label class="lg-ctchk auto" data-desc="${iEsc(desc)}"><input type="checkbox" disabled ${auto[t] ? "checked" : ""}><span>${iEsc(t)}</span></label>`;
    }
    return `<label class="lg-ctchk" data-desc="${iEsc(desc)}"><input type="checkbox" data-cttask="${iEsc(t)}" ${st.tasks.includes(t) ? "checked" : ""}><span>${iEsc(t)}</span></label>`;
  }).join("");
  return `<div class="lg-ctchecks" id="ctTaskArea">${items}</div>`;
}
function ctPoliceHtml(st) {
  const rep = st.police === "신고";
  return `<div class="lg-ctpolice">
    <label class="lg-ctradio" data-desc="경찰에 사고를 신고한 건입니다."><input type="radio" name="ctPolice" value="신고" ${rep ? "checked" : ""}>신고</label>
    <label class="lg-ctradio" data-desc="경찰 신고를 하지 않은 건입니다."><input type="radio" name="ctPolice" value="미신고" ${!rep ? "checked" : ""}>미신고</label>
    <span id="ctPoliceStationWrap" class="lg-ctstation ${rep ? "" : "lg-hide"}">
      <span class="lg-ctstation-i">관할 <input type="text" class="lg-cin sm" data-ct="policeStation" value="${iEsc(st.policeStation)}" placeholder="경찰서명" data-desc="신고한 관할 경찰서명을 입력합니다."></span>
      <span class="lg-ctstation-i">담당 <input type="text" class="lg-cin sm" data-ct="policeOfficer" value="${iEsc(st.policeOfficer || "")}" placeholder="담당 경찰관 이름" data-desc="사건 담당 경찰관의 이름을 입력합니다."></span>
      <span class="lg-ctstation-i">연락처 <input type="text" class="lg-cin sm" data-ct="policeOfficerPhone" value="${iEsc(st.policeOfficerPhone || "")}" placeholder="담당 경찰관 연락처" data-desc="사건 담당 경찰관의 연락처를 입력합니다."></span>
    </span>
  </div>`;
}
function intakeContractTab(d) {
  const P = d.parties;
  const st = getContractState(d.id, d);
  const detailOpts = (CT_ACC_DETAILS[st.accMajor] || []);
  const c = st.comp;
  const left = lgSect("사고 관련자", "※ 운전자 접수 / 저장 · 담당자 수정 가능")
    + lgTable([
      { k: "운전자", raw: ctText("driverName", st.driverName, "운전자명") },
      { k: "연락처", raw: ctText("phone", st.phone, "010-0000-0000") },
      { k: "생년월일", raw: ctBirthHtml(st) },
      { k: "관계", raw: ctSel("driverRel", st.driverRel, (st.driverRel && !CT_REL_TYPES.includes(st.driverRel)) ? [st.driverRel].concat(CT_REL_TYPES) : CT_REL_TYPES) },
      { k: "면허종류", raw: ctSel("licenseType", st.licenseType, CT_LICENSE_TYPES) },
      { k: "면허번호", raw: ctText("licenseNo", st.licenseNo, "00-00-000000-00") },
      { k: "소유자", v: P.owner.name }, { k: "연락처", v: P.owner.phone, blue: true },
      { k: "피보험자", v: P.insured.name }, { k: "연락처", v: P.insured.phone, blue: true },
      { k: "통보자", v: `${P.notifier.name || ""} ${P.notifier.rel ? "(" + P.notifier.rel + ")" : ""}`.trim() },
      { k: "연락처", v: P.notifier.phone, blue: true },
      { k: "개동", raw: ctAgreeMsgHtml(d, st), full: true },
    ])
    + lgSect("사고 정보", "※ 담당자 수정 가능")
    + lgTable([
      { k: "사고일시", raw: ctText("datetime", st.datetime, "YYYY-MM-DD HH:MM"), full: true },
      { k: "사고장소", raw: ctText("place", st.place, "사고 발생 장소"), full: true },
      { k: "장소상세", raw: ctText("placeDetail", st.placeDetail, "상세 위치"), full: true },
      { k: "내용", raw: ctText("content", st.content, "사고 경위·내용"), full: true },
      { k: "사고유형", raw: ctSel("accMajor", st.accMajor, CT_ACC_MAJORS) },
      { k: "세부분류", raw: `<select class="lg-csel" id="ctAccDetail" data-ct="accDetail">${detailOpts.map(o => `<option ${o === st.accDetail ? "selected" : ""}>${iEsc(o)}</option>`).join("")}</select>` },
      { k: "특이사항", raw: ctText("note", st.note, "특이사항"), full: true },
      { k: "조사Task", raw: ctTaskChecksHtml(d, st), full: true },
      { k: "경찰접수", raw: ctPoliceHtml(st), full: true },
    ])
    + `<div class="lg-sect">경합 보험사 접수 정보<button class="lg-mini" type="button" id="ctCompFetch" data-desc="상대측(타 보험사) 접수 정보를 조회해 아래 항목을 자동으로 불러옵니다. (연동 시 실제 타사 데이터)">타사 정보 조회</button></div>`
    + lgTable([
      { k: "경합 보험사명", raw: ctText("comp.insurer", c.insurer, "예: DB손해보험") },
      { k: "접수번호", raw: ctText("comp.caseNo", c.caseNo, "타사 접수번호") },
      { k: "타보험사 담당자", raw: ctText("comp.staff", c.staff, "담당자명") },
      { k: "담당자 연락처", raw: ctText("comp.staffPhone", c.staffPhone, "010-0000-0000"), blue: true },
      { k: "과실율", raw: ctText("comp.faultRate", c.faultRate, "예: 70:30") },
      { k: "과실 확정여부", raw: ctSel("comp.faultFixed", c.faultFixed, ["미확정", "협의중", "확정"]) },
      { k: "사고장소", raw: ctText("comp.place", c.place, "타사 기재 사고장소"), full: true },
      { k: "사고유형", raw: ctText("comp.accType", c.accType, "타사 기재 사고유형"), full: true },
      { k: "출동여부", raw: ctSel("comp.dispatched", c.dispatched, ["미출동", "출동", "출동요청"]) },
      { k: "사고내용", raw: ctText("comp.content", c.content, "타사 기재 사고내용"), full: true },
    ]);
  const right = lgSect("면부책")
    + lgTable([
      { k: "운전한정", v: d.liability.driveLimit, full: true },
      { k: "운전연령", v: d.liability.ageLimit }, { k: "자기부담", v: d.liability.selfPay },
      { k: "물적할증", v: d.liability.propertySurcharge, full: true },
    ])
    + lgSect("자차 계약사항")
    + lgTable([
      { k: "자차가입", v: d.ownDamage.joined }, { k: "자차과실", v: d.ownDamage.faultRate },
    ])
    + lgSect("피보험차량")
    + lgTable([
      { k: "차명/번호", v: joinDot([d.insuredCar.name, d.insuredCar.no]), full: true },
      { k: "차종", v: d.insuredCar.kind }, { k: "코드", v: d.insuredCar.code, blue: true },
      { k: "차량가액", v: d.insuredCar.priceAB, full: true },
      { k: "총가입금액", v: d.insuredCar.totalJoin, full: true },
      { k: "추가담보", v: d.insuredCar.addCover }, { k: "상세", v: d.insuredCar.detail },
      { k: "특약", v: d.insuredCar.special, full: true },
    ])
    + lgSect("계약 정보")
    + lgTable([
      { k: "대물의무", v: d.contract.propertyDuty, full: true },
      { k: "대물임의", v: d.contract.propertyAny, full: true },
      { k: "차량", v: d.contract.carPeriod, full: true },
      { k: "3년사고", v: d.contract.threeYear }, { k: "할인할증", v: d.contract.discount },
      { k: "보종", v: d.contract.insType, full: true },
      { k: "가입담보", v: d.contract.joinCover, full: true },
      { k: "계약변경", v: d.contract.change }, { k: "보험료", v: d.contract.premium },
      { k: "계약자", v: d.contract.contractor, full: true },
      { k: "담당RC", v: d.contract.rc, full: true },
    ]);
  return `<div class="lg-cols"><div>${left}</div><div>${right}</div></div>`;
}

function ctSetField(st, path, val) {
  if (path.indexOf(".") >= 0) { const [a, b] = path.split("."); (st[a] = st[a] || {})[b] = val; }
  else st[path] = val;
}
function bindIntakeContract(d) {
  const body = $("#intakeBody"); if (!body) return;
  const st = getContractState(d.id, d);
  body.querySelectorAll("[data-ct]").forEach(el => {
    const ev = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, () => {
      const isBirth = el.dataset.ct === "birthFront" || el.dataset.ct === "birthBack";
      if (isBirth) {                               // 생년월일 필드는 숫자만 허용
        const clean = el.value.replace(/\D/g, "");
        if (clean !== el.value) el.value = clean;
      }
      ctSetField(st, el.dataset.ct, el.value);
      if (isBirth) {                               // 앞/뒷자리 변경 시 만 나이 자동 재계산
        const ageEl = body.querySelector("#ctBirthAge");
        if (ageEl) {
          const age = calcManAge(st.birthFront, st.birthBack);
          ageEl.value = age != null ? String(age) : "";
        }
      }
      if (el.dataset.ct === "accMajor") {          // 대분류 변경 → 세부분류 옵션 갱신
        const opts = CT_ACC_DETAILS[el.value] || [];
        st.accDetail = opts[0] || "";
        const sel = body.querySelector("#ctAccDetail");
        if (sel) sel.innerHTML = opts.map(o => `<option ${o === st.accDetail ? "selected" : ""}>${iEsc(o)}</option>`).join("");
      }
      if (el.dataset.ct === "datetime") {          // 사고일시 변경 → 자동판단 조사 Task(심야사고 등) 재계산
        const area = body.querySelector("#ctTaskArea");
        if (area) { area.outerHTML = ctTaskChecksHtml(d, st); bindTaskChecks(); }
      }
    });
  });
  function bindTaskChecks() {
    body.querySelectorAll("[data-cttask]").forEach(cb => cb.addEventListener("change", () => {
      const t = cb.dataset.cttask;
      if (cb.checked) { if (!st.tasks.includes(t)) st.tasks.push(t); if (t === "Moral사고") openMoralModal(st); }
      else { st.tasks = st.tasks.filter(x => x !== t); }
    }));
  }
  bindTaskChecks();
  body.querySelectorAll('input[name="ctPolice"]').forEach(r => r.addEventListener("change", () => {
    if (!r.checked) return;
    st.police = r.value;
    const wrap = body.querySelector("#ctPoliceStationWrap");
    if (wrap) wrap.classList.toggle("lg-hide", r.value !== "신고");
  }));
  const fb = body.querySelector("#ctCompFetch");
  if (fb) fb.addEventListener("click", () => fetchCompetitorInfo(d, st));
  const mb = body.querySelector("#ctMsgBtn");
  if (mb) mb.addEventListener("click", () => openMsgSendWindow(d));
}
// 타사(경합 보험사) 정보 조회 — 데모: 임의 접수정보를 끌어와 채운다.
function fetchCompetitorInfo(d, st) {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rnd = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  st.comp = {
    insurer: pick(["DB손해보험", "삼성화재", "현대해상", "KB손해보험", "메리츠화재", "롯데손해보험"]),
    caseNo: `2026-${rnd(1000000, 9999999)}`,
    staff: pick(["김", "이", "박", "최", "정", "강"]) + pick(["성민", "지훈", "서연", "도윤", "하늘", "예린"]),
    staffPhone: `010-${rnd(2000, 8999)}-${rnd(1000, 9999)}`,
    faultRate: pick(["70:30", "80:20", "100:0", "60:40", "0:100", "90:10"]),
    faultFixed: pick(["미확정", "협의중", "확정"]),
    place: st.place || (d.accident && d.accident.place) || "",
    accType: `${st.accMajor} · ${st.accDetail}`,
    dispatched: pick(["출동", "미출동"]),
    content: pick(["상대차 후미 추돌 인정", "과실 협의 진행 중", "현장 블랙박스 확인 요청", "상대 운전자 진술 확보", "쌍방 과실 검토 중"]),
  };
  $("#intakeBody").innerHTML = renderIntakeTab("contract", d);
  bindIntakeContract(d);
  showToast(`${st.comp.insurer} 접수정보를 조회했습니다.`);
}
// Moral 사고 조사내용 입력 팝업
function openMoralModal(st) {
  let root = document.getElementById("ctMoralRoot");
  if (!root) { root = document.createElement("div"); root.id = "ctMoralRoot"; document.body.appendChild(root); }
  root.className = "ct-modal-root open";
  root.innerHTML = `
    <div class="ct-modal-bd"></div>
    <div class="ct-modal" role="dialog" aria-modal="true" aria-label="Moral 사고 조사 내용">
      <div class="ct-modal-h"><b>Moral 사고 조사 내용</b><button type="button" class="ct-modal-x" aria-label="닫기">×</button></div>
      <div class="ct-modal-b">
        <p class="ct-modal-guide">Moral(모럴) 의심 사고로 지정했습니다. 판단 근거와 조사 내용을 입력하세요.</p>
        <textarea id="ctMoralText" rows="6" placeholder="예: 사고 경위 진술 불일치, 단기간 반복 사고 이력, 심야 단독사고 등 의심 정황과 조사 결과">${iEsc(st.moralNote)}</textarea>
      </div>
      <div class="ct-modal-f"><button type="button" class="lg-abtn" id="ctMoralCancel">취소</button><button type="button" class="lg-abtn primary" id="ctMoralSave">조사내용 저장</button></div>
    </div>`;
  const close = (uncheck) => {
    root.classList.remove("open"); root.innerHTML = "";
    if (uncheck && !st.moralNote) {   // 조사내용 없이 닫으면 Moral 체크 해제
      st.tasks = st.tasks.filter(x => x !== "Moral사고");
      const cb = document.querySelector('[data-cttask="Moral사고"]');
      if (cb) cb.checked = false;
    }
  };
  root.querySelector(".ct-modal-bd").addEventListener("click", () => close(true));
  root.querySelector(".ct-modal-x").addEventListener("click", () => close(true));
  root.querySelector("#ctMoralCancel").addEventListener("click", () => close(true));
  root.querySelector("#ctMoralSave").addEventListener("click", () => {
    st.moralNote = document.getElementById("ctMoralText").value;
    close(false);
    showToast("Moral 사고 조사내용을 저장했습니다.");
  });
}

/* ======================= 알림톡 · LMS/SMS 발송 =======================
   '메시지 발송'은 팝업(모달)이 아니라 별도 새 창(message-send.html)으로 연다.
   현재 사고건의 연락처·변수 컨텍스트를 localStorage로 넘겨 새 창이 읽는다. */
const MSG_CTX_KEY = "msgSendContext";
function openMsgSendWindow(d) {
  const claim = (typeof CLAIMS !== "undefined") ? CLAIMS.find(x => x.id === d.id) : null;
  const det = (typeof INTAKE_DETAIL !== "undefined" && INTAKE_DETAIL[d.id]) || {};
  const P = d.parties || {};
  const person = o => ({ name: (o && o.name) || "", phone: (o && o.phone) || "" });
  const ctx = {
    claimId: d.id,
    custName: (P.insured && P.insured.name) || (claim && claim.name) || "",
    carNo: (d.insuredCar && d.insuredCar.no) || (claim && claim.car) || "",
    accidentDate: (d.accident && d.accident.datetime) ? String(d.accident.datetime).slice(0, 10) : "",
    managerName: (claim && claim.manager) || "담당자",
    repairShop: (claim && claim.repairShop) || "",
    inDate: det.inDate || "", outDate: det.outDate || "",
    estimate: det.estimate ? String(det.estimate).replace(/[^0-9,]/g, "") : "",
    parties: { insured: person(P.insured), owner: person(P.owner), notifier: person(P.notifier), driver: person(P.driver) },
  };
  try { localStorage.setItem(MSG_CTX_KEY, JSON.stringify(ctx)); } catch (e) {}
  const w = window.open("message-send.html?claim=" + encodeURIComponent(d.id), "msgSend_" + d.id,
    "width=1180,height=820,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes");
  if (w) w.focus(); else showToast("팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도하세요.");
}

/* ---- 탭2: 피해 진행 정보 ---- */
// 차량 부위 손상 목록 렌더 (interactive=true → 담당자 입력, 클릭 토글)
function dmgPartsHtml(checkedSet, interactive) {
  return PART_LIST.map(p => {
    const on = checkedSet.has(p);
    const attr = interactive ? ` data-staff-part="${iEsc(p)}" data-desc="'${iEsc(p)}'을(를) 담당자가 확인한 실제 파손부위로 지정/해제합니다. (정비공장 청구 부위와 대조)"` : "";
    const cls = interactive ? "lg-dmg-item staff-part" : "lg-dmg-item";
    return `<div class="${cls}${on ? " on" : ""}"${attr}><span class="b"></span>${p}</div>`;
  }).join("");
}
/* ---- 탭2: 피해 진행 정보 — 담당자 편집 상태/헬퍼 ---- */
const DM_OWN_STATES = ["분손", "전손", "도난"];
const DM_PROC_OPTS = { "분손": ["수리", "미수리"], "전손": ["폐차", "매각"], "도난": ["미회수", "회수"] };
const DM_LOST_OPTS = ["차키", "앞번호판", "뒷번호판"];
const intakeDamageState = {};
function dmNumOf(v) { return parseInt(String(v || "").replace(/[^\d]/g, ""), 10) || 0; }
function getDamageState(id, d) {
  if (!intakeDamageState[id]) {
    const ic = d.insuredCar || {}, rp = d.repair || {}, dg = d.damage || {};
    const pm = String(ic.priceAB || "").match(/([\d,]+)[^\d]+([\d,]+)/);
    const buy = pm ? pm[1] : (String(ic.priceAB || "").match(/[\d,]+/) || [""])[0];
    const accVal = pm ? pm[2] : "";
    const book = accVal ? won(Math.round(dmNumOf(accVal) * 0.72)) : "";
    const shopM = String(rp.shop || "").match(/\]\s*(.+?)\s*(\d[\d-]+\d)/);
    const period = String(rp.period || "");
    const pdM = period.match(/입고\s*([\d-]+)\s*~\s*출고\s*([\d-]+)/);
    intakeDamageState[id] = {
      plate: ic.no || "", objectName: ic.name || "",
      firstRegDate: "", owner: "(주)에스케이렌터카",
      ownState: "분손", procState: "수리", repaired: "예",
      maintSub: (dg.rentClaim === "청구") ? "이용" : "미이용",
      lost: [],
      buyPrice: buy, accidentValue: accVal, bookValue: book,
      shopName: shopM ? shopM[1] : "", shopPhone: shopM ? shopM[2] : "",
      repairPeriod: (period.match(/\((\d+일)\)/) || ["", ""])[1] || (period === "-" ? "" : period),
      inDate: pdM ? pdM[1] : "", outPlanDate: pdM ? pdM[2] : "",
      outChg1Date: "", outChg1Reason: "", outChg2Date: "", outChg2Reason: "",
      repairStartDate: "", repairEndDate: "", outDoneDate: "",
      estimate: "1,300,000",
      deductible: "300,000",
    };
  }
  return intakeDamageState[id];
}
function dmText(f, v, ph) { return `<input type="text" class="lg-cin" data-dm="${iEsc(f)}" value="${iEsc(v)}" placeholder="${iEsc(ph || "")}" data-desc="담당자가 직접 수정·저장하는 항목입니다.">`; }
function dmDate(f, v) { return `<input type="date" class="lg-cin" data-dm="${iEsc(f)}" value="${iEsc(v)}" data-desc="날짜를 선택합니다.">`; }
function dmNum(f, v) { return `<input type="text" inputmode="numeric" class="lg-cin ta-r" data-dm="${iEsc(f)}" value="${iEsc(v)}" data-desc="금액(원)을 입력합니다.">`; }
function dmSel(f, v, opts) { return `<select class="lg-csel" data-dm="${iEsc(f)}">${opts.map(o => `<option ${o === v ? "selected" : ""}>${iEsc(o)}</option>`).join("")}</select>`; }
function dmSkVal(v) { return `<span class="lg-skval">${iEsc(v) || "미수신"}<span class="lg-sktag">SK</span></span>`; }
function dmLostHtml(s) {
  return `<div class="lg-ctchecks">` + DM_LOST_OPTS.map(x =>
    `<label class="lg-ctchk" data-desc="분실 대상 '${iEsc(x)}'을(를) 표시합니다."><input type="checkbox" data-dmlost="${iEsc(x)}" ${s.lost.includes(x) ? "checked" : ""}><span>${iEsc(x)}</span></label>`
  ).join("") + `</div>`;
}
function dmShopFieldHtml(s) {
  const val = s.shopName ? `${iEsc(s.shopName)} <span class="lg-shopph">(${iEsc(s.shopPhone)})</span>` : `<span class="ph">미지정 — 검색하여 지정</span>`;
  return `<span class="lg-shopfield">${val}<button type="button" class="lg-shopbtn" id="dmShopSearch" data-desc="공업사를 검색해 지정합니다. (AOS/SK 연동 시 자동 세팅)" aria-label="공업사 검색">
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>
  </button></span>`;
}
// 예상수리비: 금액(VAT 별도) 입력 + VAT 포함액 자동 표시
function dmEstimateHtml(s) {
  const base = dmNumOf(s.estimate);
  const vat = Math.round(base * 1.1);
  return `<span class="lg-estwrap">${dmNum("estimate", s.estimate)}<span class="lg-estunit">원</span><span class="lg-estvat">(VAT 포함 <b id="dmEstVat">${won(vat)}</b>원)</span></span>`;
}
function intakeDamageTab(d) {
  const s = getDamageState(d.id, d);
  const procOpts = DM_PROC_OPTS[s.ownState] || [];
  const left = lgSect("피해 진행", "※ 담당자 수정 가능 · SK 연동 항목 표시")
    + lgTable([
      { k: "차량번호", raw: dmText("plate", s.plate, "12가3456") },
      { k: "피해물명", raw: dmText("objectName", s.objectName, "차량명") },
      { k: "최초등록일", raw: dmDate("firstRegDate", s.firstRegDate) },
      { k: "소유자", raw: dmText("owner", s.owner, "소유자(법인명)") },
      { k: "자차상태", raw: dmSel("ownState", s.ownState, DM_OWN_STATES) },
      { k: "처리상태", raw: `<select class="lg-csel" id="dmProcState" data-dm="procState">${procOpts.map(o => `<option ${o === s.procState ? "selected" : ""}>${iEsc(o)}</option>`).join("")}</select>` },
      { k: "수리여부", raw: `<select class="lg-csel" id="dmRepaired" data-dm="repaired" ${s.ownState !== "분손" ? "disabled" : ""}>${["예", "아니요"].map(o => `<option ${o === s.repaired ? "selected" : ""}>${iEsc(o)}</option>`).join("")}</select>` },
      { k: "정비대차", raw: dmSel("maintSub", s.maintSub, ["이용", "미이용"]) },
      { k: "분실대상", raw: dmLostHtml(s), full: true },
      { k: "차량구입액", raw: dmSkVal(s.buyPrice) },
      { k: "사고시가액", raw: dmSkVal(s.accidentValue) },
      { k: "예상잔존가", raw: `${dmSkVal(s.bookValue)} <span class="lg-cinhint">장부가액</span>`, full: true },
    ]);
  const right = lgSect("공업사 · 수리", "※ AOS 연동 우선 · 미연동 시 SK 수신")
    + lgTable([
      { k: "공업사", raw: dmShopFieldHtml(s), full: true },
      { k: "수리기간", raw: dmText("repairPeriod", s.repairPeriod, "예: 7일 (AOS 선견적)"), full: true },
      { k: "입고일", raw: dmDate("inDate", s.inDate) }, { k: "출고예정일", raw: dmDate("outPlanDate", s.outPlanDate) },
      { k: "출고예정 변경1", raw: dmDate("outChg1Date", s.outChg1Date) }, { k: "변경1 사유", raw: dmText("outChg1Reason", s.outChg1Reason, "변경 사유") },
      { k: "출고예정 변경2", raw: dmDate("outChg2Date", s.outChg2Date) }, { k: "변경2 사유", raw: dmText("outChg2Reason", s.outChg2Reason, "변경 사유") },
      { k: "수리개시일", raw: dmDate("repairStartDate", s.repairStartDate) }, { k: "수리완료일", raw: dmDate("repairEndDate", s.repairEndDate) },
      { k: "출고완료일", raw: dmDate("outDoneDate", s.outDoneDate), full: true },
    ])
    + lgSect("수리비 · 면책금", "※ VAT 별도 입력 · 선견적/AOS 연동")
    + lgTable([
      { k: "예상수리비", raw: dmEstimateHtml(s), full: true },
      { k: "면책금", raw: dmNum("deductible", s.deductible), full: true },
    ]);

  // 차량 부위 손상 — 정비공장 입력(좌, 읽기전용) ↔ 담당자 입력(우, 클릭 선택) 대조
  const shopChecked = new Set(d.parts.checked || []);
  const staffChecked = intakeStaffParts[d.id] || (intakeStaffParts[d.id] = new Set());
  const carDamage = lgSect("차량 부위 손상", "좌: 정비공장 입력 · 우: 담당자 입력 (실제 파손부위 대조용)")
    + `<div class="lg-dmg-pair">
         <div class="lg-dmg-col">
           <div class="lg-dmg-cap shop">정비공장 입력<span>공업사가 청구한 파손부위</span></div>
           <div class="lg-dmg"><div class="lg-dmg-list">${dmgPartsHtml(shopChecked, false)}</div><div class="lg-dmg-car">${CAR_DIAGRAM_SVG}</div></div>
         </div>
         <div class="lg-dmg-col">
           <div class="lg-dmg-cap staff">담당자 입력<span>담당자가 확인한 실제 파손부위 · 클릭하여 선택</span></div>
           <div class="lg-dmg"><div class="lg-dmg-list">${dmgPartsHtml(staffChecked, true)}</div><div class="lg-dmg-car">${CAR_DIAGRAM_SVG}</div></div>
         </div>
       </div>`;

  return `<div class="lg-cols"><div>${left}</div><div>${right}</div></div>${carDamage}`;
}

function renderIntakeTab(name, d) {
  if (name === "damage") return intakeDamageTab(d);
  if (name === "estimate") return intakeEstimateTab(d);
  return intakeContractTab(d);
}

/* ---- 탭3: 청구 견적 정보 (선견적/청구서 전환 + 손해사정 비교) ---- */
// 견적서 4단계 정의: 선견적 → 선견적 손해사정 → 청구서 → 청구서 손해사정
const ESTIMATE_STAGES = [
  { doc:"pre",   kind:"base",   label:"선견적" },
  { doc:"pre",   kind:"adjust", label:"선견적 손해사정" },
  { doc:"claim", kind:"base",   label:"청구서" },
  { doc:"claim", kind:"adjust", label:"직원 손해사정 청구서" },
];
function estSum(rows, field) {
  return rows.reduce((s, r) => s + Number(r[field].amount || 0), 0);
}

/* ---- 탭3: 결재 & 추산이력 컴포넌트 (레퍼런스 레이아웃) ----
   공용 결재 기반(APPROVALS·config·apprNow·apprBuildCoreInfo·pushApprHistory·srCurrentStaff)은 common.js에 존재. */
const SR_ACT_LABEL = { "상신": "상신", "승인": "최종결재", "반려": "반려", "상신취소": "상신취소" };
const SR_ACT_BADGE = { "상신": "ing", "승인": "done", "반려": "reject", "상신취소": "reject" };
function srApprovalsFor(claimNo) { return APPROVALS.filter(a => a.claimNo === claimNo); }
// 대표 피해물명 — 피해물 목록 첫 서열(001→"자차1"). 결재의 damagedObjectName과 순번 정합.
function srPrimaryObject(d) {
  const first = d.damageList && d.damageList[0];
  const n = first && first.seq != null ? parseInt(String(first.seq), 10) : NaN;
  return "자차" + (isNaN(n) || n < 1 ? 1 : n);
}
function srFlattenHistories(claimNo) {            // 사고건의 모든 결재 이력을 최신순으로
  const rows = [];
  srApprovalsFor(claimNo).forEach(a => (a.histories || []).forEach(h => rows.push(h)));
  rows.sort((x, y) => (y.actedAt || "").localeCompare(x.actedAt || ""));
  return rows;
}
function srNextApprId() {
  const n = APPROVALS.reduce((m, a) => Math.max(m, parseInt(String(a.id).replace(/\D/g, ""), 10) || 0), 0) + 1;
  return "APR-" + String(n).padStart(3, "0");
}
// 사고번호 + 피해물 + 결재종류 기준 3자리 순번 (기존 시드 건 포함 → 자연 연속)
function srNextResolutionNo(claimNo, objectName, type) {
  const max = APPROVALS
    .filter(a => a.claimNo === claimNo && a.damagedObjectName === objectName && a.approvalType === type)
    .reduce((m, a) => Math.max(m, parseInt(a.resolutionNo, 10) || 0), 0);
  return String(max + 1).padStart(3, "0");
}
// 결재금액: 추산=선견 합계 / 지급성=손해사정 반영 지급액(없으면 청구 합계) / 면책·VOC=0
function srApprovalAmount(d, type) {
  const doc = d.estimateDoc;
  if (!doc) return 0;
  if (type === "추산") return estSum(doc.pre, "base");
  if (type === "면책종결" || type === "VOC") return 0;
  const adj = estSum(doc.claim, "adjust");
  return adj || Number(doc.paidAmount || 0) || estSum(doc.claim, "base");
}
// 결재 신규 건 생성 — coreInfo/histories까지 채워 결재LIST/Speed결재에서 즉시 정상 동작
function createIntakeApproval(claimId, approvalType, comment) {
  const c = CLAIMS.find(x => x.id === claimId);
  const d = getIntakeData(claimId);
  if (!c || !d) return null;
  const staff = srCurrentStaff(c);
  const obj = srPrimaryObject(d);
  const item = {
    id: srNextApprId(),
    claimNo: c.id,
    resolutionNo: srNextResolutionNo(c.id, obj, approvalType),
    approvalType,
    requesterId: staff.id,
    requesterName: staff.name,
    damagedObjectName: obj,
    damageInfo: `${c.carModel || d.carModel || "-"} / ${c.car || "-"}`,
    repairShopName: c.repairShop || (d.repair && d.repair.shop) || "-",
    approvalAmount: srApprovalAmount(d, approvalType),
    approvalStatus: "상신중",
    requestedAt: apprNow(),
    completedAt: null,
    requesterComment: comment,
    approverId: null,
    approverName: "",
    approverComment: ""
  };
  item.coreInfo = apprBuildCoreInfo(item);
  item.histories = [{
    id: 1, claimNo: item.claimNo, resolutionNo: item.resolutionNo, approvalType,
    actionType: "상신", actorId: staff.id, actorName: staff.name, actorEmployeeNo: staff.employeeNo,
    actedAt: item.requestedAt, status: "상신중", comment: comment || "",
    statusBefore: "작성중", statusAfter: "상신중"
  }];
  APPROVALS.unshift(item);
  return item;
}
function finalizeIntakeSubmit(claimId, approvalType, comment) {
  const item = createIntakeApproval(claimId, approvalType, comment);
  if (item) {
    showToast(`${claimId} ${approvalType} 결재가 상신되었습니다. (결의순번 ${item.resolutionNo})`);
    renderIntake();
  }
}
// 상신 취소 — 상신중 건만 취소 가능. 취소 후 동일 종류 재상신이 가능해진다.
function cancelIntakeApproval(id) {
  const item = APPROVALS.find(a => a.id === id);
  if (!item || item.approvalStatus !== "상신중") return;
  const staff = srCurrentStaff(CLAIMS.find(c => c.id === item.claimNo));
  const before = item.approvalStatus;
  item.approvalStatus = "상신취소";
  item.completedAt = apprNow();
  pushApprHistory(item, "상신취소", staff, "상신자 상신취소", before, "상신취소");
  showToast(`${item.claimNo} ${item.approvalType} 상신이 취소되었습니다.`);
  renderIntake();
}
// 결재구분 라디오: 추산은 도입 확정 전이라 비활성(선택 불가), 결재는 지급 전용으로 운영.
const SR_APPR_FORM_TYPES = [
  { value:"추산",       label:"추산", pay:false, disabled:true },
  { value:"지급(종결)", label:"지급", pay:true,  disabled:false },
];
const SR_APPR_DEFAULT_TYPE = SR_APPR_FORM_TYPES.find(t => !t.disabled) || SR_APPR_FORM_TYPES[0];
/* ===================== 지급결의 · 지급결재 (2열 레이아웃) =====================
   OCR로 확정한 지급결의 목록(좌) + 결재순번 이력(우) + 결재상신 바(하).
   기존 결재자·의견·비밀번호 상신 흐름을 재사용. 함수명은 기존 호출부 호환 유지. */
const RES_STATUS_CLASS = {
  "결재 전": "payres-st-ready", "상신중": "appr-ing", "반려": "appr-reject",
  "상신취소": "payres-st-cancel", "결재완료": "appr-done", "재확인 필요": "payres-st-review",
};
let payresClaimId = null;
let payresSel = new Set();

function payresSyncSelection(d) {
  if (payresClaimId !== d.id) { payresClaimId = d.id; payresSel = new Set(); }
  // 더 이상 선택 불가한 결의는 선택 해제
  [...payresSel].forEach(id => {
    const r = getResolution(id);
    if (!r || !resolutionCan(r, "select")) payresSel.delete(id);
  });
}

// 함수명 유지(호출부 호환): 견적 탭 하단 결재 컴포넌트 = 지급결의·결재 2열
function srApprComponentHtml(d) {
  payresSyncSelection(d);
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  return `<div class="payres">
    ${lgSect("지급결의 · 지급결재", "AI-OCR 확정 결의 관리 및 결재 상신")}
    ${fault.confirmed ? "" : `<div class="payres-fault-banner">⚠ 과실율 확정 후 결의입력하세요 — 과실률 미확정 상태에서는 결의확정·결재상신이 제한됩니다.</div>`}
    <div class="payres-cols">
      ${payresLeftHtml(d, fault)}
      ${payresRightHtml(d)}
    </div>
    ${payresBarHtml(d, fault)}
  </div>`;
}

function payresLeftHtml(d, fault) {
  const disableSel = !fault.confirmed;
  const list = resolutionsFor(d.id).slice().sort((a, b) => (a.resolutionSeq || "").localeCompare(b.resolutionSeq || ""));
  const selectable = list.filter(r => resolutionCan(r, "select"));
  const allChecked = selectable.length && selectable.every(r => payresSel.has(r.id));
  const rows = list.length ? list.map(r => {
    const canSel = resolutionCan(r, "select") && !disableSel;
    const stCls = RES_STATUS_CLASS[r.status] || "";
    const reviewNote = r.status === "재확인 필요"
      ? `<div class="payres-review">확정 과실률 ${r.faultRateAtConfirmed}% → 현재 ${fault.pct}% · <button type="button" class="payres-mini" data-reconfirm="${r.id}">재확정</button></div>` : "";
    return `<tr class="${payresSel.has(r.id) ? "sel" : ""}">
      <td class="ta-c"><input type="checkbox" class="payres-chk" data-res="${r.id}" ${payresSel.has(r.id) ? "checked" : ""} ${canSel ? "" : "disabled"}></td>
      <td class="ta-c">${iEsc(r.resolutionSeq)}</td>
      <td>${iEsc(r.resolutionType)}<div class="payres-src">${iEsc(r.sourceType)}</div></td>
      <td class="payres-file">${iEsc(r.sourceFileName)}${reviewNote}</td>
      <td class="num">${won(r.claimAmount)}</td>
      <td class="num">${won(r.assessedAmountBeforeFault)}</td>
      <td class="num neg">-${won(r.faultOffsetAmount)}</td>
      <td class="num strong">${won(r.finalAssessedAmount)}</td>
      <td class="ta-c"><span class="badge ${stCls}">${iEsc(r.status)}</span></td>
      <td class="payres-dt">${iEsc((r.updatedAt || "").slice(5, 16))}</td>
      <td>${iEsc(r.confirmedByName || r.confirmedBy || "")}</td>
      <td class="ta-c"><button type="button" class="payres-mini" data-detail="${r.id}" data-desc="이 지급결의의 부품 내역과 OCR 수정이력을 봅니다.">상세</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="12" class="ph">저장된 지급결의가 없습니다. AI-OCR로 부품청구서를 등록하세요.</td></tr>`;
  return `<div class="payres-col left">
    <div class="payres-col-head">지급결의 저장내역 <span class="cnt">${list.length}건</span></div>
    <div class="payres-scroll"><table class="payres-tbl">
      <thead><tr>
        <th class="ta-c"><input type="checkbox" id="payresAll" ${allChecked ? "checked" : ""} ${disableSel || !selectable.length ? "disabled" : ""}></th>
        <th class="ta-c">결의</th><th>종류</th><th>원본/출처</th>
        <th class="num">청구금액</th><th class="num">손해사정</th><th class="num">과실상계</th><th class="num">최종지급</th>
        <th class="ta-c">상태</th><th>저장일시</th><th>입력자</th><th></th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="payres-col-foot">
      <button type="button" class="lg-abtn" id="payresEdit" ${disableSel ? "disabled" : ""} data-desc="선택한 지급결의 1건을 다시 편집합니다.">수정</button>
      <button type="button" class="lg-abtn danger" id="payresDelete" ${disableSel ? "disabled" : ""} data-desc="선택한 삭제 가능한 지급결의를 삭제합니다. (상신중·결재완료 제외)">선택삭제</button>
    </div>
  </div>`;
}

function payresRightHtml(d) {
  const apprs = APPROVALS.filter(a => a.claimNo === d.id && a.resolutionIds && a.resolutionIds.length)
    .slice().sort((a, b) => (b.approvalSeq || "").localeCompare(a.approvalSeq || ""));
  const cards = apprs.length ? apprs.map(a => {
    const stCls = RES_STATUS_CLASS[a.approvalStatus] || "appr-ing";
    const canCancel = a.approvalStatus === "상신중";
    return `<div class="payres-card">
      <div class="payres-card-top">
        <span class="payres-seq">결재 ${iEsc(a.approvalSeq)}</span>
        <span class="badge ${stCls}">${iEsc(a.approvalStatus)}</span>
      </div>
      <div class="payres-card-row">포함결의 ${(a.includedResolutionSeqs || []).join(", ") || "-"}</div>
      <div class="payres-card-row">결재금액 <b>${won(a.approvalAmount)}원</b></div>
      <div class="payres-card-row dim">상신 ${iEsc(a.requestedAt || "")} · ${iEsc(a.requesterName || "")}</div>
      ${a.approverName ? `<div class="payres-card-row dim">결재 ${iEsc(a.completedAt || "")} · ${iEsc(a.approverName)}</div>` : ""}
      ${a.approverComment ? `<div class="payres-card-cmt">${iEsc(a.approverComment)}</div>` : ""}
      ${canCancel ? `<div class="payres-card-foot"><button type="button" class="payres-mini danger" data-cancel="${a.id}" data-desc="상신중인 결재를 취소합니다. 연결 결의는 다시 수정·재상신할 수 있습니다.">상신취소</button></div>` : ""}
    </div>`;
  }).join("") : `<div class="payres-empty">상신된 지급결재가 없습니다.</div>`;
  return `<div class="payres-col right">
    <div class="payres-col-head">결재순번 / 결재이력</div>
    <div class="payres-cards">${cards}</div>
  </div>`;
}

function payresBarHtml(d, fault) {
  const sel = [...payresSel].map(getResolution).filter(Boolean);
  const sum = sel.reduce((s, r) => s + Number(r.finalAssessedAmount || 0), 0);
  const approverOpts = APPR_APPROVERS.map(id => {
    const s = assignStaffById(id);
    return s ? `<option value="${s.id}" ${s.id === currentApproverId ? "selected" : ""}>${iEsc(s.name)} · ${iEsc(s.position || "결재자")}</option>` : "";
  }).join("");
  const disabled = !sel.length || !fault.confirmed;
  return `<div class="payres-bar ${disabled ? "off" : ""}">
    <div class="payres-bar-info">
      <span>선택 결의 <b>${sel.length}건</b></span>
      <span class="payres-bar-amt">결재금액 <b>${won(sum)}원</b></span>
    </div>
    <div class="payres-bar-form">
      <label>다음결재자</label>
      <select class="lg-sel" id="payresApprover" data-desc="이 지급결재를 처리할 다음 결재자를 지정합니다. (Speed결재 기본 결재자로도 반영)">${approverOpts}</select>
      <input type="text" class="lg-in" id="payresComment" placeholder="결재의견" data-desc="상신 사유·검토 의견을 입력합니다. 결재 이력에 함께 기록됩니다.">
      <input type="password" class="lg-in" id="payresPw" placeholder="비밀번호" style="max-width:130px" autocomplete="off" data-desc="지급 결재 승인용 비밀번호를 입력합니다.">
      <button type="button" class="lg-abtn primary" id="payresSubmit" ${disabled ? "disabled" : ""} data-desc="선택한 지급결의를 합산해 지급결재 1건으로 상신합니다.">지급결재 상신</button>
    </div>
  </div>`;
}

// 선택 변경 시 .payres 부분 재렌더 (의견·비밀번호 입력값 보존)
function rerenderPayres(d) {
  const cur = document.querySelector(".payres");
  if (!cur) { renderIntake(); return; }
  const comment = ($("#payresComment") || {}).value || "";
  const pw = ($("#payresPw") || {}).value || "";
  const wrap = document.createElement("div");
  wrap.innerHTML = srApprComponentHtml(d);
  cur.replaceWith(wrap.firstElementChild);
  const c = $("#payresComment"); if (c) c.value = comment;
  const p = $("#payresPw"); if (p) p.value = pw;
  bindIntakeApprForm(d);
}

// 함수명 유지(호출부 호환): 지급결의·결재 2열 컴포넌트 바인딩
function bindIntakeApprForm(d) {
  const root = $("#intakeRoot");
  if (!root || !root.querySelector(".payres")) return;
  root.querySelectorAll(".payres-chk").forEach(chk => chk.addEventListener("change", () => {
    if (chk.checked) payresSel.add(chk.dataset.res); else payresSel.delete(chk.dataset.res);
    rerenderPayres(d);
  }));
  const all = $("#payresAll");
  if (all) all.addEventListener("change", () => {
    const selectable = resolutionsFor(d.id).filter(r => resolutionCan(r, "select"));
    if (all.checked) selectable.forEach(r => payresSel.add(r.id)); else selectable.forEach(r => payresSel.delete(r.id));
    rerenderPayres(d);
  });
  root.querySelectorAll("[data-reconfirm]").forEach(b => b.addEventListener("click", () => payresReconfirm(d, b.dataset.reconfirm)));
  root.querySelectorAll("[data-detail]").forEach(b => b.addEventListener("click", () => openPayresDetail(d, b.dataset.detail)));
  root.querySelectorAll("[data-cancel]").forEach(b => b.addEventListener("click", () => cancelPayresApproval(d, b.dataset.cancel)));
  const edit = $("#payresEdit");
  if (edit) edit.addEventListener("click", () => payresEditSelected(d));
  const del = $("#payresDelete");
  if (del) del.addEventListener("click", () => payresDeleteSelected(d));
  const submit = $("#payresSubmit");
  if (submit) submit.addEventListener("click", () => submitPayresApproval(d));
}

// 재확정 — 재확인 필요 결의를 최신 과실률로 재확정하여 다시 선택 가능하게 함(설계문서 §6.2)
function payresReconfirm(d, resId) {
  const r = getResolution(resId);
  if (!r) return;
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  r.faultRateAtConfirmed = fault.pct;
  recalcResolutionAmounts(r, fault.pct);
  r.status = "결재 전";
  r.faultRateAtReview = null;
  r.updatedAt = apprNow();
  persistResolutions();
  showToast(`지급결의 ${r.resolutionSeq}가 최신 과실률(${fault.pct}%)로 재확정되었습니다.`);
  rerenderPayres(d);
}

// 수정 — 선택된 편집 가능 결의 1건을 OCR 편집기로 재편집
function payresEditSelected(d) {
  const editable = [...payresSel].map(getResolution).filter(r => r && resolutionCan(r, "edit"));
  if (editable.length !== 1) { showToast("수정할 지급결의 1건을 선택하세요."); return; }
  if (typeof openOcrEditor === "function") openOcrEditor(d, editable[0]);
}

// 선택삭제 — 삭제 가능한 결의만 제거(설계문서 §8)
function payresDeleteSelected(d) {
  const deletable = [...payresSel].map(getResolution).filter(r => r && resolutionCan(r, "remove"));
  if (!deletable.length) { showToast("삭제할 수 있는 지급결의를 선택하세요."); return; }
  if (!window.confirm(`선택한 지급결의 ${deletable.length}건을 삭제하시겠습니까?\n삭제한 지급결의와 수정이력은 복구할 수 없습니다.`)) return;
  const ids = new Set(deletable.map(r => r.id));
  PAYMENT_RESOLUTIONS = PAYMENT_RESOLUTIONS.filter(r => !ids.has(r.id));
  ids.forEach(id => payresSel.delete(id));
  persistResolutions();
  showToast(`지급결의 ${deletable.length}건을 삭제했습니다.`);
  rerenderPayres(d);
}

// 지급결재 상신 — 선택 결의 합산 → 지급결재 1건 생성(결재순번), 연결 결의 상신중 잠금(설계문서 §11)
function submitPayresApproval(d) {
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  if (!fault.confirmed) { showToast("과실율 확정 후 결의입력하세요"); return; }
  const sel = [...payresSel].map(getResolution).filter(Boolean);
  if (!sel.length) { showToast("결재할 지급결의를 선택하세요."); return; }
  if (sel.some(r => !resolutionCan(r, "submit"))) {
    showToast("선택한 지급결의 중 현재 결재할 수 없는 내역이 있습니다.\n목록을 새로 확인하세요.");
    rerenderPayres(d); return;
  }
  if (sel.some(r => Number(r.faultRateAtConfirmed) !== fault.pct)) {
    showToast("과실률이 변경되어 지급결의 재확인이 필요합니다.\n최신 과실률로 금액을 확인한 후 다시 확정하세요.");
    return;
  }
  const comment = ($("#payresComment").value || "").trim();
  if (!comment) { showToast("결재의견을 입력해 주세요."); const c = $("#payresComment"); if (c) c.focus(); return; }
  if (($("#payresPw").value || "") !== APPR_PASSWORD) { showToast("비밀번호가 불일치합니다."); $("#payresPw").focus(); return; }
  const approverId = $("#payresApprover").value;
  if (approverId) currentApproverId = approverId;

  const c = CLAIMS.find(x => x.id === d.id);
  const staff = srCurrentStaff(c);
  const obj = srPrimaryObject(d);
  const approvalSeq = nextApprovalSeq(d.id);
  const sum = sel.reduce((s, r) => s + Number(r.finalAssessedAmount || 0), 0);
  const item = {
    id: srNextApprId(),
    claimNo: d.id,
    resolutionNo: approvalSeq,          // 문서번호/시드 호환용(표시는 approvalSeq)
    approvalSeq: approvalSeq,
    approvalType: "지급(종결)",
    resolutionIds: sel.map(r => r.id),
    includedResolutionSeqs: sel.map(r => r.resolutionSeq),
    requesterId: staff.id, requesterName: staff.name,
    damagedObjectName: obj,
    damageInfo: `${c.carModel || d.carModel || "-"} / ${c.car || "-"}`,
    repairShopName: c.repairShop || (d.repair && d.repair.shop) || "-",
    approvalAmount: sum,
    approvalStatus: "상신중",
    requestedAt: apprNow(), completedAt: null,
    requesterComment: comment, approverId: null, approverName: "", approverComment: "",
  };
  item.coreInfo = apprBuildCoreInfo(item);
  item.histories = [{
    id: 1, claimNo: item.claimNo, resolutionNo: item.resolutionNo, approvalType: item.approvalType,
    actionType: "상신", actorId: staff.id, actorName: staff.name, actorEmployeeNo: staff.employeeNo,
    actedAt: item.requestedAt, status: "상신중", comment: comment, statusBefore: "작성중", statusAfter: "상신중"
  }];
  APPROVALS.unshift(item);
  syncResolutionStatusFromApproval(item, "상신중");
  persistExtraApprovals();
  payresSel = new Set();
  showToast(`${d.id} 지급결재 ${approvalSeq} 상신 완료 (포함결의 ${item.includedResolutionSeqs.join(", ")} · ${won(sum)}원)`);
  renderIntake();
}

// 상신취소 — 상신중 결재 취소 → 연결 결의 잠금 해제(설계문서 §11)
function cancelPayresApproval(d, apprId) {
  const a = APPROVALS.find(x => x.id === apprId);
  if (!a || a.approvalStatus !== "상신중") return;
  if (!window.confirm(`결재 ${a.approvalSeq} 상신을 취소하시겠습니까?`)) return;
  const staff = srCurrentStaff(CLAIMS.find(x => x.id === a.claimNo));
  const before = a.approvalStatus;
  a.approvalStatus = "상신취소";
  a.completedAt = apprNow();
  if (a.histories) pushApprHistory(a, "상신취소", staff, "상신자 상신취소", before, "상신취소");
  syncResolutionStatusFromApproval(a, "상신취소");
  persistExtraApprovals();
  showToast(`결재 ${a.approvalSeq} 상신이 취소되었습니다.`);
  renderIntake();
}

// 지급결의 상세 — 부품 내역 + OCR 수정이력(읽기전용)
function fmtPayresHist(v) { if (v === true) return "불인"; if (v === false) return "인정"; if (v === null || v === undefined) return "-"; return String(v); }
function openPayresDetail(d, resId) {
  const r = getResolution(resId);
  if (!r) return;
  const root = $("#ocrModalRoot");
  if (!root) return;
  const rowsHtml = r.rows.map(row => `<tr>
    <td class="ta-c">${row.seq}</td><td>${iEsc(row.partName)}</td><td>${iEsc(row.partNumber)}</td>
    <td>${iEsc(row.partCategory)}</td><td class="ta-c">${row.quantity}</td>
    <td class="ta-c">${row.denied ? "불인" : ""}</td><td class="num">${won(row.claimAmount)}</td>
    <td class="num">${won(row.assessedAmount)}</td></tr>`).join("");
  const hist = r.editHistory || [];
  const histHtml = hist.length ? hist.map(h => `<tr>
    <td class="ta-c">${h.rowSeq}</td><td>${iEsc(h.fieldLabel)}</td>
    <td>${iEsc(fmtPayresHist(h.before))}</td><td>${iEsc(fmtPayresHist(h.after))}</td>
    <td>${iEsc(h.changeType)}</td></tr>`).join("") : `<tr><td colspan="5" class="ph">수정 이력이 없습니다.</td></tr>`;
  root.innerHTML = `<div class="modal-backdrop" data-ocr-close></div>
    <section class="action-modal ocr-modal ocr-editor" role="dialog" aria-modal="true">
      <div class="modal-head"><div>
        <div class="modal-eyebrow">지급결의 상세</div>
        <div class="modal-title">결의 ${iEsc(r.resolutionSeq)} · ${iEsc(r.resolutionType)}</div>
        <div class="modal-sub">${iEsc(r.sourceFileName)} · ${iEsc(r.sourceType)} · 상태 ${iEsc(r.status)}</div>
      </div><button class="modal-close" type="button" data-ocr-close aria-label="닫기">×</button></div>
      <div class="modal-body">
        <div class="ocr-tblwrap"><table class="ocr-tbl"><thead><tr><th>순번</th><th>부품명</th><th>부품번호</th><th>부품항목</th><th>수량</th><th>불인</th><th class="num">청구금액</th><th class="num">손해사정금액</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>
        <div class="payres-detail-sub">OCR 수정이력</div>
        <div class="ocr-tblwrap"><table class="ocr-tbl"><thead><tr><th>행</th><th>항목</th><th>변경전</th><th>변경후</th><th>유형</th></tr></thead><tbody>${histHtml}</tbody></table></div>
      </div>
      <div class="modal-foot"><button class="btn-modal primary" type="button" data-ocr-close>닫기</button></div>
    </section>`;
  root.classList.add("open"); root.setAttribute("aria-hidden", "false");
  root.querySelectorAll("[data-ocr-close]").forEach(b => b.addEventListener("click", closeOcrModal));
}
// 견적 탭 가로 사진 뷰어에 표시할 실제 차량 사진 목록 (수리전 → 수리완료 → 사고 → 기타 순)
function estimateStripImages(d) {
  const f = claimImages(d.id);
  const order = ["수리전사진", "수리완료사진", "사고사진", "고객사진", "기타"];
  const list = [];
  order.forEach(folder => (f[folder] || []).forEach(im => { if (im.url) list.push(Object.assign({ folder }, im)); }));
  return list;
}
function intakeEstimatePhotoStrip(d) {
  const imgs = estimateStripImages(d);
  const inner = imgs.length
    ? imgs.map((im, i) => `
        <button type="button" class="es-photo" data-estphoto="${i}" title="${iEsc(im.name)}" data-desc="차량 사진을 확대 뷰어로 엽니다. (클릭 확대 / 우클릭 축소 / Ctrl+휠 확대·축소)">
          <img src="${iEsc(im.url)}" alt="${iEsc(im.name)}" loading="lazy" draggable="false">
          <span class="es-photo-tag">${iEsc(im.folder)}</span>
          <span class="es-photo-name">${iEsc(im.name)}</span>
        </button>`).join("")
    : `<div class="es-strip-empty">등록된 차량 사진이 없습니다.</div>`;
  return `<div class="lg-est-photos">
    <div class="es-strip-head">
      <span class="esh-title">차량 사진</span>
      <span class="esh-hint">사진 클릭 → 확대 보기 · 클릭 확대 / 우클릭 축소 / Ctrl+휠 확대·축소</span>
      <span class="esh-count">${imgs.length}장</span>
    </div>
    <div class="es-strip" id="estPhotoStrip">${inner}</div>
  </div>`;
}
// 견적 테이블 1행 렌더 (기본 견적 행 + AI-OCR 추가부품 행 공용)
function lgEstRowHtml(r) {
  const denied = r.adjust.denied;
  const cls = r.ocr ? ` class="ocr-extra-row${r.unsaved ? " unsaved" : ""}"` : "";
  const grp = r.ocr ? `${iEsc(r.g)} <span class="ocr-rowbadge${r.unsaved ? " unsaved" : ""}">${iEsc(r.badge)}</span>` : iEsc(r.g);
  return `<tr${cls}>
    <td class="grp">${grp}</td>
    <td class="nm">${iEsc(r.n)}</td>
    <td class="it">${iEsc(r.it)}</td>
    <td class="num">${r.base.unit}</td>
    <td class="num amt">${won(r.base.amount)}</td>
    <td class="ck"><input type="checkbox" ${denied ? "checked" : ""} disabled></td>
    <td class="num${denied ? " off" : ""}">${denied ? "-" : r.adjust.unit}</td>
    <td class="num amt${denied ? " off" : ""}">${denied ? "0" : won(r.adjust.amount)}</td>
  </tr>`;
}
function lgEstTableHtml(allRows, baseLabel, sumLabel) {
  const baseSum = estSum(allRows, "base");
  const adjSum = estSum(allRows, "adjust");
  return `<div class="lg-scroll"><table class="lg-est-tbl">
    <colgroup><col style="width:74px"><col><col style="width:96px"><col style="width:52px"><col style="width:88px"><col style="width:40px"><col style="width:52px"><col style="width:88px"></colgroup>
    <thead>
      <tr>
        <th rowspan="2">작업구분</th><th rowspan="2">작업내용</th><th rowspan="2">작업항목</th>
        <th colspan="2" class="grp-claim">${baseLabel}</th>
        <th colspan="3" class="grp-adjust">손해사정</th>
      </tr>
      <tr><th>단위</th><th>금액</th><th>불인</th><th>단위</th><th>금액</th></tr>
    </thead>
    <tbody>${allRows.map(lgEstRowHtml).join("")}</tbody>
    <tfoot>
      <tr>
        <th colspan="3">${sumLabel}</th>
        <td class="num"></td><td class="num amt">${won(baseSum)}</td>
        <td class="ck"></td><td class="num"></td><td class="num amt">${won(adjSum)}</td>
      </tr>
    </tfoot>
  </table></div>`;
}
function intakeEstimateTab(d) {
  const doc = d.estimateDoc;
  if (!doc) {
    // 견적 문서가 없어도 AI-OCR 부품청구서 등록·부품 지급결의는 가능(설계문서 §5.1)
    const extra = ocrClaimExtraRows(d);
    const partsTable = extra.length ? lgEstTableHtml(extra, "청구 내역", "부품 청구 합계") : "";
    const note = extra.length ? "정비 견적(청구서)은 아직 없습니다. 아래는 AI-OCR로 등록한 부품 내역입니다." : "등록된 청구 견적 정보가 없습니다.";
    return `<div class="lg-est-emptybar">
      <div class="lg-est-empty">${note}</div>
      <button type="button" class="ocr-pro-btn" id="ocrProBtn" data-desc="부품청구서를 업로드해 AI-OCR로 전산화하고 부품 지급결의를 생성합니다. (Pro 기능)"><span class="ai">🤖</span> AI-OCR <span class="tag">Pro</span></button>
    </div>${partsTable}${ocrStageBarHtml(d)}${srApprComponentHtml(d)}`;
  }
  const rows = estimateDocType === "pre" ? doc.pre : doc.claim;
  const isPre = estimateDocType === "pre";
  const baseLabel = isPre ? "선견 내역" : "청구 내역";
  const docLabel = isPre ? "선견적" : "청구서";

  // 요약 밴드 (문서 무관 고정 지표): 선견 / 청구 / 지급
  const preTotal = estSum(doc.pre, "base");
  const claimTotal = estSum(doc.claim, "base");
  const band = `<div class="lg-est-band">
    <div class="be-item"><span class="k">선견</span><span class="v">${won(preTotal)}</span></div>
    <div class="be-item"><span class="k">청구</span><span class="v strong">${won(claimTotal)}</span></div>
    <div class="be-item"><span class="k">지급</span><span class="v paid">${won(doc.paidAmount)}</span><span class="tag">${doc.finalPaid ? "최종지급" : ""}</span></div>
    <div class="be-item wide"><span class="k">지급처</span><span class="v">${iEsc(doc.payTo)}</span></div>
  </div>`;

  // 진행 4단계 스텝퍼 (현재 보고 있는 문서의 두 단계를 강조)
  const flow = `<div class="lg-est-flow">
    ${ESTIMATE_STAGES.map((s, i) => `${i ? '<span class="arw">›</span>' : ""}<span class="be-step ${s.doc === estimateDocType ? "on" : ""}">${s.label}</span>`).join("")}
  </div>`;

  // 견적서 전환 토글 + AI-OCR Pro 버튼 (우측)
  const toggle = `<div class="lg-est-toggle" role="tablist">
    <span class="tl">견적서 전환</span>
    <button type="button" class="be-tgl ${isPre ? "on" : ""}" data-estdoc="pre" data-desc="입고 전 개략 견적인 '선견적' 내역으로 표를 전환합니다.">선견적</button>
    <button type="button" class="be-tgl ${!isPre ? "on" : ""}" data-estdoc="claim" data-desc="공업사가 정식 청구한 '청구서' 내역으로 표를 전환합니다.">청구서</button>
    <span class="grow"></span>
    <button type="button" class="ocr-pro-btn" id="ocrProBtn" data-desc="부품청구서를 업로드해 AI-OCR로 전산화하고 부품 지급결의를 생성합니다. (Pro 기능)"><span class="ai">🤖</span> AI-OCR <span class="tag">Pro</span></button>
  </div>`;

  // AI-OCR 부품 행: 청구서 보기에서만 정비 견적과 함께 표시(추가부품). 저장된 부품결의 + 미저장 스테이징.
  const extra = !isPre ? ocrClaimExtraRows(d) : [];
  const allRows = rows.concat(extra);
  const sumLabel = extra.length ? `${docLabel} 합계 (정비+부품)` : `${docLabel} 합계`;
  const table = lgEstTableHtml(allRows, baseLabel, sumLabel);

  return `<div class="lg-est">
    <div class="lg-est-head">
      <div class="be-title"><span class="dot"></span>견적 정보 <span class="be-cur">현재 보기: ${docLabel}</span></div>
    </div>
    ${intakeEstimatePhotoStrip(d)}
    ${flow}
    ${toggle}
    ${band}
    ${table}
    ${!isPre ? ocrStageBarHtml(d) : ""}
  </div>${srApprComponentHtml(d)}`;
}

// 청구서 테이블에 함께 표시할 AI-OCR 부품 행(추가부품) — 저장된 부품결의 + 미저장 스테이징
function ocrRowToEst(row, badge, unsaved) {
  return {
    g: "추가부품", n: row.partName, it: row.partNumber || row.partCategory,
    base: { unit: row.quantity, amount: Number(row.claimAmount || 0) },
    adjust: { denied: !!row.denied, unit: row.quantity, amount: row.denied ? 0 : Number(row.assessedAmount || 0) },
    ocr: true, badge: badge, unsaved: !!unsaved,
  };
}
function ocrClaimExtraRows(d) {
  const out = [];
  (typeof resolutionsFor === "function" ? resolutionsFor(d.id) : []).forEach(res => {
    if (res.resolutionType !== "부품") return;
    res.rows.forEach(row => out.push(ocrRowToEst(row, "결의 " + res.resolutionSeq, false)));
  });
  const staged = (typeof ocrGetStaged === "function") ? ocrGetStaged(d.id) : null;
  if (staged) staged.rows.forEach(row => out.push(ocrRowToEst(row, "미저장", true)));
  return out;
}
// 청구내역 결의 저장 바 — 현재 청구내역(정비 견적/부품)을 지급결의로 저장한다.
//  · 정비 견적 미저장 → 정비결의  · 부품(OCR) 반영분 → 부품결의  · 둘 다면 함께 저장
function ocrStageBarHtml(d) {
  const staged = (typeof ocrGetStaged === "function") ? ocrGetStaged(d.id) : null;
  const hasMech = (typeof resolutionsFor === "function") && resolutionsFor(d.id).some(r => r.resolutionType === "정비");
  const mechRows = (d.estimateDoc && d.estimateDoc.claim) ? d.estimateDoc.claim : [];
  const mechSaveable = !hasMech && mechRows.length > 0;
  if (!staged && !mechSaveable) return "";
  const fault = parseFaultInfo(d.ownDamage && d.ownDamage.faultRate);
  let note, btn;
  if (mechSaveable && staged) { note = `정비 견적 + 부품청구서 <b>${iEsc(staged.fileName)}</b>를 지급결의로 함께 저장합니다.`; btn = "청구서 결의 저장 (정비+부품)"; }
  else if (mechSaveable) { note = "정비 견적(청구서)을 정비 지급결의로 저장합니다."; btn = "정비 지급결의 저장"; }
  else { note = `부품청구서 <b>${iEsc(staged.fileName)}</b> · ${staged.rows.length}개 항목을 부품 지급결의로 저장합니다.`; btn = "부품 지급결의 저장"; }
  return `<div class="ocr-savebar${staged ? " unsaved" : ""}">
    <span class="ocr-savebar-note">💾 ${note}</span>
    <span class="grow"></span>
    ${fault.confirmed ? "" : `<span class="ocr-fault-warn">과실율 확정 후 결의입력하세요</span>`}
    ${staged ? `<button type="button" class="lg-abtn" id="ocrStageCancel" data-desc="반영한 미저장 부품 내역을 취소합니다.">부품 취소</button>` : ""}
    <button type="button" class="lg-abtn primary" id="ocrStageSave" ${fault.confirmed ? "" : "disabled"} data-desc="현재 청구내역(정비 견적/부품)을 지급결의로 저장합니다.">${btn}</button>
  </div>`;
}
function bindIntakeEstimate(d) {
  document.querySelectorAll("[data-estdoc]").forEach(b => b.addEventListener("click", () => {
    if (estimateDocType === b.dataset.estdoc) return;
    estimateDocType = b.dataset.estdoc;
    const bodyEl = $("#intakeBody");
    if (bodyEl) {
      bodyEl.innerHTML = renderIntakeTab(intakeTab, d);
      bindIntakeEstimate(d); // 토글 재바인딩
      bindIntakeApprForm(d); // 결재 폼 재바인딩
    }
  }));
  // 가로 사진 뷰어 — 썸네일 클릭 시 확대 뷰어 오픈
  const strip = $("#estPhotoStrip");
  if (strip) {
    const imgs = estimateStripImages(d);
    strip.querySelectorAll("[data-estphoto]").forEach(btn => btn.addEventListener("click", () => {
      openImageZoom(imgs, parseInt(btn.dataset.estphoto, 10) || 0);
    }));
  }
  // AI-OCR Pro 버튼 — 과실률 확정 여부와 무관하게 활성(설계문서 §5.1)
  const ocrBtn = $("#ocrProBtn");
  if (ocrBtn && typeof openOcrUpload === "function") ocrBtn.addEventListener("click", () => openOcrUpload(d));
  // 미저장 부품 저장/취소 바
  const stageSave = $("#ocrStageSave");
  if (stageSave && typeof saveClaimResolutions === "function") stageSave.addEventListener("click", () => saveClaimResolutions(d));
  const stageCancel = $("#ocrStageCancel");
  if (stageCancel && typeof cancelStagedOcr === "function") stageCancel.addEventListener("click", () => cancelStagedOcr(d));
  bindIntakeApprForm(d);   // 결재 폼 최초 바인딩
}

/* ===================== 이미지 확대 뷰어 + 주석(캔버스) =====================
   - 이동 도구: 클릭 확대 / 우클릭 축소 / Ctrl+휠 확대·축소 / 드래그 팬
   - 주석 도구: 펜·사각형·원·텍스트·모자이크 + 색상 팔레트, 되돌리기/전체지우기
   - 주석은 사진별 벡터 op로 저장 → 확대·이동·전환 시 캔버스에 다시 그림
   - 이전/다음 · ESC 지원 */
const IZ_COLORS = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#111111", "#ffffff"];
function openImageZoom(images, startIndex) {
  if (!images || !images.length) return;
  const root = $("#imgZoomRoot");
  if (!root) return;
  const ZOOM_STEP = 1.4, ZOOM_MAX = 8, LINE_W = 4, TEXT_PX = 26, MOSAIC_BLOCK = 12;
  let idx = Math.min(Math.max(startIndex | 0, 0), images.length - 1);
  let scale = 1, minScale = 1, tx = 0, ty = 0;      // 현재 이미지 변환 상태
  let natW = 0, natH = 0;                            // 이미지 원본 크기
  let tool = "pan";                                 // pan|pen|rect|ellipse|text|mosaic
  let color = IZ_COLORS[0];
  const opsByIdx = {};                              // 사진 idx별 주석 op 배열
  let ops = [];                                     // 현재 사진 op 배열(opsByIdx[idx] 참조)
  let drawing = null;                               // 그리는 중인 op

  const tools = [
    ["pan", "이동"], ["pen", "펜"], ["rect", "사각형"], ["ellipse", "원"],
    ["text", "텍스트"], ["mosaic", "모자이크"],
  ];
  root.innerHTML = `
    <div class="modal-backdrop" data-zoom-close></div>
    <section class="iz-modal" role="dialog" aria-modal="true" aria-label="차량 사진 확대 보기">
      <button type="button" class="iz-close" aria-label="닫기" data-zoom-close>×</button>
      <div class="iz-anntools" id="izAnnTools">
        ${tools.map(([t, label]) => `<button type="button" class="iz-tool ${t === "pan" ? "on" : ""}" data-tool="${t}">${label}</button>`).join("")}
        <span class="iz-annsep"></span>
        <span class="iz-colors">${IZ_COLORS.map((c, i) => `<button type="button" class="iz-swatch ${i === 0 ? "on" : ""}" data-color="${c}" style="background:${c}" aria-label="색상 ${c}"></button>`).join("")}</span>
        <span class="iz-annsep"></span>
        <button type="button" class="iz-tool" data-ann="undo">되돌리기</button>
        <button type="button" class="iz-tool" data-ann="clear">전체지우기</button>
      </div>
      <button type="button" class="iz-nav prev" aria-label="이전 사진" data-zoom-prev>‹</button>
      <div class="iz-stage" id="izStage">
        <img class="iz-img" id="izImg" alt="" draggable="false">
        <canvas class="iz-canvas" id="izCanvas"></canvas>
      </div>
      <button type="button" class="iz-nav next" aria-label="다음 사진" data-zoom-next>›</button>
      <div class="iz-toolbar">
        <span class="iz-name" id="izName"></span>
        <span class="iz-count" id="izCount"></span>
        <span class="iz-sp"></span>
        <button type="button" class="iz-tbtn" data-zoom-out aria-label="축소">−</button>
        <span class="iz-pct" id="izPct">100%</span>
        <button type="button" class="iz-tbtn" data-zoom-in aria-label="확대">+</button>
        <button type="button" class="iz-tbtn" data-zoom-reset>맞춤</button>
      </div>
    </section>`;
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");

  const stage = $("#izStage");
  const imgEl = $("#izImg");
  const canvas = $("#izCanvas");
  const cctx = canvas.getContext("2d");
  const mos = document.createElement("canvas");   // 모자이크용 스크래치 캔버스
  const mctx = mos.getContext("2d");

  const setCursor = () => {
    stage.classList.toggle("draw", tool !== "pan" && tool !== "text");
    stage.classList.toggle("text", tool === "text");
    stage.classList.toggle("pan", tool === "pan");
  };
  const apply = () => {
    const tf = `translate(${tx}px, ${ty}px) scale(${scale})`;
    imgEl.style.transform = tf;
    canvas.style.transform = tf;
    const pct = $("#izPct");
    if (pct) pct.textContent = Math.round((scale / minScale) * 100) + "%";
    stage.classList.toggle("zoomed", tool === "pan" && scale > minScale * 1.01);
  };
  const clampPan = () => {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const iw = natW * scale, ih = natH * scale;
    tx = iw <= sw ? (sw - iw) / 2 : Math.min(0, Math.max(sw - iw, tx));
    ty = ih <= sh ? (sh - ih) / 2 : Math.min(0, Math.max(sh - ih, ty));
  };
  const fit = () => {
    const sw = stage.clientWidth, sh = stage.clientHeight;
    if (!natW || !natH || !sw || !sh) return;
    minScale = Math.min(sw / natW, sh / natH);
    scale = minScale;
    clampPan();
    apply();
    imgEl.style.opacity = "1";
  };
  const zoomAt = (factor, cx, cy) => {
    const next = Math.min(Math.max(scale * factor, minScale), minScale * ZOOM_MAX);
    if (next === scale) return;
    const ratio = next / scale;
    tx = cx - (cx - tx) * ratio;
    ty = cy - (cy - ty) * ratio;
    scale = next;
    clampPan();
    apply();
  };
  const stageCenter = () => [stage.clientWidth / 2, stage.clientHeight / 2];
  const relPos = e => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  // 화면 좌표 → 이미지(캔버스) 원본 좌표
  const imgCoord = (rx, ry) => [(rx - tx) / scale, (ry - ty) / scale];

  // ── 주석 그리기 ─────────────────────────────
  const norm = op => ({ x: Math.min(op.x, op.x + op.w), y: Math.min(op.y, op.y + op.h), w: Math.abs(op.w), h: Math.abs(op.h) });
  const drawOp = op => {
    cctx.save();
    if (op.type === "pen") {
      cctx.strokeStyle = op.color; cctx.lineWidth = op.size; cctx.lineCap = "round"; cctx.lineJoin = "round";
      cctx.beginPath();
      op.points.forEach((p, i) => i ? cctx.lineTo(p.x, p.y) : cctx.moveTo(p.x, p.y));
      cctx.stroke();
    } else if (op.type === "rect") {
      const r = norm(op); cctx.strokeStyle = op.color; cctx.lineWidth = op.size;
      cctx.strokeRect(r.x, r.y, r.w, r.h);
    } else if (op.type === "ellipse") {
      const r = norm(op); cctx.strokeStyle = op.color; cctx.lineWidth = op.size;
      cctx.beginPath();
      cctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, Math.max(1, r.w / 2), Math.max(1, r.h / 2), 0, 0, Math.PI * 2);
      cctx.stroke();
    } else if (op.type === "text") {
      cctx.fillStyle = op.color; cctx.textBaseline = "top";
      cctx.font = `700 ${op.size}px 'Malgun Gothic', sans-serif`;
      cctx.fillText(op.text, op.x, op.y);
    } else if (op.type === "mosaic") {
      const r = norm(op);
      const tw = Math.max(1, Math.round(r.w / MOSAIC_BLOCK)), th = Math.max(1, Math.round(r.h / MOSAIC_BLOCK));
      mos.width = tw; mos.height = th;
      mctx.imageSmoothingEnabled = false;
      mctx.drawImage(imgEl, r.x, r.y, Math.max(1, r.w), Math.max(1, r.h), 0, 0, tw, th);
      cctx.imageSmoothingEnabled = false;
      cctx.drawImage(mos, 0, 0, tw, th, r.x, r.y, Math.max(1, r.w), Math.max(1, r.h));
    }
    cctx.restore();
  };
  const redraw = () => {
    cctx.clearRect(0, 0, canvas.width, canvas.height);
    ops.forEach(drawOp);
    if (drawing) drawOp(drawing);
  };

  // ── 텍스트 입력 ─────────────────────────────
  const openTextInput = (rx, ry, ix, iy) => {
    const inp = document.createElement("input");
    inp.className = "iz-textin";
    inp.style.left = rx + "px"; inp.style.top = ry + "px";
    inp.style.color = color; inp.style.fontSize = (TEXT_PX * scale) + "px";
    stage.appendChild(inp);
    inp.focus();
    let committed = false;
    const commit = () => {
      if (committed) return; committed = true;
      const text = inp.value.trim();
      if (text) { ops.push({ type: "text", color, size: TEXT_PX, x: ix, y: iy, text }); redraw(); }
      inp.remove();
    };
    inp.addEventListener("keydown", ev => {
      ev.stopPropagation();
      if (ev.key === "Enter") commit();
      else if (ev.key === "Escape") { committed = true; inp.remove(); }
    });
    inp.addEventListener("blur", commit);
  };

  const load = () => {
    const im = images[idx];
    $("#izName").textContent = im.name + (im.folder ? ` · ${im.folder}` : "");
    $("#izCount").textContent = `${idx + 1} / ${images.length}`;
    ops = opsByIdx[idx] || (opsByIdx[idx] = []);
    drawing = null;
    natW = 0; natH = 0;
    imgEl.style.opacity = "0";
    imgEl.onload = () => {
      natW = imgEl.naturalWidth; natH = imgEl.naturalHeight;
      canvas.width = natW; canvas.height = natH;
      fit();
      redraw();
    };
    imgEl.src = im.url;
    root.querySelector(".iz-nav.prev").style.visibility = images.length > 1 ? "" : "hidden";
    root.querySelector(".iz-nav.next").style.visibility = images.length > 1 ? "" : "hidden";
  };
  const go = step => { idx = (idx + step + images.length) % images.length; load(); };

  // ── 포인터 상호작용(도구별 분기) ─────────────
  let down = null, moved = false;
  stage.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const [rx, ry] = relPos(e);
    if (tool === "pan") {
      down = { x: e.clientX, y: e.clientY, tx, ty }; moved = false;
      stage.setPointerCapture(e.pointerId);
    } else if (tool === "text") {
      const [ix, iy] = imgCoord(rx, ry);
      openTextInput(rx, ry, ix, iy);
    } else {
      const [ix, iy] = imgCoord(rx, ry);
      drawing = tool === "pen"
        ? { type: "pen", color, size: LINE_W, points: [{ x: ix, y: iy }] }
        : { type: tool, color, size: LINE_W, x: ix, y: iy, w: 0, h: 0 };
      stage.setPointerCapture(e.pointerId);
    }
  });
  stage.addEventListener("pointermove", e => {
    if (down) {                                   // 팬
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!moved && Math.hypot(dx, dy) > 4) moved = true;
      if (moved && scale > minScale * 1.01) { tx = down.tx + dx; ty = down.ty + dy; clampPan(); apply(); }
    } else if (drawing) {                         // 주석 그리는 중
      const [rx, ry] = relPos(e); const [ix, iy] = imgCoord(rx, ry);
      if (drawing.type === "pen") drawing.points.push({ x: ix, y: iy });
      else { drawing.w = ix - drawing.x; drawing.h = iy - drawing.y; }
      redraw();
    }
  });
  stage.addEventListener("pointerup", e => {
    if (down) {
      const wasClick = !moved; down = null;
      if (wasClick) { const [cx, cy] = relPos(e); zoomAt(ZOOM_STEP, cx, cy); }   // 이동 도구 클릭 → 확대
    } else if (drawing) {
      const keep = drawing.type === "pen"
        ? drawing.points.length > 1
        : (Math.abs(drawing.w) > 2 && Math.abs(drawing.h) > 2);
      if (keep) ops.push(drawing);
      drawing = null; redraw();
    }
  });
  stage.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (tool !== "pan") return;                   // 주석 모드에선 브라우저 메뉴만 차단
    const [cx, cy] = relPos(e);
    zoomAt(1 / ZOOM_STEP, cx, cy);                // 이동 도구: 우클릭 축소
  });
  stage.addEventListener("wheel", e => {          // Ctrl+휠 → 확대/축소(모든 도구)
    if (!e.ctrlKey) return;
    e.preventDefault();
    const [cx, cy] = relPos(e);
    zoomAt(e.deltaY > 0 ? ZOOM_STEP : 1 / ZOOM_STEP, cx, cy);
  }, { passive: false });

  // ── 툴바 ────────────────────────────────────
  const annTools = $("#izAnnTools");
  annTools.addEventListener("click", e => {
    const tbtn = e.target.closest("[data-tool]");
    if (tbtn) {
      tool = tbtn.dataset.tool;
      annTools.querySelectorAll("[data-tool]").forEach(b => b.classList.toggle("on", b === tbtn));
      setCursor(); apply();
      return;
    }
    const sw = e.target.closest("[data-color]");
    if (sw) {
      color = sw.dataset.color;
      annTools.querySelectorAll(".iz-swatch").forEach(b => b.classList.toggle("on", b === sw));
      return;
    }
    const ann = e.target.closest("[data-ann]");
    if (ann) {
      if (ann.dataset.ann === "undo") ops.pop();
      else if (ann.dataset.ann === "clear") ops.length = 0;
      redraw();
    }
  });

  const close = () => {
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onResize);
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = "";
  };
  const onKey = e => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "+" || e.key === "=") { const [cx, cy] = stageCenter(); zoomAt(ZOOM_STEP, cx, cy); }
    else if (e.key === "-") { const [cx, cy] = stageCenter(); zoomAt(1 / ZOOM_STEP, cx, cy); }
  };
  const onResize = () => { fit(); redraw(); };
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  root.querySelectorAll("[data-zoom-close]").forEach(el => el.addEventListener("click", close));
  root.querySelector("[data-zoom-prev]").addEventListener("click", () => go(-1));
  root.querySelector("[data-zoom-next]").addEventListener("click", () => go(1));
  root.querySelector("[data-zoom-in]").addEventListener("click", () => { const [cx, cy] = stageCenter(); zoomAt(ZOOM_STEP, cx, cy); });
  root.querySelector("[data-zoom-out]").addEventListener("click", () => { const [cx, cy] = stageCenter(); zoomAt(1 / ZOOM_STEP, cx, cy); });
  root.querySelector("[data-zoom-reset]").addEventListener("click", fit);

  setCursor();
  load();
}

function bindIntakeWorkbench(d) {
  const memoSave = $("#intakeMemoSave");
  if (memoSave) memoSave.addEventListener("click", () => {
    const memoType = $("#intakeMemoType").value;
    const memoTarget = $("#intakeMemoTarget").value.trim();
    const memoText = $("#intakeMemoText").value.trim();
    if (!memoText) {
      showToast("저장할 진행 메모를 입력하세요.");
      return;
    }
    const row = {
      at: intakeNowLabel(),
      type: memoType,
      text: memoTarget ? `${memoTarget} · ${memoText}` : memoText,
    };
    if (!intakeProgressLogs[d.id]) intakeProgressLogs[d.id] = [];
    intakeProgressLogs[d.id].unshift(row);
    memos[d.id] = memoText;
    showToast(`${d.id} 진행 메모가 저장되었습니다.`);
    renderIntake();
  });

  const attrSave = $("#intakeAttrSave");
  if (attrSave) attrSave.addEventListener("click", () => {
    const attrs = Array.from(document.querySelectorAll('input[name="intakeAttr"]:checked')).map(x => x.value);
    const fields = {};
    document.querySelectorAll("[data-attr-field]").forEach(el => {
      const v = el.value.trim();
      if (v) fields[el.dataset.attrField] = v;
    });
    const custom = [0, 1].map(i => ({
      checked: !!document.querySelector(`[data-custom-check="${i}"]`)?.checked,
      text: (document.querySelector(`[data-custom-text="${i}"]`)?.value || "").trim(),
    }));
    const noteEl = $("#intakeAttrNote");                       // 메모 필드 제거됨 → 기존 값 유지
    const note = noteEl ? noteEl.value.trim() : (getIntakeProperty(d.id, d).note || "");
    intakePropertyState[d.id] = { attrs, fields, custom, note };
    const detail = INTAKE_DETAIL[d.id] || (INTAKE_DETAIL[d.id] = {});
    detail.unresolved = attrs;
    // 미결일괄조회 목록용 표시값 — 체크한 속성을 "속성명 - 메모"(메모 있을 때) 형태로 구성.
    // 표준 속성(INTAKE_ATTRS 순서) → 담당자 자유입력 순으로 정렬한다.
    const props = [];
    INTAKE_ATTRS.forEach(a => {
      if (!attrs.includes(a.key)) return;
      const memo = (fields[a.key] || "").trim();
      props.push(memo ? `${a.key} - ${memo}` : a.key);
    });
    custom.forEach(row => { if (row.checked && row.text) props.push(row.text); });
    const claim = CLAIMS.find(x => x.id === d.id);
    if (claim) {
      claim.unresolvedProps = props;   // 미결일괄조회 리스트(미결속성1·2·3)에 반영
      if (attrs.length) claim.actionType = attrs[0];
      if (note) {
        claim.actionDesc = note;
        claim.nextAction = `${attrs[0] || "미결"} 속성 확인 후 후속 조치를 진행하세요.`;
      }
    }
    showToast(`${d.id} 미결 속성이 미결일괄조회에 반영되었습니다.`);
    if (typeof renderAll === "function") renderAll();
    renderIntake();
  });

  // 진행 이력 채널(구분) 필터 — 선택 즉시 목록만 갱신 (메모 입력값 보존)
  document.querySelectorAll('input[name="lgHistFilter"]').forEach(r => r.addEventListener("change", () => {
    if (!r.checked) return;
    intakeLogFilter = r.value;
    const box = $("#intakeLogBox");
    if (box) box.innerHTML = intakeLogTableHtml(getIntakeLogs(d.id));
  }));
}

// 담당자 입력 파손부위 클릭 토글 (차량 부위 손상 · 우측 도식)
function dmSetField(s, path, val) {
  if (path.indexOf(".") >= 0) { const [a, b] = path.split("."); (s[a] = s[a] || {})[b] = val; }
  else s[path] = val;
}
function dmRecalcEstimate(body, s) {
  const vat = body.querySelector("#dmEstVat");
  if (vat) vat.textContent = won(Math.round(dmNumOf(s.estimate) * 1.1));
}
function bindIntakeDamage(d) {
  // 담당자 확인 파손부위 선택
  const set = intakeStaffParts[d.id] || (intakeStaffParts[d.id] = new Set());
  document.querySelectorAll("[data-staff-part]").forEach(el => {
    el.addEventListener("click", () => {
      const part = el.dataset.staffPart;
      if (set.has(part)) { set.delete(part); el.classList.remove("on"); }
      else { set.add(part); el.classList.add("on"); }
    });
  });
  // 피해 진행 / 공업사·수리 편집 컨트롤
  const body = $("#intakeBody"); if (!body) return;
  const s = getDamageState(d.id, d);
  body.querySelectorAll("[data-dm]").forEach(el => {
    const ev = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(ev, () => {
      dmSetField(s, el.dataset.dm, el.value);
      if (el.dataset.dm === "ownState") {           // 자차상태 → 처리상태 옵션 + 수리여부 활성 갱신
        const opts = DM_PROC_OPTS[el.value] || [];
        s.procState = opts[0] || "";
        const ps = body.querySelector("#dmProcState");
        if (ps) ps.innerHTML = opts.map(o => `<option ${o === s.procState ? "selected" : ""}>${iEsc(o)}</option>`).join("");
        const rep = body.querySelector("#dmRepaired");
        if (rep) rep.disabled = (el.value !== "분손");
      }
      if (el.dataset.dm === "estimate") dmRecalcEstimate(body, s);
    });
  });
  body.querySelectorAll("[data-dmlost]").forEach(cb => cb.addEventListener("change", () => {
    const v = cb.dataset.dmlost;
    if (cb.checked) { if (!s.lost.includes(v)) s.lost.push(v); }
    else s.lost = s.lost.filter(x => x !== v);
  }));
  const sb = body.querySelector("#dmShopSearch");
  if (sb) sb.addEventListener("click", () => openShopSearchModal(d, s));
}
// 공업사 검색·지정 팝업
function openShopSearchModal(d, s) {
  let root = document.getElementById("dmShopRoot");
  if (!root) { root = document.createElement("div"); root.id = "dmShopRoot"; document.body.appendChild(root); }
  const base = (typeof SHOPS !== "undefined" ? SHOPS : []);
  const shops = base.map((nm, i) => ({ nm, phone: `0${31 + (i % 40)}-${300 + i * 7}-${(1000 + i * 137) % 9000 + 1000}` }));
  const close = () => { root.classList.remove("open"); root.innerHTML = ""; };
  function render(filter) {
    const list = shops.filter(x => !filter || x.nm.indexOf(filter) >= 0);
    root.className = "ct-modal-root open";
    root.innerHTML = `
      <div class="ct-modal-bd"></div>
      <div class="ct-modal" role="dialog" aria-modal="true" aria-label="공업사 검색">
        <div class="ct-modal-h"><b>공업사 검색 · 지정</b><button type="button" class="ct-modal-x" aria-label="닫기">×</button></div>
        <div class="ct-modal-b">
          <input type="text" id="dmShopQuery" class="lg-cin" placeholder="공업사명 검색" value="${iEsc(filter || "")}" style="margin-bottom:10px">
          <div class="lg-shoplist">${list.length ? list.map(x => `<button type="button" class="lg-shopitem" data-shop="${iEsc(x.nm)}" data-phone="${iEsc(x.phone)}"><span class="nm">${iEsc(x.nm)}</span><span class="ph">${iEsc(x.phone)}</span></button>`).join("") : `<div class="lg-shopempty">검색 결과가 없습니다.</div>`}</div>
        </div>
      </div>`;
    root.querySelector(".ct-modal-bd").addEventListener("click", close);
    root.querySelector(".ct-modal-x").addEventListener("click", close);
    const q = root.querySelector("#dmShopQuery");
    q.addEventListener("input", () => render(q.value));
    q.focus(); q.setSelectionRange(q.value.length, q.value.length);
    root.querySelectorAll("[data-shop]").forEach(b => b.addEventListener("click", () => {
      s.shopName = b.dataset.shop; s.shopPhone = b.dataset.phone;
      close();
      $("#intakeBody").innerHTML = renderIntakeTab("damage", d);
      bindIntakeDamage(d);
      showToast(`${s.shopName} 공업사를 지정했습니다.`);
    }));
  }
  render("");
}

function normalizeIntakeText(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

function intakeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function claimNoMatches(claimId, value) {
  const query = normalizeIntakeText(value);
  const queryDigits = intakeDigits(value);
  const normalizedId = normalizeIntakeText(claimId).replace(/-/g, "");
  const idDigits = intakeDigits(claimId);
  if (!query) return false;
  return normalizedId === query.replace(/-/g, "")
    || claimId.toUpperCase() === query
    || (queryDigits.length >= 4 && idDigits.endsWith(queryDigits));
}

function intakePhoneForType(type, d) {
  if (type === "피보험자 휴대폰") return d.parties.insured.phone;
  if (type === "통보자 휴대폰") return d.parties.notifier.phone;
  if (type === "운전자 휴대폰") return d.parties.driver.phone;
  if (type === "소유자 휴대폰") return d.parties.owner.phone;
  if (type === "피해자 휴대폰") {
    const row = d.damageList.find(r => r.ownerPhone) || {};
    return row.ownerPhone || d.damage.owner || "";
  }
  return "";
}

function intakePhoneParts(phone) {
  const n = intakeDigits(phone);
  return [n.slice(0, 3), n.slice(3, 7), n.slice(7, 11)];
}

function readIntakeSearchValue() {
  const fields = Array.from(document.querySelectorAll("#intakeSearchFields input"));
  if (!fields.length) return "";
  return /휴대폰/.test(intakeQueryType)
    ? fields.map(input => input.value.trim()).join("")
    : fields[0].value.trim();
}

function intakeClaimMatches(c, type, value) {
  if (!value.trim()) return false;
  const d = getIntakeData(c.id);
  if (!d) return false;
  if (type === "사고번호") return claimNoMatches(c.id, value);
  if (type === "차량번호") return normalizeIntakeText(c.car) === normalizeIntakeText(value);
  if (type === "피해차량번호") {
    return d.damageList.some(r => normalizeIntakeText(r.carNo) === normalizeIntakeText(value));
  }
  if (/휴대폰/.test(type)) {
    return intakeDigits(intakePhoneForType(type, d)) === intakeDigits(value);
  }
  return false;
}

function runIntakeSearch() {
  const type = $("#intakeQueryType") ? $("#intakeQueryType").value : intakeQueryType;
  intakeQueryType = INTAKE_QUERY_TYPES.includes(type) ? type : INTAKE_QUERY_TYPES[0];
  const value = readIntakeSearchValue();
  if (!value.trim()) {
    showToast("조회할 값을 입력하세요.");
    return;
  }
  const matches = CLAIMS.filter(c => intakeClaimMatches(c, intakeQueryType, value));
  if (!matches.length) {
    showToast("조회 조건에 해당하는 사고건이 없습니다.");
    return;
  }
  // 사고일자 기준 내림차순 정렬 (가장 최근 접수건이 먼저)
  matches.sort((a, b) => intakeSortDate(b.id).localeCompare(intakeSortDate(a.id)));
  intakeResults = matches.map(c => c.id);
  intakeListPage = 0;
  intakeClaimId = matches[0].id;
  selectedId = matches[0].id;
  renderIntake();
  showToast(matches.length > 1
    ? `${matches.length}건이 조회되었습니다. 목록에서 사고건을 선택하세요.`
    : `${matches[0].id} 건을 조회했습니다.`);
}

function bindIntakeSearchInputs() {
  document.querySelectorAll("#intakeSearchFields input").forEach(input => {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") runIntakeSearch();
    });
  });
}

// 조회구분에 따라 검색 입력 필드를 다르게 렌더 (휴대폰 = 3칸 010-1234-1234)
function intakeSearchFieldsHtml(type, d) {
  if (/휴대폰/.test(type)) {
    const [p1, p2, p3] = intakePhoneParts(intakePhoneForType(type, d));
    return `<input class="lg-input" maxlength="3" inputmode="numeric" placeholder="010" value="${iEsc(p1)}" style="width:52px">
      <span class="dash">-</span>
      <input class="lg-input" maxlength="4" inputmode="numeric" placeholder="1234" value="${iEsc(p2)}" style="width:60px">
      <span class="dash">-</span>
      <input class="lg-input" maxlength="4" inputmode="numeric" placeholder="1234" value="${iEsc(p3)}" style="width:60px">`;
  }
  if (type === "차량번호" || type === "피해차량번호") {
    return `<input class="lg-input" value="${iEsc(d.car)}" placeholder="12가3456" style="width:130px">`;
  }
  // 사고번호(기본): 접수번호 단일 입력 (담보는 자차 고정이라 선택 불필요)
  return `<input class="lg-input" value="${iEsc(d.id)}" placeholder="사고접수번호" style="width:150px">`;
}

function renderIntake() {
  // 결재 이력/추산이력 표시를 위해 공용 APPROVALS 시드 1회 주입 (common.js)
  if (typeof seedApprovals === "function" && !apprSeeded) { seedApprovals(); apprSeeded = true; }
  if (typeof loadClaimResolutionState === "function") loadClaimResolutionState();
  const id = intakeClaimId || selectedId || (CLAIMS[0] && CLAIMS[0].id);
  intakeClaimId = id;
  // 조회 결과 목록: 없거나 현재 선택이 목록에 없으면 단건으로 초기화
  if (!intakeResults || !intakeResults.includes(id)) { intakeResults = [id]; intakeListPage = 0; }
  const d = getIntakeData(id);
  const root = $("#intakeRoot");
  if (!d) { root.innerHTML = `<div style="padding:40px;text-align:center;color:#8a90a0">표시할 사고건이 없습니다.</div>`; return; }
  const done = d.procStatus === "완료";
  const saved = !!intakeSaved[id];   // 접수지 저장 여부 (모든 탭 공통)
  const closeLocked = !saved;        // 저장 후에만 면책/지급 선택·종결 가능
  const tabLabel = intakeTab === "contract" ? "계약 사고 정보" : intakeTab === "damage" ? "피해 진행 정보" : "청구 견적 정보";
  const closeType = intakeCloseType[id] || "지급"; // 종결 구분 기본값: 지급
  const unresolvedText = (d.unresolved && d.unresolved.length) ? d.unresolved.join(", ") : "없음";
  const queryType = INTAKE_QUERY_TYPES.includes(intakeQueryType) ? intakeQueryType : INTAKE_QUERY_TYPES[0];
  root.innerHTML = `
    <button class="lg-back" type="button" id="intakeBack" data-desc="미결일괄조회 목록 화면으로 돌아갑니다.">← 목록으로</button>
    <div class="lg">
      <div class="lg-window">
        <div class="lg-search">
          <span class="lk">조회구분</span>
          <select class="lg-select" id="intakeQueryType" data-desc="조회 기준(사고번호·차량번호·휴대폰 등)을 선택합니다. 선택한 기준에 맞춰 아래 입력칸이 바뀝니다.">${INTAKE_QUERY_TYPES.map(t => `<option value="${iEsc(t)}" ${t === queryType ? "selected" : ""}>${iEsc(t)}</option>`).join("")}</select>
          <span id="intakeSearchFields" class="lg-search-fields" data-desc="선택한 조회구분에 맞는 값을 입력해 사고건을 조회합니다. (입력 후 Enter로도 조회)">${intakeSearchFieldsHtml(queryType, d)}</span>
          <span class="grow"></span>
          <div class="lg-search-btns"><button class="lg-sbtn" type="button" id="intakeSearchBtn" data-desc="입력한 조건으로 사고건을 조회해 접수지에 불러옵니다.">🔍 검색</button><button class="lg-sbtn gray" type="button" id="intakeResetBtn" data-desc="조회구분과 입력값을 처음 상태로 되돌립니다.">↻ 재설정</button></div>
        </div>
        <div class="lg-body">
          ${intakeListHtml()}
          ${lgIdBand(d)}
          ${lgRow2(d)}
          ${intakeWorkbenchHtml(d)}
          <div class="lg-tabs">
            <button class="lg-tab ${intakeTab === "contract" ? "active" : ""}" type="button" data-itab="contract" data-desc="계약자·사고 관련자·사고/출동·계약 등 접수 기본 정보를 봅니다.">계약 사고 정보</button>
            <button class="lg-tab ${intakeTab === "damage" ? "active" : ""}" type="button" data-itab="damage" data-desc="피해물·공업사 수리 정보와 차량 파손부위(정비공장 청구 ↔ 담당자 확인)를 대조합니다.">피해 진행 정보</button>
            <button class="lg-tab ${intakeTab === "estimate" ? "active" : ""}" type="button" data-itab="estimate" data-desc="선견적·청구서 견적 내역과 손해사정 비교, 추산·지급 결재를 처리합니다.">청구 견적 정보</button>
          </div>
          <div class="lg-tabbody" id="intakeBody">${renderIntakeTab(intakeTab, d)}</div>
          <div class="lg-actionbar">
            <span class="lg-std" data-desc="현재 이 사고건에 남아 있는 미결 속성(재통화·VOC 등) 태그입니다.">미결 태그: ${iEsc(unresolvedText)}</span>
            <span class="sp"></span>
            <span class="lg-savetag ${saved ? "on" : ""}" data-desc="${saved ? "접수지가 저장되어 청구 견적 탭에서 추산을 등록하고 면책/지급 종결을 할 수 있습니다." : "계약 사고 정보·피해 진행 정보를 저장해야 청구 견적 탭에서 추산을 등록하고 면책/지급 종결을 할 수 있습니다."}">${saved ? "저장됨 ✓" : "미저장"}</span>
            <div class="lg-close-type" role="radiogroup" aria-label="종결 구분">
              ${["면책", "지급"].map(t => `<label class="lg-ctype ${closeType === t ? "on" : ""} ${closeLocked ? "disabled" : ""}" data-desc="${closeLocked ? "먼저 '저장'을 눌러 접수지를 저장한 후 종결 구분(면책/지급)을 선택할 수 있습니다." : `이 사고건을 '${t}'(으)로 종결 처리할 구분으로 지정합니다.`}"><input type="radio" name="intakeCloseType" value="${t}" ${closeType === t ? "checked" : ""} ${(done || closeLocked) ? "disabled" : ""}>${t}</label>`).join("")}
            </div>
            <button class="lg-abtn" type="button" id="intakeSave" data-desc="현재 '${iEsc(tabLabel)}' 탭의 입력 내용을 저장합니다. 계약 사고 정보·피해 진행 정보를 저장해야 청구 견적 탭에서 추산(선견적)을 등록하고 면책/지급 종결을 진행할 수 있습니다.">저장</button>
            <button class="lg-abtn primary" type="button" id="intakeComplete" ${(done || !saved) ? "disabled" : ""} data-desc="${saved ? "선택한 구분(면책/지급)으로 이 사고건을 종결 처리합니다." : "접수지를 저장한 후 종결할 수 있습니다. 저장 전에는 비활성화됩니다."}">${done ? "종결됨" : "종결"}</button>
          </div>
        </div>
      </div>
    </div>`;

  $("#intakeBack").addEventListener("click", () => { window.location.href = VIEW_FILES.claims; });
  // 사고 접수 목록 — 행 클릭 시 상세 전환, 페이지 번호로 과거건 이동
  root.querySelectorAll(".lg-lrow[data-listid]").forEach(r => r.addEventListener("click", () => {
    const rid = r.dataset.listid;
    if (rid === intakeClaimId) return;
    intakeClaimId = rid; selectedId = rid;
    renderIntake();
  }));
  root.querySelectorAll("[data-listpage]").forEach(b => b.addEventListener("click", () => {
    intakeListPage = parseInt(b.dataset.listpage, 10) || 0;
    renderIntake();
  }));
  root.querySelectorAll("[data-itab]").forEach(b => b.addEventListener("click", () => {
    intakeTab = b.dataset.itab;
    renderIntake();
  }));
  bindIntakeWorkbench(d);
  bindIntakeEstimate(d);
  if (intakeTab === "damage") bindIntakeDamage(d);
  const qt = $("#intakeQueryType");
  if (qt) qt.addEventListener("change", () => {
    intakeQueryType = INTAKE_QUERY_TYPES.includes(qt.value) ? qt.value : INTAKE_QUERY_TYPES[0];
    const box = $("#intakeSearchFields");
    if (box) box.innerHTML = intakeSearchFieldsHtml(intakeQueryType, d);
    bindIntakeSearchInputs();
  });
  const sb = $("#intakeSearchBtn");
  if (sb) sb.addEventListener("click", runIntakeSearch);
  const rb = $("#intakeResetBtn");
  if (rb) rb.addEventListener("click", () => {
    intakeQueryType = INTAKE_QUERY_TYPES[0];
    intakeResults = null; intakeListPage = 0;   // 목록 단건으로 초기화
    renderIntake();
  });
  bindIntakeSearchInputs();
  // 종결 구분 라디오(면책/지급) — 선택 즉시 상태 저장 + 강조 갱신
  root.querySelectorAll('input[name="intakeCloseType"]').forEach(r => r.addEventListener("change", () => {
    if (!r.checked) return;
    intakeCloseType[d.id] = r.value;
    root.querySelectorAll(".lg-ctype").forEach(l => l.classList.toggle("on", l.querySelector("input").value === r.value));
  }));
  const cb = $("#intakeComplete");
  if (cb) cb.addEventListener("click", () => {
    if (d.procStatus === "완료") return;
    const closeType = intakeCloseType[d.id] || "지급";
    setProcStatus(d.id, "완료");
    showToast(`${d.id} 건이 ${closeType} 종결되었습니다.`);
  });
  // 계약 사고 정보 탭: 편집 컨트롤 바인딩
  if (intakeTab === "contract") bindIntakeContract(d);
  // 저장 버튼(모든 탭 공통): 현재 탭 입력 저장 → 저장 상태 전환(추산 등록·종결 잠금 해제)
  const sv = $("#intakeSave");
  if (sv) sv.addEventListener("click", () => {
    if (intakeTab === "contract") getContractState(d.id, d);
    else if (intakeTab === "damage") getDamageState(d.id, d);
    intakeSaved[d.id] = true;      // 입력값은 각 탭 상태에 이미 반영됨
    const label = intakeTab === "contract" ? "계약 사고 정보" : intakeTab === "damage" ? "피해 진행 정보" : "청구 견적 정보";
    showToast(`${d.id} ${label}가 저장되었습니다. 추산 등록·종결이 가능합니다.`);
    renderIntake();                // 저장 뱃지·종결 버튼 활성 반영
  });
}


/* ===================== 기능 설명 툴팁 ===================== */
/* [data-desc] 요소에 마우스를 올리면(또는 포커스하면) 기능 설명을 말풍선으로 노출 */
(function initDescTooltips() {
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

/* 과실률 변경 시연 훅 (설계문서 §6.2) — 실제 운영에서는 과실률 확정 IF 수신 지점으로 대체.
   예) window.__setFaultRate("CLM-2026-0001", 50) → 미결재 결의 '재확인 필요' 전환 */
window.__setFaultRate = function (claimId, pct, confirmed) {
  const conf = confirmed === false ? "미확정" : "확정";
  const text = `자차 ${pct}% (${conf})`;
  const prev = INTAKE_DETAIL[claimId] || {};
  INTAKE_DETAIL[claimId] = Object.assign({}, prev, {
    fault: text,
    ownDamage: Object.assign({}, prev.ownDamage, { faultRate: text }),
  });
  const changed = (conf === "확정" && typeof applyFaultRateChange === "function") ? applyFaultRateChange(claimId, pct) : 0;
  if (intakeClaimId === claimId) renderIntake();
  showToast(`[개발용] ${claimId} 자차 과실률 ${pct}% (${conf}) 반영${changed ? ` · 결의 ${changed}건 재확인 필요` : ""}`);
  return changed;
};

/* ===================== 초기화 ===================== */
(function initIntake() {
  const params = new URLSearchParams(window.location.search);
  const claimParam = params.get("claim");
  if (claimParam) intakeClaimId = claimParam;
  renderIntake();
})();
