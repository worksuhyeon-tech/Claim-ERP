"use strict";
const activeView = "closing";

const APPR_TYPES = ["추산", "지급(종결)", "면책종결", "추가지급", "VOC"];
const APPR_PAY_TYPES = ["지급(종결)", "추가지급"];              // 비밀번호 인증 대상(지급성)
const APPR_STATUS_CLASS = { "상신중": "appr-ing", "결재완료": "appr-done", "반려": "appr-reject" };
const APPR_TYPE_COLOR = { "추산": "#2563EB", "지급(종결)": "#15803D", "면책종결": "#7C3AED", "추가지급": "#0891B2", "VOC": "#DC2626" };
const APPR_ACT_CLASS = { "상신": "", "승인": "h-approve", "반려": "h-reject" };
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

// 결재 LIST 상태
let apprQuery = "";
let apprType = "전체";       // 결재종류 필터 (전체 / 5종) — 요약카드와 셀렉트 공용
let apprStatus = "전체";     // 결재상태 필터 (전체 / 상신중 / 결재완료 / 반려)
let apprFrom = "";           // 조회 시작일 (결재완료일 기준)
let apprTo = "";             // 조회 종료일
let apprSelectedId = null;   // 선택 결재건 id
let apprBound = false;       // 툴바 이벤트 1회 바인딩 플래그
let apprSeeded = false;      // coreInfo/histories 시드 1회 주입 플래그
let apprPwTargetId = null;   // 비밀번호 인증 대기 중인 결재건 id

// ---- 헬퍼 (전결권한 화면의 assignWon/assignStaffById 재사용) ----
function apprAmountLabel(type) {
  if (type === "추산") return "추산액";
  if (apprIsPayType(type)) return "지급액";
  if (type === "면책종결") return "면책금";
  return "청구액";
}
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

// ---- 검색/상태/기간 필터 (결재종류 필터 제외 — 카드 카운트 산출용) ----
function apprFilteredBase() {
  const q = apprQuery.trim().toLowerCase();
  return APPROVALS.filter(a => {
    if (q && !`${a.claimNo} ${a.requesterName}`.toLowerCase().includes(q)) return false;
    if (apprStatus !== "전체" && a.approvalStatus !== apprStatus) return false;
    if (apprFrom || apprTo) {
      const d = (a.completedAt || "").slice(0, 10);
      if (apprFrom && (!d || d < apprFrom)) return false;
      if (apprTo && (!d || d > apprTo)) return false;
    }
    return true;
  });
}

function renderClosingView() {
  if (!apprSeeded) { seedApprovals(); apprSeeded = true; }
  bindApprToolbar();
  const base = apprFilteredBase();
  renderApprSummary(base);
  renderApprList(base);
  renderApprPanel();
}

function renderApprSummary(base) {
  const sel = $("#apprType"); if (sel) sel.value = apprType;
  const cards = [{ key: "전체", color: "#5B6678" }].concat(APPR_TYPES.map(t => ({ key: t, color: APPR_TYPE_COLOR[t] })));
  $("#apprCards").innerHTML = cards.map(c => {
    const n = c.key === "전체" ? base.length : base.filter(a => a.approvalType === c.key).length;
    return `<button type="button" class="appr-card ${apprType === c.key ? "active" : ""}" data-type="${c.key}">
      <div class="ac-task"><span class="ac-dot" style="background:${c.color}"></span>${c.key}</div>
      <div class="ac-count">${n}<b>건</b></div>
    </button>`;
  }).join("");
  $("#apprCards").querySelectorAll("[data-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.type;
      apprType = (apprType === t && t !== "전체") ? "전체" : t;
      renderClosingView();
    });
  });
}

function apprRowHtml(a) {
  const sel = a.id === apprSelectedId;
  const stCls = APPR_STATUS_CLASS[a.approvalStatus] || "appr-ing";
  return `<tr data-id="${a.id}" class="${sel ? "selected" : ""}">
    <td class="ta-c"><input type="checkbox" ${sel ? "checked" : ""} tabindex="-1" aria-label="선택"></td>
    <td class="sa-name">${a.requesterName}</td>
    <td>${a.approvalType}</td>
    <td>${a.claimNo}</td>
    <td class="ta-c">${a.resolutionNo}</td>
    <td>${a.damagedObjectName}</td>
    <td>${a.damageInfo}</td>
    <td>${a.repairShopName}</td>
    <td class="num">${assignWon(a.approvalAmount)}원</td>
    <td class="ta-c"><span class="badge ${stCls}">${a.approvalStatus}</span></td>
    <td>${a.requestedAt ? a.requestedAt.slice(0, 10) : "-"}</td>
    <td>${a.completedAt ? a.completedAt.slice(0, 10) : "-"}</td>
  </tr>`;
}

function renderApprList(base) {
  const list = (apprType === "전체") ? base : base.filter(a => a.approvalType === apprType);
  $("#apprListTitle").textContent = (apprType === "전체") ? "전체 결재 건" : `${apprType} 결재 건`;
  $("#apprCount").textContent = `총 ${list.length}건`;
  if (!list.length) {
    $("#apprRows").innerHTML = `<div class="rows-empty">조건에 해당하는 결재 건이 없습니다.</div>`;
    return;
  }
  $("#apprRows").innerHTML = `
    <table class="sa-table appr-table">
      <thead><tr>
        <th class="ta-c">선택</th><th>상신자</th><th>결재종류</th><th>사고번호</th><th class="ta-c">결의순번</th>
        <th>피해물명</th><th>피해정보</th><th>수리업체명</th><th class="num">결재금액</th>
        <th class="ta-c">결재상태</th><th>상신일</th><th>결재완료일</th>
      </tr></thead>
      <tbody>${list.map(apprRowHtml).join("")}</tbody>
    </table>`;
  $("#apprRows").querySelectorAll("tr[data-id]").forEach(tr => {
    tr.addEventListener("click", () => { apprSelectedId = tr.dataset.id; renderClosingView(); });
  });
}

function apprApproverOptions() {
  return APPR_APPROVERS.map(id => {
    const s = assignStaffById(id); if (!s) return "";
    return `<option value="${id}" ${id === currentApproverId ? "selected" : ""}>${s.name} (${s.position})</option>`;
  }).join("");
}
// ---- 품의서 스타일 요약/전체 문서 ----
function apprDocGroup(title, pairs) {
  const rows = pairs.map(([k, v, hl]) => {
    const val = (v === null || v === undefined || v === "") ? "-" : v;
    return `<div class="dk ${hl ? "hl" : ""}">${k}</div><div class="dv ${hl ? "hl" : ""}">${val}</div>`;
  }).join("");
  return `<div class="doc-grp"><div class="doc-grp-h">${title}</div><div class="doc-rows">${rows}</div></div>`;
}
function apprDocStrip(item) {
  const cls = (item.coreInfo && item.coreInfo.closing) || {};
  return `<div class="doc-strip">
    <div><div class="k">수리업체</div><div class="v">${item.repairShopName}</div></div>
    <div><div class="k">피해물</div><div class="v">${item.damagedObjectName}</div></div>
    <div><div class="k">종결번호</div><div class="v">${cls.종결번호 || "-"}</div></div>
  </div>`;
}
function apprSignHtml(item) {
  const approverName = item.approvalStatus === "상신중"
    ? ((assignStaffById(currentApproverId) || {}).name || "-")
    : (item.approverName || "-");
  let stamp;
  if (item.approvalStatus === "결재완료") stamp = `<span class="stamp">결재완료</span>`;
  else if (item.approvalStatus === "반려") stamp = `<span class="stamp">반려</span>`;
  else stamp = `<span class="stamp wait">상신중</span>`;
  return `<div class="appr-sign">
    <div><div class="sk">담당자(상신)</div><div class="sv">${item.requesterName}</div></div>
    <div><div class="sk">결재자</div><div class="sv">${approverName}</div></div>
    <div><div class="sk">결재</div>${stamp}</div>
  </div>`;
}
// 패널용 요약 품의서 (핵심만 한눈에)
function apprDocSummaryHtml(item) {
  const ci = item.coreInfo || {};
  const acc = ci.accident || {}, con = ci.contract || {}, dmg = ci.damage || {}, cls = ci.closing || {};
  const car = `${con.차량명 || "-"}${con.차량번호 ? " · " + con.차량번호 : ""}`;
  return `<div class="appr-doc">
    <div class="doc-head"><span class="doc-title">자동차 보험금 지급 품의서</span><span class="doc-no">${item.claimNo}-${item.resolutionNo}</span></div>
    <div class="doc-amt"><span class="lbl">결재금액 (${apprAmountLabel(item.approvalType)})</span><span class="val">${assignWon(item.approvalAmount)}원</span></div>
    ${apprDocStrip(item)}
    ${apprDocGroup("사고사항", [["사고번호", item.claimNo], ["사고일시", acc.사고일시], ["사고구분", acc.사고구분], ["과실률", acc.과실률]])}
    ${apprDocGroup("계약사항", [["고객명", con.고객명], ["차량", car], ["렌트/리스", con["렌트/리스구분"]], ["면책약정금액", con.면책약정금액]])}
    ${apprDocGroup("피해 · 지급금액", [["피해구분", dmg.피해구분], ["담보구분", dmg.담보구분], ["청구액", dmg.청구액], ["추산액", dmg.추산액], ["손해사정액", dmg.손해사정액], ["면책금", dmg.면책금], ["실지급액", dmg.실지급액, true]])}
    ${apprDocGroup("종결사항", [["종결구분", cls.종결구분], ["종결승인자", cls.종결승인자], ["종결일", cls.종결일]])}
    ${apprSignHtml(item)}
  </div>
  <button type="button" class="btn doc-full-btn" data-doc-full>품의서 전체보기</button>`;
}
// 전체 품의서 (모달) — 2단 전체 필드
function apprDocSectionFull(sec, item) {
  const data = (item.coreInfo && item.coreInfo[sec.key]) || {};
  const rows = sec.fields.map(f => {
    const v = data[f];
    const val = (v === null || v === undefined || v === "") ? "-" : v;
    return `<div class="dk">${f}</div><div class="dv">${val}</div>`;
  }).join("");
  return `<div class="doc-grp"><div class="doc-grp-h">${sec.title}</div><div class="doc-rows">${rows}</div></div>`;
}
function apprDocFullHtml(item) {
  const secByKey = k => APPR_CORE_SECTIONS.find(s => s.key === k);
  const col = keys => keys.map(k => apprDocSectionFull(secByKey(k), item)).join("");
  return `<div class="appr-doc">
    <div class="doc-head"><span class="doc-title">자동차 보험금 지급 품의서</span><span class="doc-no">${item.claimNo}-${item.resolutionNo}</span></div>
    <div class="doc-amt"><span class="lbl">결재금액 (${apprAmountLabel(item.approvalType)})</span><span class="val">${assignWon(item.approvalAmount)}원</span></div>
    ${apprDocStrip(item)}
    <div class="df-cols">
      <div>${col(["accident", "contract", "closing", "closingNotice"])}</div>
      <div>${col(["damage", "payment", "previousPayment"])}</div>
    </div>
    ${apprSignHtml(item)}
  </div>`;
}
function openApprDoc(id) {
  const item = APPROVALS.find(a => a.id === id); if (!item) return;
  const root = $("#apprDocRoot");
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="action-modal appr-doc-modal" role="dialog" aria-modal="true" aria-label="지급 품의서 전체보기">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">${item.approvalType} · ${item.approvalStatus}</div>
          <h2 class="modal-title">지급 품의서 전체보기</h2>
          <div class="modal-sub">${item.claimNo} · 결의순번 ${item.resolutionNo} · 상신자 ${item.requesterName}</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-modal-close>×</button>
      </div>
      <div class="modal-body">${apprDocFullHtml(item)}</div>
      <div class="modal-foot"><button class="btn-modal" type="button" data-modal-close>닫기</button></div>
    </section>`;
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeApprDoc));
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
}
function closeApprDoc() {
  const root = $("#apprDocRoot");
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
}
function apprHistoryHtml(item) {
  if (!item.histories || !item.histories.length) return `<div class="spd-hist"><div class="h-empty">이력이 없습니다.</div></div>`;
  return `<div class="spd-hist">${item.histories.map(h => `
    <div class="h-row">
      <div class="h-line"><span class="h-time">${h.actedAt}</span><span class="h-name">${h.actorName}</span><span class="h-badge ${APPR_ACT_CLASS[h.actionType] || ""}">${h.actionType}</span></div>
      ${h.comment ? `<div class="h-comment">${h.comment}</div>` : ""}
    </div>`).join("")}</div>`;
}

function renderApprPanel() {
  const panel = $("#apprPanel");
  const item = APPROVALS.find(a => a.id === apprSelectedId);
  if (!item) { panel.innerHTML = `<div class="panel-empty">결재 건을 선택하세요.</div>`; return; }
  const done = item.approvalStatus !== "상신중";
  panel.innerHTML = `
    <div class="panel-head">
      <div class="ph-top">
        <span class="pid">${item.claimNo}</span>
        <span class="badge ${APPR_STATUS_CLASS[item.approvalStatus] || "appr-ing"}">${item.approvalStatus}</span>
      </div>
      <div class="ph-sub">${item.approvalType} · 상신자 ${item.requesterName} · 결의순번 ${item.resolutionNo}</div>
    </div>
    <div class="panel-body">
      <div class="spd-approver">
        <label class="k" for="apprApprover">결재자</label>
        <select id="apprApprover" class="sa-select">${apprApproverOptions()}</select>
      </div>
      <div class="sec"><div class="sec-title">지급 품의서</div>${apprDocSummaryHtml(item)}</div>
      <div class="sec spd-opinion"><div class="sec-title">결재의견</div>
        <div class="k">상신자 의견</div>
        <div class="spd-ro">${item.requesterComment || "-"}</div>
        <div class="k" style="margin-top:8px">결재자 의견 ${done ? "" : `<span class="spd-req">(반려 시 필수)</span>`}</div>
        ${done
          ? `<div class="spd-ro">${item.approverComment || "-"}</div>`
          : `<textarea class="memo" id="apprApproverComment" placeholder="승인 시 선택 · 반려 시 필수로 입력하세요.">${item.approverComment || ""}</textarea>`}
      </div>
      <div class="sec"><div class="sec-title">결재이력</div>${apprHistoryHtml(item)}</div>
      <div class="sec"><div class="sec-title">빠른 이동</div>
        <div class="btn-grid">
          <button class="btn" type="button" data-jump="intake">Smart접수지 보기</button>
          <button class="btn" type="button" data-jump="pay">지급결의 화면</button>
          <button class="btn" type="button" data-jump="contact">고객 컨택이력</button>
          <button class="btn" type="button" data-jump="image">첨부/이미지 확인</button>
        </div>
      </div>
    </div>
    <div class="panel-foot">
      ${done
        ? `<div class="spd-done">이미 ${item.approvalStatus} 처리된 건입니다.</div>`
        : `<button class="btn-complete" id="apprApproveBtn" type="button">승인</button>
           <button class="btn-hold" id="apprRejectBtn" type="button">반려</button>`}
    </div>`;

  const approverSel = $("#apprApprover");
  if (approverSel) approverSel.addEventListener("change", e => { currentApproverId = e.target.value; renderApprPanel(); });
  const ta = $("#apprApproverComment");
  if (ta) ta.addEventListener("input", e => { item.approverComment = e.target.value; });
  panel.querySelectorAll("[data-jump]").forEach(b => b.addEventListener("click", () => apprJump(b.dataset.jump, item)));
  panel.querySelectorAll("[data-doc-full]").forEach(b => b.addEventListener("click", () => openApprDoc(item.id)));
  if (!done) {
    $("#apprApproveBtn").addEventListener("click", () => apprApprove(item.id));
    $("#apprRejectBtn").addEventListener("click", () => apprReject(item.id));
  }
}

function apprJump(kind, item) {
  if (kind === "intake" && CLAIMS.some(c => c.id === item.claimNo)) { openIntake(item.claimNo); return; }
  showToast("해당 화면으로 이동합니다.");
}

// ---- 결재 처리 (승인/반려) ----
function pushApprHistory(item, actionType, actor, comment, before, after) {
  const nextId = item.histories.reduce((m, h) => Math.max(m, h.id || 0), 0) + 1;
  item.histories.push({
    id: nextId, claimNo: item.claimNo, resolutionNo: item.resolutionNo, approvalType: item.approvalType,
    actionType, actorId: actor.id, actorName: actor.name, actorEmployeeNo: actor.employeeNo,
    actedAt: apprNow(), status: after, comment: comment || "", statusBefore: before, statusAfter: after
  });
}
function apprFinalizeApprove(item, approver) {
  const before = item.approvalStatus;
  item.approvalStatus = "결재완료";
  item.completedAt = apprNow();
  item.approverId = approver.id;
  item.approverName = approver.name;
  pushApprHistory(item, "승인", approver, item.approverComment, before, "결재완료");
  renderClosingView();
  showToast("결재완료 처리되었습니다.");
}
function apprApprove(id) {
  const item = APPROVALS.find(a => a.id === id); if (!item) return;
  const approver = assignStaffById(currentApproverId);
  const ta = $("#apprApproverComment"); if (ta) item.approverComment = ta.value.trim();
  // 지급성 결재 → 비밀번호 인증
  if (apprIsPayType(item.approvalType)) { openApprPw(id); return; }
  apprFinalizeApprove(item, approver);
}
function apprReject(id) {
  const item = APPROVALS.find(a => a.id === id); if (!item) return;
  const approver = assignStaffById(currentApproverId);
  const ta = $("#apprApproverComment");
  const reason = ta ? ta.value.trim() : "";
  if (!reason) { showToast("반려사유를 입력해 주세요."); if (ta) ta.focus(); return; }
  item.approverComment = reason;
  const before = item.approvalStatus;
  item.approvalStatus = "반려";
  item.completedAt = apprNow();
  item.approverId = approver.id;
  item.approverName = approver.name;
  pushApprHistory(item, "반려", approver, reason, before, "반려");
  renderClosingView();
  showToast("반려 처리되었습니다.");
}

// ---- 비밀번호 인증 모달 (지급성 결재 최종승인) ----
function openApprPw(id) {
  apprPwTargetId = id;
  const root = $("#apprPwRoot");
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="action-modal" role="dialog" aria-modal="true" aria-label="지급 비밀번호 인증">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">지급성 결재 · 최종승인</div>
          <h2 class="modal-title">비밀번호 인증</h2>
          <div class="modal-sub">지급(종결)·추가지급 승인에는 결재 비밀번호가 필요합니다.</div>
        </div>
        <button class="modal-close" type="button" aria-label="닫기" data-modal-close>×</button>
      </div>
      <div class="modal-body">
        <div class="spd-pw">
          <label class="k" for="apprPwInput">결재 비밀번호</label>
          <input type="password" id="apprPwInput" class="sa-input" autocomplete="off" placeholder="비밀번호 입력" />
          <div class="spd-pw-hint">데모 비밀번호: ${APPR_PASSWORD}</div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-modal" type="button" data-modal-close>취소</button>
        <button class="btn-modal primary" type="button" id="apprPwSubmit">확인</button>
      </div>
    </section>`;
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeApprPw));
  $("#apprPwSubmit").addEventListener("click", submitApprPw);
  $("#apprPwInput").addEventListener("keydown", e => { if (e.key === "Enter") submitApprPw(); });
  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  setTimeout(() => { const el = $("#apprPwInput"); if (el) el.focus(); }, 0);
}
function closeApprPw() {
  const root = $("#apprPwRoot");
  root.classList.remove("open");
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = "";
  apprPwTargetId = null;
}
function submitApprPw() {
  const val = ($("#apprPwInput") && $("#apprPwInput").value) || "";
  if (val !== APPR_PASSWORD) { showToast("비밀번호가 불일치합니다."); return; }  // 불일치 → 상태 불변
  const item = APPROVALS.find(a => a.id === apprPwTargetId);
  const approver = assignStaffById(currentApproverId);
  closeApprPw();
  if (item && approver) apprFinalizeApprove(item, approver);
}

function bindApprToolbar() {
  if (apprBound) return;
  apprBound = true;
  $("#apprSearch").addEventListener("input", e => { apprQuery = e.target.value; renderClosingView(); });
  $("#apprType").addEventListener("change", e => { apprType = e.target.value; renderClosingView(); });
  $("#apprStatus").addEventListener("change", e => { apprStatus = e.target.value; renderClosingView(); });
  $("#apprFrom").addEventListener("change", e => { apprFrom = e.target.value; renderClosingView(); });
  $("#apprTo").addEventListener("change", e => { apprTo = e.target.value; renderClosingView(); });
  $("#apprSearchBtn").addEventListener("click", renderClosingView);
  $("#apprReset").addEventListener("click", () => {
    apprQuery = ""; apprType = "전체"; apprStatus = "전체"; apprFrom = ""; apprTo = "";
    $("#apprSearch").value = ""; $("#apprType").value = "전체"; $("#apprStatus").value = "전체";
    $("#apprFrom").value = ""; $("#apprTo").value = "";
    renderClosingView();
  });
}


/* ===================== 초기화 ===================== */
(function initClosing() {
  renderClosingView();
})();
