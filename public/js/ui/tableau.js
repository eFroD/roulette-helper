// Builds the betting surface once at startup from the field catalogue.
// Nothing here changes after build; render.js only updates state attributes.

import { BET_FIELDS, fieldById } from "../domain/wheel.js";

function cell(field, extraClass = "") {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `cell ${extraClass}`.trim();
  el.dataset.fieldId = field.id;
  if (field.colour) el.dataset.colour = field.colour;
  el.dataset.state = "neutral";

  const label = document.createElement("span");
  label.className = "cell-label";
  label.textContent = field.label;
  el.append(label);

  const taps = document.createElement("span");
  taps.className = "taps";
  taps.hidden = true;
  el.append(taps);
  return el;
}

export function buildTableau({ tableau, dozens, outside }) {
  tableau.replaceChildren();
  dozens.replaceChildren();
  outside.replaceChildren();

  // Zero spans all three rows on the left, as on a real table.
  tableau.append(cell(fieldById("n0"), "zero"));

  // Rows run 3,6..36 / 2,5..35 / 1,4..34 - i.e. column 3, then 2, then 1.
  for (const offset of [3, 2, 1]) {
    for (let n = offset; n <= 36; n += 3) tableau.append(cell(fieldById(`n${n}`)));
    tableau.append(cell(fieldById(`col${offset}`), "colbtn outside"));
  }

  for (const id of ["dozen1", "dozen2", "dozen3"]) dozens.append(cell(fieldById(id), "outside"));
  dozens.classList.add("dozens");

  for (const id of ["low", "even", "red", "black", "odd", "high"]) {
    outside.append(cell(fieldById(id), "outside"));
  }

  const byId = new Map();
  for (const el of [tableau, dozens, outside].flatMap((c) => [...c.children])) {
    byId.set(el.dataset.fieldId, el);
  }
  if (byId.size !== BET_FIELDS.length) {
    console.error(`Tableau built ${byId.size} fields, expected ${BET_FIELDS.length}`);
  }
  return byId;
}
