/** Crea el botón circular con foto de pez (mapa y spiderfy). */
export function createFishPinElement(options: {
  name: string;
  photoUrl: string;
  onClick: () => void;
  /** Mostrar nombre bajo la miniatura (spiderfy). */
  withLabel?: boolean;
  className?: string;
}): HTMLButtonElement {
  const { name, photoUrl, onClick, withLabel = false, className } = options;

  const button = document.createElement("button");
  button.type = "button";
  button.className = ["fish-pin", className].filter(Boolean).join(" ");
  button.setAttribute("aria-label", `Ver ficha de ${name}`);

  const frame = document.createElement("span");
  frame.className = "fish-pin-frame";

  const img = document.createElement("img");
  img.src = photoUrl;
  img.alt = name;
  img.draggable = false;
  img.loading = "eager";
  img.referrerPolicy = "no-referrer";
  img.className = "fish-pin-img";

  frame.append(img);
  button.append(frame);

  if (withLabel) {
    const label = document.createElement("span");
    label.className = "fish-pin-name";
    label.textContent = name;
    button.append(label);
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

  return button;
}
