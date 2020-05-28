const Jimp = require('jimp');
const Frame = require('canvas-to-buffer');
const Canvas = require('canvas');

const { Image } = Canvas;

const drawText = (params, ctx) => {
  const { text, x, y } = params;
  ctx.font = '30px Arial';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
};
const makeImage = (coverImage, params) => {
  const canvas = new Canvas.Canvas(coverImage.width, coverImage.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(coverImage, 0, 0, coverImage.width, coverImage.height);
  params.forEach((item) => {
    const { text, x, y } = item;
    drawText({ text, x, y }, ctx);
  });
  const frame = new Frame(canvas);
  return frame.toBuffer();
};
const photoUser = (photo) => Jimp.read(photo)
  .then(async (image) => {
    image
      .resize(115, 115)
      .circle();
    return image;
  });
const imgGen = (photoCover, params) => Jimp.read(photoCover)
  .then(async (image) => {
    const coverParams = [];
    for (const item of params) {
      const {
        photo, x, y, text,
      } = item;
      const profile = await photoUser(photo);
      coverParams.push({
        text,
        x: x + 60,
        y: y + 180,
      });
      image.composite(profile, x, y);
    }
    const img = await image.getBufferAsync('image/png');
    const imgCanvas = new Image();
    imgCanvas.src = img;
    return makeImage(imgCanvas, coverParams);
  });


module.exports = imgGen;
