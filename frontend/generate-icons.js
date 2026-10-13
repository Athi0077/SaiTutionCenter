import Jimp from 'jimp';
import path from 'path';

async function generateIcons() {
  try {
    const icon192 = new Jimp(192, 192, '#4f46e5'); // Indigo color background
    const font192 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    icon192.print(font192, 40, 60, 'HW');
    await icon192.writeAsync(path.resolve('./public/pwa-192x192.png'));

    const icon512 = new Jimp(512, 512, '#4f46e5');
    const font512 = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
    icon512.print(font512, 160, 180, 'HW');
    await icon512.writeAsync(path.resolve('./public/pwa-512x512.png'));

    console.log('Icons generated successfully.');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
