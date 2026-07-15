"use strict";
/* =====================================================================
 * AI 통합대시보드 (Pro) — 데모 스크립트
 * common.js 의 CLAIMS / CLAIM_IMAGES / showToast / escapeHtml / won /
 * formatNowStamp / folderImages / findImage 를 재사용한다.
 * 실제 AI API 가 없으므로 모든 분석은 더미 + 시연모드로 처리한다.
 * ===================================================================== */

/* ------------------------------------------------------------------ *
 * 1. 공통 상수 · 유틸
 * ------------------------------------------------------------------ */
const AI_STAGES = ["대기중", "수리승인", "손해사정", "완료"];
const AI_DECISIONS = ["자료대기", "청구서대기", "AI 분석대기", "AI 분석중", "적정", "조건부 적정", "보류", "부적정", "분석실패"];

// 판정 → 배지 색 클래스 (common.css 상태색 재사용)
const DECISION_CLASS = {
  "자료대기": "dc-wait", "청구서대기": "dc-wait",
  "AI 분석대기": "dc-analyzing", "AI 분석중": "dc-analyzing",
  "적정": "dc-ok", "조건부 적정": "dc-cond", "보류": "dc-hold",
  "부적정": "dc-bad", "분석실패": "dc-fail"
};
const STAGE_CLASS = { "대기중": "st-wait", "수리승인": "st-appr", "손해사정": "st-adj", "완료": "st-done" };

// 심사점수 → 판정 (강제 보류 규칙은 별도, Plan 9.2 / 9.3)
function judgeByScore(score) {
  if (score == null) return null;
  if (score >= 85) return "적정";
  if (score >= 70) return "조건부 적정";
  if (score >= 50) return "보류";
  return "부적정";
}

// 수리승인 / 손해사정 판단기준 배점 (Plan 10.2 / 11.2)
const CRITERIA_APPROVAL = [
  ["사고내용·파손형태 일치", 15], ["사진·견적 부위 일치", 25], ["수리방법 적정성", 20],
  ["부품·공임·도장비 적정성", 20], ["중복 청구 여부", 10], ["기존손상·사고무관 여부", 10]
];
const CRITERIA_ADJUST = [
  ["승인견적·청구서 일치", 25], ["추가수리 근거 적정성", 20], ["실제 수리 여부", 20],
  ["미승인 항목 청구 여부", 15], ["청구금액 적정성", 15], ["면책금·기지급금 반영", 5]
];
function mkCriteria(tpl, gots, reasons) {
  return tpl.map((row, i) => ({ name: row[0], max: row[1], got: gots[i], reason: (reasons && reasons[i]) || "" }));
}

// 목록 정렬 우선순위 (Plan 5.5)
const SORT_RANK = { "보류": 1, "부적정": 1, "AI 분석대기": 2, "조건부 적정": 2, "분석실패": 3, "자료대기": 4, "청구서대기": 4, "AI 분석중": 5, "적정": 6 };
function sortReviews(list) {
  return list.slice().sort((a, b) => {
    const ra = SORT_RANK[a.decision] || 9, rb = SORT_RANK[b.decision] || 9;
    if (ra !== rb) return ra - rb;
    return (b.waitedHours || 0) - (a.waitedHours || 0); // 경과 오래된 건 우선
  });
}

/* ------------------------------------------------------------------ *
 * 2. 더미 데이터 — 접수건별 최신 분석 1행 (Plan 4.3)
 * ------------------------------------------------------------------ */
const AI_REVIEWS = [
  /* [Hero] 수리승인 · 조건부 적정 — 사진+선견적, 전조등 근거 부족 (Plan 예시) */
  {
    claimId: "CLM-2026-0004", stage: "수리승인", decision: "조건부 적정", score: 82, confidence: 91,
    reviewType: "수리 전 견적심사", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "06.14 10:35", waitedHours: 7, hasPhoto: true, hasEstimate: true, hasBill: false,
    summary: "우측 전조등 교환 근거사진이 부족하고, 앞범퍼는 교환보다 보수 가능성이 높습니다.",
    criteria: mkCriteria(CRITERIA_APPROVAL, [15, 18, 14, 19, 10, 6], [
      "접수 사고내용(우측 전면 접촉)과 파손형태가 일치합니다.",
      "전조등 교환 항목이 있으나 제출 사진에서 전조등 파손이 명확히 확인되지 않아 감점했습니다.",
      "앞범퍼가 교환으로 청구되었으나 스크래치 수준으로 보수 가능성이 높습니다.",
      "부품·공임·도장비 기준금액과 대체로 부합합니다.",
      "동일 부위 중복 청구는 확인되지 않았습니다.",
      "좌측 도어 흠집은 이번 사고와 연관성이 낮아 감점했습니다."
    ]),
    reasons: ["우측 전조등 파손 확인 불가 (근거사진 부족)", "앞범퍼 교환 근거 부족 (보수 권장)", "좌측 도어 사고무관 의심"],
    recommend: ["전조등 근접사진 요청", "범퍼 수리방법을 교환→보수로 재검토", "확인된 수리범위만 우선 승인"],
    forcedHold: [], missing: [],
    approval: {
      approvable: "일부 승인", approvedAmount: 1180000, excludedAmount: 320000,
      items: [
        { name: "앞범퍼", method: "교환→보수 재검토", part: 380000, labor: 40000, paint: 0, status: "조건부" },
        { name: "우측 전휀더", method: "판금", part: 0, labor: 180000, paint: 0, status: "승인" },
        { name: "우측 전조등", method: "교환", part: 260000, labor: 60000, paint: 0, status: "제외" },
        { name: "도장 (범퍼·펜더)", method: "도장", part: 0, labor: 0, paint: 260000, status: "승인" }
      ]
    },
    report: {
      verdict: "조건부 적정 — 확인된 파손범위는 승인하되, 전조등·범퍼는 추가 확인이 필요합니다.",
      confirmed: ["앞범퍼 우측 긁힘", "앞범퍼 우측 변형", "우측 전휀더 경미한 찌그러짐"],
      claimed: ["앞범퍼 교환", "우측 전휀더 판금", "우측 전조등 교환"],
      mismatch: ["우측 전조등 파손 확인 불가", "앞범퍼는 교환보다 보수 가능성이 높음"],
      recommend: ["전조등 근접사진 요청", "범퍼 수리방법 재검토", "확인된 수리범위만 우선 승인"]
    },
    reply: "제출된 파손사진과 견적내용을 검토한 결과, 확인 가능한 파손범위(앞범퍼·우측 전휀더)에 대해 수리를 승인합니다. 다만 우측 전조등은 사진상 파손이 확인되지 않아 승인 항목에서 제외했으며, 앞범퍼는 교환보다 보수를 권장합니다. 해당 부위의 추가 손상이 있는 경우 근접사진과 추가견적을 제출해 주세요.",
    history: [{ at: "06.14 10:35", actor: "AI-Vision v1.2", type: "AI 분석 완료", before: "", after: "조건부 적정 · 82점 (1차)" }]
  },

  /* 수리승인 · 적정 — CLM-2026-0001 은 사진만 있으므로 자료대기 케이스로 사용 (TC-01) */
  {
    claimId: "CLM-2026-0001", stage: "대기중", decision: "자료대기", score: null, confidence: null,
    reviewType: "수리 전 견적심사", requestType: "자동", runMode: "시연", round: 0,
    analyzedAt: "-", waitedHours: 6, hasPhoto: true, hasEstimate: false, hasBill: false,
    summary: "파손사진은 등록되었으나 선견적이 없어 AI 심사를 시작할 수 없습니다.",
    criteria: null, reasons: [], recommend: ["공업사에 선견적(AOS) 등록을 요청하세요."],
    forcedHold: [], missing: ["선견적(AOS)"],
    history: [{ at: "06.13 14:42", actor: "시스템", type: "자료 등록", before: "", after: "파손사진 3건 등록" }]
  },

  /* 자료대기 · 견적만 등록 → 사진요청 (TC-02) */
  {
    claimId: "CLM-2026-0002", stage: "대기중", decision: "자료대기", score: null, confidence: null,
    reviewType: "수리 전 견적심사", requestType: "자동", runMode: "시연", round: 0,
    analyzedAt: "-", waitedHours: 4, hasPhoto: false, hasEstimate: true, hasBill: false,
    summary: "선견적은 등록되었으나 파손사진이 없어 사진·견적 대조가 불가합니다.",
    criteria: null, reasons: [], recommend: ["고객·공업사에 파손 근접사진을 요청하세요."],
    forcedHold: [], missing: ["차량 파손 근접사진"],
    history: [{ at: "06.13 09:20", actor: "정비업체", type: "자료 등록", before: "", after: "선견적서 등록" }]
  },

  /* 강제 보류 — 점수 88 이지만 AI 신뢰도 기준 미만 (TC-06) */
  {
    claimId: "CLM-2026-0006", stage: "수리승인", decision: "보류", score: 88, confidence: 62,
    reviewType: "수리 전 견적심사", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "06.14 09:10", waitedHours: 5, hasPhoto: true, hasEstimate: true, hasBill: false,
    summary: "합계점수는 높으나 이미지 인식 신뢰도가 낮아 강제 보류되었습니다.",
    criteria: mkCriteria(CRITERIA_APPROVAL, [15, 23, 18, 20, 6, 6], [
      "사고내용과 파손형태가 일치합니다.", "사진·견적 부위가 대체로 일치합니다.",
      "수리방법이 적정합니다.", "부품·공임·도장비가 적정합니다.",
      "그릴·범퍼 도장이 인접 부위와 중복 청구 소지가 있어 확인이 필요합니다.",
      "일부 흠집이 기존손상일 가능성이 있습니다."
    ]),
    reasons: ["이미지 해상도 낮음 — 파손심도 인식 신뢰도 저하", "그릴·범퍼 도장 중복 청구 의심"],
    recommend: ["선명한 파손 근접사진 재요청", "AI 재분석 후 담당자 직접 확인"],
    forcedHold: ["AI 신뢰도가 기준값(80%) 미만 (62%)"], missing: [],
    approval: {
      approvable: "보류", approvedAmount: 0, excludedAmount: 0,
      items: [
        { name: "라디에이터 그릴", method: "교환", part: 210000, labor: 40000, paint: 0, status: "보류" },
        { name: "앞범퍼", method: "판금·도장", part: 0, labor: 120000, paint: 180000, status: "보류" }
      ]
    },
    report: {
      verdict: "보류 — 점수는 충분하나 이미지 신뢰도가 낮아 담당자 확인이 필요합니다.",
      confirmed: ["라디에이터 그릴 손상", "앞범퍼 스크래치"],
      claimed: ["그릴 교환", "앞범퍼 판금·도장"],
      mismatch: ["파손심도 인식 신뢰도 낮음", "도장 범위 중복 소지"],
      recommend: ["선명한 근접사진 재요청", "재분석 후 직접 확인"]
    },
    reply: "제출된 자료를 검토했으나 이미지 인식 신뢰도가 낮아 즉시 승인이 어렵습니다. 파손부위의 선명한 근접사진을 다시 제출해 주시면 재검토 후 안내드리겠습니다.",
    history: [{ at: "06.14 09:10", actor: "AI-Vision v1.2", type: "AI 분석 완료", before: "", after: "강제 보류 · 신뢰도 62% (1차)" }]
  },

  /* 부적정 — 낮은 점수, 높은 신뢰도 (Plan 9.1 예시) */
  {
    claimId: "CLM-2026-0011", stage: "수리승인", decision: "부적정", score: 42, confidence: 96,
    reviewType: "수리 전 견적심사", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "06.13 17:05", waitedHours: 9, hasPhoto: true, hasEstimate: true, hasBill: false,
    summary: "청구 범위가 사진상 확인되는 파손보다 현저히 큽니다.",
    criteria: mkCriteria(CRITERIA_APPROVAL, [8, 9, 8, 9, 4, 4], [
      "사고내용 대비 파손형태 일부 불일치.", "견적 부위가 사진에서 상당수 확인되지 않음.",
      "일부 항목이 교환으로 과다 청구됨.", "공임·도장비가 기준 대비 높음.",
      "범퍼·펜더 도장 중복 청구 의심.", "다수 흠집이 기존손상으로 판단됨."
    ]),
    reasons: ["청구 범위가 확인 파손 대비 과다", "기존손상 다수 포함 의심", "교환 과다 청구"],
    recommend: ["수리범위·금액 전면 재검토", "담당자 직접검토 전환 권장"],
    forcedHold: [], missing: [],
    approval: {
      approvable: "부적정", approvedAmount: 0, excludedAmount: 0,
      items: [
        { name: "본넷", method: "교환", part: 620000, labor: 90000, paint: 240000, status: "제외" },
        { name: "양측 펜더", method: "교환", part: 480000, labor: 120000, paint: 200000, status: "제외" }
      ]
    },
    report: {
      verdict: "부적정 — 사진상 확인 파손 대비 청구 범위가 과다합니다.",
      confirmed: ["본넷 앞단 경미한 눌림"],
      claimed: ["본넷 교환", "양측 펜더 교환"],
      mismatch: ["펜더 파손 확인 불가", "본넷 교환 근거 부족(보수 가능)"],
      recommend: ["수리범위 재산정", "직접검토 전환"]
    },
    reply: "제출된 사진에서 확인되는 파손범위가 청구된 수리범위와 큰 차이가 있어 현재 견적으로는 승인이 어렵습니다. 실제 파손부위별 근접사진과 수정견적을 제출해 주세요.",
    history: [{ at: "06.13 17:05", actor: "AI-Vision v1.2", type: "AI 분석 완료", before: "", after: "부적정 · 42점 (1차)" }]
  },

  /* 손해사정 · 조건부 적정 — 청구서 등록 (TC-08) */
  {
    claimId: "CLM-2026-0007", stage: "손해사정", decision: "조건부 적정", score: 76, confidence: 90,
    reviewType: "수리 후 손해사정", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "06.18 11:20", waitedHours: 9, hasPhoto: true, hasEstimate: true, hasBill: true,
    summary: "승인견적 대비 최종 청구금액이 18% 증가했습니다.",
    criteria: mkCriteria(CRITERIA_ADJUST, [19, 14, 18, 12, 8, 5], [
      "승인범위와 청구범위가 대체로 일치합니다.", "추가 도장 확장의 사진 근거가 일부 부족합니다.",
      "청구 항목 대부분 실제 수리가 확인됩니다.", "사전 미승인 도장 확장이 포함되어 있습니다.",
      "청구금액이 승인견적 대비 18% 증가했습니다.", "면책금·기지급금이 반영되었습니다."
    ]),
    reasons: ["미승인 도장 확장 포함", "승인견적 대비 청구금액 18% 증가"],
    recommend: ["추가 도장 근거사진 확인 후 인정범위 조정", "미승인 항목 불인정 처리 검토"],
    forcedHold: [], missing: [],
    adjust: {
      claimedAmount: 2140000, aiAmount: 1820000, deniedAmount: 320000, diffText: "승인견적 대비 +18%",
      deniedItems: [
        { name: "추가 도장 확장(도어)", amount: 220000, reason: "사전 승인범위 외 · 근거사진 부족" },
        { name: "부가 공임 상향분", amount: 100000, reason: "기준 공임 초과" }
      ]
    },
    report: {
      verdict: "조건부 적정 — 대부분 인정하되 미승인 도장 확장은 확인이 필요합니다.",
      confirmed: ["본넷 교환 완료", "앞범퍼 도장 완료"],
      claimed: ["본넷 교환", "앞범퍼 도장", "도어 도장 확장(추가)"],
      mismatch: ["도어 도장 확장은 사전 미승인", "공임 상향분 근거 부족"],
      recommend: ["추가 도장 근거 확인", "미승인 항목 불인정 검토"]
    },
    reply: "최종 청구서를 검토한 결과 승인범위에 대한 수리는 정상 확인되었습니다. 다만 사전 승인되지 않은 도어 도장 확장분은 근거 확인 전까지 인정에서 제외합니다. 관련 추가 근거가 있는 경우 제출해 주세요.",
    history: [{ at: "06.18 11:20", actor: "AI-Vision v1.2", type: "AI 분석 완료", before: "", after: "조건부 적정 · 76점 (1차)" }]
  },

  /* 완료 — 손해사정 확정 (적정) */
  {
    claimId: "CLM-2026-0010", stage: "완료", decision: "적정", score: 96, confidence: 97,
    reviewType: "수리 후 손해사정", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "06.13 09:40", waitedHours: 1, hasPhoto: true, hasEstimate: true, hasBill: true,
    summary: "승인범위와 청구서가 일치하며 인정금액이 확정되었습니다.",
    criteria: mkCriteria(CRITERIA_ADJUST, [24, 19, 20, 15, 13, 5], [
      "승인견적과 청구서가 일치합니다.", "추가수리 근거가 충분합니다.", "청구 항목이 실제 수리로 확인됩니다.",
      "미승인 항목이 없습니다.", "청구금액이 적정합니다.", "면책금·기지급금이 반영되었습니다."
    ]),
    reasons: [], recommend: ["추가 조치가 필요하지 않습니다."], forcedHold: [], missing: [],
    adjust: { claimedAmount: 1650000, aiAmount: 1650000, deniedAmount: 0, diffText: "승인견적과 일치", deniedItems: [] },
    report: {
      verdict: "적정 — 손해사정 완료, 인정금액 확정.",
      confirmed: ["전면 수리 완료", "도장 완료"], claimed: ["범퍼 교환", "그릴 교환", "도장"],
      mismatch: [], recommend: ["종결 처리"]
    },
    reply: "최종 청구내역을 검토한 결과 승인범위와 일치하여 청구금액 전액을 인정합니다. 정산 절차를 진행하겠습니다.",
    handledBy: "박지현", handledAt: "06.13 10:05",
    history: [
      { at: "06.13 09:40", actor: "AI-Vision v1.2", type: "AI 분석 완료", before: "", after: "적정 · 96점 (1차)" },
      { at: "06.13 10:05", actor: "박지현", type: "AI 결과 확정", before: "", after: "인정금액 1,650,000원 확정" }
    ]
  },

  /* 분석실패 — OCR 인식 실패 (TC-09) */
  {
    claimId: "CLM-2026-0009", stage: "손해사정", decision: "분석실패", score: null, confidence: null,
    reviewType: "수리 후 손해사정", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "06.16 15:02", waitedHours: 12, hasPhoto: true, hasEstimate: true, hasBill: true,
    summary: "청구서 OCR 인식에 실패하여 심사를 완료하지 못했습니다.",
    criteria: null, reasons: [], recommend: ["청구서 원본을 다시 업로드하거나 담당자 직접검토로 전환하세요."],
    forcedHold: [], missing: [], failReason: "청구서 OCR 인식 실패 (스캔 품질 불량)",
    history: [{ at: "06.16 15:02", actor: "AI-OCR v1.2", type: "AI 분석 실패", before: "", after: "OCR 인식 실패" }]
  },

  /* 재분석 필요 — 분석 후 사진 변경 (TC-10) */
  {
    claimId: "CLM-2026-0013", stage: "수리승인", decision: "조건부 적정", score: 79, confidence: 88,
    reviewType: "수리 전 견적심사", requestType: "자동", runMode: "시연", round: 1, needsReanalyze: true,
    analyzedAt: "06.14 08:30", waitedHours: 3, hasPhoto: true, hasEstimate: true, hasBill: false,
    summary: "AI 분석 이후 새 파손사진이 추가되어 재분석이 필요합니다.",
    criteria: mkCriteria(CRITERIA_APPROVAL, [14, 17, 15, 18, 9, 6], []),
    reasons: ["분석 이후 자료 변경됨"], recommend: ["자료 확인 완료 후 AI 재분석을 실행하세요."],
    forcedHold: [], missing: [],
    approval: { approvable: "일부 승인", approvedAmount: 940000, excludedAmount: 120000, items: [] },
    report: { verdict: "이전 분석결과(조건부 적정)", confirmed: [], claimed: [], mismatch: [], recommend: ["재분석 필요"] },
    reply: "",
    history: [
      { at: "06.14 08:30", actor: "AI-Vision v1.2", type: "AI 분석 완료", before: "", after: "조건부 적정 · 79점 (1차)" },
      { at: "06.14 13:10", actor: "시스템", type: "자료 변경 감지", before: "", after: "파손사진 2건 추가 → 재분석 필요" }
    ]
  },

  /* AI 분석중 */
  {
    claimId: "CLM-2026-0014", stage: "수리승인", decision: "AI 분석중", score: null, confidence: null,
    reviewType: "수리 전 견적심사", requestType: "수기", runMode: "시연", round: 1,
    analyzedAt: "06.14 14:20", waitedHours: 0, hasPhoto: true, hasEstimate: true, hasBill: false,
    summary: "AI가 사진·견적을 비교 분석하고 있습니다.",
    criteria: null, reasons: [], recommend: [], forcedHold: [], missing: [],
    history: [{ at: "06.14 14:20", actor: "AI-Vision v1.2", type: "AI 분석 시작", before: "", after: "분석중" }]
  },

  /* 청구서대기 — 수리승인 완료, 청구서 미등록 (Plan 7) */
  {
    claimId: "CLM-2026-0005", stage: "대기중", decision: "청구서대기", score: null, confidence: null,
    reviewType: "수리 후 손해사정", requestType: "자동", runMode: "시연", round: 1,
    analyzedAt: "-", waitedHours: 8, hasPhoto: true, hasEstimate: true, hasBill: false,
    summary: "수리승인은 완료되었으나 최종 청구서가 등록되지 않았습니다.",
    criteria: null, reasons: [], recommend: ["공업사에 최종 청구서(AOS) 등록을 요청하세요."],
    forcedHold: [], missing: ["최종 청구서(AOS)"],
    history: [{ at: "06.13 16:00", actor: "담당자", type: "수리승인 완료", before: "", after: "청구서 등록 대기" }]
  }
];

// CLAIMS 조인 (차량/업체 정보)
AI_REVIEWS.forEach(r => {
  const c = (typeof CLAIMS !== "undefined") && CLAIMS.find(x => x.id === r.claimId);
  r.plate = c ? c.car : "-";
  r.carModel = c ? (c.carModel || "-") : "-";
  r.shop = c ? (c.repairShop || "미지정") : "미지정";
  r.custName = c ? c.name : "-";
  r.custType = c ? c.custType : "-";
  r.manager = c ? c.manager : "-";
});

/* ------------------------------------------------------------------ *
 * 3. 화면 상태
 * ------------------------------------------------------------------ */
const aiState = {
  cardFilter: null,        // null | "target" | "approval" | "adjust" | "hold"
  filters: { stage: "전체", decision: "전체", scoreBand: "전체", confBand: "전체", q: "" },
  drawerId: null,
  detailId: null,
  criteriaTpl: null
};
const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getReview(id) { return AI_REVIEWS.find(r => r.claimId === id); }
function scoreText(r) {
  if (r.decision === "분석실패") return "분석실패";
  if (r.decision === "AI 분석중") return "분석중";
  if (r.score == null) return "자료대기";
  return r.score + "점";
}
function decisionBadge(d) { return `<span class="ai-badge ${DECISION_CLASS[d] || ""}">${escapeHtml(d)}</span>`; }
function stageBadge(s) { return `<span class="ai-stage ${STAGE_CLASS[s] || ""}">${escapeHtml(s)}</span>`; }

/* ------------------------------------------------------------------ *
 * 4. 상단 요약카드 (Plan 5.1)
 * ------------------------------------------------------------------ */
function summaryCounts() {
  const today = AI_REVIEWS.length; // 데모: 전체를 오늘 검토대상으로 간주
  const approvalDone = AI_REVIEWS.filter(r => r.stage === "완료" && r.reviewType.indexOf("견적") >= 0).length
    + AI_REVIEWS.filter(r => r.handledBy && r.stage === "수리승인").length;
  const adjustDone = AI_REVIEWS.filter(r => r.stage === "완료").length;
  const hold = AI_REVIEWS.filter(r => r.decision === "보류").length;
  const wait = AI_REVIEWS.filter(r => r.decision === "자료대기" || r.decision === "청구서대기").length;
  const fail = AI_REVIEWS.filter(r => r.decision === "분석실패").length;
  return { today, approvalDone, adjustDone, hold, wait, fail };
}
function renderAiSummary() {
  const s = summaryCounts();
  const cards = [
    { key: "target", label: "오늘 AI 검토대상", value: s.today, unit: "건", sub: "신규·자료등록·재검토 포함" },
    { key: "approval", label: "수리승인 완료", value: s.approvalDone, unit: "건", sub: "담당자 승인 처리" },
    { key: "adjust", label: "손해사정 완료", value: s.adjustDone, unit: "건", sub: "최종 인정금액 확정" },
    { key: "hold", label: "보류 · 대기", value: s.hold + s.wait + s.fail, unit: "건", sub: `보류 ${s.hold} · 자료대기 ${s.wait} · 분석실패 ${s.fail}` }
  ];
  $("#aiSummary").innerHTML = cards.map(c => `
    <button type="button" class="ai-scard ${aiState.cardFilter === c.key ? "active" : ""} ${c.key === "hold" ? "warn" : ""}" data-card="${c.key}">
      <div class="asc-label">${c.label}</div>
      <div class="asc-value">${c.value}<small>${c.unit}</small></div>
      <div class="asc-sub">${escapeHtml(c.sub)}</div>
    </button>`).join("");
}

/* ------------------------------------------------------------------ *
 * 5. 필터 + 목록 (Plan 5.3 / 5.4)
 * ------------------------------------------------------------------ */
function cardMatch(r) {
  switch (aiState.cardFilter) {
    case "target": return true;
    case "approval": return r.stage === "수리승인" || (r.stage === "완료" && r.reviewType.indexOf("견적") >= 0);
    case "adjust": return r.stage === "손해사정" || r.stage === "완료";
    case "hold": return r.decision === "보류" || r.decision === "자료대기" || r.decision === "청구서대기" || r.decision === "분석실패";
    default: return true;
  }
}
function scoreBandMatch(r, band) {
  if (band === "전체") return true;
  if (band === "미산출") return r.score == null;
  if (r.score == null) return false;
  if (band === "85+") return r.score >= 85;
  if (band === "70-84") return r.score >= 70 && r.score <= 84;
  if (band === "50-69") return r.score >= 50 && r.score <= 69;
  if (band === "-49") return r.score <= 49;
  return true;
}
function confBandMatch(r, band) {
  if (band === "전체") return true;
  if (r.confidence == null) return band === "미산출";
  if (band === "90+") return r.confidence >= 90;
  if (band === "80-89") return r.confidence >= 80 && r.confidence <= 89;
  if (band === "-79") return r.confidence < 80;
  return true;
}
function filteredReviews() {
  const f = aiState.filters;
  const q = f.q.trim().toLowerCase();
  return sortReviews(AI_REVIEWS.filter(r => {
    if (!cardMatch(r)) return false;
    if (f.stage !== "전체" && r.stage !== f.stage) return false;
    if (f.decision !== "전체" && r.decision !== f.decision) return false;
    if (!scoreBandMatch(r, f.scoreBand)) return false;
    if (!confBandMatch(r, f.confBand)) return false;
    if (q) {
      const hay = `${r.claimId} ${r.plate} ${r.carModel} ${r.shop} ${r.custName}`.toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    return true;
  }));
}
function renderAiList() {
  const rows = filteredReviews();
  const body = rows.map((r, i) => {
    const reanalyze = r.needsReanalyze ? `<span class="ai-flag">재분석 필요</span>` : "";
    return `
    <tr data-id="${r.claimId}">
      <td class="c-seq">${i + 1}</td>
      <td class="c-id"><button type="button" class="link-id" data-detail="${r.claimId}">${r.claimId}</button></td>
      <td>${escapeHtml(r.shop)}</td>
      <td class="c-plate">${escapeHtml(r.plate)}</td>
      <td>${escapeHtml(r.carModel)}</td>
      <td class="c-score"><span class="score-badge ${r.score == null ? "muted" : ""}">${scoreText(r)}</span></td>
      <td>${stageBadge(r.stage)}</td>
      <td>${decisionBadge(r.decision)} ${reanalyze}</td>
      <td class="c-summary" title="${escapeHtml(r.summary)}">${escapeHtml(r.summary)}</td>
      <td class="c-move"><button type="button" class="btn-move" data-move="${r.claimId}">이동</button></td>
    </tr>`;
  }).join("");
  $("#aiRows").innerHTML = rows.length ? body
    : `<tr><td colspan="10" class="ai-empty">조건에 맞는 검토대상이 없습니다.</td></tr>`;
  $("#aiCount").innerHTML = `총 <b>${rows.length}</b>건`;
}

/* ------------------------------------------------------------------ *
 * 6. 도넛 Score 애니메이션 (Plan 13.3) — 12시 시작 · 반시계
 * ------------------------------------------------------------------ */
function donutSvg(idPrefix, score, decision, big) {
  const R = big ? 52 : 34, C = 2 * Math.PI * R, sw = big ? 12 : 9, box = (R + sw) * 2;
  const cls = DECISION_CLASS[decision] || "dc-cond";
  return `
  <div class="donut ${big ? "big" : ""} ${cls}" data-score="${score == null ? "" : score}">
    <svg viewBox="0 0 ${box} ${box}" width="${box}" height="${box}">
      <circle class="donut-track" cx="${box / 2}" cy="${box / 2}" r="${R}" fill="none" stroke-width="${sw}"/>
      <circle class="donut-prog" cx="${box / 2}" cy="${box / 2}" r="${R}" fill="none" stroke-width="${sw}"
        stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"
        data-circ="${C.toFixed(1)}"/>
    </svg>
    <div class="donut-center">
      <div class="donut-num">${score == null ? "–" : "0"}</div>
      <div class="donut-unit">점</div>
    </div>
  </div>`;
}
function animateDonut(el, score) {
  if (!el) return;
  const prog = el.querySelector(".donut-prog");
  const num = el.querySelector(".donut-num");
  if (score == null) { if (num) num.textContent = "–"; return; }
  const C = parseFloat(prog.getAttribute("data-circ"));
  const target = C * (1 - score / 100);
  if (REDUCED_MOTION) {
    prog.style.strokeDashoffset = target;
    num.textContent = score;
    el.classList.add("done");
    return;
  }
  const dur = 1200, t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const p = Math.min(1, (now - t0) / dur), e = ease(p);
    prog.style.strokeDashoffset = (C - (C - target) * e).toFixed(1);
    num.textContent = Math.round(score * e);
    if (p < 1) requestAnimationFrame(step);
    else { num.textContent = score; el.classList.add("done"); }
  }
  requestAnimationFrame(step);
}

/* ------------------------------------------------------------------ *
 * 7. 우측 요약패널 (Drawer, Plan 12)
 * ------------------------------------------------------------------ */
function drawerActions(r) {
  const btns = [];
  if (r.decision === "자료대기") {
    if (!r.hasPhoto) btns.push(`<button class="ai-qbtn" data-act="reqPhoto">사진요청</button>`);
    if (!r.hasEstimate) btns.push(`<button class="ai-qbtn" data-act="reqEstimate">견적요청</button>`);
    btns.push(`<button class="ai-qbtn" data-act="confirmData">자료 확인 완료</button>`);
  } else if (r.decision === "청구서대기") {
    btns.push(`<button class="ai-qbtn" data-act="reqEstimate">청구서요청</button>`);
    btns.push(`<button class="ai-qbtn" data-act="confirmData">자료 확인 완료</button>`);
  } else if (r.decision === "분석실패") {
    btns.push(`<button class="ai-qbtn" data-act="reanalyze">AI 재분석</button>`);
    btns.push(`<button class="ai-qbtn" data-act="toManual">직접검토 전환</button>`);
  } else if (r.decision !== "AI 분석중" && r.stage !== "완료") {
    btns.push(`<button class="ai-qbtn" data-act="supplement">자료보완 요청</button>`);
    btns.push(`<button class="ai-qbtn" data-act="toManual">직접검토 전환</button>`);
  }
  btns.push(`<button class="ai-qbtn primary" data-act="detail">상세 분석 보기</button>`);
  return btns.join("");
}
function renderDrawer(r) {
  const reasons = (r.reasons || []).slice(0, 3);
  const hold = (r.forcedHold || []).length
    ? `<div class="dw-hold">강제 보류: ${r.forcedHold.map(escapeHtml).join(" · ")}</div>` : "";
  const missing = (r.missing || []).length
    ? `<div class="dw-row"><span class="dw-k">부족자료</span><span class="dw-v warn">${r.missing.map(escapeHtml).join(", ")}</span></div>` : "";
  $("#aiDrawer").innerHTML = `
    <div class="dw-head">
      <div>
        <div class="dw-id">${r.claimId} ${r.needsReanalyze ? '<span class="ai-flag">재분석 필요</span>' : ""}</div>
        <div class="dw-sub">${escapeHtml(r.plate)} · ${escapeHtml(r.carModel)} · ${escapeHtml(r.shop)}</div>
      </div>
      <button class="dw-close" type="button" data-act="close" aria-label="닫기">×</button>
    </div>
    <div class="dw-body">
      <div class="dw-scorewrap">
        ${donutSvg("dw", r.score, r.decision, false)}
        <div class="dw-scoreinfo">
          <div class="dw-decision">${decisionBadge(r.decision)}</div>
          <div class="dw-conf">AI 신뢰도 <b>${r.confidence == null ? "–" : r.confidence + "%"}</b></div>
          <div class="dw-stage">${escapeHtml(r.reviewType)} · ${escapeHtml(r.stage)}</div>
        </div>
      </div>
      ${hold}
      ${reasons.length ? `<div class="dw-block"><div class="dw-bt">핵심 감점사유</div><ul class="dw-list">${reasons.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>` : ""}
      ${(r.recommend || []).length ? `<div class="dw-block"><div class="dw-bt">AI 권장조치</div><ul class="dw-list rec">${r.recommend.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>` : ""}
      ${missing}
      <div class="dw-meta">분석일시 ${escapeHtml(r.analyzedAt)} · ${r.round}차 분석</div>
      <div class="dw-actions">${drawerActions(r)}</div>
    </div>`;
  const donut = $("#aiDrawer").querySelector(".donut");
  animateDonut(donut, r.score);
}
function openDrawer(id) {
  const r = getReview(id); if (!r) return;
  aiState.drawerId = id;
  renderDrawer(r);
  $("#aiDrawer").classList.add("open");
  $("#aiDrawerBackdrop").classList.add("show");
}
function closeDrawer() {
  aiState.drawerId = null;
  $("#aiDrawer").classList.remove("open");
  $("#aiDrawerBackdrop").classList.remove("show");
}

/* ------------------------------------------------------------------ *
 * 8. 전체 상세화면 (Plan 13)
 * ------------------------------------------------------------------ */
function photoCards(r) {
  const imgs = (typeof folderImages === "function") ? folderImages(r.claimId, "수리전사진") : [];
  if (!imgs.length) return `<div class="ai-nodata">등록된 파손사진이 없습니다.</div>`;
  return `<div class="ph-grid">${imgs.slice(0, 6).map(im => `
    <figure class="ph-card">
      ${im.url ? `<img src="${escapeHtml(im.url)}" alt="${escapeHtml(im.name)}" loading="lazy">` : `<div class="ph-ph">사진</div>`}
      <figcaption>${escapeHtml(im.name)}</figcaption>
    </figure>`).join("")}</div>`;
}
function estimateTable(r) {
  const items = (r.approval && r.approval.items && r.approval.items.length) ? r.approval.items : null;
  if (r.adjust) {
    const a = r.adjust;
    return `
      <table class="ocr-table">
        <thead><tr><th>구분</th><th class="num">금액</th></tr></thead>
        <tbody>
          <tr><td>최종 청구금액</td><td class="num">${won(a.claimedAmount)}원</td></tr>
          <tr><td>AI 제안 인정금액</td><td class="num strong">${won(a.aiAmount)}원</td></tr>
          <tr><td>불인정금액</td><td class="num red">${won(a.deniedAmount)}원</td></tr>
          <tr><td>승인견적 대비</td><td class="num">${escapeHtml(a.diffText)}</td></tr>
        </tbody>
      </table>
      ${a.deniedItems.length ? `<div class="ocr-sub">불인정 항목</div><ul class="deny-list">${a.deniedItems.map(d => `<li><b>${escapeHtml(d.name)}</b> ${won(d.amount)}원 — ${escapeHtml(d.reason)}</li>`).join("")}</ul>` : ""}`;
  }
  if (!items) return `<div class="ai-nodata">견적/청구 OCR 추출내역이 없습니다.</div>`;
  return `
    <table class="ocr-table">
      <thead><tr><th>부품/작업</th><th>수리방법</th><th class="num">부품비</th><th class="num">공임</th><th class="num">도장비</th><th>판정</th></tr></thead>
      <tbody>${items.map(it => `
        <tr class="st-${it.status === "승인" ? "ok" : it.status === "제외" ? "no" : "cond"}">
          <td>${escapeHtml(it.name)}</td><td>${escapeHtml(it.method)}</td>
          <td class="num">${it.part ? won(it.part) : "-"}</td>
          <td class="num">${it.labor ? won(it.labor) : "-"}</td>
          <td class="num">${it.paint ? won(it.paint) : "-"}</td>
          <td><span class="item-st st-${it.status === "승인" ? "ok" : it.status === "제외" ? "no" : "cond"}">${escapeHtml(it.status)}</span></td>
        </tr>`).join("")}</tbody>
    </table>
    <div class="ocr-foot">AI 승인금액 <b>${won(r.approval.approvedAmount)}원</b> · 제외 <b class="red">${won(r.approval.excludedAmount)}원</b></div>`;
}
function criteriaBars(r) {
  if (!r.criteria) return `<div class="ai-nodata">판단기준 점수가 아직 산출되지 않았습니다.</div>`;
  return r.criteria.map((c, i) => {
    const pct = Math.round((c.got / c.max) * 100);
    const lack = c.got < c.max;
    return `
    <div class="cri-row ${lack ? "has-reason" : ""}" data-cri="${i}">
      <div class="cri-top">
        <span class="cri-name">${escapeHtml(c.name)} ${lack && c.reason ? '<span class="cri-caret">▾</span>' : ""}</span>
        <span class="cri-score">${c.got} / ${c.max}</span>
      </div>
      <div class="cri-bar"><div class="cri-fill ${pct < 70 ? "low" : ""}" style="width:${pct}%"></div></div>
      ${lack && c.reason ? `<div class="cri-reason">${escapeHtml(c.reason)}</div>` : ""}
    </div>`;
  }).join("");
}
function detailActionButtons(r) {
  if (r.stage === "완료") return `<div class="da-done">✓ 처리 완료 · ${escapeHtml(r.handledBy || "담당자")} (${escapeHtml(r.handledAt || r.analyzedAt)})</div>`;
  if (r.decision === "분석실패") {
    return `<button class="da-btn" data-act="reanalyze">AI 재분석</button>
            <button class="da-btn" data-act="toManual">직접검토 전환</button>`;
  }
  if (r.stage === "손해사정") {
    return `<button class="da-btn ghost" data-act="supplement">자료보완 요청</button>
            <button class="da-btn ghost" data-act="toManual">직접검토 전환</button>
            <button class="da-btn edit" data-act="editConfirm">수정 후 확정</button>
            <button class="da-btn primary" data-act="confirm">AI 결과 확정</button>`;
  }
  // 수리승인 기본
  return `<button class="da-btn ghost" data-act="supplement">자료보완 요청</button>
          <button class="da-btn ghost" data-act="toManual">직접검토 전환</button>
          <button class="da-btn edit" data-act="editApprove">수정 후 승인</button>
          <button class="da-btn primary" data-act="approve">AI 결과 승인</button>`;
}
function renderDetail(r) {
  const rep = r.report || {};
  const reportBlock = (title, arr, cls) => (arr && arr.length)
    ? `<div class="rep-block"><div class="rep-t ${cls || ""}">${title}</div><ul>${arr.map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul></div>` : "";
  const hold = (r.forcedHold || []).length
    ? `<div class="det-hold">⚠ 강제 보류: ${r.forcedHold.map(escapeHtml).join(" · ")}</div>` : "";
  const fail = r.failReason ? `<div class="det-hold fail">⚠ 분석실패 사유: ${escapeHtml(r.failReason)}</div>` : "";
  const reanalyze = r.needsReanalyze ? `<div class="det-hold reanalyze">AI 분석 이후 자료가 변경되었습니다. 재분석이 필요합니다.</div>` : "";

  $("#aiDetailBody").innerHTML = `
    <div class="det-head">
      <button class="det-back" type="button" data-act="back">← 목록으로</button>
      <div class="det-hid">
        <span class="det-id">${r.claimId}</span>
        <span class="det-sub">${escapeHtml(r.custName)} · ${escapeHtml(r.plate)} · ${escapeHtml(r.carModel)} · ${escapeHtml(r.shop)}</span>
      </div>
      <div class="det-badges">${stageBadge(r.stage)} ${decisionBadge(r.decision)} <span class="det-mgr">담당 ${escapeHtml(r.manager)}</span></div>
    </div>
    ${hold}${fail}${reanalyze}

    <section class="det-score card">
      <div class="ds-donut">${donutSvg("det", r.score, r.decision, true)}</div>
      <div class="ds-info">
        <div class="ds-decision">${decisionBadge(r.decision)}<span class="ds-review">${escapeHtml(r.reviewType)}</span></div>
        <div class="ds-grid">
          <div><span class="ds-k">AI 신뢰도</span><span class="ds-v">${r.confidence == null ? "–" : r.confidence + "%"}</span></div>
          <div><span class="ds-k">단계</span><span class="ds-v">${escapeHtml(r.stage)}</span></div>
          <div><span class="ds-k">분석일시</span><span class="ds-v">${escapeHtml(r.analyzedAt)}</span></div>
          <div><span class="ds-k">재분석 차수</span><span class="ds-v">${r.round}차</span></div>
        </div>
        <div class="ds-summary">${escapeHtml(r.summary)}</div>
      </div>
    </section>

    <section class="det-criteria card">
      <div class="det-ct">판단기준별 Score <span class="det-hint">항목 클릭 시 감점사유 표시</span></div>
      <div class="cri-list">${criteriaBars(r)}</div>
    </section>

    <section class="det-compare">
      <div class="cmp-col card">
        <div class="cmp-t">파손사진 · AI 인식</div>
        ${photoCards(r)}
      </div>
      <div class="cmp-col card">
        <div class="cmp-t">${r.hasBill ? "청구서" : "견적서"} · OCR 추출내역</div>
        ${estimateTable(r)}
      </div>
    </section>

    <section class="det-report card">
      <div class="det-ct">AI 심사 레포트</div>
      ${rep.verdict ? `<div class="rep-verdict">${escapeHtml(rep.verdict)}</div>` : ""}
      <div class="rep-cols">
        ${reportBlock("확인된 파손", rep.confirmed)}
        ${reportBlock(r.hasBill ? "청구 내용" : "견적 청구내용", rep.claimed)}
        ${reportBlock("불일치 항목", rep.mismatch, "warn")}
        ${reportBlock("권장조치", rep.recommend, "rec")}
      </div>
    </section>

    ${r.stage !== "완료" && r.reply !== undefined ? `
    <section class="det-reply card">
      <div class="det-ct">검토회신 초안 <span class="det-hint">담당자 수정 가능</span></div>
      <textarea id="aiReplyEditor" rows="4">${escapeHtml(r.reply || "")}</textarea>
    </section>` : (r.reply ? `
    <section class="det-reply card">
      <div class="det-ct">검토회신</div>
      <div class="reply-final">${escapeHtml(r.reply)}</div>
    </section>` : "")}

    <section class="det-actions">${detailActionButtons(r)}</section>

    <section class="det-history card">
      <div class="det-ct">처리 · 재분석 이력</div>
      <table class="hist-table">
        <thead><tr><th>일시</th><th>처리자</th><th>구분</th><th>내용</th></tr></thead>
        <tbody>${(r.history || []).map(h => `<tr><td>${escapeHtml(h.at)}</td><td>${escapeHtml(h.actor)}</td><td>${escapeHtml(h.type)}</td><td>${escapeHtml(h.after || "")}${h.before ? ` <span class="hist-before">(이전: ${escapeHtml(h.before)})</span>` : ""}</td></tr>`).join("")}</tbody>
      </table>
    </section>`;

  animateDonut($("#aiDetailBody").querySelector(".donut"), r.score);
}
function openDetail(id) {
  const r = getReview(id); if (!r) return;
  aiState.detailId = id;
  closeDrawer();
  renderDetail(r);
  $("#viewAi").classList.add("hidden");
  $("#viewAiDetail").classList.remove("hidden");
  window.scrollTo(0, 0);
}
function backToList() {
  aiState.detailId = null;
  $("#viewAiDetail").classList.add("hidden");
  $("#viewAi").classList.remove("hidden");
  renderAiSummary();
  renderAiList();
}

/* ------------------------------------------------------------------ *
 * 9. 담당자 액션 (승인/확정/보완/직접검토/자료요청/재분석)
 * ------------------------------------------------------------------ */
function pushHistory(r, type, after, before) {
  (r.history = r.history || []).push({ at: formatNowStamp(), actor: r.manager || "담당자", type, before: before || "", after });
}
function handleAction(r, act) {
  switch (act) {
    case "reqPhoto": openSendStub(r, "사진"); return;
    case "reqEstimate": openSendStub(r, r.decision === "청구서대기" ? "청구서" : "견적"); return;
    case "confirmData": confirmData(r); return;
    case "reanalyze": runReanalyze(r); return;
    case "supplement":
      r.stage = r.stage === "손해사정" ? "손해사정" : "수리승인"; r.decision = "자료대기";
      r.missing = r.missing && r.missing.length ? r.missing : ["보완 자료"];
      pushHistory(r, "자료보완 요청", "자료대기로 전환");
      showToast(`${r.claimId} 자료보완을 요청했습니다.`); refreshAll(); return;
    case "toManual":
      pushHistory(r, "직접검토 전환", "담당자 직접검토");
      showToast(`${r.claimId} 담당자 직접검토로 전환했습니다.`); refreshAll(); return;
    case "approve": commitApprove(r, false); return;
    case "editApprove": commitApprove(r, true); return;
    case "confirm": commitConfirm(r, false); return;
    case "editConfirm": commitConfirm(r, true); return;
  }
}
function readReply(r) {
  const ed = $("#aiReplyEditor");
  if (ed && ed.value !== r.reply) {
    pushHistory(r, "검토회신 수정", ed.value.slice(0, 40) + "…", (r.reply || "").slice(0, 40) + "…");
    r.reply = ed.value;
  }
}
function commitApprove(r, edited) {
  readReply(r);
  const before = `AI 승인 ${won((r.approval && r.approval.approvedAmount) || 0)}원`;
  if (edited) {
    const cur = (r.approval && r.approval.approvedAmount) || 0;
    const input = prompt("담당자 승인금액을 입력하세요 (원)", String(cur));
    if (input == null) return;
    const val = parseInt(String(input).replace(/[^\d]/g, ""), 10) || 0;
    r.approval = r.approval || {}; r.approval.finalAmount = val;
    pushHistory(r, "수정 후 승인", `담당자 승인 ${won(val)}원`, before);
  } else {
    r.approval = r.approval || {}; r.approval.finalAmount = r.approval.approvedAmount;
    pushHistory(r, "AI 결과 승인", `승인금액 ${won(r.approval.approvedAmount || 0)}원 확정`);
  }
  r.stage = "완료"; r.handledBy = r.manager; r.handledAt = formatNowStamp();
  showToast(`${r.claimId} 수리승인을 완료했습니다.`);
  backToList();
}
function commitConfirm(r, edited) {
  readReply(r);
  const a = r.adjust || {};
  const before = `AI 인정 ${won(a.aiAmount || 0)}원`;
  if (edited) {
    const input = prompt("담당자 확정 인정금액을 입력하세요 (원)", String(a.aiAmount || 0));
    if (input == null) return;
    const val = parseInt(String(input).replace(/[^\d]/g, ""), 10) || 0;
    a.finalAmount = val; r.adjust = a;
    pushHistory(r, "수정 후 확정", `담당자 인정 ${won(val)}원`, before);
  } else {
    a.finalAmount = a.aiAmount; r.adjust = a;
    pushHistory(r, "AI 결과 확정", `인정금액 ${won(a.aiAmount || 0)}원 확정`);
  }
  r.stage = "완료"; r.handledBy = r.manager; r.handledAt = formatNowStamp();
  showToast(`${r.claimId} 손해사정을 확정했습니다.`);
  backToList();
}
// 사진/견적/청구서 요청 — 발송화면 호출 인터페이스 스텁 (실제 발송 연동 제외, Plan 3.2)
function openSendStub(r, kind) {
  const claim = (typeof CLAIMS !== "undefined") && CLAIMS.find(c => c.id === r.claimId);
  pushHistory(r, `${kind}요청`, `알림톡/SMS ${kind}요청 발송`);
  showToast(`${r.claimId} ${kind} 요청을 알림톡·SMS 발송화면으로 전달했습니다. (발송 연동은 별도 화면)`);
  if (aiState.drawerId === r.claimId) renderDrawer(r);
}
// 자료 확인 완료 → 재검증 후 재분석 (TC-04 / TC-05)
function confirmData(r) {
  const need = [];
  if (!r.hasPhoto) need.push("차량 파손사진");
  if (r.reviewType.indexOf("손해사정") >= 0 || r.decision === "청구서대기") { if (!r.hasBill) need.push("최종 청구서"); }
  else if (!r.hasEstimate) need.push("선견적");
  if (need.length) {
    showToast(`AI 심사를 다시 진행할 수 없습니다. 부족자료: ${need.join(", ")}`);
    return;
  }
  runReanalyze(r);
}
// AI 재분석 (시연) — 분석중 → 결과 산출, 차수 증가
function runReanalyze(r) {
  r.decision = "AI 분석중"; r.needsReanalyze = false; r.failReason = null;
  pushHistory(r, "AI 재분석 시작", `${r.round + 1}차 분석`);
  refreshAll();
  const finish = () => {
    r.round += 1; r.analyzedAt = formatNowStamp();
    r.confidence = r.confidence && r.confidence >= 80 ? r.confidence : 90;
    if (!r.criteria) {
      const isAdj = r.reviewType.indexOf("손해사정") >= 0;
      r.criteria = isAdj
        ? mkCriteria(CRITERIA_ADJUST, [22, 17, 19, 13, 11, 5], [])
        : mkCriteria(CRITERIA_APPROVAL, [15, 20, 16, 18, 9, 7], []);
    }
    r.score = r.criteria.reduce((s, c) => s + c.got, 0);
    r.decision = (r.forcedHold && r.forcedHold.length) ? "보류" : judgeByScore(r.score);
    r.stage = r.reviewType.indexOf("손해사정") >= 0 ? "손해사정" : "수리승인";
    r.summary = `재분석 결과 종합점수 ${r.score}점 · ${r.decision}`;
    if (!r.approval && r.stage === "수리승인") r.approval = { approvable: "일부 승인", approvedAmount: Math.round(r.score * 15000), excludedAmount: 120000, items: [] };
    if (!r.adjust && r.stage === "손해사정") r.adjust = { claimedAmount: 1900000, aiAmount: 1700000, deniedAmount: 200000, diffText: "승인견적 대비 +11%", deniedItems: [] };
    pushHistory(r, "AI 재분석 완료", `${r.decision} · ${r.score}점 (${r.round}차)`);
    showToast(`${r.claimId} 재분석 완료 — ${r.score}점 · ${r.decision}`);
    refreshAll();
    if (aiState.detailId === r.claimId) renderDetail(r);
    else openDrawer(r.claimId);
  };
  if (REDUCED_MOTION) finish();
  else setTimeout(finish, 1600);
}
function refreshAll() {
  renderAiSummary();
  renderAiList();
  if (aiState.drawerId) { const r = getReview(aiState.drawerId); if (r) renderDrawer(r); }
}

/* ------------------------------------------------------------------ *
 * 10. 수기 AI 검토요청 + 시연 진행 애니메이션 (Plan 6)
 * ------------------------------------------------------------------ */
const PROGRESS_STEPS = [
  "사고 및 차량정보 확인", "파손사진 분석", "견적서·청구서 OCR 인식",
  "사진·견적 항목 비교", "판단기준별 Score 산출", "AI 심사 레포트 작성", "분석결과 생성 완료"
];
function closeAiModal() {
  const root = $("#aiModalRoot");
  root.classList.remove("open"); root.setAttribute("aria-hidden", "true"); root.innerHTML = "";
}
function openRequestModal() {
  const root = $("#aiModalRoot");
  const opts = AI_REVIEWS.map(r => `<option value="${r.claimId}">${r.claimId} · ${escapeHtml(r.custName)} · ${escapeHtml(r.plate)}</option>`).join("");
  root.innerHTML = `
    <div class="modal-backdrop" data-ai-close></div>
    <section class="action-modal ai-modal" role="dialog" aria-modal="true" aria-label="AI 검토요청">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">AI 통합대시보드 · 수기 검토요청 <span class="demo-badge">시연모드</span></div>
          <h2 class="modal-title">+ AI 검토요청</h2>
          <div class="modal-sub">사고건과 분석단계를 선택하고 AI 분석을 시작하세요.</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-ai-close>×</button>
      </div>
      <div class="modal-body" id="aiReqBody">
        <div class="req-grid">
          <div class="req-field full"><div class="k">접수번호</div><select id="areqClaim">${opts}</select></div>
          <div class="req-field"><div class="k">차량번호</div><input id="areqPlate" readonly /></div>
          <div class="req-field"><div class="k">차량명</div><input id="areqModel" readonly /></div>
          <div class="req-field"><div class="k">정비업체</div><input id="areqShop" readonly /></div>
          <div class="req-field"><div class="k">분석단계</div><select id="areqStage">
            <option value="수리 전 견적심사">수리 전 견적 적정성</option>
            <option value="수리 후 손해사정">수리 후 최종 인정금액</option>
          </select></div>
          <div class="req-field full"><div class="k">현재 보유자료</div><div id="areqHave" class="have-chips"></div></div>
          <div class="req-field full"><div class="k">요청사유</div><textarea id="areqReason" rows="2" placeholder="검토 요청 사유를 입력하세요."></textarea></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-modal" type="button" data-ai-close>취소</button>
        <button class="btn-modal primary" type="button" id="areqStart">AI 분석 시작</button>
      </div>
    </section>`;
  root.classList.add("open"); root.setAttribute("aria-hidden", "false");
  const sync = () => {
    const r = getReview($("#areqClaim").value);
    if (!r) return;
    $("#areqPlate").value = r.plate; $("#areqModel").value = r.carModel; $("#areqShop").value = r.shop;
    const chips = [];
    chips.push(`<span class="have-chip ${r.hasPhoto ? "on" : "off"}">파손사진 ${r.hasPhoto ? "✓" : "없음"}</span>`);
    chips.push(`<span class="have-chip ${r.hasEstimate ? "on" : "off"}">선견적 ${r.hasEstimate ? "✓" : "없음"}</span>`);
    chips.push(`<span class="have-chip ${r.hasBill ? "on" : "off"}">청구서 ${r.hasBill ? "✓" : "없음"}</span>`);
    $("#areqHave").innerHTML = chips.join("");
  };
  sync();
  root.querySelector("#areqClaim").addEventListener("change", sync);
  root.querySelectorAll("[data-ai-close]").forEach(el => el.addEventListener("click", closeAiModal));
  root.querySelector("#areqStart").addEventListener("click", startAnalysis);
}
function startAnalysis() {
  const r = getReview($("#areqClaim").value);
  const stage = $("#areqStage").value;
  if (!r) return;
  // 필수자료 검증 (Plan 6.2)
  const need = [];
  if (!r.hasPhoto) need.push("파손사진");
  if (stage.indexOf("손해사정") >= 0) { if (!r.hasBill) need.push("최종 청구서"); }
  else if (!r.hasEstimate) need.push("선견적");
  if (need.length) {
    showToast(`필수자료가 부족하여 분석을 시작할 수 없습니다. 부족자료: ${need.join(", ")}`);
    return;
  }
  r.reviewType = stage; r.requestType = "수기";
  runProgress(r);
}
function runProgress(r) {
  const body = $("#aiReqBody");
  body.innerHTML = `
    <div class="prog-wrap">
      <div class="prog-bar"><div class="prog-fill" id="progFill"></div></div>
      <div class="prog-pct" id="progPct">0%</div>
      <ul class="prog-steps" id="progSteps">
        ${PROGRESS_STEPS.map((s, i) => `<li class="prog-step" data-i="${i}"><span class="ps-ic"></span><span class="ps-tx">${escapeHtml(s)}</span></li>`).join("")}
      </ul>
      <div class="prog-note">시연모드 · 사전 정의된 분석결과를 사용합니다.</div>
    </div>`;
  $("#areqStart").disabled = true;
  const steps = [...document.querySelectorAll(".prog-step")];
  const total = steps.length;
  const stepDur = REDUCED_MOTION ? 0 : 700;
  let i = 0;
  const advance = () => {
    if (i > 0) { steps[i - 1].classList.remove("doing"); steps[i - 1].classList.add("done"); }
    if (i < total) {
      steps[i].classList.add("doing");
      const pct = Math.round(((i + 1) / total) * 100);
      $("#progFill").style.width = pct + "%"; $("#progPct").textContent = pct + "%";
      i++;
      setTimeout(advance, stepDur);
    } else {
      finishAnalysis(r);
    }
  };
  advance();
}
function finishAnalysis(r) {
  // 시연: 사전 정의 결과가 있으면 사용, 없으면 산출
  if (!r.criteria || r.decision === "AI 분석중" || r.decision === "자료대기") {
    const isAdj = r.reviewType.indexOf("손해사정") >= 0;
    r.criteria = isAdj
      ? mkCriteria(CRITERIA_ADJUST, [19, 15, 18, 13, 12, 5], [])
      : mkCriteria(CRITERIA_APPROVAL, [15, 18, 14, 19, 10, 6], []);
    r.score = r.criteria.reduce((s, c) => s + c.got, 0);
    r.confidence = 91;
    r.decision = (r.forcedHold && r.forcedHold.length) ? "보류" : judgeByScore(r.score);
    r.stage = isAdj ? "손해사정" : "수리승인";
    r.summary = r.summary && r.summary.indexOf("시작할 수 없") < 0 ? r.summary : `AI 분석 결과 ${r.score}점 · ${r.decision}`;
    if (!r.report) r.report = { verdict: `${r.decision} — AI 분석 완료`, confirmed: [], claimed: [], mismatch: [], recommend: r.recommend || [] };
    if (!r.approval && r.stage === "수리승인") r.approval = { approvable: "일부 승인", approvedAmount: Math.round(r.score * 15000), excludedAmount: 200000, items: [] };
  }
  r.round = Math.max(1, r.round + 1); r.analyzedAt = formatNowStamp();
  pushHistory(r, "AI 분석 완료(수기)", `${r.decision} · ${r.score != null ? r.score + "점" : "-"} (${r.round}차)`);
  const body = $("#aiReqBody");
  body.querySelector(".prog-wrap").insertAdjacentHTML("beforeend", `
    <div class="prog-result">
      <div class="pr-title">✓ AI 검토가 완료되었습니다.</div>
      <div class="pr-score">종합점수 <b>${r.score != null ? r.score + "점" : "-"}</b> · ${escapeHtml(r.decision)}</div>
      <div class="pr-sub">확인이 필요한 항목을 요약패널에서 확인하세요.</div>
    </div>`);
  const foot = document.querySelector(".ai-modal .modal-foot");
  if (foot) foot.innerHTML = `<button class="btn-modal primary" type="button" id="areqDone">결과 확인</button>`;
  const done = () => { closeAiModal(); refreshAll(); openDrawer(r.claimId); };
  const btn = $("#areqDone");
  if (btn) btn.addEventListener("click", done);
  if (REDUCED_MOTION) done();
}

/* ------------------------------------------------------------------ *
 * 11. 이벤트 바인딩 + 초기화
 * ------------------------------------------------------------------ */
function initAiDashboard() {
  renderAiSummary();
  renderAiList();

  // 요약카드 클릭 → 필터
  $("#aiSummary").addEventListener("click", e => {
    const btn = e.target.closest("[data-card]"); if (!btn) return;
    const key = btn.dataset.card;
    aiState.cardFilter = (aiState.cardFilter === key) ? null : key;
    renderAiSummary(); renderAiList();
  });

  // 필터 컨트롤
  ["#fStage", "#fDecision", "#fScore", "#fConf"].forEach(sel => {
    const el = document.querySelector(sel); if (!el) return;
    el.addEventListener("change", () => {
      aiState.filters.stage = $("#fStage").value;
      aiState.filters.decision = $("#fDecision").value;
      aiState.filters.scoreBand = $("#fScore").value;
      aiState.filters.confBand = $("#fConf").value;
      renderAiList();
    });
  });
  $("#fSearch").addEventListener("input", () => { aiState.filters.q = $("#fSearch").value; renderAiList(); });
  $("#fReset").addEventListener("click", () => {
    aiState.filters = { stage: "전체", decision: "전체", scoreBand: "전체", confBand: "전체", q: "" };
    aiState.cardFilter = null;
    $("#fStage").value = "전체"; $("#fDecision").value = "전체"; $("#fScore").value = "전체"; $("#fConf").value = "전체"; $("#fSearch").value = "";
    renderAiSummary(); renderAiList();
  });

  // 목록 클릭 (이동 / 접수번호)
  $("#aiRows").addEventListener("click", e => {
    const mv = e.target.closest("[data-move]"); if (mv) { openDrawer(mv.dataset.move); return; }
    const dt = e.target.closest("[data-detail]"); if (dt) { openDrawer(dt.dataset.detail); return; }
  });

  // 검토요청 버튼
  $("#btnAiRequest").addEventListener("click", openRequestModal);

  // Drawer 액션
  $("#aiDrawer").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act;
    if (act === "close") { closeDrawer(); return; }
    const r = getReview(aiState.drawerId); if (!r) return;
    if (act === "detail") { openDetail(r.claimId); return; }
    handleAction(r, act);
  });
  $("#aiDrawerBackdrop").addEventListener("click", closeDrawer);

  // Detail 액션 (이벤트 위임)
  $("#viewAiDetail").addEventListener("click", e => {
    const b = e.target.closest("[data-act]"); if (b) {
      const act = b.dataset.act;
      if (act === "back") { backToList(); return; }
      const r = getReview(aiState.detailId); if (!r) return;
      handleAction(r, act);
      return;
    }
    const cri = e.target.closest(".cri-row.has-reason");
    if (cri) cri.classList.toggle("open");
  });

  // ESC 로 drawer/detail 닫기
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if ($("#aiModalRoot").classList.contains("open")) { closeAiModal(); return; }
    if (aiState.drawerId) { closeDrawer(); return; }
  });
}

document.addEventListener("DOMContentLoaded", initAiDashboard);
