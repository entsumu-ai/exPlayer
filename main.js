const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { exec } = require('child_process');

let mainWindow;
let startFilePath = null;

// サポートする音楽ファイルの拡張子
const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.mid', '.midi'];

// 起動引数のパース
function parseFilePathFromArgs(argv) {
  for (const arg of argv) {
    if (typeof arg === 'string' && !arg.startsWith('-')) {
      const ext = path.extname(arg).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        try {
          if (fs.existsSync(arg)) {
            return path.resolve(arg);
          }
        } catch (e) {
          // 無視
        }
      }
    }
  }
  return null;
}

// 最初の起動引数を取得
startFilePath = parseFilePathFromArgs(process.argv);

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      
      const filePath = parseFilePathFromArgs(commandLine);
      if (filePath) {
        // レンダラーが準備できているかを考慮して少し待つか、または直接送る
        mainWindow.webContents.send('open-file', filePath);
      }
    }
  });
}

// 'media://' プロトコルを特権スキームとして登録
// これにより、フロントエンドの <audio> や fetch() でローカルファイルを再生・読み込み可能にします
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { bypassCSP: true, stream: true, supportFetchAPI: true, corsEnabled: true } }
]);

const stateFilePath = path.join(app.getPath('userData'), 'window-state.json');
let windowState = { 
  width: 1200, 
  height: 800, 
  x: undefined, 
  y: undefined,
  isCompact: false,
  compactWidth: 360,
  compactX: undefined,
  compactY: undefined,
  alwaysOnTop: false
};
try {
  if (fs.existsSync(stateFilePath)) {
    windowState = { ...windowState, ...JSON.parse(fs.readFileSync(stateFilePath, 'utf8')) };
  }
} catch (e) {
  console.error('Failed to load window state:', e);
}

function createWindow() {
  const isCompact = windowState.isCompact;
  const initialWidth = isCompact ? (windowState.compactWidth || 360) : (windowState.width || 1200);
  const initialHeight = isCompact ? 100 : (windowState.height || 800);
  const initialX = isCompact ? windowState.compactX : windowState.x;
  const initialY = isCompact ? windowState.compactY : windowState.y;

  mainWindow = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    x: initialX,
    y: initialY,
    minWidth: 320,
    minHeight: 100, // コンパクトモードに対応するため制限を緩和
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
    alwaysOnTop: windowState.alwaysOnTop || false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "exPlayer",
    autoHideMenuBar: true
  });

  if (isCompact) {
    mainWindow.setMinimumSize(320, 100);
    mainWindow.setMaximumSize(10000, 100);
  }

  // ウィンドウクローズ時に状態を保存
  mainWindow.on('close', () => {
    try {
      const bounds = mainWindow.getBounds();
      const isCurrentlyCompact = windowState.isCompact;
      windowState.alwaysOnTop = mainWindow.isAlwaysOnTop();
      if (isCurrentlyCompact) {
        windowState.isCompact = true;
        windowState.compactWidth = bounds.width;
        windowState.compactX = bounds.x;
        windowState.compactY = bounds.y;
      } else {
        windowState.isCompact = false;
        windowState.width = bounds.width;
        windowState.height = bounds.height;
        windowState.x = bounds.x;
        windowState.y = bounds.y;
      }
      fs.writeFileSync(stateFilePath, JSON.stringify(windowState), 'utf8');
    } catch (e) {
      console.error('Failed to save window state:', e);
    }
  });

  // ウィンドウのリサイズや移動イベントを監視して、状態を常に最新に保つ
  const updateWindowState = () => {
    if (!mainWindow) return;
    try {
      const bounds = mainWindow.getBounds();
      if (!bounds || isNaN(bounds.width) || isNaN(bounds.height)) return;
      
      if (windowState.isCompact) {
        windowState.compactWidth = bounds.width;
        windowState.compactX = bounds.x;
        windowState.compactY = bounds.y;
      } else {
        if (bounds.height > 150) {
          windowState.width = bounds.width;
          windowState.height = bounds.height;
          windowState.x = bounds.x;
          windowState.y = bounds.y;
        }
      }
      fs.writeFileSync(stateFilePath, JSON.stringify(windowState), 'utf8');
    } catch (e) {
      console.error('Failed to update window state:', e);
    }
  };

  mainWindow.on('resize', updateWindowState);
  mainWindow.on('move', updateWindowState);

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // 起動表示完了時に最前面表示状態を再適用（確実な適用のためのガード）
  mainWindow.once('ready-to-show', () => {
    if (windowState.alwaysOnTop) {
      mainWindow.setAlwaysOnTop(true, 'status');
    }
  });
  
  // Rendererのコンソールログをターミナルに出力する
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] Level:${level} - ${message} (${path.basename(sourceId)}:${line})`);
  });

  
  // 開発ツールを開く場合は以下を有効化
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // media:// プロトコルハンドラーの登録 (クエリパラメータ方式 - 安全な文字列切出)
  protocol.handle('media', (request) => {
    try {
      const urlStr = request.url;
      const pathKey = '?path=';
      const index = urlStr.indexOf(pathKey);
      if (index === -1) throw new Error("No path parameter found");
      
      const rawPath = urlStr.substring(index + pathKey.length);
      const filePath = decodeURIComponent(rawPath);
      if (!filePath) throw new Error("No path specified in request");

      const normalizedPath = path.normalize(filePath);
      const stat = fs.statSync(normalizedPath);
      const fileSize = stat.size;
      
      // HTTP Range ヘッダーの解析
      const range = request.headers.get('range');
      
      const ext = path.extname(normalizedPath).toLowerCase();
      let mimeType = 'audio/mpeg';
      if (ext === '.wav') mimeType = 'audio/wav';
      else if (ext === '.ogg') mimeType = 'audio/ogg';
      else if (ext === '.m4a') mimeType = 'audio/x-m4a';
      else if (ext === '.flac') mimeType = 'audio/flac';
      else if (ext === '.mid' || ext === '.midi') mimeType = 'audio/midi';

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        
        // highWaterMarkを256KBに設定し、ストリーミング読み込み時のディスクI/O遅延による音飛びを防止
        const fileStream = fs.createReadStream(normalizedPath, { start, end, highWaterMark: 256 * 1024 });
        
        return new Response(fileStream, {
          status: 206,
          statusText: 'Partial Content',
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': mimeType
          }
        });
      } else {
        const fileStream = fs.createReadStream(normalizedPath, { highWaterMark: 256 * 1024 });
        return new Response(fileStream, {
          status: 200,
          headers: {
            'Content-Length': fileSize,
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes'
          }
        });
      }
    } catch (error) {
      console.error("Failed to handle media protocol request:", error);
      return new Response("Error reading file: " + error.message, { status: 500 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// サポートする音楽ファイルの拡張子は上部で定義されています

// 指定されたディレクトリの中身を読み込む関数（1階層分）
function readDirContents(dirPath) {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    const folders = [];
    const files = [];

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      if (item.name.startsWith('.')) continue;

      if (item.isDirectory()) {
        folders.push({
          name: item.name,
          path: fullPath,
          type: 'directory',
          hasChildren: hasSubDirectoriesOrMusic(fullPath)
        });
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push({
            name: item.name,
            path: fullPath,
            type: 'file',
            ext: ext
          });
        }
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return { folders, files };
  } catch (error) {
    console.error("Error reading directory:", error);
    return { folders: [], files: [] };
  }
}

function hasSubDirectoriesOrMusic(dirPath) {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('.')) continue;
      if (item.isDirectory()) return true;
      if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

// IPCハンドラー登録
ipcMain.handle('dialog:open-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  const rootName = path.basename(selectedPath) || selectedPath;
  const contents = readDirContents(selectedPath);

  return {
    rootPath: selectedPath,
    rootName: rootName,
    ...contents
  };
});

ipcMain.handle('directory:read', async (event, dirPath) => {
  return readDirContents(dirPath);
});

// コンパクトモード切り替え時にウィンドウサイズを変更するIPCハンドラー
ipcMain.on('window:set-compact', (event, isCompact) => {
  if (!mainWindow) return;
  
  const wasCompact = windowState.isCompact;
  const isAlwaysOnTop = mainWindow.isAlwaysOnTop(); // 現在の最前面状態を取得しておく
  windowState.isCompact = isCompact;
  
  const bounds = mainWindow.getBounds();
  
  if (isCompact) {
    // 通常モードからコンパクトモードにする場合のみ、現在の通常サイズを保存
    if (!wasCompact && bounds.height > 150) {
      windowState.width = bounds.width;
      windowState.height = bounds.height;
      windowState.x = bounds.x;
      windowState.y = bounds.y;
    }
    mainWindow.setMinimumSize(320, 100);
    mainWindow.setMaximumSize(10000, 100); // 高さをコンパクトモードの100pxに固定
    
    // 今の場所（bounds.x, bounds.y）を維持して、コンパクトモードのサイズにする
    const cWidth = windowState.compactWidth || 360;
    mainWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: cWidth,
      height: 100
    });
  } else {
    // コンパクトモードから通常モードにする場合のみ、コンパクトサイズを保存
    if (wasCompact) {
      windowState.compactWidth = bounds.width;
      windowState.compactX = bounds.x;
      windowState.compactY = bounds.y;
    }

    mainWindow.setMaximumSize(10000, 10000); // 制限を解除
    mainWindow.setMinimumSize(800, 600);
    
    // 今の場所（bounds.x, bounds.y）を維持して、通常モードのサイズにする
    mainWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width: windowState.width || 1200,
      height: windowState.height || 800
    });
  }

  // サイズ変更後に最前面表示状態を再適用（レベルをstatusに指定）
  if (isAlwaysOnTop) {
    mainWindow.setAlwaysOnTop(true, 'status');
  } else {
    mainWindow.setAlwaysOnTop(false);
  }

  // 状態をファイルに保存して整合性を保つ
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(windowState), 'utf8');
  } catch (e) {
    console.error('Failed to save window state:', e);
  }
});

// 起動時にC:, D:ドライブやマイミュージックフォルダのルートを取得するためのIPCハンドラー
ipcMain.handle('system:get-roots', async () => {
  const roots = [];
  
  // 1. マイ ミュージックフォルダを追加
  try {
    const musicPath = app.getPath('music');
    if (fs.existsSync(musicPath)) {
      roots.push({ name: 'マイ ミュージック', path: musicPath, type: 'music' });
    }
  } catch (e) {
    console.error('Failed to get music directory:', e);
  }

  // 2. Windows の論理ドライブを検出して追加
  if (process.platform === 'win32') {
    const driveLetters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'; // CからZまで
    for (let i = 0; i < driveLetters.length; i++) {
      const drive = driveLetters[i] + ':\\';
      try {
        if (fs.existsSync(drive)) {
          roots.push({ name: `${driveLetters[i]}: ドライブ`, path: drive, type: 'drive' });
        }
      } catch (e) {
        // ドライブが存在しないか、オフラインの場合のエラーは無視
      }
    }
  } else {
    // macOS や Linux の場合はホームディレクトリをルートに追加
    roots.push({ name: 'ホーム', path: app.getPath('home'), type: 'drive' });
  }
  
  return roots;
});

// 常に最前面表示切り替え用のIPCハンドラー
ipcMain.on('window:set-always-on-top', (event, alwaysOnTop) => {
  if (mainWindow) {
    if (alwaysOnTop) {
      mainWindow.setAlwaysOnTop(true, 'status');
    } else {
      mainWindow.setAlwaysOnTop(false);
    }
  }
});

// 起動時ファイル取得のIPCハンドラー
ipcMain.handle('system:get-start-file', () => {
  const temp = startFilePath;
  startFilePath = null; // 一度取得したらクリア
  return temp;
});

// ファイル関連付けのチェック
ipcMain.handle('system:check-association', async () => {
  if (process.platform !== 'win32') return false;
  return new Promise((resolve) => {
    exec('reg query HKCU\\Software\\Classes\\explayer.music', (err) => {
      resolve(!err);
    });
  });
});

// ファイル関連付けの設定
ipcMain.handle('system:set-association', async (event, enable) => {
  if (process.platform !== 'win32') return false;
  
  const exePath = app.getPath('exe');
  const progId = 'explayer.music';
  
  return new Promise((resolve) => {
    if (enable) {
      const commands = [
        `reg add HKCU\\Software\\Classes\\${progId} /ve /t REG_SZ /d "exPlayer Audio File" /f`,
        `reg add HKCU\\Software\\Classes\\${progId}\\DefaultIcon /ve /t REG_SZ /d "\\"${exePath}\\",0" /f`,
        `reg add HKCU\\Software\\Classes\\${progId}\\shell\\open\\command /ve /t REG_SZ /d "\\"${exePath}\\" \\"%1\\"" /f`,
        `reg add HKCU\\Software\\Classes\\.mp3\\OpenWithProgids /v ${progId} /t REG_NONE /f`,
        `reg add HKCU\\Software\\Classes\\.wav\\OpenWithProgids /v ${progId} /t REG_NONE /f`,
        `reg add HKCU\\Software\\Classes\\.mid\\OpenWithProgids /v ${progId} /t REG_NONE /f`,
        `reg add HKCU\\Software\\Classes\\.midi\\OpenWithProgids /v ${progId} /t REG_NONE /f`
      ];
      
      const fullCommand = commands.join(' && ');
      exec(fullCommand, (err) => {
        if (err) {
          console.error('Failed to create association:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } else {
      const commands = [
        `reg delete HKCU\\Software\\Classes\\${progId} /f`,
        `reg delete HKCU\\Software\\Classes\\.mp3\\OpenWithProgids /v ${progId} /f`,
        `reg delete HKCU\\Software\\Classes\\.wav\\OpenWithProgids /v ${progId} /f`,
        `reg delete HKCU\\Software\\Classes\\.mid\\OpenWithProgids /v ${progId} /f`,
        `reg delete HKCU\\Software\\Classes\\.midi\\OpenWithProgids /v ${progId} /f`
      ];
      
      async function runCommandsSequentially(cmds) {
        for (const cmd of cmds) {
          await new Promise((res) => {
            exec(cmd, () => res());
          });
        }
        return true;
      }
      
      runCommandsSequentially(commands).then(resolve);
    }
  });
});

