const sharp = require('sharp')

const svgBuffer = Buffer.from(`<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#0F172A"/>
  <polygon points="58,12 32,52 52,52 36,88 68,44 48,44 60,12" fill="white"/>
</svg>`)

async function generate() {
  await sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png')
  await sharp(svgBuffer).resize(192, 192).png().toFile('public/icon-192.png')
  await sharp(svgBuffer).resize(512, 512).png().toFile('public/icon-512.png')
  await sharp(svgBuffer).resize(32, 32).png().toFile('public/favicon.png')
  console.log('All icons generated!')
}

generate()
