import sharp from "sharp";

// 1200x630 link-preview card: hero photo, dark overlay, logo + wordmark.
const W = 1200, H = 630;

// Hero is 1584x672 (2.36:1); OG is 1.9:1 — resize to cover and center-crop.
const photo = await sharp("public/hero-course.jpg")
  .resize(W, H, { fit: "cover", position: "centre" })
  .toBuffer();

const overlay = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="rgba(10,13,12,0.55)"/>
         <stop offset="55%" stop-color="rgba(10,13,12,0.45)"/>
         <stop offset="100%" stop-color="rgba(10,13,12,0.75)"/>
       </linearGradient>
     </defs>
     <rect width="${W}" height="${H}" fill="url(#d)"/>
     <text x="50%" y="392" text-anchor="middle"
       font-family="Georgia, 'Playfair Display', serif" font-weight="bold"
       font-size="92" letter-spacing="14" fill="#F3F4F6">JUICE TOUR</text>
     <text x="50%" y="448" text-anchor="middle"
       font-family="Helvetica, Arial, sans-serif" font-weight="500"
       font-size="26" letter-spacing="6" fill="#D4AF37">FANTASY GOLF FOR THE MAJORS</text>
   </svg>`
);

const logo = await sharp("public/logo-v3.png").resize({ height: 190 }).toBuffer();
const logoMeta = await sharp(logo).metadata();

await sharp(photo)
  .composite([
    { input: overlay, left: 0, top: 0 },
    { input: logo, left: Math.round((W - (logoMeta.width ?? 173)) / 2), top: 88 },
  ])
  .jpeg({ quality: 88 })
  .toFile("public/og.jpg");
console.log("og.jpg done");
