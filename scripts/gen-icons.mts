import sharp from "sharp";

const LOGO = "public/logo-v3.png";
const BG = "#14201A";

async function makeIcon(size: number, out: string, radiusRatio: number) {
  const radius = Math.round(size * radiusRatio);
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}"/>
     </svg>`
  );
  // Logo is 990x1088 (taller than wide) — fit to ~72% of icon height.
  const logoH = Math.round(size * 0.72);
  const logo = await sharp(LOGO).resize({ height: logoH }).toBuffer();
  const meta = await sharp(logo).metadata();
  const left = Math.round((size - (meta.width ?? logoH)) / 2);
  const top = Math.round((size - logoH) / 2);

  await sharp(bg)
    .png()
    .composite([{ input: logo, left, top }])
    .toFile(out);
  console.log(`${out} ${size}x${size}`);
}

await makeIcon(512, "src/app/icon.png", 0.18);
await makeIcon(180, "src/app/apple-icon.png", 0); // iOS rounds it itself
await makeIcon(48, "/tmp/favicon-48.png", 0.18);
