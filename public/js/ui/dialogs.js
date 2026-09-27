// Promise-based confirmation. Kept out of domain/ on purpose: round.js stays
// synchronous and DOM-free, and the tests never have to stub a prompt.

let els = null;
let resolveCurrent = null;

export function initDialogs() {
  els = {
    modal: document.getElementById("modal"),
    text: document.getElementById("modal-text"),
    ok: document.getElementById("modal-ok"),
    cancel: document.getElementById("modal-cancel"),
  };
  els.ok.addEventListener("click", () => close(true));
  els.cancel.addEventListener("click", () => close(false));
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) close(false);
  });
  document.addEventListener("keydown", (e) => {
    if (!els.modal.hidden && e.key === "Escape") close(false);
  });
}

function close(result) {
  if (!resolveCurrent) return;
  els.modal.hidden = true;
  const resolve = resolveCurrent;
  resolveCurrent = null;
  resolve(result);
}

export function confirmAction(message, okLabel = "Weiter") {
  if (resolveCurrent) close(false);
  return new Promise((resolve) => {
    resolveCurrent = resolve;
    els.text.textContent = message;
    els.ok.textContent = okLabel;
    els.modal.hidden = false;
    els.ok.focus();
  });
}
