const fs = require('fs');
const path = require('path');

const distDir = 'dist';
const oldPath = path.join(distDir, 'exPlayer-win32-x64');
const newPath = path.join(distDir, 'exPlayer');

// フォルダの中身を空にするヘルパー関数 (ロック対策)
function cleanDirectoryContents(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      fs.rmSync(filePath, { recursive: true, force: true });
    } catch (e) {
      console.warn(`Failed to remove file/folder inside dist: ${filePath}. Retrying in 1s...`);
      // 1秒待ってリトライ
      const start = Date.now();
      while (Date.now() - start < 1000) {}
      fs.rmSync(filePath, { recursive: true, force: true });
    }
  }
}

// フォルダの中身を再帰的にコピーするヘルパー
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

try {
  // 1. 新しいフォルダの中身をクリーンアップ (殻は残すことでEPERMロックを回避)
  if (fs.existsSync(newPath)) {
    console.log(`Cleaning contents of ${newPath}...`);
    cleanDirectoryContents(newPath);
  } else {
    fs.mkdirSync(newPath, { recursive: true });
  }

  // 2. ビルドされたフォルダ (oldPath) の中身を newPath にコピー
  if (fs.existsSync(oldPath)) {
    console.log(`Copying files from ${oldPath} to ${newPath}...`);
    copyFolderSync(oldPath, newPath);
    
    // コピー完了後、元の oldPath フォルダは不要なので削除
    console.log(`Removing build source folder ${oldPath}...`);
    fs.rmSync(oldPath, { recursive: true, force: true });
    console.log(`Successfully moved build folder to: ${newPath}`);
  } else {
    console.warn(`Warning: Built folder not found at ${oldPath}`);
  }

  // 3. アプリのルートから icon.ico と icon.png をコピーして同梱 (上書き)
  const filesToCopy = ['icon.ico', 'icon.png'];
  filesToCopy.forEach(file => {
    const srcFile = path.join(__dirname, '..', file);
    const destFile = path.join(newPath, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied ${file} to ${newPath}`);
    } else {
      console.warn(`Warning: Asset file not found at ${srcFile}`);
    }
  });

  console.log('Post-build processing completed successfully!');
} catch (error) {
  console.error('Error during post-build processing:', error);
  process.exit(1);
}
