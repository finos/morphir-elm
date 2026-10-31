import "@shoelace-style/shoelace/dist/components/details/details.js";
import theme from "@shoelace-style/shoelace/dist/themes/light.css" with { type: "text" };

const STYLE_ID = "morphir-visualize-shoelace-theme";

/** Shoelace components read their design tokens from the document; inject them once. */
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = theme;
  document.head.append(style);
}
