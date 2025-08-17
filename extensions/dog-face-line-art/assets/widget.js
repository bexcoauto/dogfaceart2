// Dog Face Line Art — Theme App Extension Widget (client-side)
console.log("Dog Line Art widget v8 (proxy=dogfaceart3 + tunnel fallback)");

// Current production URL - fallback if the store proxy isn't available
const DDL_BASE = "https://dogfaceart2.onrender.com";

// Compress image client-side to stay under App Proxy limits (~1MB safe)
async function compressImageIfNeeded(file) {
  const SAFE_BYTES = 900 * 1024; // ~900KB
  if (!file || file.size <= SAFE_BYTES) return file;
  try {
    let bitmap;
    if ("createImageBitmap" in window) {
      bitmap = await createImageBitmap(file);
    } else {
      const el = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      bitmap = el;
    }
    const maxW = 1280, maxH = 1280;
    const ratio = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], (file.name || "upload") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // If anything fails, just send the original file
  }
}

// Try storefront App Proxy first (same-origin), then fall back to direct tunnel (CORS)
async function postWithFallback(proxyPath, tunnelPath, fd) {
  // 1) Same-origin App Proxy (no CORS)
  try {
    const url = `${proxyPath}?t=${Date.now()}`;
    const resp = await fetch(url, { method: "POST", body: fd });
    const text = await resp.text();
    console.log("[DDL] POST-proxy", url, resp.status, text.slice(0, 200));
    try {
      const data = JSON.parse(text);
      if (resp.ok && data) return data;
    } catch {}
    // continue to tunnel
  } catch {}
  // 2) Direct tunnel (CORS)
  try {
    const url = `${DDL_BASE}${tunnelPath}?t=${Date.now()}`;
    const resp = await fetch(url, { method: "POST", body: fd, mode: "cors" });
    const text = await resp.text();
    console.log("[DDL] POST-tunnel", url, resp.status, text.slice(0, 200));
    const data = JSON.parse(text);
    if (!resp.ok) throw new Error(data?.error || text.slice(0, 120));
    return data;
  } catch (e) {
    console.warn("postWithFallback failed:", e);
    throw new Error("All routes failed (proxy and tunnel).");
  }
}

(function () {
  function initBlock(root) {
    if (!root || root.dataset.ddlInited === "1") return;
    root.dataset.ddlInited = "1";

    const drop = root.querySelector(".ddl-drop");
    const fileInput = root.querySelector(".ddl-file");
    const actions = root.querySelector(".ddl-actions");
    const btnGen = root.querySelector(".ddl-generate");
    const btnRegen = root.querySelector(".ddl-regenerate");
    const preview = root.querySelector(".ddl-preview");
    const img = root.querySelector(".ddl-img");
    const btnApprove = root.querySelector(".ddl-approve");
    const status = root.querySelector(".ddl-status");

    let fileBlob = null;
    let regenLeft = 3;
    let finalB64 = null;

    function setStatus(t) { if (status) status.textContent = t || ""; }
    function show(el, yes) { if (el) el.hidden = !yes; }

    function onFiles(files) {
      if (!files || !files[0]) return;
      const f = files[0];
      if (f.size > 15 * 1024 * 1024) { setStatus("File too large (max 15MB)."); return; }
      fileBlob = f;
      setStatus('Ready. Click "Generate preview".');
      show(actions, true);
      if (btnGen) btnGen.disabled = false;
    }

    function pickFile() { if (fileInput) fileInput.click(); }

    // Drag & drop + click
    if (drop) {
      drop.addEventListener("click", pickFile);
      drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.style.background = "#f0f0f0"; });
      drop.addEventListener("dragleave", () => { drop.style.background = ""; });
      drop.addEventListener("drop", (e) => { e.preventDefault(); drop.style.background = ""; onFiles(e.dataTransfer.files); });
    }
    if (fileInput) fileInput.addEventListener("change", (e) => onFiles(e.target.files));

    async function callPreview() {
      if (!fileBlob) return;
      setStatus("Generating preview…");
      if (btnGen) btnGen.disabled = true;
      try {
        const sendFile = await compressImageIfNeeded(fileBlob);
        const fd = new FormData(); fd.append("image", sendFile);
        const data = await postWithFallback("/apps/dogart/preview", "/apps/dogart/preview", fd);
        finalB64 = data.previewB64;
        if (img) img.src = `data:image/png;base64,${finalB64}`;
        show(preview, true);
        regenLeft -= 1;
        if (btnRegen && regenLeft <= 0) btnRegen.disabled = true;
        setStatus("Preview ready. If you like it, click Approve.");
      } catch (err) {
        setStatus(String(err.message || err));
        if (btnGen) btnGen.disabled = false;
      }
    }

    if (btnGen) btnGen.addEventListener("click", callPreview);
    if (btnRegen) btnRegen.addEventListener("click", callPreview);

    async function approve() {
      if (!finalB64) return;
      setStatus("Saving approved art…");
      try {
        const fd = new FormData(); fd.append("finalB64", finalB64);
        const data = await postWithFallback("/apps/dogart/finalize", "/apps/dogart/finalize", fd);
        if (!data.artUrl) throw new Error(data.error || "Could not save art. Try again.");

        setStatus("Approved. Adding to cart…");
        const form = document.querySelector('form[action^="/cart/add" i], product-form form');
        if (!form) { setStatus("Could not find product form."); return; }

        const props = {
          'properties[approved]': 'true',
          'properties[art_url]': data.artUrl,
        };
        Object.entries(props).forEach(([k, v]) => {
          const input = document.createElement("input");
          input.type = "hidden"; input.name = k; input.value = v;
          form.appendChild(input);
        });
        form.submit();
      } catch (err) {
        setStatus(String(err.message || err));
      }
    }

    if (btnApprove) btnApprove.addEventListener("click", approve);

    console.log("Dog Line Art: bound");
  }

  function bindAll(root = document) {
    root.querySelectorAll(".ddl-art-block").forEach(initBlock);
  }

  // Run on initial load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => bindAll());
  } else {
    bindAll();
  }

  // Re-bind when Shopify re-renders sections/blocks in the editor
  document.addEventListener("shopify:section:load", (e) => bindAll(e.target));
  document.addEventListener("shopify:section:select", (e) => bindAll(e.target));
  document.addEventListener("shopify:block:select", (e) => bindAll(e.target));
})();