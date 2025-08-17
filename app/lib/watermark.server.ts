import sharp from "sharp";

export async function watermarkDiagonal(
  input: Buffer,
  text = "DillyDallyDog.com • PREVIEW"
) {
  const img = sharp(input).ensureAlpha();
  const meta = await img.metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;
  const fontSize = Math.round(Math.min(w, h) * 0.08);

  const svg = `<?xml version='1.0'?>
  <svg width='${w}' height='${h}' xmlns='http://www.w3.org/2000/svg'>
    <g transform='translate(${w/2}, ${h/2}) rotate(-30)'>
      <text x='0' y='0' text-anchor='middle' dominant-baseline='central'
        style='font-family: sans-serif; font-size: ${fontSize}px; fill: rgba(0,0,0,0.35);'>${text}</text>
    </g>
  </svg>`;

  return await img.composite([{ input: Buffer.from(svg) }]).png().toBuffer();
}
