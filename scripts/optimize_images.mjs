// =============================================================
// 画像最適化スクリプト — もらえるお金ナビ
// 実行: node scripts/optimize_images.mjs
// 参照されている画像だけをWebP/縮小PNGに変換する（元PNGは残す）
// =============================================================
import sharp from 'sharp';
import { statSync } from 'fs';

const jobs = [
  // 地域アイコン: 表示48px → 144px(3x) WebPで十分
  ...['region-kanto', 'region-tohoku', 'region-chubu', 'region-kinki', 'region-chugoku-shikoku', 'region-kyushu-okinawa'].map(n => ({
    src: `public/images/icons/${n}.png`,
    out: `public/images/icons/${n}.webp`,
    width: 144, format: 'webp', quality: 82,
  })),
  // アプリアイコン: ヘッダー32px表示 + favicon用
  { src: 'public/images/icons/app-icon.png', out: 'public/images/icons/app-icon-192.png', width: 192, format: 'png' },
  { src: 'public/images/icons/app-icon.png', out: 'public/images/icons/app-icon.webp', width: 192, format: 'webp', quality: 85 },
  // OGPシェアカード: 1200px幅・JPEG（SNSクローラ互換性重視）
  { src: 'public/images/illustrations/ogp-share-card.png', out: 'public/images/illustrations/ogp-share-card.jpg', width: 1200, format: 'jpeg', quality: 82 },
];

for (const j of jobs) {
  let img = sharp(j.src).resize({ width: j.width, withoutEnlargement: true });
  if (j.format === 'webp') img = img.webp({ quality: j.quality });
  if (j.format === 'jpeg') img = img.flatten({ background: '#ffffff' }).jpeg({ quality: j.quality, mozjpeg: true });
  if (j.format === 'png') img = img.png({ compressionLevel: 9 });
  await img.toFile(j.out);
  const before = (statSync(j.src).size / 1024).toFixed(0);
  const after = (statSync(j.out).size / 1024).toFixed(0);
  console.log(`${j.out}  ${before}KB -> ${after}KB`);
}
console.log('完了');
