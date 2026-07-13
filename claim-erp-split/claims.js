"use strict";
const activeView = "claims";

/* ===================== 업무 Flow 단계 정의 ===================== */


const STAGE_CONFIG = {
  "접수·선견적": {
    tasks: ["차량·계약정보 확인", "운전자·사고정보 확인 (단독/차대차)", "입고지 확인", "AOS 선견적 수신·검토"],
    buttons: [
      { label:"계약정보 확인",   kind:"primary", toast:"계약정보 확인이 완료되었습니다." },
      { label:"사고정보 확인",   kind:"normal",  toast:"사고정보 확인이 완료되었습니다." },
      { label:"입고지 확인",     kind:"normal",  toast:"입고지 확인이 완료되었습니다." },
      { label:"선견적 확인",     kind:"normal",  toast:"AOS 선견적을 확인했습니다." }
    ] },
  "수리 승인": {
    tasks: ["공업사 수리 오더", "수리 승인", "승인 후 진행상태 확인"],
    buttons: [
      { label:"수리 승인",       kind:"primary", toast:"수리 승인이 완료되었습니다." },
      { label:"공업사 오더",     kind:"normal",  toast:"공업사에 수리 오더를 전달했습니다." },
      { label:"고객 안내발송",   kind:"normal",  toast:"고객에게 안내를 발송했습니다." },
      { label:"관리자 확인요청", kind:"alert",   toast:"관리자에게 확인요청을 전송했습니다." }
    ] },
  "손해사정": {
    tasks: ["AOS 청구 자동 수신", "AOS 손해사정 결과 조회", "면부책 및 과실 조회"],
    buttons: [
      { label:"AOS 청구 조회",   kind:"primary", toast:"AOS 청구 내역을 조회했습니다." },
      { label:"사정결과 조회",   kind:"normal",  toast:"AOS 손해사정 결과를 조회했습니다." },
      { label:"면부책 조회",     kind:"normal",  toast:"면부책·과실 내역을 조회했습니다." },
      { label:"관리자 검토요청", kind:"alert",   toast:"관리자에게 검토요청을 전송했습니다." }
    ] },
  "지급 / 정산": {
    tasks: ["손해액 확정 및 공업사 안내", "SK렌터카 전산 수리내역 입력", "월 정산 데이터 정리"],
    buttons: [
      { label:"손해액 확정",     kind:"primary", toast:"손해액이 확정되었습니다." },
      { label:"공업사 안내",     kind:"normal",  toast:"공업사에 정산 안내를 발송했습니다." },
      { label:"SK전산 입력",     kind:"normal",  toast:"SK렌터카 전산 입력이 완료되었습니다." },
      { label:"월정산 반영",     kind:"normal",  toast:"월 정산 데이터에 반영되었습니다." }
    ] }
};

const ACTION_WORKFLOWS = {
  "접수 확인": [
    {
      label: "계약정보 확인",
      title: "계약정보 확인",
      subtitle: "SK렌터카와 임차인 간 임대차 계약 내용을 확인합니다.",
      status: "계약정보 탭 조회",
      hideDetail: true,
      body: "SK전산 계약정보 탭 기준으로 렌트/리스 구분, 상품, 계약번호, 관리지점, 차량, 잔존가액, 고객명, 사고/정비대차 포함 여부를 확인합니다.",
      fields: [
        ["렌트/리스 구분", "장기렌트"],
        ["상품구분", "개인 장기렌탈"],
        ["계약번호", "SKR-2024-184520"],
        ["관리지점", "수도권보상센터"],
        ["최초등록일", "2024.03.18"],
        ["차량번호", "{car}"],
        ["모델명", "쏘렌토 2.2D 2WD 프레스티지"],
        ["잔존가액", "18,420,000원"],
        ["고객명", "{name}"],
        ["임차인 구분", "{custType}"],
        ["사고대차 포함", "포함"],
        ["정비대차 포함", "포함"],
        ["자기부담금", "{deductible}"],
        ["현재 조치유형", "{actionType}"]
      ],
      checks: ["사고접수 시 자동 세팅되는 계약번호와 차량번호 일치 확인", "잔존가액과 자기부담금 조건 확인", "사고/정비대차 제공 가능 여부 확인"],
      nextIndex: 1
    },
    {
      label: "사고정보 확인",
      title: "사고정보 확인",
      imagePanel: true,
      subtitle: "고객센터에서 1차 입력한 사고내역과 조사에 필요한 담당 정보를 확인합니다.",
      status: "사고정보 탭 조회",
      accidentEdit: true,
      groups: [
        { title:"사고 개요", fields: [
          { key:"accidentBody", label:"사고내용", value:"강남역 방면 3차로 주행 중 상대 차량이 차선 변경하며 우측 후면을 접촉했습니다. 고객 진술 기준 인명 피해는 없고 차량 후측면 긁힘 및 범퍼 손상이 확인되었습니다.", type:"textarea", full:true },
          { key:"accidentAt", label:"사고일시", value:"2026.06.13 14:25" },
          { key:"accidentType", label:"사고유형", value:"차대차 / 차선변경", type:"select", options:["차대차 / 추돌", "차대차 / 차선변경", "차대차 / 후진사고", "차대차 / 주/정차 사고", "단독 / 자손", "단독 / 시설물"], help:"단독/차대차 여부만 확인 (사고조사 단계 흡수)" },
          { key:"accidentPlace", label:"사고장소", value:"서울시 강남구 테헤란로 152", full:true }
        ] },
        { title:"운전자 정보", fields: [
          { key:"reporterRel", label:"통보자 관계", value:"본인", type:"select", options:["본인", "배우자", "자녀", "부모", "형제자매", "직원", "기타"] },
          { key:"reporterName", label:"통보자 이름", value:"김민수" },
          { key:"driverRel", label:"운전자 관계", value:"배우자", type:"select", options:["본인", "배우자", "자녀", "부모", "형제자매", "직원", "기타"] },
          { key:"driverName", label:"운전자 이름", value:"홍길동", help:"피보험자 기준 관계와 함께 확인" },
          { key:"driverRrn", label:"주민등록번호", value:"940927-2*******", help:"운전자 신원 확인용" },
          { key:"licenseNo", label:"면허번호", value:"서울 12-34-567890-12", help:"면허 진위/적성 확인용" }
        ] },
        { title:"경합 · 현장 처리", fields: [
          { key:"rivalNo", label:"경합 사고접수번호", value:"삼성화재 / SS-2026-0613-4821", help:"담당자: 김나비 010-****-2481", full:true },
          { key:"repairShop", label:"입고 공업사", value:"SK네트웍스 강남협력공업사 (02-111-1111)", full:true },
          { key:"policeReport", label:"경찰서 신고 여부", value:"미신고", type:"select", options:["신고", "미신고"] },
          { key:"towing", label:"견인 여부", value:"미견인", type:"select", options:["견인", "미견인"] }
        ] }
      ],
      checks: ["경합 보험사 사고접수번호와 담당자 연락처 확인", "운전자 정보와 피보험자 관계 확인", "경찰 신고/견인 여부에 따른 추가 조사 필요성 확인"],
      nextIndex: 2
    },
    {
      label: "고객 정보 요청",
      title: "고객 정보 요청",
      subtitle: "계약정보와 사고정보 확인 후 부족한 운전자, 사고경위, 사진 정보를 고객에게 요청합니다.",
      status: "요청 발송 준비",
      messageRequest: true,
      body: "{id} 접수 건의 필수 정보가 일부 비어 있습니다. 고객에게 정보 입력 링크를 발송하기 전 요청 항목과 응답 기한을 확인하세요.",
      defaultMessage: "{name} 고객님, SK렌터카 사고접수 {id} 진행을 위해 운전자 정보와 사고경위 확인이 필요합니다. 아래 링크에서 오늘 18시까지 정보를 입력해 주세요.",
      notices: [
        { id: "receipt", name: "사고접수 안내", desc: "접수번호와 담당자 안내", channel: "알림톡", status: "발송완료", sentAt: "06.13 14:32" },
        { id: "driver", name: "운전자 정보 요청", desc: "운전자명, 연락처, 생년월일 확인", channel: "알림톡", status: "발송필요", sentAt: "-" },
        { id: "accident", name: "사고경위 입력 요청", desc: "사고일시, 장소, 상세 경위 확인", channel: "알림톡", status: "미발송", sentAt: "-" },
        { id: "photo", name: "현장 사진 업로드 요청", desc: "파손 부위와 현장 사진 등록", channel: "문자", status: "발송필요", sentAt: "-" }
      ],
      fields: [
        ["요청 대상", "{name}"],
        ["차량번호", "{car}"],
        ["고객구분", "{custType}"],
        ["권장 채널", "문자 + 알림톡"],
        ["응답 기한", "오늘 18:00"],
        ["담당자", "{manager}"]
      ],
      checks: ["운전자 연락처와 실사용자 일치 여부 확인", "사고 일시, 장소, 경위 입력 요청", "현장 사진 또는 블랙박스 자료 요청"],
      nextIndex: 3
    },
    {
      label: "상담 메모",
      title: "상담 메모 작성",
      subtitle: "고객 상담 내용과 다음 조치를 메모로 남기고 접수 확인 단계를 마감합니다.",
      status: "상담 메모 작성",
      consultMemo: true,
      completeLabel: "메모 저장 후 접수 확인 완료",
      categories: ["통화 완료", "고객 부재중", "정보 입력 안내", "추가 조사 필요", "면책/보상 안내", "기타"],
      templates: [
        { label:"통화 완료",      text:"고객과 통화 완료. 사고 경위를 추가로 확인했습니다." },
        { label:"부재중",         text:"부재중이어서 음성 메시지를 남겼습니다. 재연락 예정입니다." },
        { label:"정보 입력 안내", text:"운전자 정보 입력 안내 문자를 발송했습니다." },
        { label:"사진 요청",      text:"현장/파손 사진 추가 등록을 요청했습니다." },
        { label:"면책 안내",      text:"면책 가능성과 자기부담금 조건을 안내했습니다." }
      ],
      checks: ["상담 일시와 통화 상대(본인/대리인) 기록", "고객 요청사항과 약속한 다음 조치 기록", "재연락 필요 시 예정 일시 입력"],
      nextIndex: null,
      completesClaim: true
    }
  ],

  "입고 / 선견적": [
    {
      label: "입고지 확인",
      title: "입고지 확인",
      imagePanel: true,
      subtitle: "협력업체 입고 여부와 입고일, 입고 공업사 정보를 확인합니다.",
      status: "사고수리정보 탭 조회",
      hideDetail: true,
      body: "SK전산 사고건 조회 후 하단 사고수리정보 탭에서 입고 여부와 입고일을 확인합니다. 차량이 배정된 협력업체로 입고되면 협력업체가 채널COSS에 입고일을 직접 입력하고, 차량사진·선견적서는 사고이미지 탭에 등록됩니다.",
      screenRefs: [
        { title:"사고수리정보 탭", desc:"사고건 조회 후 하단 탭. 입고일·입고상태·채널COSS 입력값 확인", tag:"SK전산" },
        { title:"사고이미지 탭", desc:"협력업체가 올린 차량사진·선견적서 등록 여부 확인", tag:"채널COSS" }
      ],
      fields: [
        ["입고 공업사", "SK네트웍스 강남협력공업사"],
        ["입고일", "2026.06.13"],
        ["입고상태", "입고완료"],
        ["채널COSS 입력 여부", "입력완료"],
        ["사고이미지 등록 여부", "등록완료"],
        ["차량사진 등록 여부", "등록완료"],
        ["선견적서 등록 여부", "미등록"]
      ],
      checks: ["협력업체가 채널COSS에 입고일을 입력했는지 확인", "사고이미지 탭에 차량사진이 등록되었는지 확인", "선견적서가 누락되지 않았는지 확인"],
      nextIndex: 1
    },
    {
      label: "선견적 확인",
      title: "선견적 확인",
      imagePanel: true,
      subtitle: "협력업체가 업로드한 선견적서와 추산액, 출고예정일을 확인합니다.",
      status: "사고수리정보 / 사고이미지 탭 조회",
      hideDetail: true,
      body: "협력업체에서 선견적금액은 추산액 칸에 직접 숫자로 입력합니다. AOS 연동이 불가하므로 수기 입력값을 확인하고, 출고예정일도 협력업체 입력값으로 확인합니다.",
      screenRefs: [
        { title:"사고수리정보 탭", desc:"추산액(수기입력)·출고예정일 확인", tag:"SK전산" },
        { title:"사고이미지 탭", desc:"파손부위 사진과 견적금액 적정성 대조", tag:"채널COSS" }
      ],
      fields: [
        ["선견적서 등록 여부", "등록완료"],
        ["추산액", "1,820,000원"],
        ["출고예정일", "2026.06.20"],
        ["차량상태", "후측면 긁힘 / 범퍼 손상"],
        ["파손사진", "근접 3매 / 전체 2매"],
        ["견적금액 적정성", "적정 (사진 대조 완료)"],
        ["AOS 연동 여부", "미연동 / 수기입력"]
      ],
      checks: ["선견적금액과 사진상 파손부위가 일치하는지 확인", "추산액이 과다하거나 누락된 항목은 없는지 확인", "출고예정일이 현실적인지 확인"],
      nextIndex: 2
    },
    {
      label: "사진요청 발송",
      title: "사진요청 발송",
      imagePanel: true,
      subtitle: "선견적 검토에 필요한 사진·자료가 부족할 경우 고객 또는 공업사에 요청합니다.",
      status: "요청 발송 준비",
      messageRequest: true,
      defaultMessage: "{name} 고객님, SK렌터카 사고접수 {id} 선견적 검토를 위해 차량 전체사진과 파손부위 근접사진이 필요합니다. 아래 링크에서 오늘 18시까지 사진을 등록해 주세요.",
      notices: [
        { id: "carFull",  name: "차량 전체사진 요청", desc: "차량 전체가 보이는 사진", channel: "문자", status: "발송필요", sentAt: "-" },
        { id: "damage",   name: "파손부위 근접사진 요청", desc: "손상 부위 근접 촬영", channel: "문자", status: "발송필요", sentAt: "-" },
        { id: "plate",    name: "번호판 사진 요청", desc: "차량번호 식별용", channel: "알림톡", status: "미발송", sentAt: "-" },
        { id: "cluster",  name: "계기판 사진 요청", desc: "주행거리·경고등 확인", channel: "알림톡", status: "미발송", sentAt: "-" },
        { id: "estimate", name: "선견적서 등록 요청", desc: "공업사 선견적서 업로드", channel: "공업사 알림", status: "발송필요", sentAt: "-" },
        { id: "release",  name: "출고예정일 확인 요청", desc: "협력업체 출고예정일 입력", channel: "공업사 알림", status: "미발송", sentAt: "-" }
      ],
      checks: ["고객에게 요청할 사진인지, 공업사에 요청할 자료인지 구분", "사진 요청 후 회신기한(오늘 18시)을 안내", "발송 후 토스트로 발송 결과 확인"],
      nextIndex: 3
    },
    {
      label: "공업사 요청",
      title: "공업사 요청",
      subtitle: "입고/선견적 자료가 누락되었거나 지연될 때 공업사에 재요청합니다.",
      status: "공업사 재요청",
      hideDetail: true,
      body: "채널COSS 입력 누락 항목과 회신기한 초과 여부를 확인하고 공업사에 재요청합니다. 지연이 길어지면 관리자 확인요청으로 에스컬레이션합니다.",
      fields: [
        ["요청 공업사", "SK네트웍스 강남협력공업사"],
        ["요청 유형", "선견적서 등록 / 추산액 입력 요청"],
        ["추가 요청", "출고예정일 입력 · 차량사진 등록"],
        ["요청 기한", "오늘 18:00"],
        ["회신기한 초과", "선견적서 4시간 지연"],
        ["담당자 메모", "오전 통화 시 14시까지 등록 약속"]
      ],
      checks: ["채널COSS 입력 누락 항목(선견적서·추산액·출고예정일) 확인", "회신기한 초과 여부 확인", "지연 지속 시 관리자 확인요청으로 에스컬레이션"],
      completeLabel: "입고/선견적 확인 완료",
      completeToast: "입고/선견적 확인이 완료되었습니다.",
      setStatus: "처리중",
      nextIndex: null
    }
  ],

  "수리 승인": [
    {
      label: "수리 승인",
      title: "수리 승인",
      imagePanel: true,
      subtitle: "선견적 입력 완료 건을 조회해 차량상태·견적을 1차 검토하고 수리승인 처리합니다.",
      status: "선견적 검토 / 수리승인",
      hideDetail: true,
      body: "사고담당자는 선견적 입력 완료 건을 조회하여 차량상태 및 견적을 1차 검토한 뒤 수리승인을 처리합니다. 승인 시 협력업체가 수리에 착수합니다.",
      fields: [
        ["선견적 금액", "1,820,000원"],
        ["추산액", "1,820,000원"],
        ["차량상태", "후측면 긁힘 / 범퍼 손상"],
        ["파손사진 등록 여부", "등록완료 (근접 3매)"],
        ["출고예정일", "2026.06.20"],
        ["승인 가능 여부", "승인 가능"],
        ["승인 제한 사유", "없음"],
        ["담당자 판단 메모", "사진 대비 수리범위 적정"]
      ],
      checks: ["선견적 금액이 사진상 손상과 일치하는지 확인", "수리범위가 과다하지 않은지 확인", "출고예정일과 수리기간이 적정한지 확인", "면책금/계약조건 확인 필요 여부 확인"],
      nextIndex: 1
    },
    {
      label: "공업사 오더",
      title: "공업사 오더",
      subtitle: "수리 승인 이후 공업사가 작업을 시작하도록 수리 오더를 전달합니다.",
      status: "수리 오더 전달",
      hideDetail: true,
      body: "협력업체는 수리승인 건에 한해 작업을 시작하며, 수리개시일을 입력합니다. 오더 전달과 착수 여부를 확인합니다.",
      fields: [
        ["수리 승인일", "2026.06.14"],
        ["수리 오더 발송 여부", "발송완료"],
        ["공업사명", "SK네트웍스 강남협력공업사"],
        ["공업사 담당자", "이정비 02-111-1111"],
        ["수리개시일", "2026.06.14"],
        ["오더 상태", "착수 대기"],
        ["예상 수리기간", "5일"]
      ],
      checks: ["수리승인 후 공업사에 오더가 전달되었는지 확인", "공업사가 수리개시일을 입력했는지 확인", "수리 착수 지연 여부 확인"],
      nextIndex: 2
    },
    {
      label: "고객 안내발송",
      title: "고객 안내발송",
      subtitle: "수리 승인 후 고객에게 진행상황·예상 출고일·면책금 여부를 안내합니다.",
      status: "고객 안내 발송",
      messageRequest: true,
      defaultMessage: "{name} 고객님, 차량 수리 승인이 완료되었습니다. 현재 공업사에서 수리 착수 예정이며, 예상 출고일은 2026.06.20입니다. 진행상황은 담당자가 추가 안내드리겠습니다.",
      notices: [
        { id: "approve", name: "수리 승인 완료 안내", desc: "수리 승인 및 착수 예정 안내", channel: "알림톡", status: "발송필요", sentAt: "-" },
        { id: "release", name: "예상 출고일 안내", desc: "예상 출고일 2026.06.20", channel: "알림톡", status: "미발송", sentAt: "-" },
        { id: "rental",  name: "대차/렌트 이용 안내", desc: "대차 이용 여부 확인", channel: "문자", status: "미발송", sentAt: "-" },
        { id: "deduct",  name: "면책금 발생 가능 안내", desc: "면책금 발생 가능성 안내", channel: "문자", status: "발송필요", sentAt: "-" }
      ],
      checks: ["고객에게 예상 출고일 안내", "면책금 발생 가능성 안내", "수리 지연 가능성 있는 경우 별도 안내"],
      nextIndex: 3
    },
    {
      label: "관리자 확인요청",
      title: "관리자 확인요청",
      subtitle: "고액·지연·과다견적·면책 이슈가 있는 경우 관리자 검토를 요청합니다.",
      status: "관리자 확인요청",
      hideDetail: true,
      body: "수리 승인 단계에서 관리자 판단이 필요한 사유를 정리해 검토를 요청합니다. 견적·사진·계약조건을 함께 확인할 수 있도록 구성합니다.",
      fields: [
        ["확인요청 사유", "고액 견적 / 면책·계약조건 확인 필요"],
        ["선견적 금액", "1,820,000원"],
        ["예상 수리기간", "5일"],
        ["면책/계약조건", "개별정액 (확인 필요)"],
        ["고객 민원 가능성", "낮음"],
        ["담당자 의견", "수리범위 적정하나 면책조건 재확인 요청"]
      ],
      checks: ["관리자 확인이 필요한 사유가 명확한지 확인", "견적·사진·계약조건을 함께 확인할 수 있도록 구성", "요청 후 토스트로 전송 결과 확인"],
      completeLabel: "수리 승인 단계 완료",
      completeToast: "수리 승인 단계 확인이 완료되었습니다.",
      nextIndex: null
    }
  ],

  "손해사정": [
    {
      label: "AOS 청구 확인",
      title: "AOS 청구 확인",
      imagePanel: true,
      subtitle: "수리 완료 후 공업사가 AOS·채널COSS에 입력한 청구서와 청구금액을 확인합니다.",
      status: "AOS / 채널COSS 청구 조회",
      hideDetail: true,
      body: "수리가 끝난 즉시 협력업체가 AOS 및 채널COSS에 청구서와 청구금액을 입력합니다. 사고담당자는 두 청구금액의 일치 여부와 선견적 대비 증감을 확인합니다.",
      screenRefs: [
        { title:"AOS 청구 화면", desc:"공업사 최종 청구서·청구금액 확인", tag:"AOS" },
        { title:"채널COSS 청구", desc:"채널COSS 입력 청구금액과 대조", tag:"채널COSS" }
      ],
      fields: [
        ["AOS 청구 수신 여부", "수신완료"],
        ["채널COSS 청구 입력 여부", "입력완료"],
        ["청구금액", "1,950,000원"],
        ["선견적 금액", "1,820,000원"],
        ["차액", "+130,000원 (도장 추가)"],
        ["수리완료일", "2026.06.19"],
        ["청구서 등록 여부", "등록완료"]
      ],
      checks: ["AOS 청구금액과 채널COSS 금액 일치 여부 확인", "선견적 대비 증감 사유 확인", "청구서·사진·수리완료일 누락 여부 확인"],
      nextIndex: 1
    },
    {
      label: "손해사정 등록",
      title: "손해사정 등록",
      imagePanel: true,
      subtitle: "AOS 청구와 수리내역을 기준으로 손해액을 검토하고 사정 결과를 등록합니다.",
      status: "손해사정 등록",
      hideDetail: true,
      body: "수리비 청구금액을 부품·공임·도장으로 구분해 검토하고, 인정금액과 삭감금액을 산정해 사정 결과를 등록합니다.",
      fields: [
        ["수리비 청구금액", "1,950,000원"],
        ["인정금액", "1,880,000원"],
        ["삭감금액", "70,000원"],
        ["부품/공임/도장 구분", "부품 90 / 공임 55 / 도장 50만"],
        ["수리범위 적정성", "적정 (도장 1패널 추가 인정)"],
        ["담당자 사정의견", "도장 추가분 일부 감액 후 인정"]
      ],
      checks: ["수리범위와 사고내용이 일치하는지 확인", "선견적 대비 증가 사유가 타당한지 확인", "감액 또는 추가 확인 필요 여부 기록"],
      nextIndex: 2
    },
    {
      label: "면부책 확인",
      title: "면부책 확인",
      imagePanel: true,
      subtitle: "계약조건·운전자 범위·과실·면책금 조건을 최종 확인합니다.",
      status: "면부책 / 면책금 조건 확인",
      hideDetail: true,
      body: "고객정보 조회 후 면책금 계약조건을 확인합니다. 개별정액은 고객이 공장에 직접 면책금을 납부하고, 통합정액은 공장이 수취하지 않고 익월 렌탈료에 추가 청구해야 합니다.",
      screenRefs: [
        { title:"고객정보 / 보험정보", desc:"보험사 사고접수번호·운전자범위·보상한도 확인", tag:"SK전산" },
        { title:"면책금입금내역 탭", desc:"개별정액/통합정액 등 면책금 계약조건 확인", tag:"SK전산" }
      ],
      fields: [
        ["보험사 사고접수번호", "삼성화재 SS-2026-0613-4821"],
        ["운전자범위", "가족한정 (위반 없음)"],
        ["보상한도", "대물 2억 / 자기차량 가입"],
        ["과실율", "30% (상대 70)"],
        ["면책금 계약조건", "개별정액"],
        ["고객 납부 여부", "공장 직접 납부 예정"],
        ["공업사 수취 여부", "수취 예정"],
        ["익월 청구 필요 여부", "불필요 (개별정액)"]
      ],
      checks: ["운전자 범위 위반 여부 확인", "면책금 조건이 개별정액인지 통합정액인지 확인", "과실율 및 보상한도 확인", "면책/부책 판단 메모 작성"],
      nextIndex: 3
    },
    {
      label: "관리자 검토요청",
      title: "관리자 검토요청",
      subtitle: "고액·과실분쟁·면책 이슈가 있는 경우 관리자 검토를 요청합니다.",
      status: "관리자 검토요청",
      hideDetail: true,
      body: "손해사정 결과 중 관리자 판단이 필요한 쟁점을 정리해 검토를 요청합니다. 금액·과실·면책 조건이 함께 보이도록 구성합니다.",
      fields: [
        ["검토요청 사유", "과실 협의 결과 반영 / 도장 추가 인정"],
        ["손해사정 금액", "1,880,000원"],
        ["면책금 조건", "개별정액"],
        ["과실율", "30% (협의중)"],
        ["쟁점사항", "상대 보험사 과실 협의 미확정"],
        ["담당자 의견", "과실 확정 후 최종 손해액 확정 권장"],
        ["참조 화면", "AOS 청구 · 채널COSS · 사고수리정보 · 보험정보"]
      ],
      checks: ["관리자에게 판단 필요한 쟁점이 명확한지 확인", "금액·과실·면책 조건이 함께 보이게 구성", "검토요청 후 처리상태를 처리중으로 변경"],
      completeLabel: "손해사정 단계 완료",
      completeToast: "손해사정 단계 확인이 완료되었습니다.",
      setStatus: "처리중",
      nextIndex: null
    }
  ],

  "지급 / 정산": [
    {
      label: "손해액 확정",
      title: "손해액 확정",
      subtitle: "AOS 청구 및 손해사정 결과를 바탕으로 최종 손해액을 확정합니다.",
      status: "손해액 확정",
      hideDetail: true,
      body: "수리·출고 완료와 과실 확정 여부를 확인하고 면책금을 반영해 최종 손해액을 확정합니다.",
      fields: [
        ["청구금액", "1,950,000원"],
        ["인정금액", "1,880,000원"],
        ["삭감금액", "70,000원"],
        ["최종 손해액", "1,880,000원"],
        ["면책금", "400,000원 (개별정액)"],
        ["고객 부담금", "400,000원"],
        ["공업사 지급 예정금액", "1,480,000원"]
      ],
      checks: ["수리 및 출고완료 여부 확인", "과실 완료 여부 확인", "면책금 반영 여부 확인", "최종 손해액 확정 가능 여부 확인"],
      nextIndex: 1
    },
    {
      label: "공업사 안내",
      title: "공업사 안내",
      subtitle: "확정 손해액과 지급·출고 관련 내용을 공업사에 안내합니다.",
      status: "공업사 정산 안내",
      hideDetail: true,
      body: "개별정액인 경우 고객에게 직접 면책금을 수취한 뒤 출고처리하며, 출고완료일 입력이 필요합니다. 통합정액인 경우 공업사가 직접 수취하지 않습니다.",
      screenRefs: [
        { title:"사고수리정보 탭", desc:"출고완료일 입력 / 출고가능 여부 확인", tag:"SK전산" }
      ],
      fields: [
        ["공업사명", "SK네트웍스 강남협력공업사"],
        ["확정 손해액", "1,880,000원"],
        ["공업사 지급 예정금액", "1,480,000원"],
        ["면책금 수취 대상", "고객 → 공업사 (개별정액)"],
        ["출고가능 여부", "출고가능"],
        ["출고완료일", "2026.06.20"],
        ["안내 메시지", "면책금 수취 후 출고 처리 요청"]
      ],
      checks: ["개별정액이면 공업사 면책금 수취 여부 확인", "통합정액이면 공업사가 직접 수취하지 않도록 안내", "출고완료일 입력 여부 확인"],
      nextIndex: 2
    },
    {
      label: "SK전산 입력",
      title: "SK전산 입력",
      subtitle: "사고수리정보·면책금입금내역·종결보고서 값을 SK렌터카 전산에 입력·확인합니다.",
      status: "SK전산 입력 / 확인",
      hideDetail: true,
      body: "사고건 조회 후 사고수리정보 탭의 일자값과 면책금입금내역 탭의 계약조건을 입력합니다. 종결보고서 탭은 선행 탭 값 입력 시 자동 세팅되며, 수리·출고·과실 완료 건에 한해 최종 종결처리합니다.",
      screenRefs: [
        { title:"사고수리정보 탭", desc:"입고일·추산액·출고예정일·수리개시일·수리완료일·출고완료일", tag:"SK전산" },
        { title:"면책금입금내역 탭", desc:"면책금 계약조건(개별/통합정액)·수취·익월청구 확인", tag:"SK전산" },
        { title:"종결보고서 탭", desc:"선행 탭 입력 시 자동 세팅 · 최종 종결처리", tag:"SK전산" }
      ],
      fields: [
        ["입고일", "2026.06.13"],
        ["추산액", "1,820,000원"],
        ["출고예정일", "2026.06.20"],
        ["수리개시일 / 완료일", "06.14 / 06.19"],
        ["출고완료일", "2026.06.20"],
        ["면책금 계약조건", "개별정액 (공업사 수취)"],
        ["익월 렌탈료 청구 필요", "불필요"],
        ["종결보고서", "수리·출고·과실 완료 / 자동세팅"],
        ["결재자 지정 여부", "지정완료 (승인자 박지현)"]
      ],
      checks: ["사고수리정보 필수일자가 모두 입력되었는지 확인", "면책금 조건(개별/통합정액)에 맞게 처리되었는지 확인", "종결보고서 자동 세팅값 누락 여부 확인"],
      nextIndex: 3
    },
    {
      label: "월정산 반영",
      title: "월정산 반영",
      subtitle: "최종 손해액·면책금·청구 대상 정보를 월 정산 데이터에 반영합니다.",
      status: "월 정산 반영 / 종결",
      hideDetail: true,
      body: "통합정액인 경우 고객은 익월 렌탈료에 추가 청구되며 사고담당자가 후청구를 입력합니다. 월 정산 데이터 반영 후 종결보고서에서 최종 종결처리합니다.",
      fields: [
        ["사고번호", "{id}"],
        ["고객명", "{name}"],
        ["차량번호", "{car}"],
        ["최종 손해액", "1,880,000원"],
        ["면책금", "400,000원"],
        ["청구대상", "공업사 지급 / 고객 면책금"],
        ["월정산 반영월", "2026.06"],
        ["후청구 필요 여부", "불필요 (개별정액)"],
        ["종결처리 여부", "종결처리 가능"]
      ],
      checks: ["월 정산 데이터에 사고번호·수리비·청구처가 반영되었는지 확인", "통합정액 후청구 대상인지 확인", "종결보고서 최종처리 가능 여부 확인"],
      completeLabel: "지급/정산 단계 완료",
      completeToast: "지급/정산 단계가 완료되었습니다.",
      completesClaim: true,
      nextIndex: null
    }
  ]
};

/* 접수 확인 + 입고/선견적 워크플로를 "접수·선견적" 4스텝으로 병합 (리치 모달 객체 재사용) */
ACTION_WORKFLOWS["접수·선견적"] = [
  ACTION_WORKFLOWS["접수 확인"][0],     // 계약정보 확인
  ACTION_WORKFLOWS["접수 확인"][1],     // 사고정보 확인 (단독/차대차)
  ACTION_WORKFLOWS["입고 / 선견적"][0], // 입고지 확인
  ACTION_WORKFLOWS["입고 / 선견적"][1]  // 선견적 확인
];
delete ACTION_WORKFLOWS["접수 확인"];
delete ACTION_WORKFLOWS["입고 / 선견적"];
ACTION_WORKFLOWS["접수·선견적"].forEach((a, i, arr) => { a.nextIndex = i < arr.length - 1 ? i + 1 : null; });
(() => {
  const last = ACTION_WORKFLOWS["접수·선견적"][3];
  last.completeLabel = "접수·선견적 확인 완료";
  last.completeToast = "접수·선견적 확인이 완료되었습니다.";
  last.completesClaim = true;
})();

const TYPE_ORDER = ["고객 미응답", "고객 연락요청", "계약 조사", "사진 미등록", "업체 미회신", "청구서 미수신(선견적만)", "입고/수리 지연", "재통화", "VOC", "교통", "렌트", "CS", "기타", "정산 대기"];

let activeStage = STAGES[0];    // 선택된 단계 (단일 선택)
let allTypes = true;            // 조치유형 전체 선택 여부
let checkedTypes = new Set();   // 체크된 조치유형 (allTypes=false일 때 적용)
let planFilter = "전체";        // 계획 필터: 전체 / 긴급 / 관심
let shopQuery = "";             // 정비공장명 검색
let searchQuery = "";           // 통합 검색어 (접수번호/차량명/차량번호/담당자/고객명)
let pageSize = 20;              // 페이지당 표시 건수
let currentPage = 1;            // 현재 페이지 (1-base)

const planState = {};           // 사고번호별 계획(별점): "긴급" | "관심" | undefined
const selectedRows = new Set(); // 체크된 행 (사고번호)

function planOf(id) { return planState[id]; }
function typesForStage(stage) { return TYPE_ORDER.filter(t => stageClaims(stage).some(c => c.actionType === t)); }

const actionProgress = {}; // 사고번호별 빠른 액션 팝업 진행 상태
const noticeSends = {}; // 사고번호별 알림톡/문자 발송 상태
const accidentEdits = {}; // 사고번호별 사고조사 수정값
const consultMemos = {}; // 사고번호별 상담 메모 작성중 임시값 (분류/다음연락/내용)
const consultLog = { // 사고번호별 남긴 상담 메모 이력 (최신순으로 추가)
  "CLM-2026-0001": [
    { at:"06.13 14:35", manager:"박지현", category:"통화 완료", text:"최초 사고접수 통화. 사고 경위 1차 확인, 운전자(배우자)와 피보험자 관계 추가 확인 필요 안내." },
    { at:"06.13 16:10", manager:"박지현", category:"정보 입력 안내", text:"운전자 정보 입력 링크 문자 발송. 미입력 시 익일 오전 재안내 예정." }
  ]
};
const DEFAULT_MESSAGE_TEMPLATES = [
  "사고접수 진행을 위해 운전자 정보와 사고경위 입력이 필요합니다. 오늘 18시까지 회신 부탁드립니다.",
  "차량 파손 부위 사진과 사고 현장 사진을 업로드해 주세요. 확인 후 담당자가 다음 절차를 안내드리겠습니다.",
  "접수된 사고 건의 추가 확인이 필요합니다. 가능하신 시간에 담당자에게 회신 부탁드립니다."
];
let messageTemplates = loadMessageTemplates();

function stageClaims(stage) { return CLAIMS.filter(c => c.flowStage === stage); }

/* 운전자 정보 유무 도형 (원=있음 / 삼각형=없음) */
function driverShape(c) {
  return c.driverInfo === false
    ? '<span class="dvi none" title="운전자 정보 미확보"></span>'
    : '<span class="dvi has" title="운전자 정보 확보"></span>';
}
/* 수리 승인 검토요청/수리승인 서브뱃지 */
function reviewBadge(c) {
  if (!c.reviewState) return "";
  const cls = c.reviewState === "수리승인" ? "rev-appr" : "rev-req";
  return `<span class="badge ${cls}">${c.reviewState}</span>`;
}
/* 면책금 개별/통합 구분 요약 행 */
function deductibleRow(c) {
  if (!c.deductible) return "";
  return `<div class="info-item"><div class="k">면책금 구분</div><div class="v">${c.deductibleType || "-"} · ${c.deductible}</div></div>`;
}

/* 상태값 → 색상 텍스트 클래스 */
const STATUS_CLASS = {
  "완료": "s-done", "반납": "s-done", "지급": "s-pay", "대여": "s-pay", "수취": "s-recv",
  "대기": "s-wait", "미완료": "s-wait", "미처리": "s-wait",
  "요청": "s-req", "주의": "s-req", "지연": "s-late", "오류": "s-late"
};
/* 상태 텍스트 셀 — 해당없음("-"/빈값)은 옅은 대시로 표시 */
function statusCell(v) {
  if (!v || v === "-") return '<span class="dash">-</span>';
  return `<span class="st ${STATUS_CLASS[v] || "s-wait"}">${v}</span>`;
}
/* 금액 셀 — 값 있으면 우측 정렬 숫자, 없으면 대시 (cls: est/pay 색상) */
function numCell(v, cls) {
  if (!v || v === "-") return '<span class="dash">-</span>';
  return `<span class="num ${cls || ""}">${v}</span>`;
}
function scopeClaims() {
  let list = stageClaims(activeStage);                       // 단계 (단일 선택)
  if (!allTypes) list = list.filter(c => checkedTypes.has(c.actionType)); // 조치유형 체크박스
  if (planFilter !== "전체") list = list.filter(c => planOf(c.id) === planFilter); // 계획(별점)
  const sq = shopQuery.trim().toLowerCase();                 // 정비공장명
  if (sq) list = list.filter(c => String(c.repairShop || "").toLowerCase().includes(sq));
  const q = searchQuery.trim().toLowerCase();                // 통합 검색어
  if (q) {
    list = list.filter(c => [c.id, c.carModel, c.car, c.manager, c.name, c.actionType]
      .some(v => String(v || "").toLowerCase().includes(q)));
  }
  return list;
}
function currentPageItems() {
  const items = scopeClaims();
  const start = (currentPage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
function openCount(list) { return list.filter(c => c.procStatus !== "완료").length; }

function loadMessageTemplates() {
  try {
    const saved = localStorage.getItem("claimMessageTemplates");
    const parsed = saved ? JSON.parse(saved) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_MESSAGE_TEMPLATES];
  } catch {
    return [...DEFAULT_MESSAGE_TEMPLATES];
  }
}
function saveMessageTemplates() {
  try {
    localStorage.setItem("claimMessageTemplates", JSON.stringify(messageTemplates));
  } catch {
    // 정적 데모에서는 저장 실패 시 현재 화면 상태만 유지한다.
  }
}
function getNoticeRows(claim, action) {
  const sent = noticeSends[claim.id] || {};
  return action.notices.map(item => {
    const override = sent[item.id];
    return override ? { ...item, ...override } : item;
  });
}

/* 단계별 통계 카드 — setProcStatus 에서도 호출하므로 함수명 renderFlow 유지 */
function renderFlow() {
  $("#statCards").innerHTML = STAGES.map((stage, i) => {
    const count = stageClaims(stage).length;
    const cls = "cl-stat" + (stage === activeStage ? " active" : "");
    const desc = `'${stage}' 단계로 전환해 해당 단계의 사고건만 조회합니다. (현재 ${count}건)`;
    return `
      <button class="${cls}" data-stage="${stage}" type="button" data-desc="${desc}">
        <div class="cs-head"><span class="cs-no">${i + 1}</span><span class="cs-name">${stage}</span></div>
        <div class="cs-count">${count}<small>건</small></div>
      </button>`;
  }).join("");
}

/* 조치유형 체크박스 (선택 단계 기준으로 동적 생성) */
function renderFilterChecks() {
  const types = typesForStage(activeStage);
  const allChecked = allTypes || (types.length > 0 && types.every(t => checkedTypes.has(t)));
  const boxes = types.map(t => `
    <label class="clf-check" data-desc="조치유형이 '${t}'인 건만 골라 표시합니다. (여러 유형 동시 선택 가능)">
      <input type="checkbox" data-type="${t}" ${(allTypes || checkedTypes.has(t)) ? "checked" : ""} />
      <span>${t}</span>
    </label>`).join("");
  $("#typeChecks").innerHTML = `
    <label class="clf-check clf-check-all" data-desc="이 단계의 모든 조치유형을 한 번에 선택하거나 해제합니다.">
      <input type="checkbox" id="typeAll" ${allChecked ? "checked" : ""} />
      <span>전체</span>
    </label>${boxes}`;
}

/* 필터 컨트롤 상태 동기화 (단계 select · 계획 버튼 · 체크박스) */
function renderFilters() {
  const sel = $("#stageSelect");
  if (sel && sel.value !== activeStage) sel.value = activeStage;
  $("#planFilter").querySelectorAll("button").forEach(b =>
    b.classList.toggle("active", b.dataset.plan === planFilter));
  renderFilterChecks();
}

/* 계약 정보확인 Y/N — 접수·선견적 단계에서 계약정보 확인이 남아있으면 N */
function contractConfirmed(c) {
  if (c.flowStage === "접수·선견적" && /계약/.test(c.status || "")) return false;
  return true;
}
/* Y/N 배지 셀 (동의/확인 여부) */
function ynCell(yes) {
  return yes
    ? '<span class="yn yn-y">Y</span>'
    : '<span class="yn yn-n">N</span>';
}

/* 리스트 표 고정 구조 — 14열 colgroup + 1줄 헤더 (체크·계획·순번 추가) */
const LIST_COLGROUP =
  '<colgroup>' +
  '<col style="width:3%"><col style="width:4%"><col style="width:4%">' +
  '<col style="width:12%"><col style="width:15%"><col style="width:9%"><col style="width:8%">' +
  '<col style="width:6%"><col style="width:6%"><col style="width:6%">' +
  '<col style="width:9%"><col style="width:9%">' +
  '<col style="width:5%"><col style="width:5%">' +
  '</colgroup>';
const LIST_THEAD =
  '<thead>' +
    '<tr>' +
      '<th class="col-check" data-desc="현재 페이지의 모든 건을 한 번에 선택하거나 해제합니다."><input type="checkbox" id="selectAll" aria-label="전체선택" /></th>' +
      '<th>계획</th><th>순번</th>' +
      '<th>접수번호</th><th>정비공장명</th><th>차량명</th><th>차량번호</th>' +
      '<th>정비 상태</th><th>부품 상태</th><th>승인 상태</th>' +
      '<th>추산</th><th>지급</th>' +
      '<th>운전자<br>정보동의</th><th>계약<br>정보확인</th>' +
    '</tr>' +
  '</thead>';

/* 계획(별점) 버튼 셀 */
function planStar(id) {
  const p = planOf(id);
  const cls = p === "긴급" ? "urgent" : p === "관심" ? "watch" : "none";
  const now = p ? `현재 '${p}'` : "현재 표시 없음";
  const desc = `계획(중요도) 표시를 바꿉니다. 클릭할 때마다 없음 → 긴급 → 관심 순으로 순환합니다. (${now})`;
  return `<button class="star-btn ${cls}" type="button" data-plan-toggle="${id}" data-desc="${desc}" aria-label="계획 표시">★</button>`;
}

/* 사고건 1건 = tbody.row (1행) */
function claimRowHtml(c, seq) {
  const w = c.work;
  const p = planOf(c.id);
  const planCls = p === "긴급" ? " plan-urgent" : p === "관심" ? " plan-watch" : "";
  const sel = c.id === selectedId ? " selected" : "";
  const checked = selectedRows.has(c.id) ? " checked" : "";
  return `
    <tbody class="row${sel}${planCls}" data-id="${c.id}">
      <tr>
        <td class="col-check" data-desc="이 사고건을 선택합니다. (일괄 처리·내보내기 대상으로 지정)"><input type="checkbox" class="row-check" data-check="${c.id}"${checked} aria-label="선택" /></td>
        <td class="col-plan">${planStar(c.id)}</td>
        <td class="cseq">${seq}</td>
        <td class="cid">${c.id}</td>
        <td class="cshop">${c.repairShop || "미입고"}</td>
        <td class="cmodel">${c.carModel}</td>
        <td class="cno">${c.car}</td>
        <td>${statusCell(w.repair)}</td>
        <td>${statusCell(w.part)}</td>
        <td>${statusCell(w.approval)}</td>
        <td>${numCell(w.estimate, "est")}</td>
        <td>${numCell(w.payment, "pay")}</td>
        <td>${ynCell(c.driverInfo !== false)}</td>
        <td>${ynCell(contractConfirmed(c))}</td>
      </tr>
    </tbody>`;
}

function syncSelectAll(pageItems) {
  const all = $("#selectAll");
  if (!all) return;
  all.checked = pageItems.length > 0 && pageItems.every(c => selectedRows.has(c.id));
}

function renderPager(pageCount, page) {
  const pager = $("#pager");
  if (!pager) return;
  if (pageCount <= 1) { pager.innerHTML = ""; return; }
  let nums = "";
  for (let p = 1; p <= pageCount; p++) {
    nums += `<button class="pg-num${p === page ? " active" : ""}" type="button" data-page="${p}" data-desc="${p}페이지로 이동합니다.">${p}</button>`;
  }
  pager.innerHTML =
    `<button class="pg-arrow" type="button" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""} aria-label="이전 페이지" data-desc="이전 페이지로 이동합니다.">‹</button>` +
    nums +
    `<button class="pg-arrow" type="button" data-page="${page + 1}" ${page >= pageCount ? "disabled" : ""} aria-label="다음 페이지" data-desc="다음 페이지로 이동합니다.">›</button>`;
}

function renderList() {
  const items = scopeClaims();
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (currentPage > pageCount) currentPage = pageCount;
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  $("#summaryLine").innerHTML =
    `<b>총 ${total}건</b><span class="cls-dim"> · 오늘 발생 18건 · 면책 3건 · 종결 12건 · 평균 리드타임 2.8일</span>`;

  const head = `<table class="claim-table cl-table">${LIST_COLGROUP}${LIST_THEAD}`;
  if (!total) {
    const q = searchQuery.trim();
    const msg = q
      ? `<b>'${escapeHtml(q)}'</b>에 해당하는 조치대상 건이 없습니다.`
      : `조건에 해당하는 조치대상 건이 없습니다.`;
    $("#rows").innerHTML = `${head}<tbody><tr><td colspan="14" class="rows-empty">${msg}</td></tr></tbody></table>`;
    renderPager(1, 1);
    return;
  }
  $("#rows").innerHTML = head + pageItems.map((c, i) => claimRowHtml(c, start + i + 1)).join("") + "</table>";
  renderPager(pageCount, currentPage);
  syncSelectAll(pageItems);
}

function fillActionTemplate(text, claim) {
  return String(text ?? "").replace(/\{(\w+)\}/g, (_, key) => claim[key] ?? "");
}

function openActionModal(claimId, actionIndex) {
  const claim = CLAIMS.find(x => x.id === claimId);
  const workflow = claim ? ACTION_WORKFLOWS[claim.flowStage] : null;
  if (!claim || !workflow || !workflow[actionIndex]) return;
  renderActionModal(claim, workflow, actionIndex);
}

function noticeStatusClass(status) {
  if (status === "발송완료") return "sent";
  if (status === "미발송" || status === "발송필요") return "need";
  return "wait";
}

function renderMessageRequestContent(claim, action) {
  const rows = getNoticeRows(claim, action).map(item => {
    const canSend = item.status !== "발송완료";
    return `
      <tr>
        <td>
          <div class="notice-name">${item.name}</div>
          <div class="notice-desc">${item.desc}</div>
        </td>
        <td>${item.channel}</td>
        <td><span class="notice-status ${noticeStatusClass(item.status)}">${item.status}</span></td>
        <td>${item.sentAt}</td>
        <td>${canSend ? `<button class="btn-mini primary" type="button" data-notice-send="${item.id}">발송</button>` : `<button class="btn-mini" type="button" disabled>완료</button>`}</td>
      </tr>`;
  }).join("");
  const defaultMessage = fillActionTemplate(action.defaultMessage || action.body, claim);
  const templateItems = messageTemplates.map((text, i) => `
    <div class="template-item">
      <div class="template-text">${escapeHtml(text)}</div>
      <button class="btn-mini" type="button" data-template-use="${i}">적용</button>
    </div>`).join("");

  return `
    <div class="message-layout">
      <div>
        <div class="modal-box" style="margin-bottom:12px">
          <div class="modal-box-title">사고접수 알림톡 발송 현황</div>
          <table class="notice-table">
            <thead>
              <tr><th>항목</th><th>채널</th><th>상태</th><th>발송시각</th><th>조치</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="modal-box">
          <div class="modal-box-title">자주 쓰는 템플릿</div>
          <div class="template-list" id="templateList">${templateItems}</div>
        </div>
      </div>
      <div class="phone-shell">
        <div class="phone-screen">
          <div class="phone-top">
            <div class="phone-contact">${claim.name} 고객</div>
            <div class="phone-number">010-3842-1907 · ${claim.id}</div>
          </div>
          <div class="channel-tabs">
            <button class="channel-btn active" type="button" data-channel="알림톡">알림톡</button>
            <button class="channel-btn" type="button" data-channel="문자">문자</button>
          </div>
          <div class="message-preview">
            <div class="bubble" id="messagePreview">${escapeHtml(defaultMessage)}</div>
            <textarea class="message-input" id="messageComposer">${escapeHtml(defaultMessage)}</textarea>
          </div>
          <div class="phone-actions">
            <button class="btn-mini" type="button" id="saveTemplateBtn">템플릿 저장</button>
            <button class="btn-mini primary" type="button" id="sendDirectMessageBtn">발송</button>
          </div>
        </div>
      </div>
    </div>`;
}

function bindMessageRequestHandlers(claim, action, workflow, actionIndex) {
  const root = $("#actionModalRoot");
  const composer = root.querySelector("#messageComposer");
  const preview = root.querySelector("#messagePreview");
  let selectedChannel = "알림톡";

  if (composer && preview) {
    composer.addEventListener("input", () => {
      preview.textContent = composer.value || "메시지 내용을 입력하세요.";
    });
  }
  root.querySelectorAll("[data-channel]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedChannel = btn.dataset.channel;
      root.querySelectorAll("[data-channel]").forEach(el => el.classList.toggle("active", el === btn));
    });
  });
  root.querySelectorAll("[data-notice-send]").forEach(btn => {
    btn.addEventListener("click", () => {
      const noticeId = btn.dataset.noticeSend;
      noticeSends[claim.id] = {
        ...(noticeSends[claim.id] || {}),
        [noticeId]: { status: "발송완료", sentAt: "방금" }
      };
      showToast(`${claim.id} ${btn.closest("tr").querySelector(".notice-name").textContent}을 발송했습니다.`);
      renderActionModal(claim, workflow, actionIndex);
    });
  });
  root.querySelectorAll("[data-template-use]").forEach(btn => {
    btn.addEventListener("click", () => {
      const template = messageTemplates[Number(btn.dataset.templateUse)];
      if (!template || !composer || !preview) return;
      composer.value = template;
      preview.textContent = template;
    });
  });
  root.querySelector("#saveTemplateBtn")?.addEventListener("click", () => {
    const text = composer?.value.trim();
    if (!text) {
      showToast("저장할 메시지를 입력하세요.");
      return;
    }
    if (!messageTemplates.includes(text)) {
      messageTemplates = [text, ...messageTemplates].slice(0, 8);
      saveMessageTemplates();
    }
    showToast("자주 쓰는 템플릿으로 저장했습니다.");
    renderActionModal(claim, workflow, actionIndex);
  });
  root.querySelector("#sendDirectMessageBtn")?.addEventListener("click", () => {
    const text = composer?.value.trim();
    if (!text) {
      showToast("발송할 메시지를 입력하세요.");
      return;
    }
    showToast(`${claim.name} 고객에게 ${selectedChannel}을 발송했습니다.`);
  });
}

function getAccidentGroups(claim, action) {
  const saved = accidentEdits[claim.id] || {};
  // 구버전(평면 fields) 호환: groups가 없으면 단일 그룹으로 감싼다.
  const groups = action.groups || [{ title: null, fields: action.fields || [] }];
  return groups.map(group => ({
    title: group.title,
    fields: group.fields.map(field => ({
      ...field,
      value: saved[field.key] ?? fillActionTemplate(field.value, claim)
    }))
  }));
}

function renderAccidentField(field) {
  const value = escapeHtml(field.value || "");
  let control = "";
  if (field.type === "textarea") {
    control = `<textarea class="accident-textarea" data-accident-field="${field.key}">${value}</textarea>`;
  } else if (field.type === "select") {
    const options = field.options.map(option => `<option value="${escapeHtml(option)}" ${option === field.value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
    control = `<select class="accident-select" data-accident-field="${field.key}">${options}</select>`;
  } else {
    control = `<input class="accident-input" data-accident-field="${field.key}" value="${value}" />`;
  }
  return `
      <div class="accident-field ${field.full ? "full" : ""}">
        <label>${field.label}</label>
        ${control}
        ${field.help ? `<div class="field-help">${field.help}</div>` : ""}
      </div>`;
}

function renderAccidentEditContent(claim, action) {
  const checks = action.checks.map(item => `
    <div class="check-item">
      <span class="check-dot">✓</span>
      <span>${item}</span>
    </div>`).join("");
  const groups = getAccidentGroups(claim, action).map(group => {
    const fields = group.fields.map(renderAccidentField).join("");
    const heading = group.title
      ? `<div class="accident-group-title">${group.title}</div>`
      : "";
    return `
      <div class="accident-group">
        ${heading}
        <div class="accident-form-grid">${fields}</div>
      </div>`;
  }).join("");

  return `
    <div class="accident-edit">
      <div class="modal-box accident-check">
        <div class="modal-box-title">완료 전 체크</div>
        <div class="check-list">${checks}</div>
      </div>
      <div class="modal-box">
        <div class="modal-box-title">사고 조사 입력 정보</div>
        <div class="accident-groups">${groups}</div>
      </div>
    </div>`;
}

function bindAccidentEditHandlers(claim) {
  const root = $("#actionModalRoot");
  root.querySelectorAll("[data-accident-field]").forEach(control => {
    control.addEventListener("input", () => {
      accidentEdits[claim.id] = {
        ...(accidentEdits[claim.id] || {}),
        [control.dataset.accidentField]: control.value
      };
    });
    control.addEventListener("change", () => {
      accidentEdits[claim.id] = {
        ...(accidentEdits[claim.id] || {}),
        [control.dataset.accidentField]: control.value
      };
    });
  });
}

function renderConsultMemoContent(claim, action) {
  const saved = consultMemos[claim.id] || {};
  const category = saved.category ?? action.categories[0];
  const nextContact = saved.nextContact ?? "";
  const text = saved.text ?? "";
  const categoryOptions = action.categories
    .map(o => `<option ${o === category ? "selected" : ""}>${escapeHtml(o)}</option>`).join("");
  const templates = action.templates
    .map((t, i) => `<button type="button" class="consult-chip" data-consult-template="${i}">${escapeHtml(t.label)}</button>`).join("");
  const checks = action.checks.map(item => `
    <div class="check-item">
      <span class="check-dot">✓</span>
      <span>${item}</span>
    </div>`).join("");
  const log = consultLog[claim.id] || [];
  const logItems = log.length
    ? log.slice().reverse().map(entry => `
        <div class="consult-log-item">
          <div class="cl-head">
            <span class="cl-cat">${escapeHtml(entry.category || "상담")}</span>
            <span class="cl-meta">${escapeHtml(entry.at)} · ${escapeHtml(entry.manager || "")}</span>
          </div>
          <div class="cl-text">${escapeHtml(entry.text)}</div>
        </div>`).join("")
    : `<div class="consult-log-empty">아직 남긴 상담 메모가 없습니다. 첫 상담 내용을 기록해 보세요.</div>`;

  return `
    <div class="consult-memo">
      <div class="modal-summary">
        <div class="modal-box soft">
          <div class="modal-box-title">상담 대상</div>
          <div class="detail-list">
            <div class="detail-item"><div class="k">고객명</div><div class="v">${claim.name}</div></div>
            <div class="detail-item"><div class="k">차량번호</div><div class="v">${claim.car}</div></div>
            <div class="detail-item"><div class="k">고객구분</div><div class="v">${claim.custType}</div></div>
            <div class="detail-item"><div class="k">담당자</div><div class="v">${claim.manager}</div></div>
          </div>
        </div>
        <div class="modal-box">
          <div class="modal-box-title">상담 분류</div>
          <div class="accident-form-grid">
            <div class="accident-field full">
              <label>상담 결과</label>
              <select class="accident-select" data-consult-field="category">${categoryOptions}</select>
            </div>
            <div class="accident-field full">
              <label>다음 연락 예정</label>
              <input class="accident-input" data-consult-field="nextContact" value="${escapeHtml(nextContact)}" placeholder="예: 06.14 14:00 재연락" />
            </div>
          </div>
        </div>
      </div>
      <div class="modal-box">
        <div class="modal-box-title">상담 메모</div>
        <div class="consult-templates">${templates}</div>
        <textarea class="accident-textarea consult-textarea" data-consult-field="text" placeholder="상담 내용을 입력하세요. (예: 고객 통화 완료, 사고경위 확인, 14시 재연락 예정)">${escapeHtml(text)}</textarea>
      </div>
      <div class="modal-box">
        <div class="modal-box-title">남긴 상담 이력 <span class="consult-log-count">${log.length}건</span></div>
        <div class="consult-log">${logItems}</div>
      </div>
      <div class="modal-box accident-check">
        <div class="modal-box-title">완료 전 체크</div>
        <div class="check-list">${checks}</div>
      </div>
    </div>`;
}

function bindConsultMemoHandlers(claim, action) {
  const root = $("#actionModalRoot");
  const save = (key, value) => {
    consultMemos[claim.id] = { ...(consultMemos[claim.id] || {}), [key]: value };
  };
  root.querySelectorAll("[data-consult-field]").forEach(control => {
    const handler = () => save(control.dataset.consultField, control.value);
    control.addEventListener("input", handler);
    control.addEventListener("change", handler);
  });
  const textarea = root.querySelector('[data-consult-field="text"]');
  root.querySelectorAll("[data-consult-template]").forEach(chip => {
    chip.addEventListener("click", () => {
      const tpl = action.templates[Number(chip.dataset.consultTemplate)];
      const current = textarea.value.trim();
      textarea.value = current ? `${current}\n${tpl.text}` : tpl.text;
      save("text", textarea.value);
      textarea.focus();
    });
  });
}

function renderScreenRefs(action) {
  if (!action.screenRefs || !action.screenRefs.length) return "";
  const cards = action.screenRefs.map(ref => `
      <div class="screen-ref-card">
        <div class="srf-head">
          <span class="srf-thumb" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 9h18M8 21h8M12 17v4"/></svg>
          </span>
          <div class="srf-title-wrap">
            <div class="srf-title">${escapeHtml(ref.title)}</div>
            ${ref.tag ? `<span class="srf-tag">${escapeHtml(ref.tag)}</span>` : ""}
          </div>
        </div>
        <div class="srf-desc">${escapeHtml(ref.desc)}</div>
      </div>`).join("");
  return `
      <div class="modal-box screen-refs">
        <div class="modal-box-title">화면캡처 참조 <span class="srf-hint">담당자가 확인할 SK전산 화면</span></div>
        <div class="screen-ref-grid">${cards}</div>
      </div>`;
}

function renderActionModal(claim, workflow, actionIndex) {
  const action = workflow[actionIndex];
  const completedIndex = actionProgress[claim.id] ?? -1;
  const root = $("#actionModalRoot");
  const steps = workflow.map((item, i) => {
    const cls = ["modal-step", i < actionIndex || i <= completedIndex ? "done" : "", i === actionIndex ? "current" : ""].join(" ");
    return `
      <div class="${cls}">
        <span class="ms-no">${i + 1}</span>
        <span class="ms-label">${item.label}</span>
      </div>`;
  }).join("");
  const detailItems = (action.fields || []).map(item => {
    const key = Array.isArray(item) ? item[0] : item.label;
    const value = Array.isArray(item) ? item[1] : item.value;
    return `
      <div class="detail-item">
        <div class="k">${key}</div>
        <div class="v">${fillActionTemplate(value, claim)}</div>
      </div>`;
  }).join("");
  const checks = action.checks.map(item => `
    <div class="check-item">
      <span class="check-dot">✓</span>
      <span>${item}</span>
    </div>`).join("");
  const nextLabel = action.completeLabel || (action.completesClaim ? "접수 확인 완료" : "처리완료");
  const detailSummary = action.hideDetail || action.accidentEdit ? "" : `
        <div class="modal-summary">
          <div class="modal-box soft">
            <div class="modal-box-title">${action.detailTitle || "상세 설명"}</div>
            <div class="modal-copy">${fillActionTemplate(action.body, claim)}</div>
          </div>
          <div class="modal-box">
            <div class="modal-box-title">처리 상태</div>
            <div class="detail-list">
              <div class="detail-item"><div class="k">액션 상태</div><div class="v">${action.status}</div></div>
              <div class="detail-item"><div class="k">현재 Flow</div><div class="v">${claim.flowStage}</div></div>
              <div class="detail-item"><div class="k">처리상태</div><div class="v">${claim.procStatus}</div></div>
              <div class="detail-item"><div class="k">경과시간</div><div class="v">${claim.elapsed}</div></div>
            </div>
          </div>
        </div>`;
  const infoSummaryClass = action.hideDetail ? "modal-summary info-wide" : "modal-summary";
  const standardContent = `
${detailSummary}
        <div class="${infoSummaryClass}">
          <div class="modal-box">
            <div class="modal-box-title">확인 정보</div>
            <div class="detail-list">${detailItems}</div>
          </div>
          <div class="modal-box">
            <div class="modal-box-title">완료 전 체크</div>
            <div class="check-list">${checks}</div>
          </div>
        </div>`;
  const modalContent = action.accidentEdit
    ? renderAccidentEditContent(claim, action)
    : action.messageRequest
      ? renderMessageRequestContent(claim, action)
      : action.consultMemo
        ? renderConsultMemoContent(claim, action)
        : standardContent;

  if (action.imagePanel) resetPanel("m");
  const hasImages = !!CLAIM_IMAGES[claim.id];

  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close></div>
    <section class="action-modal" role="dialog" aria-modal="true" aria-labelledby="actionModalTitle">
      <div class="modal-head">
        <div class="modal-title-wrap">
          <div class="modal-eyebrow">${claim.flowStage} 빠른 액션 · ${actionIndex + 1}/${workflow.length}</div>
          <h2 class="modal-title" id="actionModalTitle">${action.title}</h2>
          <div class="modal-sub">${claim.id} · ${claim.name} · ${claim.car}</div>
        </div>
        <button class="modal-img-btn" type="button" data-open-images title="${hasImages ? "" : "등록된 이미지 없음"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 17 4.5-4.5 3 3L16 11l4 4.5"/></svg>
          이미지${hasImages ? ` <span class="mib-cnt">${claimImageTotal(claim.id)}</span>` : ""}
        </button>
        <button class="modal-close" type="button" aria-label="팝업 닫기" data-modal-close>×</button>
      </div>
      <div class="modal-body">
        <div class="modal-steps">${steps}</div>
${modalContent}
${renderScreenRefs(action)}
${action.imagePanel ? renderImagePanelBox(claim) : ""}
      </div>
      <div class="modal-foot">
        <button class="btn-modal" type="button" data-action-prev ${actionIndex === 0 ? "disabled" : ""}>이전</button>
        <button class="btn-modal primary" type="button" data-action-complete>${nextLabel}</button>
      </div>
    </section>`;

  root.classList.add("open");
  root.setAttribute("aria-hidden", "false");
  root.querySelectorAll("[data-modal-close]").forEach(el => el.addEventListener("click", closeActionModal));
  root.querySelector("[data-action-prev]").addEventListener("click", () => {
    if (actionIndex > 0) renderActionModal(claim, workflow, actionIndex - 1);
  });
  root.querySelector("[data-action-complete]").addEventListener("click", () => completeActionModal(claim.id, actionIndex));
  root.querySelector("[data-open-images]").addEventListener("click", () => openImageViewer(claim));
  if (action.messageRequest) bindMessageRequestHandlers(claim, action, workflow, actionIndex);
  if (action.accidentEdit) bindAccidentEditHandlers(claim);
  if (action.consultMemo) bindConsultMemoHandlers(claim, action);
}

function completeActionModal(claimId, actionIndex) {
  const claim = CLAIMS.find(x => x.id === claimId);
  const workflow = claim ? ACTION_WORKFLOWS[claim.flowStage] : null;
  const action = workflow ? workflow[actionIndex] : null;
  if (!claim || !workflow || !action) return;

  actionProgress[claim.id] = Math.max(actionProgress[claim.id] ?? -1, actionIndex);

  // 상담 메모는 완료 시 이력에 적재하고 우측 패널 처리 메모와 동기화한다.
  if (action.consultMemo) {
    const memo = consultMemos[claim.id];
    if (memo && memo.text && memo.text.trim()) {
      const text = memo.text.trim();
      (consultLog[claim.id] = consultLog[claim.id] || []).push({
        at: formatNowStamp(),
        manager: claim.manager,
        category: memo.category || "상담",
        text
      });
      memos[claim.id] = text;
      consultMemos[claim.id] = {}; // 작성중 임시값 초기화
    }
  }

  showToast(action.completeToast || `${action.title} 처리가 완료되었습니다.`);

  if (action.nextIndex !== null) {
    renderActionModal(claim, workflow, action.nextIndex);
    return;
  }

  if (action.completesClaim) setProcStatus(claim.id, "완료");
  else if (action.setStatus) setProcStatus(claim.id, action.setStatus);
  closeActionModal();
}

function selectFirst() {
  const items = scopeClaims();
  selectedId = items.length ? items[0].id : null;
}

function renderAll() {
  renderFlow();       // 단계 통계 카드
  renderFilters();    // 필터 컨트롤 (단계·계획·조치유형)
  renderList();       // 리스트 + 페이지네이션
}

/* 단계 전환 (통계 카드 클릭 / 드롭다운) */
function setStage(stage) {
  if (!STAGES.includes(stage)) return;
  activeStage = stage;
  allTypes = true;                               // 단계 변경 시 조치유형 전체로 초기화
  checkedTypes = new Set(typesForStage(stage));
  currentPage = 1;
  selectFirst();
  renderAll();
}

$("#statCards").addEventListener("click", e => {
  const card = e.target.closest(".cl-stat");
  if (card) setStage(card.dataset.stage);
});
$("#stageSelect").addEventListener("change", e => setStage(e.target.value));

/* 조치유형 체크박스 */
$("#typeChecks").addEventListener("change", e => {
  const cb = e.target;
  if (cb.id === "typeAll") {
    allTypes = cb.checked;
    checkedTypes = cb.checked ? new Set(typesForStage(activeStage)) : new Set();
  } else if (cb.dataset.type) {
    if (allTypes) { checkedTypes = new Set(typesForStage(activeStage)); allTypes = false; }
    if (cb.checked) checkedTypes.add(cb.dataset.type);
    else checkedTypes.delete(cb.dataset.type);
    const types = typesForStage(activeStage);
    allTypes = types.length > 0 && types.every(t => checkedTypes.has(t));
  } else {
    return;
  }
  currentPage = 1;
  selectFirst();
  renderFilterChecks();
  renderList();
});

/* 계획(별점) 필터 */
$("#planFilter").addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  planFilter = btn.dataset.plan;
  currentPage = 1;
  selectFirst();
  renderFilters();
  renderList();
});

/* 정비공장명 · 검색어 (실시간) */
$("#shopInput").addEventListener("input", e => { shopQuery = e.target.value; currentPage = 1; renderList(); });
$("#searchInput").addEventListener("input", e => { searchQuery = e.target.value; currentPage = 1; renderList(); });
$("#searchInput").addEventListener("keydown", e => { if (e.key === "Enter") { currentPage = 1; renderList(); } });

/* 조회 / 초기화 */
$("#btnSearch").addEventListener("click", () => { currentPage = 1; selectFirst(); renderList(); });
$("#btnReset").addEventListener("click", () => {
  allTypes = true;
  checkedTypes = new Set(typesForStage(activeStage));
  planFilter = "전체";
  shopQuery = "";
  searchQuery = "";
  $("#shopInput").value = "";
  $("#searchInput").value = "";
  currentPage = 1;
  selectFirst();
  renderAll();
});

/* 페이지당 표시 건수 */
$("#pageSizeSelect").addEventListener("change", e => {
  pageSize = parseInt(e.target.value, 10) || 20;
  currentPage = 1;
  renderList();
});

/* 페이지네이션 */
$("#pager").addEventListener("click", e => {
  const btn = e.target.closest("button[data-page]");
  if (!btn || btn.disabled) return;
  const p = parseInt(btn.dataset.page, 10);
  if (!isNaN(p)) { currentPage = p; renderList(); }
});

/* 리스트 상호작용 — 전체선택 / 행 체크 / 별점 토글 / 행 클릭 */
$("#rows").addEventListener("click", e => {
  // 전체선택 (현재 페이지 기준)
  if (e.target.id === "selectAll") {
    currentPageItems().forEach(c => {
      if (e.target.checked) selectedRows.add(c.id);
      else selectedRows.delete(c.id);
    });
    renderList();
    return;
  }
  // 행 체크박스
  const rowCheck = e.target.closest(".row-check");
  if (rowCheck) {
    if (rowCheck.checked) selectedRows.add(rowCheck.dataset.check);
    else selectedRows.delete(rowCheck.dataset.check);
    syncSelectAll(currentPageItems());
    e.stopPropagation();
    return;
  }
  // 별점(계획) 토글: 없음 → 긴급 → 관심 → 없음
  const star = e.target.closest("[data-plan-toggle]");
  if (star) {
    const id = star.dataset.planToggle;
    const cur = planState[id];
    if (cur === "긴급") planState[id] = "관심";
    else if (cur === "관심") delete planState[id];
    else planState[id] = "긴급";
    if (planFilter !== "전체") selectFirst();
    renderList();
    e.stopPropagation();
    return;
  }
  // 행 클릭 → 해당 사고건 Smart접수지 열기
  const row = e.target.closest(".row");
  if (!row) return;
  selectedId = row.dataset.id;
  openIntake(row.dataset.id);
});


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

/* ===================== 초기화 ===================== */
(function initClaims() {
  // 계획(별점) 데모 시드 — 각 단계의 일부 건에 관심/긴급 표시
  STAGES.forEach(stage => {
    const items = stageClaims(stage);
    if (items[1]) planState[items[1].id] = "관심";
    if (items[3]) planState[items[3].id] = "긴급";
  });
  checkedTypes = new Set(typesForStage(activeStage));
  selectFirst();
  renderAll();
})();
