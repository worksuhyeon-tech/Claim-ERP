"use strict";
const activeView = "images";

let imgSelectedClaimId = null;    // 이미지뷰에서 선택된 사고건
let imgActiveFolder = null;       // 현재 보고 있는 폴더
let imgSearch = "";               // 이미지뷰 사고건 검색어

function imgScopedClaims() {
  const q = imgSearch.trim().toLowerCase();
  let list = CLAIMS.filter(c => CLAIM_IMAGES[c.id]); // 이미지가 등록된 사고건만
  if (q) list = list.filter(c => [c.id, c.name, c.car, c.manager].some(v => String(v || "").toLowerCase().includes(q)));
  return list;
}

function renderImgClaimList() {
  const list = imgScopedClaims();
  if (!list.length) {
    $("#imgClaimList").innerHTML = `<div class="rows-empty">검색 결과가 없습니다.</div>`;
    return;
  }
  $("#imgClaimList").innerHTML = list.map(c => `
    <button type="button" class="img-claim ${c.id === imgSelectedClaimId ? "active" : ""}" data-img-claim="${c.id}">
      <div class="ic-top"><span class="ic-id">${c.id}</span><span class="ic-cnt">${claimImageTotal(c.id)}장</span></div>
      <div class="ic-sub">${c.name} · ${c.car} · ${c.flowStage}</div>
    </button>`).join("");
}

function renderImgMain() {
  const claim = CLAIMS.find(c => c.id === imgSelectedClaimId);
  if (!claim) {
    $("#imgMain").innerHTML = `<div class="img-empty">왼쪽에서 사고건을 선택하면<br/>해당 건의 사진·서류 폴더가 표시됩니다.</div>`;
    return;
  }
  if (!imgActiveFolder) imgActiveFolder = IMAGE_FOLDERS[0];

  const tabs = IMAGE_FOLDERS.map(f => {
    const cnt = folderImages(claim.id, f).length;
    const cls = ["folder-tab", f === imgActiveFolder ? "active" : "", cnt === 0 ? "empty" : ""].join(" ");
    return `<button type="button" class="${cls}" data-folder="${f}">${f}<span class="ft-cnt">${cnt}</span></button>`;
  }).join("");

  const imgs = folderImages(claim.id, imgActiveFolder);
  const kind = FOLDER_KIND[imgActiveFolder] === "doc" ? "doc" : "photo";
  const grid = imgs.length
    ? imgs.map(im => renderImageThumb(im, kind)).join("")
    : `<div class="image-empty-folder">'${imgActiveFolder}' 폴더에 등록된 자료가 없습니다.</div>`;

  const sel = imgSelected.size;
  const log = imageSendLog[claim.id] || [];
  const logHtml = log.length
    ? log.slice().reverse().map(e => `
        <div class="sendlog-item">
          <div class="sl-head">
            <span class="sl-mode ${e.mode === "MMS" ? "mms" : ""}">${e.mode === "MMS" ? "직접첨부" : "보안링크"}</span>
            <span class="sl-meta">${escapeHtml(e.at)} · ${escapeHtml(e.manager)} · ${e.channel}</span>
          </div>
          <div class="sl-names">${e.count}장 — ${escapeHtml(e.names.join(", "))}</div>
        </div>`).join("")
    : `<div class="sendlog-empty">아직 고객에게 발송한 이미지가 없습니다.</div>`;

  $("#imgMain").innerHTML = `
    <div class="img-head">
      <div class="ih-top">
        <span class="ih-id">${claim.id}</span>
        <span class="badge ${URGENCY_CLASS[claim.urgency]}">${claim.urgency}</span>
        <span class="badge ${PROC_CLASS[claim.procStatus]}">${claim.procStatus}</span>
      </div>
      <div class="ih-sub">${claim.name} · ${claim.car} · ${claim.custType} · 담당 ${claim.manager}</div>
    </div>
    <div class="folder-tabs">${tabs}</div>
    <div class="image-grid" id="imageGrid">${grid}</div>
    <div class="img-actionbar">
      <span class="ab-count">선택 <b>${sel}</b>장</span>
      <div class="ab-spacer"></div>
      <button type="button" class="ab-btn" id="imgZoomBtn" ${sel ? "" : "disabled"}>확대보기</button>
      <button type="button" class="ab-btn" id="imgDownloadBtn" ${sel ? "" : "disabled"}>다운로드</button>
      <button type="button" class="ab-btn primary" id="imgSendBtn" ${sel ? "" : "disabled"}>문자 발송</button>
    </div>
    <div class="img-sendlog">
      <div class="img-sendlog-title">고객 발송 이력</div>
      ${logHtml}
    </div>`;
}

function renderImageThumb(im, kind) { return thumbHtml(im, kind, imgSelected.has(im.id), "data-img"); }

function renderImageView() {
  // 첫 진입 시 첫 사고건 자동 선택
  if (!imgSelectedClaimId) {
    const first = imgScopedClaims()[0];
    imgSelectedClaimId = first ? first.id : null;
    imgActiveFolder = IMAGE_FOLDERS[0];
  }
  renderImgClaimList();
  renderImgMain();
}

function selectImgClaim(id) {
  imgSelectedClaimId = id;
  imgActiveFolder = IMAGE_FOLDERS[0];
  imgSelected.clear();
  renderImgClaimList();
  renderImgMain();
}

function applyImgSearch(value) {
  imgSearch = value;
  $("#imgSearchClear").hidden = !value.trim();
  // 검색 결과에 현재 선택 건이 없으면 첫 건으로 이동
  const list = imgScopedClaims();
  if (!list.some(c => c.id === imgSelectedClaimId)) {
    imgSelectedClaimId = list[0] ? list[0].id : null;
    imgActiveFolder = IMAGE_FOLDERS[0];
    imgSelected.clear();
  }
  renderImgClaimList();
  renderImgMain();
}

$("#imgSearchInput").addEventListener("input", e => applyImgSearch(e.target.value));
$("#imgSearchInput").addEventListener("keydown", e => {
  if (e.key === "Escape") { e.target.value = ""; applyImgSearch(""); e.target.blur(); }
});
$("#imgSearchClear").addEventListener("click", () => {
  const input = $("#imgSearchInput");
  input.value = "";
  applyImgSearch("");
  input.focus();
});

$("#imgClaimList").addEventListener("click", e => {
  const btn = e.target.closest("[data-img-claim]");
  if (!btn) return;
  selectImgClaim(btn.dataset.imgClaim);
});

$("#imgMain").addEventListener("click", e => {
  const folder = e.target.closest("[data-folder]");
  if (folder) { imgActiveFolder = folder.dataset.folder; imgSelected.clear(); renderImgMain(); return; }

  const thumb = e.target.closest("[data-img]");
  if (thumb) {
    const id = thumb.dataset.img;
    if (imgSelected.has(id)) imgSelected.delete(id); else imgSelected.add(id);
    renderImgMain();
    return;
  }

  if (e.target.closest("#imgSendBtn")) {
    const claim = CLAIMS.find(c => c.id === imgSelectedClaimId);
    const images = [...imgSelected].map(id => findImage(imgSelectedClaimId, id)).filter(Boolean);
    if (claim && images.length) openImageSendModal(claim, images);
    return;
  }
  if (e.target.closest("#imgDownloadBtn")) { showToast(`${imgSelected.size}장을 다운로드합니다. (데모)`); return; }
  if (e.target.closest("#imgZoomBtn")) { showToast(`선택한 ${imgSelected.size}장을 확대보기로 엽니다. (데모)`); return; }
});


/* ===================== 초기화 ===================== */
(function initImages() {
  renderImageView();
})();
