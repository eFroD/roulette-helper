// Fullscreen toggle.
//
// Unlike Wake Lock and service workers, the Fullscreen API is NOT gated on a
// secure context, so it works on the real LAN-HTTP deployment. It does need a
// user gesture, which is why this is a button and never an automatic call.

export function initFullscreen(button) {
  if (!document.documentElement.requestFullscreen) {
    button.hidden = true; // iPhone Safari, notably
    return;
  }
  button.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch (err) {
      console.warn("Fullscreen refused:", err?.name ?? err);
    }
  });
}
