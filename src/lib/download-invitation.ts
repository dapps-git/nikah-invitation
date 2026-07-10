"use client";

type StyleSnapshot = {
  el: HTMLElement;
  transform: string;
  opacity: string;
};

function prepareElementForCapture(element: HTMLElement): () => void {
  const snapshots: StyleSnapshot[] = [];
  const nodes = [element, ...element.querySelectorAll("*")];

  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;

    snapshots.push({
      el: node,
      transform: node.style.transform,
      opacity: node.style.opacity,
    });
    node.style.transform = "none";
    if (node.style.opacity && node.style.opacity !== "1") {
      node.style.opacity = "1";
    }
  }

  // Flatten couple-name-initial spans so the letter gap disappears in capture
  element.querySelectorAll(".couple-name-initial").forEach((span) => {
    if (span instanceof HTMLElement) {
      span.style.display = "inline";
      span.style.marginRight = "0";
    }
  });

  return () => {
    for (const { el, transform, opacity } of snapshots) {
      el.style.transform = transform;
      el.style.opacity = opacity;
    }
    element.querySelectorAll(".couple-name-initial").forEach((span) => {
      if (span instanceof HTMLElement) {
        span.style.display = "";
        span.style.marginRight = "";
      }
    });
  };
}

function hideExportExcludedElements(element: HTMLElement): () => void {
  const hidden: HTMLElement[] = [];

  element.querySelectorAll("[data-export-hide]").forEach((node) => {
    if (node instanceof HTMLElement) {
      hidden.push(node);
      node.style.visibility = "hidden";
    }
  });

  return () => {
    for (const el of hidden) {
      el.style.visibility = "";
    }
  };
}

/** Fetch a Google Font CSS URL and inline all font files as base64 data URIs */
async function fetchFontAsDataUri(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const css = await response.text();
    const fontUrls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map(
      (m) => m[1]
    );
    let resolvedCss = css;
    for (const fontUrl of fontUrls) {
      try {
        const fontResp = await fetch(fontUrl);
        const fontBuf = await fontResp.arrayBuffer();
        const base64 = btoa(
          String.fromCharCode(...new Uint8Array(fontBuf))
        );
        const mime = fontUrl.endsWith(".woff2") ? "font/woff2" : "font/woff";
        resolvedCss = resolvedCss.replace(
          `url(${fontUrl})`,
          `url(data:${mime};base64,${base64})`
        );
      } catch {
        // skip individual font file failures silently
      }
    }
    return resolvedCss;
  } catch {
    return "";
  }
}

export async function downloadInvitationCard(): Promise<void> {
  const element = document.getElementById("invitation-card");
  if (!element) {
    console.warn("Invitation card element not found");
    return;
  }

  const { toPng } = await import("html-to-image");

  // Pre-fetch and embed fonts so they render correctly on mobile captures
  const [greatVibesCss, cormorantCss] = await Promise.all([
    fetchFontAsDataUri(
      "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"
    ),
    fetchFontAsDataUri(
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap"
    ),
  ]);

  // Inject base64 fonts into a temporary <style> inside the capture element
  const styleTag = document.createElement("style");
  styleTag.textContent = greatVibesCss + "\n" + cormorantCss;
  element.appendChild(styleTag);

  const restoreStyles = prepareElementForCapture(element);
  const restoreVisibility = hideExportExcludedElements(element);

  try {
    await document.fonts.ready;
    // Give fonts a moment to apply after injection
    await new Promise((r) => setTimeout(r, 300));

    const width = element.offsetWidth;
    const height = element.scrollHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    const dataUrl = await toPng(element, {
      width,
      height,
      canvasWidth: width * dpr,
      canvasHeight: height * dpr,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor: "#FFFDF9",
      style: {
        margin: "0",
        transform: "none",
        width: `${width}px`,
        maxWidth: "none",
      },
      filter: (node) =>
        !(node instanceof HTMLElement && node.dataset.exportHide !== undefined),
    });

    const link = document.createElement("a");
    link.download = "nikah-invitation.png";
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Failed to download invitation card:", error);
  } finally {
    element.removeChild(styleTag);
    restoreVisibility();
    restoreStyles();
  }
}
