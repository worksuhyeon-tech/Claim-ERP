"use strict";
const activeView = "intake";

let intakeClaimId = null;   // Smart접수지에 바인딩된 사고건
let intakeTab = "contract"; // "contract"(계약·사고정보) | "damage"(피해 진행정보) | "estimate"(청구 견적 정보)
let estimateDocType = "claim"; // 청구 견적 문서 전환: "pre"(선견적) | "claim"(청구서)

const INTAKE_MEMO_TYPES = ["피보/운전", "피해소유", "고객요청", "공업사", "내부공유"];
const INTAKE_ATTRS = ["재통화", "VOC", "교통", "렌트", "CS", "기타"];
// Smart접수지 조회구분 (참조: reference/조회구분값.png)
const INTAKE_QUERY_TYPES = ["사고번호", "차량번호", "피해차량번호", "피보험자 휴대폰", "통보자 휴대폰", "피해자 휴대폰", "운전자 휴대폰", "소유자 휴대폰"];
let intakeQueryType = INTAKE_QUERY_TYPES[0];

const intakeProgressLogs = {
  "CLM-2026-0004": [
    { at:"06.18 09:12", type:"피보/운전", text:"운전자 통화 완료. 사고 경위와 입고 희망 공업사 확인." },
    { at:"06.18 10:05", type:"공업사", text:"탑모터스 입고 가능 여부 확인, 선견적 회신 대기." },
    { at:"06.18 11:20", type:"내부공유", text:"피해담당자와 로그 기준 사고 내용 상이. 추가 확인 필요." },
  ],
};
const intakePropertyState = {
  "CLM-2026-0004": {
    attrs:["재통화", "VOC"],
    note:"피해담당자와 로그의 사고내용이 서로 다름",
  },
};

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
    ownDamage:{ joined:"가입(Y)", faultRate:"자차 0% / 대차 100% (미확정)" },
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
const GEN_REL = ["피보험자 본인", "배우자", "자녀", "형제", "지인 (동의운전)"];
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
  const faultText = idx >= 2 ? "자차 0% / 대차 100%" : "0% 미확정";

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
  ["accident","dispatch","liability","ownDamage","insuredCar","contract","damage","repair","handlers"]
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

/* ===================== Smart접수지 렌더링 ===================== */
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
      attrs: (d.unresolved || []).filter(x => INTAKE_ATTRS.includes(x)),
      note: d.actionDesc || "",
    };
  }
  return intakePropertyState[id];
}

/* ---- 레거시 테이블 헬퍼 ---- */
// entries: { k, v, full?, blue? } — full은 값이 3칸 병합, 아니면 k/v 쌍을 2개씩 묶어 4열 배치
function lgTable(entries) {
  const rows = [];
  let buf = [];
  const flush = () => { if (buf.length) { rows.push("<tr>" + buf.join("") + "</tr>"); buf = []; } };
  entries.forEach(e => {
    const val = iEsc(e.v);
    if (e.full) {
      flush();
      rows.push(`<tr><th>${e.k}</th><td colspan="3" class="${e.blue ? "blue " : ""}${val ? "" : "ph"}">${val || "-"}</td></tr>`);
    } else {
      buf.push(`<th>${e.k}</th><td class="${e.blue ? "blue " : ""}${val ? "" : "ph"}">${val || "-"}</td>`);
      if (buf.length === 2) flush();
    }
  });
  flush();
  return `<table class="lg-tbl"><colgroup><col style="width:14%"><col style="width:36%"><col style="width:14%"><col style="width:36%"></colgroup>${rows.join("")}</table>`;
}
function lgSect(title, note) {
  return `<div class="lg-sect">${title}${note ? `<span class="note">${note}</span>` : ""}</div>`;
}

function lgIdBand(d) {
  return `<div class="lg-idband">
    <span class="tag">${iEsc(d.procStatus) || "대기"}</span>
    <span class="id">${iEsc(d.id)}</span>
    <span class="seg fault">${iEsc(d.fault) || "0% 미확정"}</span>
    <span class="seg car">${joinDot([d.carModel, d.car]) || "-"}</span>
    <span class="seg cust">${iEsc(d.custType) || ""}</span>
  </div>`;
}

function lgRow2(d) {
  const left = lgTable([
    { k: "사고담당", v: d.accidentManager }, { k: "디지털안내", v: "-" },
    { k: "피해담당", v: d.damageManager, full: true },
    { k: "검토회신", v: d.reviewReply }, { k: "고객구분", v: d.custType },
  ]);
  const checks = ["정비", "부품", "유리", "실런트", "운반", "기타", "렌트", "교통", "복구"].map(k => {
    const st = (d.chips && d.chips[k]) || "none";
    const on = st && st !== "none";
    return `<label class="lg-chk" title="${CHIP_STATE_TEXT[st] || "미청구"}"><input type="checkbox" ${on ? "checked" : ""} disabled>${k}</label>`;
  }).join("");
  const right = `<div class="lg-checkbox-box"><span class="lg-chk head">검토 · 청구진행</span>${checks}<span class="lg-chk">통합</span><span class="lg-move">이동 ›</span></div>`;
  return `<div class="lg-row2"><div>${left}</div>${right}</div>`;
}

/* ---- 진행 이력 / 진행 메모 / 미결 속성 (동작 유지) ---- */
function intakeWorkbenchHtml(d) {
  const prop = getIntakeProperty(d.id, d);
  const attrSet = new Set(prop.attrs || []);
  const logs = getIntakeLogs(d.id);
  const logTable = logs.length
    ? `<table><thead><tr><th style="width:32px">순번</th><th style="width:78px">일시</th><th style="width:66px">구분</th><th>내용</th></tr></thead><tbody>${logs.map((r, i) => `<tr><td>${logs.length - i}</td><td>${iEsc(r.at)}</td><td>${iEsc(r.type)}</td><td class="txt">${iEsc(r.text)}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty">데이터가 없습니다.</div>`;
  const histBtns = ["컨택", "메세지발송", "입회정보", "간편렌트"];
  return `<div class="lg-panels">
    <div class="lg-panel">
      <div class="lg-panel-h"><span class="h">진행 이력</span><span class="lg-radio"><label><input type="radio" name="lgHistScope" disabled> MY</label><label><input type="radio" name="lgHistScope" checked disabled> 전체</label></span></div>
      <div class="lg-mini-btns">${histBtns.map(b => `<button class="lg-mini gray" type="button">${b}</button>`).join("")}</div>
      <div class="lg-radio" style="margin-bottom:6px"><label><input type="radio" name="lgHistFilter" checked disabled> 전체</label><label><input type="radio" name="lgHistFilter" disabled> 피보/운전</label><label><input type="radio" name="lgHistFilter" disabled> 피해/소유</label></div>
      <div class="lg-log">${logTable}</div>
    </div>
    <div class="lg-panel">
      <div class="lg-panel-h"><span class="h">진행 메모</span><label class="lg-chk"><input type="checkbox" disabled> 자동처리 금지</label></div>
      <div class="lg-form">
        <div class="fr"><label class="k" for="intakeMemoType">구분</label><select class="lg-sel" id="intakeMemoType">${INTAKE_MEMO_TYPES.map(t => `<option value="${iEsc(t)}">${iEsc(t)}</option>`).join("")}</select></div>
        <div class="fr"><label class="k" for="intakeMemoTarget">관련대상</label><input class="lg-in" id="intakeMemoTarget" type="text" value="${iEsc(d.name)}"></div>
        <div class="fr top"><label class="k" for="intakeMemoText">주요내용</label><textarea class="lg-ta" id="intakeMemoText" placeholder="진행 내용을 입력하세요. 예: 공업사 재요청, 고객 재통화 예정"></textarea></div>
        <div class="lg-form-foot"><span class="lg-std">※ (표준) 945,000원</span><span class="sp"></span><button class="lg-mini gray" type="button">간편일보</button><button class="lg-mini" type="button" id="intakeMemoSave">메모 저장</button></div>
      </div>
      <div class="lg-warn">피해물 담당자와 로그인 사번이 서로 다름</div>
    </div>
    <div class="lg-panel">
      <div class="lg-panel-h"><span class="h">미결 속성</span><button class="lg-mini" type="button" id="intakeAttrSave">저장</button></div>
      <div class="lg-attrs">${INTAKE_ATTRS.map(a => `<label class="lg-attr"><input type="checkbox" name="intakeAttr" value="${iEsc(a)}" ${attrSet.has(a) ? "checked" : ""}>${iEsc(a)}</label>`).join("")}</div>
      <textarea class="lg-ta" id="intakeAttrNote" placeholder="미결 속성 메모 (Smart업무관리에 반영)">${iEsc(prop.note)}</textarea>
      <div style="display:flex;margin-top:7px"><span style="flex:1"></span><button class="lg-assign" type="button">배당확인 ▶</button></div>
    </div>
  </div>`;
}

/* ---- 탭1: 계약 사고 정보 ---- */
function intakeContractTab(d) {
  const P = d.parties;
  const left = lgSect("사고 관련자", "※ 운전자 접수 / 저장")
    + lgTable([
      { k: "운전자", v: `${P.driver.name || ""} ${P.driver.rel ? "(" + P.driver.rel + ")" : ""}`.trim() },
      { k: "연락처", v: P.driver.phone, blue: true },
      { k: "생년월일", v: P.driver.birth }, { k: "면허", v: P.driver.license },
      { k: "소유자", v: P.owner.name }, { k: "연락처", v: P.owner.phone, blue: true },
      { k: "피보험자", v: P.insured.name }, { k: "연락처", v: P.insured.phone, blue: true },
      { k: "통보자", v: `${P.notifier.name || ""} ${P.notifier.rel ? "(" + P.notifier.rel + ")" : ""}`.trim() },
      { k: "연락처", v: P.notifier.phone, blue: true },
      { k: "개동", v: "운전 Y / 소유 Y", full: true },
    ])
    + lgSect("사고 정보")
    + lgTable([
      { k: "사고일시", v: d.accident.datetime, full: true },
      { k: "사고장소", v: d.accident.place, full: true },
      { k: "장소상세", v: d.accident.placeDetail, full: true },
      { k: "내용", v: d.accident.content, full: true },
      { k: "특이사항", v: d.accident.note }, { k: "조사Task", v: d.accident.task },
      { k: "경찰접수", v: d.accident.police }, { k: "타차운전", v: d.accident.otherDrive },
    ])
    + lgSect("출동 정보")
    + lgTable([
      { k: "담당", v: d.dispatch.manager }, { k: "운전자", v: d.dispatch.driver },
      { k: "중대사고", v: d.dispatch.majorAcc, full: true },
      { k: "사고내용", v: d.dispatch.content, full: true },
      { k: "전달사항", v: d.dispatch.delivery, full: true },
      { k: "기타", v: (d.dispatch.etc || []).join(" / "), full: true },
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

/* ---- 탭2: 피해 진행 정보 ---- */
function intakeDamageTab(d) {
  const mark = v => v === "done" ? "✓" : v === "call" ? "☎" : v ? "•" : "–";
  const parts = PART_LIST.map(p => {
    const on = (d.parts.checked || []).includes(p);
    return `<div class="lg-dmg-item${on ? " on" : ""}"><span class="b"></span>${p}</div>`;
  }).join("");
  const left = lgSect("피해 진행")
    + lgTable([
      { k: "피해물", v: d.damage.object, full: true },
      { k: "소유자", v: d.damage.owner }, { k: "정보사항", v: d.damage.info },
      { k: "교통비청구", v: d.damage.transport }, { k: "렌트청구", v: d.damage.rentClaim },
      { k: "부가세대상", v: d.damage.vatTarget }, { k: "고객정보", v: d.damage.custInfo },
    ])
    + lgSect("공업사 · 수리")
    + lgTable([
      { k: "공업사", v: d.repair.shop, full: true },
      { k: "수리기간", v: d.repair.period, full: true },
      { k: "사고가액", v: d.repair.accAmount, full: true },
      { k: "지급특약", v: d.repair.paySpecial }, { k: "추산/지급", v: d.repair.estimatePay },
      { k: "지급재원", v: d.repair.payResource }, { k: "종결일자", v: d.repair.closeDate },
    ]);
  const right = lgSect("담당자 · 피해정보")
    + lgTable([
      { k: "물사고담당", v: d.handlers.propertyAcc, full: true },
      { k: "인사고담당", v: d.handlers.personAcc, full: true },
      { k: "(물)총피해", v: d.handlers.propertyTotal }, { k: "(인)총피해", v: d.handlers.personTotal },
    ])
    + lgSect("차량 부위 손상")
    + `<div class="lg-dmg"><div class="lg-dmg-list">${parts}</div><div class="lg-dmg-car">${CAR_DIAGRAM_SVG}</div></div>`;
  const guide = lgSect("고객안내 진행현황", "담보별 고객 컨택")
    + `<div class="lg-scroll"><table class="lg-tbl auto"><tr><th style="width:96px">담보</th>${d.guideCols.map(c => `<th>${c}</th>`).join("")}</tr>${d.guideRows.map(r => `<tr><th>${r.label}</th>${d.guideCols.map(c => `<td>${mark(r.cells[c])}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const dmgList = lgSect("피해물 목록")
    + `<div class="lg-scroll"><table class="lg-tbl auto"><tr><th>담보</th><th>서열</th><th>차량번호</th><th>피해물/자</th><th>지급금액</th><th>진행</th><th>소유자연락처</th><th>보상담당자</th><th>배당일</th><th>피해접수일</th></tr>${d.damageList.length
      ? d.damageList.map(r => `<tr><td>${iEsc(r.cover) || "-"}</td><td>${iEsc(r.seq) || "-"}</td><td>${iEsc(r.carNo) || "-"}</td><td>${iEsc(r.object) || "-"}</td><td>${iEsc(r.payAmount) || "-"}</td><td>${iEsc(r.progress) || "-"}</td><td>${iEsc(r.ownerPhone) || "-"}</td><td>${iEsc(r.handler) || "-"}</td><td>${iEsc(r.assignDate) || "-"}</td><td>${iEsc(r.receiptDate) || "-"}</td></tr>`).join("")
      : `<tr><td colspan="10" class="ph">등록된 피해물이 없습니다.</td></tr>`}</table></div>`;
  return `<div class="lg-cols"><div>${left}</div><div>${right}</div></div>${guide}${dmgList}`;
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
function intakeEstimateTab(d) {
  const doc = d.estimateDoc;
  if (!doc) {
    return `<div class="lg-est-empty">등록된 청구 견적 정보가 없습니다.</div>`;
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

  // 견적서 전환 토글
  const toggle = `<div class="lg-est-toggle" role="tablist">
    <span class="tl">견적서 전환</span>
    <button type="button" class="be-tgl ${isPre ? "on" : ""}" data-estdoc="pre">선견적</button>
    <button type="button" class="be-tgl ${!isPre ? "on" : ""}" data-estdoc="claim">청구서</button>
  </div>`;

  const baseSum = estSum(rows, "base");
  const adjSum = estSum(rows, "adjust");
  const body = rows.map(r => {
    const denied = r.adjust.denied;
    return `<tr>
      <td class="grp">${iEsc(r.g)}</td>
      <td class="nm">${iEsc(r.n)}</td>
      <td class="it">${iEsc(r.it)}</td>
      <td class="num">${r.base.unit}</td>
      <td class="num amt">${won(r.base.amount)}</td>
      <td class="ck"><input type="checkbox" ${denied ? "checked" : ""} disabled></td>
      <td class="num${denied ? " off" : ""}">${denied ? "-" : r.adjust.unit}</td>
      <td class="num amt${denied ? " off" : ""}">${denied ? "0" : won(r.adjust.amount)}</td>
    </tr>`;
  }).join("");

  const table = `<div class="lg-scroll"><table class="lg-est-tbl">
    <colgroup><col style="width:74px"><col><col style="width:96px"><col style="width:52px"><col style="width:88px"><col style="width:40px"><col style="width:52px"><col style="width:88px"></colgroup>
    <thead>
      <tr>
        <th rowspan="2">작업구분</th><th rowspan="2">작업내용</th><th rowspan="2">작업항목</th>
        <th colspan="2" class="grp-claim">${baseLabel}</th>
        <th colspan="3" class="grp-adjust">손해사정</th>
      </tr>
      <tr>
        <th>단위</th><th>금액</th>
        <th>불인</th><th>단위</th><th>금액</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
    <tfoot>
      <tr>
        <th colspan="3">${docLabel} 합계</th>
        <td class="num"></td><td class="num amt">${won(baseSum)}</td>
        <td class="ck"></td><td class="num"></td><td class="num amt">${won(adjSum)}</td>
      </tr>
    </tfoot>
  </table></div>`;

  return `<div class="lg-est">
    <div class="lg-est-head">
      <div class="be-title"><span class="dot"></span>견적 정보 <span class="be-cur">현재 보기: ${docLabel}</span></div>
      <div class="be-btns"><button class="lg-mini gray" type="button">이미지</button><button class="lg-mini" type="button">통합손해사정</button></div>
    </div>
    ${flow}
    ${toggle}
    ${band}
    ${table}
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
    }
  }));
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
    const note = $("#intakeAttrNote").value.trim();
    intakePropertyState[d.id] = { attrs, note };
    const detail = INTAKE_DETAIL[d.id] || (INTAKE_DETAIL[d.id] = {});
    detail.unresolved = attrs;
    const claim = CLAIMS.find(x => x.id === d.id);
    if (claim) {
      if (attrs.length) claim.actionType = attrs[0];
      if (note) {
        claim.actionDesc = note;
        claim.nextAction = `${attrs[0] || "미결"} 속성 확인 후 후속 조치를 진행하세요.`;
      }
    }
    showToast(`${d.id} 미결 속성이 Smart업무관리에 반영되었습니다.`);
    if (typeof renderAll === "function") renderAll();
    renderIntake();
  });
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
  const hit = CLAIMS.find(c => intakeClaimMatches(c, intakeQueryType, value));
  if (!hit) {
    showToast("조회 조건에 해당하는 사고건이 없습니다.");
    return;
  }
  intakeClaimId = hit.id;
  selectedId = hit.id;
  renderIntake();
  showToast(`${hit.id} 건을 조회했습니다.`);
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
  const id = intakeClaimId || selectedId || (CLAIMS[0] && CLAIMS[0].id);
  intakeClaimId = id;
  const d = getIntakeData(id);
  const root = $("#intakeRoot");
  if (!d) { root.innerHTML = `<div style="padding:40px;text-align:center;color:#8a90a0">표시할 사고건이 없습니다.</div>`; return; }
  const done = d.procStatus === "완료";
  const unresolvedText = (d.unresolved && d.unresolved.length) ? d.unresolved.join(", ") : "없음";
  const queryType = INTAKE_QUERY_TYPES.includes(intakeQueryType) ? intakeQueryType : INTAKE_QUERY_TYPES[0];
  root.innerHTML = `
    <button class="lg-back" type="button" id="intakeBack">← 목록으로</button>
    <div class="lg">
      <div class="lg-window">
        <div class="lg-titlebar"><span class="t">Smart접수지 (물)</span><span class="r"><span class="lg-secret">대외비</span><span class="lg-x">✕</span></span></div>
        <div class="lg-search">
          <span class="lk">조회구분</span>
          <select class="lg-select" id="intakeQueryType">${INTAKE_QUERY_TYPES.map(t => `<option value="${iEsc(t)}" ${t === queryType ? "selected" : ""}>${iEsc(t)}</option>`).join("")}</select>
          <span id="intakeSearchFields" class="lg-search-fields">${intakeSearchFieldsHtml(queryType, d)}</span>
          <span class="grow"></span>
          <div class="lg-search-btns"><button class="lg-sbtn" type="button" id="intakeSearchBtn">🔍 검색</button><button class="lg-sbtn gray" type="button">대기</button><button class="lg-sbtn gray" type="button" id="intakeResetBtn">↻ 재설정</button></div>
        </div>
        <div class="lg-body">
          ${lgIdBand(d)}
          ${lgRow2(d)}
          ${intakeWorkbenchHtml(d)}
          <div class="lg-tabs">
            <button class="lg-tab ${intakeTab === "contract" ? "active" : ""}" type="button" data-itab="contract">계약 사고 정보</button>
            <button class="lg-tab ${intakeTab === "damage" ? "active" : ""}" type="button" data-itab="damage">피해 진행 정보</button>
            <button class="lg-tab ${intakeTab === "estimate" ? "active" : ""}" type="button" data-itab="estimate">청구 견적 정보</button>
          </div>
          <div class="lg-tabbody" id="intakeBody">${renderIntakeTab(intakeTab, d)}</div>
          <div class="lg-actionbar">
            <span class="lg-std">미결 태그: ${iEsc(unresolvedText)}</span>
            <span class="sp"></span>
            <button class="lg-abtn" type="button" id="intakeHold" ${done ? "disabled" : ""}>보류</button>
            <button class="lg-abtn primary" type="button" id="intakeComplete" ${done ? "disabled" : ""}>${done ? "처리완료됨" : "처리완료"}</button>
          </div>
        </div>
      </div>
    </div>`;

  $("#intakeBack").addEventListener("click", () => { window.location.href = VIEW_FILES.claims; });
  root.querySelectorAll("[data-itab]").forEach(b => b.addEventListener("click", () => {
    intakeTab = b.dataset.itab;
    renderIntake();
  }));
  bindIntakeWorkbench(d);
  bindIntakeEstimate(d);
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
    renderIntake();
  });
  bindIntakeSearchInputs();
  const cb = $("#intakeComplete");
  if (cb) cb.addEventListener("click", () => {
    if (d.procStatus === "완료") return;
    setProcStatus(d.id, "완료");
    showToast(`${d.id} 건이 처리완료되었습니다.`);
  });
  const hb = $("#intakeHold");
  if (hb) hb.addEventListener("click", () => {
    if (d.procStatus === "완료") return;
    setProcStatus(d.id, "보류");
    showToast(`${d.id} 건이 보류 처리되었습니다.`);
  });
}


/* ===================== 초기화 ===================== */
(function initIntake() {
  const params = new URLSearchParams(window.location.search);
  const claimParam = params.get("claim");
  if (claimParam) intakeClaimId = claimParam;
  renderIntake();
})();
