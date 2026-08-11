const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'assets', 'thumbar');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 16x16 ピクセルのシンプルな白アイコン (Base64 PNG)
const icons = {
  'prev.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4y2NgGAWjYBQMFPifgYHhPwNxg/8MzA0MDL8ZGBj/ExPApADdAZDdf/9B5EEy2DXjUwAyG2gASAZDEB2A9IIMIMmA7gYmRBrAZQCy5WwMDL8JGMKAIQcwoaFjFAwYAAA4RSEgK5FkYwAAAABJRU5ErkJggg==',
  'play.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPklEQVQ4y2NgGAWjYBSMAurBfwbGf/9BGH0T3QG4tDAwMP4D0Qxs8v///w9j41IDMgBqAEbH0EE+pWIBLAAAl3EnIC5T8rIAAAAASUVORK5CYII=',
  'pause.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAJElEQVQ4y2NgGAWjYBSMgsED/zMwmBsg0f+J8QMhRjMh8aBgFAAAiicJ61yU5k8AAAAASUVORK5CYII=',
  'next.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZ0ULEQVQ4y2NgGAWjYBQMFPifgYHhPwNxg/8MzA0MDL8ZGBj/ExPApADdAZDdf/9B5EEy2DXjUwAyG2gASAZDEB2A9IIMIMmA7gYmRBrAZQCy5WwMDL8JGMKAIQcwoaFjFAwYAAA4RSEgK5FkYwAAAABJRU5ErkJggg=='
};

for (const [filename, base64Str] of Object.entries(icons)) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64Str, 'base64'));
  console.log(`Created ${filename}`);
}
