// The last-N winning numbers. Pure decoration - it never feeds a calculation.

import { colourOf } from "../domain/wheel.js";

export function renderHistory(el, numbers) {
  if (numbers.length === 0) {
    el.replaceChildren();
    return;
  }
  el.replaceChildren(
    ...numbers.map((n) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.dataset.colour = colourOf(n);
      chip.style.background = `var(--${colourOf(n)})`;
      chip.textContent = String(n);
      return chip;
    }),
  );
}
