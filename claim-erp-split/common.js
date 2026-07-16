"use strict";

const STAGES = ["접수·선견적", "수리 승인", "손해사정", "지급 / 정산"];
const STAGE_SHORT = { "접수·선견적":"접수", "수리 승인":"승인", "손해사정":"사정", "지급 / 정산":"정산" };

const URGENCY_CLASS = { "긴급":"u-urgent", "주의":"u-warn", "정상":"u-normal" };
const PROC_CLASS    = { "미처리":"s-todo", "처리중":"s-doing", "완료":"s-done", "보류":"s-hold" };

const CLAIMS = [
  /* ---- 1. 접수·선견적 (접수 확인 + 입고/선견적 통합) ---- */
  { id:"CLM-2026-0001", name:"김민수", car:"12하3456", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 미응답", status:"계약정보 확인", urgency:"주의", elapsed:"6시간 20분", manager:"박지현", procStatus:"미처리",
    deductible:"손해액의 20% / 20~50만원",
    actionDesc:"운전자 정보 및 사고경위 확인 요청 후 미응답",
    nextAction:"고객에게 정보 입력 링크를 재발송하세요." },
  { id:"CLM-2026-0002", name:"이서연", car:"34허7821", custType:"리스",
    flowStage:"접수·선견적", actionType:"계약 조사", status:"이전 접수이력 확인", urgency:"정상", elapsed:"2시간 15분", manager:"최도윤", procStatus:"처리중",
    deductible:"30만원",
    actionDesc:"동일 차량의 이전 사고 접수 이력 확인이 필요함",
    nextAction:"이전 사고 이력 확인 후 중복 여부를 판단하세요." },
  { id:"CLM-2026-0013", name:"조민혁", car:"47너8253", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 미응답", status:"운전자 정보 확인", urgency:"정상", elapsed:"2시간 45분", manager:"박지현", procStatus:"미처리",
    deductible:"50만원",
    actionDesc:"운전자 면허번호 입력 요청 후 미응답",
    nextAction:"고객에게 정보 입력 링크를 재발송하세요." },
  { id:"CLM-2026-0014", name:"서지우", car:"31두5147", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 미응답", status:"사고정보 확인", urgency:"주의", elapsed:"5시간 10분", manager:"최도윤", procStatus:"처리중",
    deductible:"손해액의 20% / 20~50만원",
    actionDesc:"사고경위 확인 요청 후 미응답",
    nextAction:"고객 전화로 사고경위를 직접 확인하세요." },
  { id:"CLM-2026-0015", name:"황민서", car:"62루1428", custType:"리스",
    flowStage:"접수·선견적", actionType:"계약 조사", status:"계약정보 확인", urgency:"정상", elapsed:"1시간 50분", manager:"박지현", procStatus:"미처리",
    deductible:"30만원",
    actionDesc:"계약자/운전자 관계 확인이 필요함",
    nextAction:"계약조건의 운전자 범위를 확인하세요." },
  { id:"CLM-2026-0016", name:"노아인", car:"19모7765", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"계약 조사", status:"이전 접수이력 확인", urgency:"정상", elapsed:"3시간", manager:"김하늘", procStatus:"미처리",
    deductible:"50만원",
    actionDesc:"동일 고객의 최근 3개월 내 접수이력 확인이 필요함",
    nextAction:"이전 접수이력 조회 후 중복 여부를 판단하세요." },
  { id:"CLM-2026-0017", name:"류현빈", car:"84버3391", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 연락요청", status:"사고정보 확인", urgency:"정상", elapsed:"1시간 20분", manager:"문태호", procStatus:"미처리",
    deductible:"손해액의 20% / 20~50만원",
    actionDesc:"고객이 접수 진행상황 문의로 연락을 요청함",
    nextAction:"고객에게 접수 진행상황을 안내하세요." },
  { id:"CLM-2026-0018", name:"김다온", car:"53소2284", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 미응답", status:"운전자 정보 확인", urgency:"정상", elapsed:"40분", manager:"박지현", procStatus:"미처리",
    deductible:"30만원",
    actionDesc:"운전자 인적사항 입력 대기 중",
    nextAction:"미응답 지속 시 정보요청 알림을 재발송하세요." },
  { id:"CLM-2026-0019", name:"박서윤", car:"26우6512", custType:"리스",
    flowStage:"접수·선견적", actionType:"계약 조사", status:"계약정보 확인", urgency:"정상", elapsed:"2시간 05분", manager:"최도윤", procStatus:"처리중",
    deductible:"50만원",
    actionDesc:"법인 계약 차량의 운전자 등록 여부 확인 중",
    nextAction:"법인 담당자에게 운전자 등록 여부를 확인하세요." },

  /* ---- (접수·선견적 계속) ---- */
  { id:"CLM-2026-0003", name:"정우진", car:"56호9012", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"사진 미등록", status:"선견적 자료 대기", urgency:"정상", elapsed:"4시간 40분", manager:"김하늘", procStatus:"미처리",
    actionDesc:"파손부위 근접사진과 차량 전체사진이 미등록됨",
    nextAction:"사진 요청 알림을 재발송하세요." },
  { id:"CLM-2026-0004", name:"박지훈", car:"78바1123", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"업체 미회신", status:"AOS 선견적 수신 대기", urgency:"주의", elapsed:"7시간 10분", manager:"오세린", procStatus:"미처리",
    actionDesc:"공업사에 AOS 선견적 요청 후 미회신",
    nextAction:"공업사에 선견적 등록을 재요청하세요." },
  { id:"CLM-2026-0012", name:"남기준", car:"33호1212", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 연락요청", status:"입고지 확인", urgency:"긴급", elapsed:"35분", manager:"문태호", procStatus:"미처리",
    actionDesc:"고객이 입고 가능 공업사와 수리 소요기간 문의로 연락 요청",
    nextAction:"고객에게 입고 가능 공업사와 예상 수리일정을 안내하세요." },
  { id:"CLM-2026-0020", name:"이준호", car:"71자9034", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"사진 미등록", status:"선견적 자료 대기", urgency:"정상", elapsed:"3시간 05분", manager:"김하늘", procStatus:"미처리",
    actionDesc:"차량 전체사진이 미등록됨",
    nextAction:"사진 요청 알림을 재발송하세요." },
  { id:"CLM-2026-0021", name:"정하람", car:"38조4470", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"업체 미회신", status:"AOS 선견적 수신 대기", urgency:"주의", elapsed:"6시간 40분", manager:"오세린", procStatus:"미처리",
    actionDesc:"공업사 AOS 선견적 등록이 지연되고 있음",
    nextAction:"공업사에 선견적 등록을 재요청하세요." },
  { id:"CLM-2026-0022", name:"최서아", car:"95고1182", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"사진 미등록", status:"선견적 자료 대기", urgency:"주의", elapsed:"8시간 10분", manager:"김하늘", procStatus:"미처리",
    actionDesc:"파손부위 근접사진 미등록으로 선견적 검토가 불가함",
    nextAction:"고객 전화로 사진 등록 방법을 안내하세요." },
  { id:"CLM-2026-0023", name:"강시우", car:"14노5521", custType:"리스",
    flowStage:"접수·선견적", actionType:"입고/수리 지연", status:"입고지 확인", urgency:"정상", elapsed:"2시간 30분", manager:"문태호", procStatus:"처리중",
    actionDesc:"입고 예정 공업사가 미확정 상태임",
    nextAction:"고객과 입고지 협의 후 공업사를 확정하세요." },
  { id:"CLM-2026-0024", name:"윤지호", car:"58도8810", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"업체 미회신", status:"AOS 선견적 수신 대기", urgency:"정상", elapsed:"1시간 35분", manager:"오세린", procStatus:"미처리",
    actionDesc:"공업사에 선견적 요청 후 회신 대기 중",
    nextAction:"회신기한 경과 시 공업사에 재요청하세요." },
  { id:"CLM-2026-0025", name:"임채원", car:"42로3356", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"고객 미응답", status:"입고지 확인", urgency:"주의", elapsed:"5시간 25분", manager:"박지현", procStatus:"미처리",
    actionDesc:"입고 일정 안내 후 고객 미응답",
    nextAction:"고객에게 입고 일정 확인을 재요청하세요." },
  { id:"CLM-2026-0026", name:"한지안", car:"77보6643", custType:"리스",
    flowStage:"접수·선견적", actionType:"입고/수리 지연", status:"입고 확인 대기", urgency:"정상", elapsed:"4시간", manager:"문태호", procStatus:"미처리",
    actionDesc:"공업사 입고 예정시간 경과 후 입고확인 미회신",
    nextAction:"공업사에 입고 여부를 확인하세요." },
  { id:"CLM-2026-0027", name:"오도현", car:"29수9917", custType:"렌터카",
    flowStage:"접수·선견적", actionType:"사진 미등록", status:"선견적 자료 대기", urgency:"정상", elapsed:"1시간 10분", manager:"김하늘", procStatus:"미처리",
    actionDesc:"번호판 사진이 미등록됨",
    nextAction:"사진 요청 알림을 발송하세요." },

  /* ---- 3. 수리 승인 ---- */
  { id:"CLM-2026-0005", name:"한유나", car:"90하4455", custType:"리스",
    flowStage:"수리 승인", actionType:"입고/수리 지연", status:"수리 승인 대기", urgency:"긴급", elapsed:"1일 3시간", manager:"문태호", procStatus:"미처리",
    actionDesc:"선견적 검토 후 수리 승인 처리가 지연되고 있음",
    nextAction:"선견적 금액 확인 후 수리 승인 여부를 결정하세요." },
  { id:"CLM-2026-0006", name:"강도현", car:"23허6789", custType:"렌터카",
    flowStage:"수리 승인", actionType:"업체 미회신", status:"공업사 수리 오더 대기", urgency:"주의", elapsed:"5시간 30분", manager:"유나래", procStatus:"처리중",
    actionDesc:"공업사 수리 오더 전달 후 진행상태 미회신",
    nextAction:"공업사에 수리 오더 확인을 요청하세요." },
  { id:"CLM-2026-0028", name:"신유진", car:"66어2208", custType:"리스",
    flowStage:"수리 승인", actionType:"입고/수리 지연", status:"수리 승인 대기", urgency:"긴급", elapsed:"1일 6시간", manager:"문태호", procStatus:"미처리",
    actionDesc:"선견적 검토 완료 후 수리 승인이 1일 이상 지연됨",
    nextAction:"선견적 금액 확인 후 수리 승인을 처리하세요." },
  { id:"CLM-2026-0029", name:"백승호", car:"81저7745", custType:"렌터카",
    flowStage:"수리 승인", actionType:"업체 미회신", status:"공업사 수리 오더 대기", urgency:"주의", elapsed:"7시간 20분", manager:"유나래", procStatus:"미처리",
    actionDesc:"수리 오더 전달 후 공업사 확인 미회신",
    nextAction:"공업사에 수리 오더 확인을 요청하세요." },
  { id:"CLM-2026-0030", name:"장하늘", car:"36처4419", custType:"렌터카",
    flowStage:"수리 승인", actionType:"고객 연락요청", status:"수리 진행상태 확인", urgency:"정상", elapsed:"1시간 45분", manager:"문태호", procStatus:"미처리",
    actionDesc:"고객이 수리 진행상황 문의로 연락을 요청함",
    nextAction:"고객에게 수리 진행상태를 안내하세요." },
  { id:"CLM-2026-0031", name:"송민재", car:"92카8873", custType:"리스",
    flowStage:"수리 승인", actionType:"입고/수리 지연", status:"승인 후 진행 확인", urgency:"정상", elapsed:"3시간 30분", manager:"유나래", procStatus:"처리중",
    actionDesc:"수리 승인 후 공업사 착수 보고 대기 중",
    nextAction:"공업사 착수 여부를 확인하세요." },
  { id:"CLM-2026-0032", name:"안소율", car:"15타3160", custType:"렌터카",
    flowStage:"수리 승인", actionType:"업체 미회신", status:"공업사 수리 오더 대기", urgency:"정상", elapsed:"2시간 15분", manager:"유나래", procStatus:"보류",
    actionDesc:"부품 수급 확인 후 오더 예정으로 보류 중",
    nextAction:"부품 수급 확정 시 수리 오더를 전달하세요." },

  /* ---- 4. 손해사정 ---- */
  { id:"CLM-2026-0007", name:"배수빈", car:"45하2233", custType:"렌터카",
    flowStage:"손해사정", actionType:"업체 미회신", status:"AOS 청구 수신 대기", urgency:"주의", elapsed:"9시간 30분", manager:"박지현", procStatus:"미처리",
    actionDesc:"공업사 AOS 청구서 수신이 지연되고 있음",
    nextAction:"공업사에 AOS 청구 등록을 요청하세요." },
  { id:"CLM-2026-0008", name:"윤태준", car:"67호8844", custType:"리스",
    flowStage:"손해사정", actionType:"계약 조사", status:"면부책 및 과실 확인", urgency:"긴급", elapsed:"1일 2시간", manager:"최도윤", procStatus:"미처리",
    actionDesc:"면부책 및 과실 최종 확인이 필요함",
    nextAction:"계약조건과 사고내용을 확인하여 지급 가능 여부를 확정하세요." },
  { id:"CLM-2026-0033", name:"권나윤", car:"64파5528", custType:"렌터카",
    flowStage:"손해사정", actionType:"업체 미회신", status:"AOS 청구 수신 대기", urgency:"정상", elapsed:"3시간 40분", manager:"박지현", procStatus:"미처리",
    actionDesc:"공업사 AOS 청구서 수신 대기 중",
    nextAction:"회신기한 경과 시 청구 등록을 재요청하세요." },
  { id:"CLM-2026-0034", name:"홍서준", car:"73거2917", custType:"리스",
    flowStage:"손해사정", actionType:"계약 조사", status:"손해사정 진행", urgency:"정상", elapsed:"5시간", manager:"최도윤", procStatus:"처리중",
    actionDesc:"수리비 적정성 검토가 진행 중임",
    nextAction:"AOS 청구 내역과 선견적을 대조 검토하세요." },
  { id:"CLM-2026-0035", name:"문가은", car:"28너4631", custType:"렌터카",
    flowStage:"손해사정", actionType:"계약 조사", status:"면부책 및 과실 확인", urgency:"정상", elapsed:"2시간 50분", manager:"최도윤", procStatus:"미처리",
    actionDesc:"과실비율 협의 결과 반영이 필요함",
    nextAction:"보험사 과실 협의 결과를 확인해 반영하세요." },
  { id:"CLM-2026-0036", name:"양현우", car:"51더7384", custType:"렌터카",
    flowStage:"손해사정", actionType:"업체 미회신", status:"AOS 청구 수신 대기", urgency:"정상", elapsed:"1시간 25분", manager:"박지현", procStatus:"미처리",
    actionDesc:"공업사 청구 등록 안내 후 회신 대기 중",
    nextAction:"미회신 시 공업사에 전화로 확인하세요." },

  /* ---- 5. 지급 / 정산 ---- */
  { id:"CLM-2026-0009", name:"송예린", car:"89바3344", custType:"렌터카",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"손해액 확정 대기", urgency:"주의", elapsed:"2일 6시간", manager:"김하늘", procStatus:"미처리",
    actionDesc:"손해액 확정 후 공업사 안내가 필요함",
    nextAction:"손해액 확정 후 공업사에 정산 안내를 발송하세요." },
  { id:"CLM-2026-0010", name:"임재민", car:"11허5566", custType:"렌터카",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"SK렌터카 전산 입력 대기", urgency:"정상", elapsed:"1일 4시간", manager:"오세린", procStatus:"처리중",
    actionDesc:"SK렌터카 전산 수리내역 입력이 필요함",
    nextAction:"확정된 수리내역과 손해액을 SK렌터카 전산에 입력하세요." },
  { id:"CLM-2026-0011", name:"차은별", car:"22하9900", custType:"리스",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"월 정산 데이터 정리", urgency:"주의", elapsed:"3일 2시간", manager:"유나래", procStatus:"미처리",
    actionDesc:"월 정산 대상 건으로 데이터 정리가 필요함",
    nextAction:"월 정산 데이터에 사고번호, 수리비, 청구처를 반영하세요." },
  { id:"CLM-2026-0037", name:"고은채", car:"82머1473", custType:"리스",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"손해액 확정 대기", urgency:"주의", elapsed:"2일 1시간", manager:"유나래", procStatus:"미처리",
    actionDesc:"손해액 확정 지연으로 공업사 안내가 대기 중임",
    nextAction:"손해액 확정 후 공업사에 안내하세요." },
  { id:"CLM-2026-0038", name:"배진우", car:"17서6092", custType:"렌터카",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"SK렌터카 전산 입력 대기", urgency:"정상", elapsed:"6시간 15분", manager:"오세린", procStatus:"미처리",
    actionDesc:"확정 수리내역의 전산 입력이 필요함",
    nextAction:"수리내역과 손해액을 SK렌터카 전산에 입력하세요." },
  { id:"CLM-2026-0039", name:"유시현", car:"49어8265", custType:"렌터카",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"월 정산 데이터 정리", urgency:"정상", elapsed:"1일 2시간", manager:"유나래", procStatus:"처리중",
    actionDesc:"월 정산 대상 데이터 정리가 진행 중임",
    nextAction:"사고번호·수리비·청구처를 월 정산 데이터에 반영하세요." },
  { id:"CLM-2026-0040", name:"전하율", car:"91카3548", custType:"렌터카",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"공업사 정산 안내", urgency:"정상", elapsed:"4시간 50분", manager:"유나래", procStatus:"미처리",
    actionDesc:"손해액 확정 완료 — 공업사 안내가 필요함",
    nextAction:"공업사에 확정 손해액과 지급 일정을 안내하세요." },
  { id:"CLM-2026-0041", name:"진서호", car:"25하9136", custType:"리스",
    flowStage:"지급 / 정산", actionType:"고객 연락요청", status:"손해액 확정 대기", urgency:"정상", elapsed:"1시간", manager:"문태호", procStatus:"미처리",
    actionDesc:"고객이 청구 금액 문의로 연락을 요청함",
    nextAction:"고객에게 청구 내역을 안내하세요." },
  { id:"CLM-2026-0042", name:"마지원", car:"60호2751", custType:"렌터카",
    flowStage:"지급 / 정산", actionType:"정산 대기", status:"정산 완료", urgency:"정상", elapsed:"30분", manager:"유나래", procStatus:"완료",
    actionDesc:"월 정산 반영 완료 — 종결 처리됨",
    nextAction:"추가 조치가 필요하지 않습니다." }
];

const SHOPS = ["강남협력공업사", "블루핸즈 분당점", "오토큐 강서점", "민자동차공업사", "KCC오토 수원", "스피드메이트 송파", "현대모터스 일산"];
const MODELS = ["쏘나타", "아반떼", "그랜저", "K5", "스포티지", "싼타페", "쏘렌토", "셀토스", "G80", "레이", "캐스퍼", "투싼", "카니발", "모닝"];
const PRE_INTAKE_STATUS = /계약정보 확인|사고정보 확인|운전자 정보 확인|이전 접수이력 확인|입고지 확인|입고 확인 대기/;

const won = (n) => n.toLocaleString("ko-KR");
function deriveWork(c) {
  const idx = STAGES.indexOf(c.flowStage);         // 0 접수 → 3 정산
  const done = c.procStatus === "완료";
  // 현재 진행 단계의 활성 항목 상태: 처리중=요청, 미처리/보류=대기
  const active = done ? "완료" : (c.procStatus === "처리중" ? "요청" : "대기");
  const h = parseInt(c.id.replace(/\D/g, "").slice(-2), 10) || 0;
  const base = ((h % 28) + 6) * 100000;            // 추정 손해액 60만~330만 (데모)

  // --- 상태 텍스트 열 ---
  const approval = idx > 1 ? "완료" : idx === 1 ? active : "미완료";             // 수리 승인
  const repair   = idx >= 2 ? "완료" : idx === 1 ? active : "-";                 // 정비 진행
  // 부품·유리·실런트: 정비 세부 작업 — 입고(수리) 이후 일부 건만 진행
  const part     = idx >= 1 && h % 2 === 0 ? (idx >= 2 ? "완료" : active) : "-";
  const glass    = idx >= 1 && h % 3 === 0 ? (idx >= 2 ? "완료" : active) : "-";
  const sealant  = idx >= 1 && h % 4 === 0 ? (idx >= 2 ? "완료" : active) : "-";
  // 렌트(대차): 제공 건은 대여중 → 정산 후 반납
  const rent     = h % 2 === 1 ? (idx >= 3 && done ? "반납" : idx >= 1 ? "대여" : "-") : "-";

  // --- 금액(숫자) 열 --- 손해사정 이후 확정, 정산 단계에서 지급/수취
  const estimate  = idx >= 2 ? won(base) : "-";                                  // 손해액 추산
  const payment   = idx === 3 ? won(Math.round(base * 0.9 / 1000) * 1000) : "-"; // 지급액
  const exemption = c.deductibleType === "통합정액" ? won(200000) : won(300000); // 면책금액
  const receive   = idx === 3 && done ? won(Math.round(base * 0.1 / 1000) * 1000) : "-"; // 수취액

  return { repair, part, glass, sealant, rent, exemption, approval, estimate, payment, receive };
}

CLAIMS.forEach(c => {
  const n = parseInt((c.id.replace(/\D/g, "").slice(-4) || "0"), 10);
  // 정비공장 — 입고된 건만 표시, 입고 전이면 공백
  if (c.repairShop == null) {
    const preIntake = c.flowStage === "접수·선견적" && PRE_INTAKE_STATUS.test(c.status || "");
    c.repairShop = preIntake ? "" : SHOPS[n % SHOPS.length];
  }
  // 차량명(모델) — 데이터에 모델정보가 없어 접수번호 기반으로 배정
  if (c.carModel == null) c.carModel = MODELS[n % MODELS.length];
  // 면책금 개별/통합 구분 — 리스는 통합정액, 렌터카는 개별정액
  if (c.deductibleType == null) c.deductibleType = /리스/.test(c.custType) ? "통합정액" : "개별정액";
  if (c.deductible == null) c.deductible = c.deductibleType === "통합정액" ? "월 통합정산 차감" : "30만원";
  // 운전자 정보 유무 — "운전자 정보 확인" 상태 건은 정보 미확보로 간주
  if (c.driverInfo == null) c.driverInfo = !(c.status && c.status.indexOf("운전자 정보") >= 0);
  // 수리 승인: 검토요청 / 수리승인 구분
  if (c.flowStage === "수리 승인" && c.reviewState == null)
    c.reviewState = /수리 승인 대기|관리자|검토/.test(c.status) ? "검토요청" : "수리승인";
  // 지급/정산: 상신 상태 (종결 요청 리스트용)
  if (c.flowStage === "지급 / 정산" && c.submitState == null)
    c.submitState = c.procStatus === "완료" ? "완료" : (c.procStatus === "처리중" ? "상신" : "대기");
  // 업무 항목별 상태값 — 리스트 상태열 렌더링 기준
  if (c.work == null) c.work = deriveWork(c);
});
// 청구서 미수신(선견적만) → 면책 처리 후보 (좌측 필터 노출용)
["CLM-2026-0032", "CLM-2026-0029"].forEach(id => {
  const c = CLAIMS.find(x => x.id === id);
  if (c) { c.actionType = "청구서 미수신(선견적만)"; c.reviewState = "검토요청"; }
});

const memos = {}; // 사고번호별 처리 메모 임시 저장

const imgSelected = new Set();    // 선택된 이미지 id (현재 사고건 기준)
const imageSendLog = {};          // 사고번호별 이미지 문자 발송 이력

const panelState = {
  m: { folder: null, selected: new Set() },
  v: { folder: null, selected: new Set() }
};
function resetPanel(ns) { panelState[ns].folder = IMAGE_FOLDERS[0]; panelState[ns].selected.clear(); }

const IMAGE_FOLDERS = ["사고사진", "고객사진", "수리전사진", "수리완료사진", "청구관련서류", "종결", "기타"];
const FOLDER_KIND = { "청구관련서류": "doc", "종결": "doc" }; // 그 외는 photo

// url이 있으면 실제 이미지, 없으면 아이콘 썸네일로 표시된다.
function mkImg(id, name, date, src, url) { return { id, name, date, src, url }; }
const CLAIM_IMAGES = {
  "CLM-2026-0001": {
    "사고사진": [mkImg("i0101","사고현장_전경.jpg","06.13 14:40","cust"), mkImg("i0102","파손_우측후면_근접.jpg","06.13 14:41","cust"), mkImg("i0103","상대차량_번호판.jpg","06.13 14:42","cust")],
    "고객사진": [mkImg("i0111","운전면허증_앞면.jpg","06.13 16:05","cust"), mkImg("i0112","차량등록증.jpg","06.13 16:06","cust")],
    "수리전사진": [
      mkImg("i0121","전면_전체.jpg","06.14 10:20","shop","assets/accident_car/repair_01.jpg"),
      mkImg("i0122","라디에이터그릴_파손.jpg","06.14 10:21","shop","assets/accident_car/repair_02.jpg"),
      mkImg("i0123","앞범퍼_스크래치.jpg","06.14 10:22","shop","assets/accident_car/repair_03.jpg"),
      mkImg("i0124","헤드램프_우측.jpg","06.14 10:23","shop","assets/accident_car/repair_04.jpg"),
      mkImg("i0125","번호판_하단.jpg","06.14 10:24","shop","assets/accident_car/repair_05.jpg"),
      mkImg("i0126","좌측_펜더.jpg","06.14 10:25","shop","assets/accident_car/repair_06.jpg")
    ],
    "수리완료사진": [
      mkImg("i0131","도장완료_전면.jpg","06.18 15:40","shop","assets/accident_car/repair_07.jpg"),
      mkImg("i0132","조립완료_범퍼.jpg","06.18 15:41","shop","assets/accident_car/repair_08.jpg")
    ],
    "청구관련서류": [], "종결": [],
    "기타": [mkImg("i0191","블랙박스_캡처.png","06.13 17:20","staff")]
  },
  "CLM-2026-0004": {
    "사고사진": [mkImg("i0401","사고현장.jpg","06.12 09:10","cust"), mkImg("i0402","파손부위_범퍼.jpg","06.12 09:11","cust")],
    "고객사진": [mkImg("i0411","운전면허증.jpg","06.12 10:30","cust")],
    "수리전사진": [
      mkImg("i0421","입고_전면.jpg","06.13 11:00","shop","assets/accident_car/repair_09.jpg"),
      mkImg("i0422","범퍼_탈거전.jpg","06.13 11:02","shop","assets/accident_car/repair_10.jpg"),
      mkImg("i0423","그릴_손상_근접.jpg","06.13 11:03","shop","assets/accident_car/repair_11.jpg"),
      mkImg("i0424","헤드램프_주변.jpg","06.13 11:04","shop","assets/accident_car/repair_12.jpg"),
      mkImg("i0425","범퍼_하단_스크래치.jpg","06.13 11:05","shop","assets/accident_car/repair_13.jpg"),
      mkImg("i0426","번호판_탈거전.jpg","06.13 11:06","shop","assets/accident_car/repair_14.jpg")
    ],
    "수리완료사진": [
      mkImg("i0427","도장완료_전면.jpg","06.19 16:20","shop","assets/accident_car/repair_15.jpg"),
      mkImg("i0428","조립완료_그릴.jpg","06.19 16:21","shop","assets/accident_car/repair_16.jpg")
    ],
    "청구관련서류": [mkImg("i0431","선견적서.pdf","06.13 15:40","shop")],
    "종결": [], "기타": []
  },
  "CLM-2026-0007": {
    "사고사진": [mkImg("i0701","사고현장_야간.jpg","06.10 21:30","cust"), mkImg("i0702","파손_본넷.jpg","06.10 21:31","cust")],
    "고객사진": [mkImg("i0711","운전면허증.jpg","06.11 09:00","cust")],
    "수리전사진": [
      mkImg("i0721","입고_전면.jpg","06.11 14:00","shop","assets/accident_car/repair_17.jpg"),
      mkImg("i0722","본넷_주변_손상.jpg","06.11 14:01","shop","assets/accident_car/repair_18.jpg")
    ],
    "수리완료사진": [
      mkImg("i0731","수리완료_전면.jpg","06.17 16:00","shop","assets/accident_car/repair_19.jpg"),
      mkImg("i0732","도장완료.jpg","06.17 16:02","shop","assets/accident_car/repair_20.jpg")
    ],
    "청구관련서류": [mkImg("i0741","AOS청구서.pdf","06.18 10:00","shop"), mkImg("i0742","수리내역서.pdf","06.18 10:01","shop")],
    "종결": [], "기타": []
  },
  "CLM-2026-0010": {
    "사고사진": [mkImg("i1001","사고현장.jpg","06.05 13:20","cust")],
    "고객사진": [mkImg("i1011","운전면허증.jpg","06.05 14:00","cust")],
    "수리전사진": [mkImg("i1021","입고_전면.jpg","06.06 10:00","shop","assets/accident_car/repair_21.jpg")],
    "수리완료사진": [mkImg("i1031","수리완료_전면.jpg","06.12 15:00","shop","assets/accident_car/repair_22.jpg")],
    "청구관련서류": [mkImg("i1041","AOS청구서.pdf","06.13 09:00","shop"), mkImg("i1042","면책금영수증.pdf","06.13 17:00","shop")],
    "종결": [mkImg("i1051","종결보고서.pdf","06.13 18:00","staff"), mkImg("i1052","지급내역서.pdf","06.13 18:01","staff")],
    "기타": []
  },
  "CLM-2026-0006": {
    "사고사진": [mkImg("i0601","사고현장.jpg","06.09 08:40","cust"), mkImg("i0602","파손_전면.jpg","06.09 08:41","cust")],
    "고객사진": [mkImg("i0611","운전면허증.jpg","06.09 10:00","cust")],
    "수리전사진": [
      mkImg("i0621","입고_전면.jpg","06.10 09:30","shop","assets/accident_car/repair_01.jpg"),
      mkImg("i0622","그릴_손상.jpg","06.10 09:31","shop","assets/accident_car/repair_03.jpg"),
      mkImg("i0623","범퍼_스크래치.jpg","06.10 09:32","shop","assets/accident_car/repair_05.jpg"),
      mkImg("i0624","헤드램프_주변.jpg","06.10 09:33","shop","assets/accident_car/repair_08.jpg")
    ],
    "수리완료사진": [
      mkImg("i0631","도장완료_전면.jpg","06.16 15:10","shop","assets/accident_car/repair_15.jpg"),
      mkImg("i0632","조립완료.jpg","06.16 15:11","shop","assets/accident_car/repair_20.jpg")
    ],
    "청구관련서류": [], "종결": [], "기타": []
  },
  "CLM-2026-0011": {
    "사고사진": [mkImg("i1101","사고현장.jpg","06.04 17:20","cust")],
    "고객사진": [mkImg("i1111","운전면허증.jpg","06.04 18:00","cust")],
    "수리전사진": [
      mkImg("i1121","입고_전면.jpg","06.05 11:00","shop","assets/accident_car/repair_09.jpg"),
      mkImg("i1122","범퍼_탈거전.jpg","06.05 11:01","shop","assets/accident_car/repair_11.jpg"),
      mkImg("i1123","번호판_하단.jpg","06.05 11:02","shop","assets/accident_car/repair_13.jpg")
    ],
    "수리완료사진": [
      mkImg("i1131","도장완료_전면.jpg","06.11 14:30","shop","assets/accident_car/repair_16.jpg"),
      mkImg("i1132","수리완료_그릴.jpg","06.11 14:31","shop","assets/accident_car/repair_19.jpg")
    ],
    "청구관련서류": [], "종결": [], "기타": []
  }
};

function claimImages(claimId) { return CLAIM_IMAGES[claimId] || {}; }
function folderImages(claimId, folder) { return (claimImages(claimId)[folder]) || []; }
function claimImageTotal(claimId) {
  const f = claimImages(claimId);
  return IMAGE_FOLDERS.reduce((n, k) => n + ((f[k] || []).length), 0);
}
function findImage(claimId, imgId) {
  const f = claimImages(claimId);
  for (const k of IMAGE_FOLDERS) { const hit = (f[k] || []).find(im => im.id === imgId); if (hit) return hit; }
  return null;
}

const $ = (sel) => document.querySelector(sel);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}

function closeActionModal() {
  const root = $("#actionModalRoot");
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
}

function openRequestModal(presetId) {
  const root = $("#actionModalRoot");
  let kind = "대차"; // "대차" | "탑승"
  const opts = CLAIMS.map(c => `<option value="${c.id}" ${c.id === presetId ? "selected" : ""}>${c.id} · ${c.name} · ${c.car}</option>`).join("");
  const render = () => {
    const isSub = kind === "대차";
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-close></div>
      <section class="action-modal" role="dialog" aria-modal="true" aria-label="대차/탑승 신청">
        <div class="modal-head">
          <div class="modal-title-wrap">
            <div class="modal-eyebrow">통합 신청 · 어느 화면에서든 호출</div>
            <h2 class="modal-title">대차 / 탑승 신청</h2>
            <div class="modal-sub">사고건을 선택하고 ${kind} 신청 정보를 입력하세요.</div>
          </div>
          <button class="modal-close" type="button" aria-label="팝업 닫기" data-modal-close>×</button>
        </div>
        <div class="modal-body">
          <div class="req-toggle">
            <button type="button" class="req-seg ${isSub ? "active" : ""}" data-kind="대차">대차 신청</button>
            <button type="button" class="req-seg ${!isSub ? "active" : ""}" data-kind="탑승">탑승(대차 외) 신청</button>
          </div>
          <div class="req-grid">
            <div class="req-field full"><div class="k">사고번호</div><select id="reqClaim">${opts}</select></div>
            <div class="req-field"><div class="k">고객명</div><input id="reqName" readonly /></div>
            <div class="req-field"><div class="k">차량번호</div><input id="reqCar" readonly /></div>
            ${isSub
              ? `<div class="req-field"><div class="k">대차 차종</div><select><option>동급 (준중형)</option><option>1등급 하향</option><option>고객 지정</option></select></div>
                 <div class="req-field"><div class="k">대차 구분</div><select><option>사고대차</option><option>정비대차</option></select></div>
                 <div class="req-field"><div class="k">대차 시작일</div><input type="date" value="2026-06-28" /></div>
                 <div class="req-field"><div class="k">대차 종료(예정)일</div><input type="date" value="2026-07-05" /></div>`
              : `<div class="req-field"><div class="k">탑승 인원</div><input type="number" min="1" value="2" /></div>
                 <div class="req-field"><div class="k">탑승 구간</div><input placeholder="예: 자택 → 공업사" /></div>
                 <div class="req-field"><div class="k">희망 일시</div><input type="datetime-local" value="2026-06-28T10:00" /></div>
                 <div class="req-field"><div class="k">동승 차량</div><select><option>콜택시</option><option>렌터카 인수</option></select></div>`}
            <div class="req-field full"><div class="k">신청 사유 / 메모</div><textarea rows="2" placeholder="신청 사유를 입력하세요."></textarea></div>
            <div class="req-field full"><div class="k">안내 발송 채널</div>
              <select><option>알림톡</option><option>문자(SMS)</option><option>발송 안함</option></select></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-modal" type="button" data-modal-close>취소</button>
          <button class="btn-modal primary" type="button" id="reqSubmit">${kind} 신청 접수</button>
        </div>
      </section>`;
    const sync = () => {
      const c = CLAIMS.find(x => x.id === $("#reqClaim").value);
      if (c) { $("#reqName").value = c.name; $("#reqCar").value = c.car; }
    };
    sync();
    root.querySelector("#reqClaim").addEventListener("change", sync);
    root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeActionModal));
    root.querySelectorAll("[data-kind]").forEach(el => el.addEventListener("click", () => { kind = el.dataset.kind; render(); }));
    root.querySelector("#reqSubmit").addEventListener("click", () => {
      const id = $("#reqClaim").value;
      closeActionModal();
      showToast(`${id} ${kind} 신청이 접수되었습니다.`);
    });
  };
  render();
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
}

function formatNowStamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const ICON_PHOTO = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 3 3 3.5-3.5L20 16"/></svg>`;
const ICON_DOC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const SRC_LABEL = { cust: "고객", shop: "정비업체", staff: "담당자" };
const SRC_CLASS = { cust: "", shop: "shop", staff: "staff" };

function thumbHtml(im, kind, selected, attr) {
  const srcCls = SRC_CLASS[im.src] || "";
  // 실제 이미지 url이 있으면 사진을 표시하고, 없으면 기존 아이콘 플레이스홀더를 유지한다.
  const canvasInner = im.url
    ? `<img class="it-img" src="${escapeHtml(im.url)}" alt="${escapeHtml(im.name)}" loading="lazy" draggable="false">`
    : (kind === "doc" ? ICON_DOC : ICON_PHOTO);
  return `
    <div class="image-thumb ${selected ? "selected" : ""}" ${attr}="${im.id}">
      <div class="it-check">${ICON_CHECK}</div>
      <div class="it-canvas ${kind === "doc" ? "doc" : ""} ${im.url ? "has-img" : ""}">${canvasInner}</div>
      <div class="it-meta">
        <div class="it-name">${escapeHtml(im.name)}</div>
        <div class="it-info">
          <span class="it-date">${escapeHtml(im.date)}</span>
          <span class="it-src ${srcCls}">${SRC_LABEL[im.src] || "기타"}</span>
        </div>
      </div>
    </div>`;
}

function renderImagePanelHTML(claim, ns) {
  const st = panelState[ns];
  if (!st.folder) st.folder = IMAGE_FOLDERS[0];
  const tabs = IMAGE_FOLDERS.map(f => {
    const cnt = folderImages(claim.id, f).length;
    const cls = ["folder-tab", f === st.folder ? "active" : "", cnt === 0 ? "empty" : ""].join(" ");
    return `<button type="button" class="${cls}" data-pfolder="${f}">${f}<span class="ft-cnt">${cnt}</span></button>`;
  }).join("");
  const imgs = folderImages(claim.id, st.folder);
  const kind = FOLDER_KIND[st.folder] === "doc" ? "doc" : "photo";
  const grid = imgs.length
    ? imgs.map(im => thumbHtml(im, kind, st.selected.has(im.id), "data-pimg")).join("")
    : `<div class="image-empty-folder">'${st.folder}' 폴더에 등록된 자료가 없습니다.</div>`;
  const sel = st.selected.size;
  return `
    <div class="claim-img-panel" data-ns="${ns}" data-claim="${claim.id}">
      <div class="folder-tabs">${tabs}</div>
      <div class="image-grid">${grid}</div>
      <div class="img-actionbar">
        <span class="ab-count">선택 <b>${sel}</b>장</span>
        <div class="ab-spacer"></div>
        <button type="button" class="ab-btn" data-pact="zoom" ${sel ? "" : "disabled"}>확대보기</button>
        <button type="button" class="ab-btn" data-pact="download" ${sel ? "" : "disabled"}>다운로드</button>
        <button type="button" class="ab-btn primary" data-pact="send" ${sel ? "" : "disabled"}>문자 발송</button>
      </div>
    </div>`;
}
function renderImagePanelBox(claim) {
  return `
      <div class="modal-box">
        <div class="modal-box-title">사고 이미지 <span class="srf-hint">업무 확인용 · 선택 후 문자 발송 가능</span></div>
        ${renderImagePanelHTML(claim, "m")}
      </div>`;
}
function rerenderPanel(ns, claimId) {
  const panel = document.querySelector(`.claim-img-panel[data-ns="${ns}"]`);
  if (!panel) return;
  const claim = CLAIMS.find(c => c.id === claimId);
  if (claim) panel.outerHTML = renderImagePanelHTML(claim, ns);
}
function refreshPanels(claimId) {
  ["m", "v"].forEach(ns => { if (document.querySelector(`.claim-img-panel[data-ns="${ns}"]`)) rerenderPanel(ns, claimId); });
}

function openImageViewer(claim) {
  resetPanel("v");
  const root = $("#imageViewerRoot");
  root.innerHTML = `
    <div class="modal-backdrop" data-viewer-close></div>
    <section class="action-modal image-viewer" role="dialog" aria-modal="true" aria-label="사고 이미지 조회">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">이미지 시스템 · 빠른 조회</div>
          <h2 class="modal-title">${claim.id} 사고 이미지</h2>
          <div class="modal-sub">${claim.name} · ${claim.car} · ${claim.custType}</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-viewer-close>×</button>
      </div>
      <div class="modal-body">${renderImagePanelHTML(claim, "v")}</div>
    </section>`;
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  root.querySelectorAll("[data-viewer-close]").forEach(el => el.addEventListener("click", closeImageViewer));
}
function closeImageViewer() {
  const r = $("#imageViewerRoot");
  r.classList.remove("open");
  r.setAttribute("aria-hidden", "true");
  r.innerHTML = "";
}

function openImageSendModal(claim, images, rootSel) {
  if (!images.length) return;
  rootSel = rootSel || "#actionModalRoot";
  const root = $(rootSel);
  const closeThis = () => { root.classList.remove("open"); root.setAttribute("aria-hidden", "true"); root.innerHTML = ""; };
  let mode = "link"; // "link" | "MMS"
  let channel = "문자";
  const expire = "2026.06.16 18:00";
  const defaultMsg = `${claim.name} 고객님, 요청하신 ${claim.id} 건의 사진/서류 ${images.length}건을 보내드립니다. 아래 보안 링크에서 확인해 주세요. (개인정보 보호를 위해 ${expire}까지만 열람 가능)`;

  function attachmentsHtml() {
    return images.map(im => {
      const isDoc = /\.(pdf|hwp|docx?|xlsx?)$/i.test(im.name);
      return `
        <div class="send-attach">
          <div class="sa-thumb ${isDoc ? "doc" : ""}">${isDoc ? ICON_DOC : ICON_PHOTO}</div>
          <div>
            <div class="sa-name">${escapeHtml(im.name)}</div>
            <div class="sa-sub">${escapeHtml(im.date)} · ${SRC_LABEL[im.src] || "기타"}</div>
          </div>
        </div>`;
    }).join("");
  }
  function previewHtml() {
    const composer = root.querySelector("#imgMsgComposer");
    const msg = composer ? composer.value : defaultMsg;
    if (mode === "link") {
      return `${escapeHtml(msg)}
        <div class="secure-link-box">
          <div class="slb-url">https://sk-claim.co.kr/s/${claim.id.replace(/\W/g,"").toLowerCase()}9f2a</div>
          <div class="slb-exp">열람 만료: ${expire} · 1회 인증 후 열람</div>
        </div>`;
    }
    return `${escapeHtml(msg)}<div style="margin-top:6px">${images.map(im => `<span class="attach-chip">${/\.(pdf|hwp|docx?|xlsx?)$/i.test(im.name) ? ICON_DOC : ICON_PHOTO}${escapeHtml(im.name)}</span>`).join("")}</div>`;
  }
  function render() {
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-close></div>
      <section class="action-modal" role="dialog" aria-modal="true" aria-labelledby="imgSendTitle">
        <div class="modal-head">
          <div class="modal-title-wrap">
            <div class="modal-eyebrow">이미지 시스템 · 고객 문자 발송</div>
            <h2 class="modal-title" id="imgSendTitle">이미지 ${images.length}장 문자 발송</h2>
            <div class="modal-sub">${claim.id} · ${claim.name} · ${claim.car}</div>
          </div>
          <button class="modal-close" type="button" aria-label="팝업 닫기" data-modal-close>×</button>
        </div>
        <div class="modal-body">
          <div class="message-layout">
            <div>
              <div class="modal-box" style="margin-bottom:12px">
                <div class="modal-box-title">발송 방식</div>
                <div class="send-mode-toggle">
                  <button type="button" class="send-mode-btn ${mode === "link" ? "active" : ""}" data-mode="link">보안 링크<span class="smb-desc">만료·인증 열람 / 개인정보 보호</span></button>
                  <button type="button" class="send-mode-btn ${mode === "MMS" ? "active" : ""}" data-mode="MMS">직접 첨부(MMS)<span class="smb-desc">이미지 바로 첨부 발송</span></button>
                </div>
              </div>
              <div class="modal-box">
                <div class="modal-box-title">첨부 자료 (${images.length})</div>
                <div class="img-send-attachments">${attachmentsHtml()}</div>
              </div>
            </div>
            <div class="phone-shell">
              <div class="phone-screen">
                <div class="phone-top">
                  <div class="phone-contact">${claim.name} 고객</div>
                  <div class="phone-number">010-3842-1907 · ${claim.id}</div>
                </div>
                <div class="channel-tabs">
                  <button class="channel-btn ${channel === "문자" ? "active" : ""}" type="button" data-channel="문자">문자</button>
                  <button class="channel-btn ${channel === "알림톡" ? "active" : ""}" type="button" data-channel="알림톡">알림톡</button>
                </div>
                <div class="message-preview">
                  <div class="bubble" id="imgMsgPreview">${previewHtml()}</div>
                  <textarea class="message-input" id="imgMsgComposer">${escapeHtml(defaultMsg)}</textarea>
                </div>
                <div class="phone-actions">
                  <button class="btn-mini" type="button" data-modal-close>취소</button>
                  <button class="btn-mini primary" type="button" id="imgDoSend">발송</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-modal" type="button" data-modal-close>닫기</button>
          <button class="btn-modal primary" type="button" id="imgDoSendFoot">${mode === "link" ? "보안 링크로 발송" : "이미지 첨부 발송"}</button>
        </div>
      </section>`;

    root.classList.add("open");
    root.setAttribute("aria-hidden", "false");
    root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeThis));
    root.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => { mode = b.dataset.mode; render(); }));
    root.querySelectorAll("[data-channel]").forEach(b => b.addEventListener("click", () => { channel = b.dataset.channel; render(); }));
    const composer = root.querySelector("#imgMsgComposer");
    const preview = root.querySelector("#imgMsgPreview");
    composer.addEventListener("input", () => { preview.innerHTML = previewHtml(); });
    const doSend = () => sendImages(claim, images, mode, channel, closeThis);
    root.querySelector("#imgDoSend").addEventListener("click", doSend);
    root.querySelector("#imgDoSendFoot").addEventListener("click", doSend);
  }
  render();
}

function sendImages(claim, images, mode, channel, closeFn) {
  (imageSendLog[claim.id] = imageSendLog[claim.id] || []).push({
    at: formatNowStamp(),
    manager: claim.manager,
    count: images.length,
    channel,
    mode: mode === "MMS" ? "MMS" : "LINK",
    names: images.map(im => im.name)
  });
  (closeFn || closeActionModal)();
  showToast(`고객에게 이미지 ${images.length}장을 ${channel}로 발송했습니다.`);
  // 선택 해제 + 화면/패널 갱신
  imgSelected.clear();
  panelState.m.selected.clear();
  panelState.v.selected.clear();
  if (activeView === "images") renderImgMain();
  refreshPanels(claim.id);
}

let staffAssignmentSettings = [
  { id:"EMP001", name:"최도윤", employeeNo:"12340001", position:"직원",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:15, todayAssignedCount:7, assignmentMode:"지역+업체순환", regionGroup:"경기남부", vendorGroup:"수원협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP002", name:"박지현", employeeNo:"12340002", position:"직원",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:true, canClosePayment:false,
    dailyAssignmentLimit:15, todayAssignedCount:5, assignmentMode:"지역+업체순환", regionGroup:"경기남부", vendorGroup:"수원협력업체",
    assignmentStatus:"배당중지", absenceStart:null, absenceEnd:null, deputyEmployeeId:"EMP001", isActive:true },
  { id:"EMP003", name:"김하늘", employeeNo:"12340003", position:"대리",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"분당센터",
    approvalLevel:1, estimateLimit:3999000, paymentLimit:2999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:12, todayAssignedCount:3, assignmentMode:"업체순환", regionGroup:"경기남부", vendorGroup:"분당협력업체",
    assignmentStatus:"정상", absenceStart:"2026-07-06T09:00", absenceEnd:"2026-07-06T13:00", deputyEmployeeId:null, isActive:true },
  { id:"EMP004", name:"오세린", employeeNo:"12340004", position:"직원",
    orgRegion:"수도권", dept:"Claim운영2팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:false, canClosePayment:true,
    dailyAssignmentLimit:15, todayAssignedCount:9, assignmentMode:"지역순환", regionGroup:"서울강남", vendorGroup:"강서협력업체",
    assignmentStatus:"정상", absenceStart:"2026-07-06T13:00", absenceEnd:"2026-07-06T18:00", deputyEmployeeId:null, isActive:true },
  { id:"EMP005", name:"문태호", employeeNo:"12340005", position:"직원",
    orgRegion:"중부권", dept:"Claim운영2팀", center:"분당센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:false, canClosePayment:false,
    dailyAssignmentLimit:12, todayAssignedCount:4, assignmentMode:"지역+업체순환", regionGroup:"경기북부", vendorGroup:"일산협력업체",
    assignmentStatus:"정상", absenceStart:"2026-07-06T09:00", absenceEnd:"2026-07-06T18:00", deputyEmployeeId:"EMP003", isActive:true },
  { id:"EMP006", name:"유나래", employeeNo:"12340006", position:"대리",
    orgRegion:"수도권", dept:"Claim운영2팀", center:"강남센터",
    approvalLevel:1, estimateLimit:3999000, paymentLimit:2999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:10, todayAssignedCount:10, assignmentMode:"지역순환", regionGroup:"서울강남", vendorGroup:"송파협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP007", name:"정예린", employeeNo:"12340007", position:"직원",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:true, canClosePayment:false,
    dailyAssignmentLimit:15, todayAssignedCount:2, assignmentMode:"지역+업체순환", regionGroup:"경기남부", vendorGroup:"수원협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP008", name:"한도경", employeeNo:"12340008", position:"직원",
    orgRegion:"중부권", dept:"Claim운영2팀", center:"분당센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:false, canClosePayment:false,
    dailyAssignmentLimit:12, todayAssignedCount:6, assignmentMode:"업체순환", regionGroup:"경기북부", vendorGroup:"일산협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP009", name:"서지우", employeeNo:"12340009", position:"직원",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"분당센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:15, todayAssignedCount:8, assignmentMode:"지역+업체순환", regionGroup:"경기남부", vendorGroup:"분당협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP010", name:"임하준", employeeNo:"12340010", position:"직원",
    orgRegion:"수도권", dept:"Claim운영2팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:false, canClosePayment:true,
    dailyAssignmentLimit:12, todayAssignedCount:1, assignmentMode:"지역순환", regionGroup:"서울강북", vendorGroup:"강서협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:false },
  { id:"EMP011", name:"강민서", employeeNo:"12340011", position:"직원",
    orgRegion:"중부권", dept:"Claim운영2팀", center:"분당센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:true, canClosePayment:false,
    dailyAssignmentLimit:12, todayAssignedCount:5, assignmentMode:"업체순환", regionGroup:"인천", vendorGroup:"수원협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP012", name:"윤서준", employeeNo:"12340012", position:"직원",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"강남센터",
    approvalLevel:1, estimateLimit:2999000, paymentLimit:1999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:999, todayAssignedCount:0, assignmentMode:"지역+업체순환", regionGroup:"서울강남", vendorGroup:"송파협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  // 결재/전결 관리 대상 (센터장·부장) — 3레벨, 기본 배당제외
  { id:"EMP013", name:"김본부", employeeNo:"12340013", position:"센터장",
    orgRegion:"수도권", dept:"Claim운영1팀", center:"강남센터",
    approvalLevel:3, estimateLimit:9999000, paymentLimit:9999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:0, todayAssignedCount:0, assignmentMode:"배당제외", regionGroup:"경기남부", vendorGroup:"수원협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
  { id:"EMP014", name:"이지사", employeeNo:"12340014", position:"부장",
    orgRegion:"중부권", dept:"Claim운영2팀", center:"분당센터",
    approvalLevel:3, estimateLimit:7999000, paymentLimit:7999000, canCloseWaiver:true, canClosePayment:true,
    dailyAssignmentLimit:0, todayAssignedCount:0, assignmentMode:"배당제외", regionGroup:"경기북부", vendorGroup:"일산협력업체",
    assignmentStatus:"정상", absenceStart:null, absenceEnd:null, deputyEmployeeId:null, isActive:true },
];

function assignWon(n) { return Number(n || 0).toLocaleString("ko-KR"); }

function assignStaffById(id) { return staffAssignmentSettings.find(s => s.id === id) || null; }


/* ===================== 상태(공통) ===================== */
let selectedId = null;

/* ===================== 사고건 진행상태 변경 (공통, claims/intake 양쪽에서 호출) ===================== */
function setProcStatus(id, status) {
  const c = CLAIMS.find(x => x.id === id);
  if (!c) return;
  c.procStatus = status;
  if (typeof renderFlow === "function") renderFlow();
  if (typeof renderList === "function") renderList();
  if (typeof renderIntake === "function" && activeView === "intake") renderIntake();
}

/* ===================== 메뉴 간 이동 (파일 분리로 인해 페이지 이동 방식으로 대체) ===================== */
const VIEW_TITLES = { claims:"미결일괄조회", intake:"Smart업무처리", images:"이미지 시스템", closing:"결재 LIST", assign:"전결·순환배당 관리", ai:"AI 통합대시보드" };
const VIEW_FILES = {
  claims: "smart-claims.html",
  intake: "smart-intake.html",
  images: "image-system.html",
  closing: "approval-list.html",
  assign: "assignment-management.html",
  ai: "ai-dashboard.html"
};

function openViewWindow(name) {
  if (!VIEW_FILES[name]) return;
  window.open(VIEW_FILES[name], "_blank", "noopener");
}

function openIntake(claimId) {
  const id = claimId || selectedId || (CLAIMS[0] && CLAIMS[0].id);
  window.location.href = "smart-intake.html" + (id ? ("?claim=" + encodeURIComponent(id)) : "");
}

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if ($("#apprDocRoot").classList.contains("open")) { closeApprDoc(); return; }
  if ($("#apprPwRoot").classList.contains("open")) { closeApprPw(); return; }
  if ($("#assignSimRoot").classList.contains("open")) { closeAssignSim(); return; }
  if ($("#imageViewerRoot").classList.contains("open")) { closeImageViewer(); return; }
  if ($("#actionModalRoot").classList.contains("open")) closeActionModal();
});

(function initSideNav() {
  const shell = document.querySelector(".app-shell");
  const nav = document.querySelector(".side-nav");
  const edge = $("#navEdge");
  const pin = $("#navPin");
  let pinned = localStorage.getItem("navPinned") === "1";

  function applyPinned() {
    shell.classList.toggle("nav-pinned", pinned);
    pin.setAttribute("aria-pressed", pinned ? "true" : "false");
    pin.title = pinned ? "메뉴 고정 해제" : "메뉴 고정";
    if (pinned) nav.classList.remove("nav-open");
  }
  const openNav = () => { if (!pinned) nav.classList.add("nav-open"); };
  const closeNav = () => { if (!pinned) nav.classList.remove("nav-open"); };

  edge.addEventListener("mouseenter", openNav);
  nav.addEventListener("mouseenter", openNav);
  nav.addEventListener("mouseleave", closeNav);
  pin.addEventListener("click", () => {
    pinned = !pinned;
    localStorage.setItem("navPinned", pinned ? "1" : "0");
    applyPinned();
  });
  applyPinned();
})();

/* 대차/탑승 신청 — 전역 버튼 (현재 선택 건이 있으면 프리셋) */
$("#btnRequest").addEventListener("click", () => openRequestModal(selectedId || undefined));

document.addEventListener("click", e => {
  const panel = e.target.closest(".claim-img-panel");
  if (!panel) return;
  const ns = panel.dataset.ns;
  const claimId = panel.dataset.claim;
  const st = panelState[ns];

  const folder = e.target.closest("[data-pfolder]");
  if (folder) { st.folder = folder.dataset.pfolder; st.selected.clear(); rerenderPanel(ns, claimId); return; }

  const thumb = e.target.closest("[data-pimg]");
  if (thumb) {
    const id = thumb.dataset.pimg;
    if (st.selected.has(id)) st.selected.delete(id); else st.selected.add(id);
    rerenderPanel(ns, claimId);
    return;
  }

  const act = e.target.closest("[data-pact]");
  if (act) {
    const claim = CLAIMS.find(c => c.id === claimId);
    const images = [...st.selected].map(id => findImage(claimId, id)).filter(Boolean);
    if (act.dataset.pact === "send") {
      if (claim && images.length) openImageSendModal(claim, images, "#imageViewerRoot");
    } else if (act.dataset.pact === "download") {
      showToast(`${st.selected.size}장을 다운로드합니다. (데모)`);
    } else if (act.dataset.pact === "zoom") {
      showToast(`선택한 ${st.selected.size}장을 확대보기로 엽니다. (데모)`);
    }
  }
});

function showToast(msg) {
  const wrap = $("#toastWrap");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="tk"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 260);
  }, 2600);
}


document.querySelectorAll(".nav-item[data-view]").forEach(btn => {
  btn.addEventListener("click", () => {
    const file = VIEW_FILES[btn.dataset.view];
    if (file) window.location.href = file;
  });
});
document.querySelectorAll(".nav-popout[data-open-view]").forEach(btn => {
  btn.addEventListener("click", () => openViewWindow(btn.dataset.openView));
});


/* ===================== 공통 초기화 (오늘 날짜 표시) ===================== */
(function initCommon() {
  const d = new Date(2026, 5, 12); // 데모 기준일
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  $("#todayLabel").textContent = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${days[d.getDay()]})`;
})();


/* ===================== 결재 공용 기반 (접수지·결재LIST 공유) ===================== */
// closing.js에서 이동 — Smart업무처리 결재 상신과 결재LIST가 단일 APPROVALS 소스를 공유.
const APPR_PAY_TYPES = ["지급(종결)", "추가지급"];              // 비밀번호 인증 대상(지급성)
const APPR_PASSWORD = "1234";                                 // 데모 검증 전용(화면 검증용)
// 결재자 후보 — 전결권한 데이터(staffAssignmentSettings) 참조. 기본 김본부 센터장.
const APPR_APPROVERS = ["EMP013", "EMP014", "EMP003", "EMP002", "EMP004"];
let currentApproverId = "EMP013";
function apprIsPayType(type) { return APPR_PAY_TYPES.includes(type); }

// 더미 결재 데이터 (확장 구조). coreInfo·histories는 최초 렌더 시 seedApprovals()로 주입.
// approvalAmount = 결재금액(추산→추산액 / 지급성→실지급액 / 면책종결→면책금 / VOC→청구액)
let APPROVALS = [
  // 추산 (추산한도 기준)
  { id:"APR-001", claimNo:"CLM-2026-0004", resolutionNo:"001", approvalType:"추산", requesterId:"EMP004", requesterName:"오세린",
    damagedObjectName:"자차1", damageInfo:"제네시스 G80 / 299너1997", repairShopName:"수원협력업체", approvalAmount:2850000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 09:05", completedAt:null,
    requesterComment:"선견적 기준 추산액 산정 완료. 추산 결재 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-002", claimNo:"CLM-2026-0027", resolutionNo:"001", approvalType:"추산", requesterId:"EMP003", requesterName:"김하늘",
    damagedObjectName:"자차1", damageInfo:"카니발 / 12가3456", repairShopName:"분당협력업체", approvalAmount:3450000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 10:22", completedAt:null,
    requesterComment:"파손 범위 확대로 추산액 상향. 검토 부탁드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-003", claimNo:"CLM-2026-0021", resolutionNo:"001", approvalType:"추산", requesterId:"EMP004", requesterName:"오세린",
    damagedObjectName:"자차2", damageInfo:"쏘렌토 / 45나6789", repairShopName:"강서협력업체", approvalAmount:1980000,
    approvalStatus:"결재완료", requestedAt:"2026-06-24 09:40", completedAt:"2026-06-26 11:10",
    requesterComment:"경미 접촉 추산 건입니다.", approverId:"EMP013", approverName:"김본부", approverComment:"추산 근거 확인. 승인합니다." },
  { id:"APR-004", claimNo:"CLM-2026-0022", resolutionNo:"002", approvalType:"추산", requesterId:"EMP003", requesterName:"김하늘",
    damagedObjectName:"자차1", damageInfo:"아반떼 / 78다1234", repairShopName:"수원협력업체", approvalAmount:2600000,
    approvalStatus:"결재완료", requestedAt:"2026-06-18 14:00", completedAt:"2026-06-20 09:30",
    requesterComment:"추산 결재 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"확인 후 승인." },
  { id:"APR-005", claimNo:"CLM-2026-0003", resolutionNo:"001", approvalType:"추산", requesterId:"EMP001", requesterName:"최도윤",
    damagedObjectName:"자차1", damageInfo:"그랜저 / 34라5678", repairShopName:"송파협력업체", approvalAmount:3120000,
    approvalStatus:"반려", requestedAt:"2026-06-12 10:15", completedAt:"2026-06-14 13:20",
    requesterComment:"추산 결재 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"견적 상세 내역 보완 후 재상신 바랍니다." },
  // 지급(종결) (지급한도 + 지급종결 권한)
  { id:"APR-006", claimNo:"CLM-2026-0010", resolutionNo:"002", approvalType:"지급(종결)", requesterId:"EMP004", requesterName:"오세린",
    damagedObjectName:"자차1", damageInfo:"제네시스 G80 / 299너1997", repairShopName:"수원협력업체", approvalAmount:1999000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 09:12", completedAt:null,
    requesterComment:"수리비 청구 내역 및 지급처 확인 완료. 지급 결재 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-007", claimNo:"CLM-2026-0009", resolutionNo:"001", approvalType:"지급(종결)", requesterId:"EMP003", requesterName:"김하늘",
    damagedObjectName:"대물1", damageInfo:"K5 / 90마2345", repairShopName:"분당협력업체", approvalAmount:1750000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 11:03", completedAt:null,
    requesterComment:"손해사정 완료. 지급 결재 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-008", claimNo:"CLM-2026-0037", resolutionNo:"001", approvalType:"지급(종결)", requesterId:"EMP006", requesterName:"유나래",
    damagedObjectName:"자차1", damageInfo:"스포티지 / 11바7788", repairShopName:"송파협력업체", approvalAmount:2480000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 13:40", completedAt:null,
    requesterComment:"고액 지급 건. 지급처 계좌 확인 완료.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-009", claimNo:"CLM-2026-0011", resolutionNo:"001", approvalType:"지급(종결)", requesterId:"EMP006", requesterName:"유나래",
    damagedObjectName:"자차1", damageInfo:"아반떼 / 78다1234", repairShopName:"강서협력업체", approvalAmount:1600000,
    approvalStatus:"결재완료", requestedAt:"2026-06-22 10:00", completedAt:"2026-06-25 15:10",
    requesterComment:"지급 결재 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"청구금액 및 지급처 확인 완료. 지급 승인합니다." },
  { id:"APR-010", claimNo:"CLM-2026-0038", resolutionNo:"002", approvalType:"지급(종결)", requesterId:"EMP004", requesterName:"오세린",
    damagedObjectName:"자차1", damageInfo:"카니발 / 12가3456", repairShopName:"수원협력업체", approvalAmount:1900000,
    approvalStatus:"반려", requestedAt:"2026-06-15 09:20", completedAt:"2026-06-17 10:05",
    requesterComment:"지급 결재 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"세금계산서 확인 필요. 보완 후 재상신 바랍니다." },
  // 추가지급 (지급한도)
  { id:"APR-011", claimNo:"CLM-2026-0040", resolutionNo:"003", approvalType:"추가지급", requesterId:"EMP006", requesterName:"유나래",
    damagedObjectName:"자차1", damageInfo:"그랜저 / 34라5678", repairShopName:"송파협력업체", approvalAmount:1850000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 14:05", completedAt:null,
    requesterComment:"추가 부품 교체분 추가지급 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-012", claimNo:"CLM-2026-0009", resolutionNo:"002", approvalType:"추가지급", requesterId:"EMP003", requesterName:"김하늘",
    damagedObjectName:"대물1", damageInfo:"K5 / 90마2345", repairShopName:"분당협력업체", approvalAmount:2300000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 15:18", completedAt:null,
    requesterComment:"추가 손해 확인분. 추가지급 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-013", claimNo:"CLM-2026-0035", resolutionNo:"002", approvalType:"추가지급", requesterId:"EMP001", requesterName:"최도윤",
    damagedObjectName:"자차1", damageInfo:"쏘렌토 / 45나6789", repairShopName:"일산협력업체", approvalAmount:1200000,
    approvalStatus:"결재완료", requestedAt:"2026-06-19 11:00", completedAt:"2026-06-21 14:30",
    requesterComment:"추가지급 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"추가 내역 확인. 승인합니다." },
  // 면책종결 (면책종결 권한)
  { id:"APR-014", claimNo:"CLM-2026-0008", resolutionNo:"001", approvalType:"면책종결", requesterId:"EMP001", requesterName:"최도윤",
    damagedObjectName:"자차1", damageInfo:"아반떼 / 78다1234", repairShopName:"수원협력업체", approvalAmount:500000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 09:50", completedAt:null,
    requesterComment:"약관상 면책 사유 확인. 면책종결 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-015", claimNo:"CLM-2026-0007", resolutionNo:"001", approvalType:"면책종결", requesterId:"EMP002", requesterName:"박지현",
    damagedObjectName:"자차1", damageInfo:"K5 / 90마2345", repairShopName:"강서협력업체", approvalAmount:700000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 10:40", completedAt:null,
    requesterComment:"고객 귀책 사유로 면책종결 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-016", claimNo:"CLM-2026-0034", resolutionNo:"001", approvalType:"면책종결", requesterId:"EMP001", requesterName:"최도윤",
    damagedObjectName:"자차1", damageInfo:"그랜저 / 34라5678", repairShopName:"송파협력업체", approvalAmount:0,
    approvalStatus:"결재완료", requestedAt:"2026-06-13 09:10", completedAt:"2026-06-16 11:40",
    requesterComment:"면책종결 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"면책 사유 확인. 종결 승인합니다." },
  { id:"APR-017", claimNo:"CLM-2026-0033", resolutionNo:"002", approvalType:"면책종결", requesterId:"EMP002", requesterName:"박지현",
    damagedObjectName:"자차1", damageInfo:"스포티지 / 11바7788", repairShopName:"일산협력업체", approvalAmount:300000,
    approvalStatus:"반려", requestedAt:"2026-06-11 10:30", completedAt:"2026-06-13 09:50",
    requesterComment:"면책종결 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"면책 근거 자료 보완 필요. 재검토 바랍니다." },
  // VOC (결재레벨 기준)
  { id:"APR-018", claimNo:"CLM-2026-0017", resolutionNo:"001", approvalType:"VOC", requesterId:"EMP005", requesterName:"문태호",
    damagedObjectName:"자차1", damageInfo:"카니발 / 12가3456", repairShopName:"일산협력업체", approvalAmount:150000,
    approvalStatus:"상신중", requestedAt:"2026-07-06 11:25", completedAt:null,
    requesterComment:"처리 지연 관련 고객 불만 접수. VOC 결재 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-019", claimNo:"CLM-2026-0041", resolutionNo:"001", approvalType:"VOC", requesterId:"EMP005", requesterName:"문태호",
    damagedObjectName:"대물1", damageInfo:"K5 / 90마2345", repairShopName:"분당협력업체", approvalAmount:0,
    approvalStatus:"상신중", requestedAt:"2026-07-06 16:02", completedAt:null,
    requesterComment:"응대 관련 VOC 접수. 결재 요청드립니다.", approverId:null, approverName:"", approverComment:"" },
  { id:"APR-020", claimNo:"CLM-2026-0012", resolutionNo:"001", approvalType:"VOC", requesterId:"EMP005", requesterName:"문태호",
    damagedObjectName:"자차1", damageInfo:"제네시스 G80 / 299너1997", repairShopName:"수원협력업체", approvalAmount:300000,
    approvalStatus:"결재완료", requestedAt:"2026-06-20 13:00", completedAt:"2026-06-23 10:20",
    requesterComment:"VOC 결재 요청드립니다.", approverId:"EMP013", approverName:"김본부", approverComment:"고객 안내 완료 확인. 승인합니다." },
];

let apprSeeded = false;      // coreInfo/histories 시드 1회 주입 플래그

function apprNow() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
// ---- 사고번호 시드 기반 결정적 더미 생성 (동일 사고번호는 항상 동일 값) ----
function apprSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h || 1;
}
function apprPicker(seed) {
  let s = seed;
  return { pick(arr) { s = (s * 1103515245 + 12345) & 0x7fffffff; return arr[s % arr.length]; } };
}
const APPR_CORE_SECTIONS = [
  { key:"accident",        title:"A. 사고사항",              fields:["사고번호","사고일시","사고장소","사고구분","사고내용","사고담당자","과실률","접수일시"] },
  { key:"contract",        title:"B. 계약사항",              fields:["계약번호","고객명","계약기간","차량번호","차량명","렌트/리스구분","면책약정금액","운전자범위","임직원특약여부"] },
  { key:"closing",         title:"C. 종결사항",              fields:["종결구분","종결번호","종결요청일시","종결요청자","종결승인자","종결일","미처리사유","비고"] },
  { key:"closingNotice",   title:"D. 종결안내",              fields:["안내대상","안내일시","안내방법","안내내용","고객반응","비고"] },
  { key:"damage",          title:"E. 피해사항",              fields:["피해물명","피해자명","피해구분","담보구분","수리업체명","입고일","출고예정일","청구액","추산액","손해사정액","면책금","실지급액"] },
  { key:"payment",         title:"F. 보험금 지급 내역",      fields:["지급처","사업자번호","공급가액","부가세","지급금액","지급처구분","지급예정일자","전표번호","분리지급사유"] },
  { key:"previousPayment", title:"G. 기존 지급/면책종결 내역", fields:["기존지급일","기존지급유형","기존지급금액","기존지급처","기존전표번호","면책종결여부","면책종결일","면책종결사유","기존종결번호"] },
];
function apprBuildCoreInfo(item) {
  const p = apprPicker(apprSeed(item.claimNo + "-" + item.resolutionNo));
  const won = n => assignWon(n) + "원";
  const amt = item.approvalAmount || 0;
  const type = item.approvalType;
  const done = item.approvalStatus !== "상신중";
  // 금액 정합 — 대표 결재금액(approvalAmount)을 종류별 항목과 일치시킴
  const 추산액 = (type === "추산") ? amt : Math.round(amt * 1.08 / 1000) * 1000;
  const 면책금 = (type === "면책종결") ? (amt || p.pick([300000, 500000, 700000])) : p.pick([0, 300000, 500000]);
  const 청구액 = (type === "VOC") ? (amt || p.pick([0, 150000, 300000])) : Math.round(Math.max(amt, 추산액) * 1.12 / 1000) * 1000;
  const 손해사정액 = Math.round(청구액 * 0.95 / 1000) * 1000;
  const 실지급액 = apprIsPayType(type) ? amt : Math.max(0, 손해사정액 - 면책금);
  const 공급가액 = Math.round(실지급액 / 1.1 / 100) * 100;
  const 부가세 = Math.max(0, 실지급액 - 공급가액);
  const custName = p.pick(["김서준", "이하은", "박도현", "최유나", "정민재", "한소율"]);
  const parts = item.damageInfo.split("/");
  const carName = (parts[0] || "").trim(), carNo = (parts[1] || "").trim();
  const closeType = ({ "면책종결":"면책종결", "지급(종결)":"지급종결" })[type] || "일반종결";
  return {
    accident: {
      "사고번호": item.claimNo,
      "사고일시": p.pick(["2026-06-20 08:40", "2026-06-22 18:12", "2026-06-25 13:05", "2026-06-28 21:30"]),
      "사고장소": p.pick(["경부고속도로 하행 42km", "서울 강남구 테헤란로", "성남 분당구 판교역로", "수원 영통구 광교로", "인천 연수구 송도동"]),
      "사고구분": p.pick(["차대차", "차대물", "단독", "추돌"]),
      "사고내용": p.pick(["신호대기 중 후미 추돌", "차선 변경 중 접촉", "주차 중 물피", "빗길 미끄러짐 단독"]),
      "사고담당자": item.requesterName,
      "과실률": p.pick(["0%", "20%", "30%", "50%", "70%", "100%"]),
      "접수일시": item.requestedAt
    },
    contract: {
      "계약번호": "RENT-2026-" + (10000 + (apprSeed(item.claimNo) % 90000)),
      "고객명": custName,
      "계약기간": p.pick(["2025-03-01 ~ 2028-02-29", "2024-11-15 ~ 2027-11-14", "2025-07-01 ~ 2028-06-30"]),
      "차량번호": carNo || "-",
      "차량명": carName || "-",
      "렌트/리스구분": p.pick(["렌트", "리스"]),
      "면책약정금액": won(p.pick([300000, 500000, 700000])),
      "운전자범위": p.pick(["누구나운전", "만26세이상 / 가족한정", "만35세이상 / 부부한정", "만48세이상 / 기명1인"]),
      "임직원특약여부": p.pick(["Y", "N"])
    },
    closing: {
      "종결구분": closeType,
      "종결번호": done ? "CLS-2026-" + (2000 + (apprSeed(item.claimNo) % 8000)) : "-",
      "종결요청일시": item.requestedAt,
      "종결요청자": item.requesterName,
      "종결승인자": item.approverName || "-",
      "종결일": item.completedAt || "-",
      "미처리사유": done ? "-" : p.pick(["손해사정 확인 중", "지급처 계좌 확인 중", "고객 회신 대기"]),
      "비고": p.pick(["-", "고객 요청 신속처리", "협력업체 견적 재확인"])
    },
    closingNotice: {
      "안내대상": custName,
      "안내일시": item.completedAt || item.requestedAt,
      "안내방법": p.pick(["문자(SMS)", "유선", "알림톡", "이메일"]),
      "안내내용": p.pick(["수리 완료 및 정산 안내", "면책금 안내", "지급 예정 안내", "종결 처리 안내"]),
      "고객반응": p.pick(["확인", "이의 없음", "추가 문의", "미확인"]),
      "비고": "-"
    },
    damage: {
      "피해물명": item.damagedObjectName,
      "피해자명": p.pick(["-", custName, "상대차량 운전자"]),
      "피해구분": p.pick(["자차", "대물", "대인", "자기신체"]),
      "담보구분": p.pick(["자기차량손해", "대물배상", "대인배상I", "자기신체사고"]),
      "수리업체명": item.repairShopName,
      "입고일": p.pick(["2026-06-21", "2026-06-24", "2026-06-27", "2026-06-29"]),
      "출고예정일": p.pick(["2026-06-30", "2026-07-02", "2026-07-04", "2026-07-07"]),
      "청구액": won(청구액),
      "추산액": won(추산액),
      "손해사정액": won(손해사정액),
      "면책금": won(면책금),
      "실지급액": won(실지급액)
    },
    payment: {
      "지급처": item.repairShopName,
      "사업자번호": p.pick(["123-45-67890", "220-81-11223", "135-86-44556", "312-05-99887"]),
      "공급가액": won(공급가액),
      "부가세": won(부가세),
      "지급금액": won(실지급액),
      "지급처구분": p.pick(["수리업체", "고객", "렌터카사"]),
      "지급예정일자": item.completedAt ? item.completedAt.slice(0, 10) : p.pick(["2026-07-03", "2026-07-05", "2026-07-08"]),
      "전표번호": done ? "VCH-2026-" + (5000 + (apprSeed(item.claimNo) % 5000)) : "-",
      "분리지급사유": p.pick(["-", "부분 선지급", "면책금 별도 청구"])
    },
    previousPayment: {
      "기존지급일": p.pick(["-", "2026-05-18", "2026-04-22"]),
      "기존지급유형": p.pick(["-", "추산 선지급", "부분지급"]),
      "기존지급금액": p.pick(["-", won(500000), won(1200000)]),
      "기존지급처": p.pick(["-", item.repairShopName]),
      "기존전표번호": p.pick(["-", "VCH-2026-4120", "VCH-2026-3980"]),
      "면책종결여부": type === "면책종결" ? "Y" : p.pick(["N", "N", "Y"]),
      "면책종결일": type === "면책종결" ? (item.completedAt || "-") : "-",
      "면책종결사유": type === "면책종결" ? p.pick(["과실 100% 면책", "약관상 면책", "고객 귀책"]) : "-",
      "기존종결번호": p.pick(["-", "CLS-2026-1180", "CLS-2026-2075"])
    }
  };
}

// 각 결재건에 coreInfo + 상신/처리 이력을 1회 주입 (renderClosingView 최초 진입 시)
function seedApprovals() {
  APPROVALS.forEach(item => {
    item.coreInfo = apprBuildCoreInfo(item);
    const requester = assignStaffById(item.requesterId) || { id: item.requesterId, name: item.requesterName, employeeNo: "" };
    item.histories = [{
      id: 1, claimNo: item.claimNo, resolutionNo: item.resolutionNo, approvalType: item.approvalType,
      actionType: "상신", actorId: requester.id, actorName: requester.name, actorEmployeeNo: requester.employeeNo,
      actedAt: item.requestedAt, status: "상신중", comment: item.requesterComment || "",
      statusBefore: "작성중", statusAfter: "상신중"
    }];
    // 이미 처리된 건이면 승인/반려 이력 시드
    if (item.approvalStatus === "결재완료" || item.approvalStatus === "반려") {
      const appr = assignStaffById(item.approverId) || assignStaffById("EMP013");
      item.approverId = item.approverId || appr.id;
      item.approverName = item.approverName || appr.name;
      item.histories.push({
        id: 2, claimNo: item.claimNo, resolutionNo: item.resolutionNo, approvalType: item.approvalType,
        actionType: item.approvalStatus === "결재완료" ? "승인" : "반려",
        actorId: appr.id, actorName: appr.name, actorEmployeeNo: appr.employeeNo,
        actedAt: item.completedAt || item.requestedAt, status: item.approvalStatus,
        comment: item.approverComment || "", statusBefore: "상신중", statusAfter: item.approvalStatus
      });
    }
  });
}

function pushApprHistory(item, actionType, actor, comment, before, after) {
  const nextId = item.histories.reduce((m, h) => Math.max(m, h.id || 0), 0) + 1;
  item.histories.push({
    id: nextId, claimNo: item.claimNo, resolutionNo: item.resolutionNo, approvalType: item.approvalType,
    actionType, actorId: actor.id, actorName: actor.name, actorEmployeeNo: actor.employeeNo,
    actedAt: apprNow(), status: after, comment: comment || "", statusBefore: before, statusAfter: after
  });
}

// 저장자·상신자 신원 해석 (접수지 결재 상신에서 사용)
function srCurrentStaff(claim) {                  // 저장자·상신자 신원 (담당자명이 전결권한 직원목록과 일치)
  return (claim && staffAssignmentSettings.find(s => s.name === claim.manager))
    || assignStaffById("EMP004")
    || { id:"", name:(claim && claim.manager) || "담당자", employeeNo:"" };
}


/* ===================== 지급결의(PAYMENT_RESOLUTIONS) 공용 기반 =====================
   AI-OCR 부품청구서 등으로 확정한 '지급결의'를 화면 간 공유하는 공용 배열.
   - 청구서 1개 = 지급결의 1건. 동일 사고건에 여러 건 저장 가능.
   - 여러 지급결의를 선택·합산해 지급결재(APPROVALS) 1건으로 상신.
   - 결의순번(resolutionSeq)과 결재순번(approvalSeq)은 서로 다른 번호 체계.
   프로토타입은 localStorage로 화면 간 유지(백엔드 DB 대체). */
let PAYMENT_RESOLUTIONS = [];
const RESOLUTION_LS_KEY = "claimResolutions";     // 지급결의 저장 키
const APPROVAL_LS_KEY = "claimApprovalsExtra";    // 결의 기반 신규 결재 저장 키
let resolutionsSeeded = false;                    // 결의/결재 복원·시드 1회 가드

// 상태별 권한 매트릭스 (설계문서 §8) — 선택·수정·삭제·결재상신 가능 여부
const RESOLUTION_PERMS = {
  "결재 전":     { select:true,  edit:true,  remove:true,  submit:true  },
  "상신중":      { select:false, edit:false, remove:false, submit:false },
  "반려":        { select:true,  edit:true,  remove:true,  submit:true  },
  "상신취소":    { select:true,  edit:true,  remove:true,  submit:true  },
  "결재완료":    { select:false, edit:false, remove:false, submit:false },
  "재확인 필요": { select:false, edit:true,  remove:true,  submit:false }, // 재확정 후 select/submit 가능
};
function resolutionCan(res, action) {
  const p = res && RESOLUTION_PERMS[res.status];
  return !!(p && p[action]);
}
function resolutionsFor(claimNo) { return PAYMENT_RESOLUTIONS.filter(r => r.claimNo === claimNo); }
function getResolution(id) { return PAYMENT_RESOLUTIONS.find(r => r.id === id) || null; }

// 결의순번 — 사고번호 기준 1씩 증가(청구유형 무관). 삭제분은 최대값 기준이라 재사용 안 함.
function nextResolutionSeq(claimNo) {
  const max = PAYMENT_RESOLUTIONS
    .filter(r => r.claimNo === claimNo)
    .reduce((m, r) => Math.max(m, parseInt(r.resolutionSeq, 10) || 0), 0);
  return String(max + 1).padStart(3, "0");
}
// 결재순번 — 사고번호 기준 실제 결재상신 시 1씩 증가.
function nextApprovalSeq(claimNo) {
  const max = APPROVALS
    .filter(a => a.claimNo === claimNo && a.approvalSeq)
    .reduce((m, a) => Math.max(m, parseInt(a.approvalSeq, 10) || 0), 0);
  return String(max + 1).padStart(3, "0");
}
// 지급결의 고유 ID (RES-####)
function nextResolutionId() {
  const n = PAYMENT_RESOLUTIONS.reduce((m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 0) + 1;
  return "RES-" + String(n).padStart(4, "0");
}

// 과실률 문자열 파싱 — "자차 20% (확정)" → { pct:20, confirmed:true }
function parseFaultInfo(faultText) {
  const s = String(faultText || "");
  const m = s.match(/(\d+)\s*%/);
  const pct = m ? parseInt(m[1], 10) : 0;
  const confirmed = /확정/.test(s) && !/미확정/.test(s);
  return { pct, confirmed };
}

// 결의 금액 재계산 — 과실상계는 손해사정금액에만 적용(청구금액 불변).
function recalcResolutionAmounts(res, faultPct) {
  const claim = res.rows.reduce((s, r) => s + Number(r.claimAmount || 0), 0);
  const assessed = res.rows.reduce((s, r) => s + (r.denied ? 0 : Number(r.assessedAmount || 0)), 0);
  const offset = Math.round(assessed * (Number(faultPct || 0) / 100));
  res.claimAmount = claim;
  res.assessedAmountBeforeFault = assessed;
  res.faultOffsetAmount = offset;
  res.finalAssessedAmount = assessed - offset;
  return res;
}

// 결재 상신/처리 시 연결 결의 상태 동기화 (설계문서 §11)
function syncResolutionStatusFromApproval(approval, newStatus) {
  (approval.resolutionIds || []).forEach(rid => {
    const r = getResolution(rid);
    if (!r) return;
    r.status = newStatus;
    if (newStatus === "상신중") {
      r.currentApprovalId = approval.id;
    } else {
      if (r.currentApprovalId && r.approvalHistoryIds.indexOf(r.currentApprovalId) < 0) {
        r.approvalHistoryIds.push(r.currentApprovalId);
      }
      if (newStatus !== "결재완료") r.currentApprovalId = null;
    }
    r.updatedAt = apprNow();
  });
  persistResolutions();
  persistExtraApprovals();
}

// 과실률 변경 반영 (설계문서 §6.2) — 미결재 결의는 '재확인 필요'로 전환 후 최신 과실률로 재계산.
// 실제 운영에서는 과실률 확정 IF 수신 시점에 호출. 프로토타입은 window.__setFaultRate 훅으로 시연.
function applyFaultRateChange(claimNo, newPct) {
  let changed = 0;
  resolutionsFor(claimNo).forEach(r => {
    if (r.status === "결재완료" || r.status === "상신중") return; // 완료·상신중은 자동 변경 안 함
    if (Number(r.faultRateAtConfirmed) === Number(newPct)) return;
    if (r.status === "결재 전" || r.status === "반려" || r.status === "상신취소" || r.status === "재확인 필요") {
      r.status = "재확인 필요";
      r.faultRateAtReview = Number(newPct);
      recalcResolutionAmounts(r, newPct);
      r.updatedAt = apprNow();
      changed++;
    }
  });
  persistResolutions();
  return changed;
}

// ---- localStorage 동기화 (프로토타입: 화면 간 유지). 실제 운영은 백엔드 DB로 대체 ----
function persistResolutions() {
  try { localStorage.setItem(RESOLUTION_LS_KEY, JSON.stringify(PAYMENT_RESOLUTIONS)); } catch (e) {}
}
function persistExtraApprovals() {
  try {
    const extra = APPROVALS.filter(a => a.resolutionIds && a.resolutionIds.length);
    localStorage.setItem(APPROVAL_LS_KEY, JSON.stringify(extra));
  } catch (e) {}
}
// 결의·결재 상태 복원. seedApprovals() 이후 1회 호출 → 결의 기반 신규 결재를 APPROVALS에 병합.
function loadClaimResolutionState() {
  if (resolutionsSeeded) return;
  resolutionsSeeded = true;
  // 1) 지급결의 복원 or 최초 시드
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(RESOLUTION_LS_KEY) || "null"); } catch (e) {}
  if (Array.isArray(stored)) {
    PAYMENT_RESOLUTIONS = stored;
  } else {
    seedResolutions();
    persistResolutions();
  }
  // 2) 결의 기반 신규 결재 복원 → APPROVALS 병합(중복 id 제거)
  let extra = null;
  try { extra = JSON.parse(localStorage.getItem(APPROVAL_LS_KEY) || "null"); } catch (e) {}
  if (Array.isArray(extra)) {
    extra.forEach(a => { if (!APPROVALS.some(x => x.id === a.id)) APPROVALS.unshift(a); });
  }
}

// 데모 시드 — 기본 사고건에 정비청구서 결의 001을 저장해 두어 다중 결의·전체선택 결재를 시연.
function seedResolutions() {
  const c = (typeof CLAIMS !== "undefined" && CLAIMS[0]) ? CLAIMS[0] : null;
  if (!c) return;
  const staff = srCurrentStaff(c);
  const claim = 1500000, assessed = 1400000, faultPct = 20;
  const offset = Math.round(assessed * faultPct / 100);
  PAYMENT_RESOLUTIONS.push({
    id: nextResolutionId(),
    claimNo: c.id,
    resolutionSeq: nextResolutionSeq(c.id),
    resolutionType: "정비",
    sourceType: "수기입력",
    sourceFileName: "정비청구서_" + c.id + ".pdf",
    documentType: "claim",
    status: "결재 전",
    faultRateAtConfirmed: faultPct,
    claimAmount: claim,
    assessedAmountBeforeFault: assessed,
    faultOffsetAmount: offset,
    finalAssessedAmount: assessed - offset,
    rows: [
      { rowId:"ROW-S1", seq:1, partName:"판금 도장 공임", partNumber:"-", partCategory:"공임", quantity:1, denied:false, claimAmount:900000, assessedAmount:850000, ocrOriginal:null },
      { rowId:"ROW-S2", seq:2, partName:"소모품 일체", partNumber:"-", partCategory:"교환", quantity:1, denied:false, claimAmount:600000, assessedAmount:550000, ocrOriginal:null },
    ],
    editHistory: [],
    currentApprovalId: null,
    approvalHistoryIds: [],
    confirmedBy: staff.id,
    confirmedByName: staff.name,
    confirmedAt: apprNow(),
    updatedAt: apprNow(),
  });
}
