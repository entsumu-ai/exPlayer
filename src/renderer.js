// グローバルエラーキャッチャー（デバッグ用アラート）
window.addEventListener('error', (event) => {
  alert(`JS Error: ${event.message}\nAt: ${event.filename}:${event.lineno}`);
});
window.addEventListener('unhandledrejection', (event) => {
  alert(`Promise Rejection: ${event.reason}`);
});

// HTML要素の参照
const btnPlaylistToggle = document.getElementById('btn-playlist-toggle');
const btnAlwaysOnTop = document.getElementById('btn-always-on-top');
const chkAssociation = document.getElementById('chk-association');

const folderTree = document.getElementById('folder-tree');
const currentPathText = document.getElementById('current-path-text');
const fileSearch = document.getElementById('file-search');
const fileListBody = document.getElementById('file-list-body');

// 液晶表示要素
const lcdPanel = document.getElementById('lcd-panel');
const btnLcdToggle = document.getElementById('btn-lcd-toggle');
const lcdFilePath = document.getElementById('lcd-file-path');
const lcdTrackTitle = document.getElementById('lcd-track-title');
const lcdFormat = document.getElementById('lcd-format');
const lcdPlaylist = document.getElementById('lcd-playlist');
const lcdSpeedVal = document.getElementById('lcd-speed-val');
const lcdCurrentTime = document.getElementById('lcd-current-time');
const lcdTotalTime = document.getElementById('lcd-total-time');
const lcdProgressBar = document.getElementById('lcd-progress-bar');
const analyzerCanvas = document.getElementById('analyzer-canvas');
const canvasCtx = analyzerCanvas.getContext('2d');

// 再生コントロール要素
const btnPlayPause = document.getElementById('btn-play-pause');
const playPauseIcon = document.getElementById('play-pause-icon');
const btnStop = document.getElementById('btn-stop');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnShuffle = document.getElementById('btn-shuffle');
const btnLoop = document.getElementById('btn-loop');
const timelineSlider = document.getElementById('timeline-slider');
const volumeSlider = document.getElementById('volume-slider');
const volumeBtn = document.getElementById('volume-btn');
const volumeVal = document.getElementById('volume-val');

// FX・設定ポップアップ要素
const btnFxToggle = document.getElementById('btn-fx-toggle');
const fxPopup = document.getElementById('fx-popup');
const btnFxClose = document.getElementById('btn-fx-close');
const speedSlider = document.getElementById('speed-slider');
const speedPopVal = document.getElementById('speed-pop-val');
const btnResetSpeed = document.getElementById('btn-reset-speed');
const eqLow = document.getElementById('eq-low');
const eqMid = document.getElementById('eq-mid');
const eqHigh = document.getElementById('eq-high');
const eqLowVal = document.getElementById('eq-low-val');
const eqMidVal = document.getElementById('eq-mid-val');
const eqHighVal = document.getElementById('eq-high-val');

// タブ・アクション要素
const tabFiles = document.getElementById('tab-files');
const tabPlaylist = document.getElementById('tab-playlist');
const playlistCount = document.getElementById('playlist-count');
const btnClearPlaylist = document.getElementById('btn-clear-playlist');
const themeSelector = document.getElementById('theme-selector');

// 複数選択およびモーダルダイアログ要素
const addConfirmModal = document.getElementById('add-confirm-modal');
const addConfirmText = document.getElementById('add-confirm-text');
const modalPlaylistSelect = document.getElementById('modal-playlist-select');
const modalCreateNewCheck = document.getElementById('modal-create-new-check');
const modalNewPlaylistField = document.getElementById('modal-new-playlist-field');
const modalNewPlaylistName = document.getElementById('modal-new-playlist-name');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalConfirm = document.getElementById('btn-modal-confirm');

// アバウトポップアップ要素
const btnAboutToggle = document.getElementById('btn-about-toggle');
const aboutModal = document.getElementById('about-modal');
const btnAboutClose = document.getElementById('btn-about-close');

// 新規演奏リスト作成モーダル要素
const newPlaylistModal = document.getElementById('new-playlist-modal');
const newPlaylistInputName = document.getElementById('new-playlist-input-name');
const btnNewPlaylistModalCancel = document.getElementById('btn-new-playlist-modal-cancel');
const btnNewPlaylistModalConfirm = document.getElementById('btn-new-playlist-modal-confirm');

// 音声再生・Web Audio関連の状態
let audioCtx = null;
let audioTag = null;
let mediaSource = null;
let analyserNode = null;
let eqLowNode = null;
let eqMidNode = null;
let eqHighNode = null;
let gainNode = null;

// MIDI再生関連の状態
let midiSynth = null;
let midiSequencer = null;
let isMidiLoading = false;

// プレイヤーの動作状態
let currentTab = 'files';     // 'files' (フォルダ内) または 'playlist' (演奏リスト)
let currentFolderFiles = []; // 現在のフォルダ内の全音声ファイル
let playlist = [];           // 演奏リスト（プレイリスト）
let currentTrackIndex = -1;  // 現在再生中のトラック（演奏リスト内のインデックス）
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'list';     // 'none': リピートなし, 'list': リスト全体ループ, 'track': 1曲ループ
let updateProgressInterval = null;

// 複数選択用の状態変数
let selectedIndices = [];      // 現在のタブで選択されているファイルのインデックス配列
let lastSelectedIndex = -1;    // 最後にクリックされたファイルのインデックス (Shiftキー範囲用)
let isDraggingFiles = false;   // ドラッグ選択中フラグ

// 複数プレイリスト用の状態変数
let playlists = { "デフォルト": [] };  // 演奏リストのマップ構造
let currentPlaylistName = "デフォルト";  // 現在選択されている演奏リストの名前
let pendingAddFiles = [];      // 追加確認待ちのファイルリスト
let playingPlaylistName = "";  // 現在再生中の演奏リストの名前

// ソート用の状態変数
let sortField = 'name';
let sortDirection = 'none';    // 'none', 'asc', 'desc'

// オートスクロール用の状態変数
let lastDragX = 0;
let lastDragY = 0;
let autoScrollTimer = null;

// シーク中フラグ
let isSeeking = false;

// キャンバス描画用
let animationFrameId = null;

// 外部SoundFontのURL (軽量なGeneral MIDI音源: 約6MB)
const SOUNDFONT_URL = "https://raw.githubusercontent.com/SuperZato/sf2-web-audio/master/TimGM6mb.sf2";

// ==========================================================================
// 1. 初期化処理
// ==========================================================================

async function init() {
  setupEventListeners();
  loadSavedPlaylist();
  loadSavedTheme();
  loadSavedLcdVisibility();
  loadSavedCompactMode();
  loadSavedAlwaysOnTop();
  loadSavedEQ();
  loadSavedVolume();
  initFileAssociation();
  
  // リピートモードの初期UI表示
  updateRepeatButtonUI();
  
  // マウスホイール音量調整イベントのバインド
  const controlContainers = ['.tool-bar', '.lcd-panel', '.timeline-row'];
  controlContainers.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) {
      el.addEventListener('wheel', handleMouseWheelVolume, { passive: true });
    }
  });
  
  // 初期ドライブ・フォルダツリーのロード
  await initSystemRoots();
  
  // 前回開いていたフォルダの自動復元
  await restoreLastFolder();
  
  // 起動時および二重起動時のファイル引数を処理
  await handleStartAndArgsFiles();
  
  // 初期リサイズと描画
  setTimeout(() => {
    resizeCanvas();
    drawEmptyAnalyzer();
  }, 100);
  
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isPlaying) drawEmptyAnalyzer();
  });
}

function setupEventListeners() {
  // プレイリスト（コンパクトモード）トグル
  btnPlaylistToggle.addEventListener('click', toggleCompactMode);
  
  // 検索
  fileSearch.addEventListener('input', handleSearch);
  
  // 再生コントロール
  btnPlayPause.addEventListener('click', handlePlayPause);
  btnStop.addEventListener('click', handleStop);
  btnPrev.addEventListener('click', handlePrevTrack);
  btnNext.addEventListener('click', handleNextTrack);
  btnShuffle.addEventListener('click', toggleShuffle);
  btnLoop.addEventListener('click', toggleLoop);
  
  // ボリューム
  volumeSlider.addEventListener('input', handleVolumeChange);
  volumeBtn.addEventListener('click', toggleMute);
  
  // タイムラインシーク
  timelineSlider.addEventListener('input', handleTimelineInput);
  timelineSlider.addEventListener('change', handleTimelineChange);
  
  // 速度とEQ
  speedSlider.addEventListener('input', handleSpeedChange);
  btnResetSpeed.addEventListener('click', resetSpeed);
  eqLow.addEventListener('input', () => handleEQChange('low', eqLow.value));
  eqMid.addEventListener('input', () => handleEQChange('mid', eqMid.value));
  eqHigh.addEventListener('input', () => handleEQChange('high', eqHigh.value));

  // 液晶ON/OFFトグル
  btnLcdToggle.addEventListener('click', toggleLcdPanel);

  // FXポップアップトグル
  btnFxToggle.addEventListener('click', toggleFxPopup);
  btnFxClose.addEventListener('click', closeFxPopup);
  document.addEventListener('click', (e) => {
    if (!fxPopup.classList.contains('hidden') && 
        !fxPopup.contains(e.target) && 
        !btnFxToggle.contains(e.target)) {
      closeFxPopup();
    }
  });

  tabFiles.addEventListener('click', () => switchTab('files'));
  btnClearPlaylist.style.display = 'none'; // 初期非表示
  btnClearPlaylist.addEventListener('click', clearPlaylist);

  // テーマ切り替え
  themeSelector.addEventListener('change', () => switchTheme(themeSelector.value));

  // アバウトポップアップ
  if (btnAboutToggle) {
    btnAboutToggle.addEventListener('click', () => {
      aboutModal.classList.remove('hidden');
    });
  }
  if (btnAboutClose) {
    btnAboutClose.addEventListener('click', () => {
      aboutModal.classList.add('hidden');
    });
  }

  // 新規プレイリストタブ追加ボタン
  const btnNewPlaylistTab = document.getElementById('btn-new-playlist-tab');
  if (btnNewPlaylistTab) {
    btnNewPlaylistTab.addEventListener('click', handleCreateNewPlaylistClick);
  }

  // 名前ヘッダーのソートイベント
  const thName = document.getElementById('th-name');
  if (thName) {
    thName.addEventListener('click', toggleNameSort);
  }

  // 複数選択一括操作ボタンのイベント
  const btnAddSelected = document.getElementById('btn-add-selected');
  if (btnAddSelected) {
    btnAddSelected.addEventListener('click', handleAddSelectedClick);
  }
  const btnDeleteSelected = document.getElementById('btn-delete-selected');
  if (btnDeleteSelected) {
    btnDeleteSelected.addEventListener('click', handleDeleteSelectedClick);
  }
  const btnClearSelection = document.getElementById('btn-clear-selection');
  if (btnClearSelection) {
    btnClearSelection.addEventListener('click', clearFileSelection);
  }

  // モーダルのイベント
  if (modalCreateNewCheck) {
    modalCreateNewCheck.addEventListener('change', () => {
      if (modalCreateNewCheck.checked) {
        modalNewPlaylistField.classList.remove('hidden');
      } else {
        modalNewPlaylistField.classList.add('hidden');
      }
    });
  }
  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', closeAddConfirmModal);
  }
  if (btnModalConfirm) {
    btnModalConfirm.addEventListener('click', confirmAddPendingFiles);
  }

  // 新規演奏リスト作成モーダルのイベント
  if (btnNewPlaylistModalCancel) {
    btnNewPlaylistModalCancel.addEventListener('click', closeNewPlaylistModal);
  }
  if (btnNewPlaylistModalConfirm) {
    btnNewPlaylistModalConfirm.addEventListener('click', confirmCreateNewPlaylist);
  }
  if (newPlaylistInputName) {
    newPlaylistInputName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        confirmCreateNewPlaylist();
      } else if (e.key === 'Escape') {
        closeNewPlaylistModal();
      }
    });
  }

  // グローバルのドラッグ終了イベント
  window.addEventListener('mouseup', () => {
    isDraggingFiles = false;
    stopAutoScroll();
  });

  // グローバルのドラッグ中マウス移動イベント（オートスクロール監視）
  window.addEventListener('mousemove', (e) => {
    if (isDraggingFiles) {
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      
      const container = document.querySelector('.file-list-container');
      if (container) {
        const rect = container.getBoundingClientRect();
        // マウスがコンテナの上端または下端付近（20px以内）にある場合のみスクロールを開始
        if (e.clientY < rect.top + 20 || e.clientY > rect.bottom - 20) {
          startAutoScroll();
        } else {
          stopAutoScroll();
        }
      }
    }
  });

  // 演奏リストタブコンテナのホイールでの横スクロールサポート
  const playlistTabsContainer = document.getElementById('playlist-tabs-container');
  if (playlistTabsContainer) {
    playlistTabsContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      playlistTabsContainer.scrollLeft += e.deltaY;
    });
  }

  // 外部からのドラッグ＆ドロップイベント
  const dragOverlay = document.getElementById('drag-overlay');
  if (dragOverlay) {
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragOverlay.classList.remove('hidden');
    });
    
    window.addEventListener('dragleave', (e) => {
      // マウスがウィンドウ外に出た場合のみオーバーレイを非表示にする
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        dragOverlay.classList.add('hidden');
      }
    });
    
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragOverlay.classList.add('hidden');
      
      const files = e.dataTransfer.files;
      if (files.length === 0) return;
      
      const droppedFiles = [];
      const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma', '.mid', '.midi'];
      
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const name = f.name;
        const filePath = f.path; // Electronの絶対パスプロパティ
        
        if (!filePath) continue;
        
        const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          droppedFiles.push({
            name: name,
            path: filePath,
            ext: ext,
            type: 'file'
          });
        }
      }
      
      if (droppedFiles.length > 0) {
        showAddConfirmModal(droppedFiles);
      }
    });
  }

  // 最前面表示の切り替え
  if (btnAlwaysOnTop) {
    btnAlwaysOnTop.addEventListener('click', toggleAlwaysOnTop);
  }

  // ファイル関連付けの切り替え
  if (chkAssociation) {
    chkAssociation.addEventListener('change', handleAssociationToggle);
  }
}

// ==========================================================================
// 2. 音声エンジンの初期化 (Web Audio API)
// ==========================================================================

function initAudioEngine() {
  if (audioCtx) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  // 一般音声ファイル再生用 <audio> 要素
  audioTag = new Audio();
  audioTag.crossOrigin = "anonymous";
  
  // Web Audio ノード接続
  mediaSource = audioCtx.createMediaElementSource(audioTag);
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 128; // 64バンドのスペアナ
  
  // イコライザー (EQ)
  eqLowNode = audioCtx.createBiquadFilter();
  eqLowNode.type = 'lowshelf';
  eqLowNode.frequency.value = 300;
  eqLowNode.gain.value = parseFloat(eqLow.value);
  
  eqMidNode = audioCtx.createBiquadFilter();
  eqMidNode.type = 'peaking';
  eqMidNode.Q.value = 1.0;
  eqMidNode.frequency.value = 1000;
  eqMidNode.gain.value = parseFloat(eqMid.value);
  
  eqHighNode = audioCtx.createBiquadFilter();
  eqHighNode.type = 'highshelf';
  eqHighNode.frequency.value = 3000;
  eqHighNode.gain.value = parseFloat(eqHigh.value);
  
  // 音量ノード
  gainNode = audioCtx.createGain();
  gainNode.gain.value = volumeSlider.value / 100;
  
  // 接続: Source -> EQ -> Analyser -> Gain -> Destination
  mediaSource.connect(eqLowNode);
  eqLowNode.connect(eqMidNode);
  eqMidNode.connect(eqHighNode);
  eqHighNode.connect(analyserNode);
  analyserNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  // オーディオイベント
  audioTag.addEventListener('timeupdate', handleTimeUpdate);
  audioTag.addEventListener('ended', handleTrackEnded);
  audioTag.addEventListener('play', () => {
    if (speedSlider) audioTag.playbackRate = speedSlider.value / 100;
  });
  audioTag.addEventListener('loadedmetadata', () => {
    if (speedSlider) audioTag.playbackRate = speedSlider.value / 100;
  });
  audioTag.addEventListener('error', (e) => {
    // 停止やソース解除などのダミーの空エラーは無視する
    if (!audioTag.src || audioTag.src === window.location.href || audioTag.src.endsWith('/') || audioTag.src === 'media://load/') {
      return;
    }
    console.error("Audio tag error:", e);
    lcdTrackTitle.textContent = "Playback Error";
  });

  
  // ビジュアライザー起動
  startVisualizer();
}

// ==========================================================================
// 3. フォルダツリーの処理
// ==========================================================================

async function handleOpenFolder() {
  const result = await window.api.openDirectory();
  if (!result) return;

  folderTree.innerHTML = '';
  const rootNode = createFolderTreeNode(result.rootName, result.rootPath, true);
  folderTree.appendChild(rootNode);
  
  selectFolder(result.rootPath, result.folders, result.files);
}

function createFolderTreeNode(name, folderPath, isRoot = false) {
  const node = document.createElement('div');
  node.className = `tree-node ${isRoot ? 'root-node' : ''}`;
  node.dataset.path = folderPath;
  
  const item = document.createElement('div');
  item.className = 'tree-item';
  
  const arrow = document.createElement('span');
  arrow.className = 'tree-arrow';
  arrow.innerHTML = '<span class="material-icons-round">play_arrow</span>';
  
  const icon = document.createElement('span');
  icon.className = 'tree-icon material-icons-round';
  icon.textContent = isRoot ? 'dns' : 'folder';
  
  const label = document.createElement('span');
  label.className = 'tree-label';
  label.textContent = name;
  
  // 演奏リストに追加ボタン (ホバー時に表示)
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn-tree-add';
  btnAdd.title = 'このフォルダ内のすべての曲を演奏リストに追加';
  btnAdd.innerHTML = '<span class="material-icons-round">playlist_add</span>';
  btnAdd.addEventListener('click', async (e) => {
    e.stopPropagation(); // フォルダ選択やツリー展開を防ぐ
    try {
      const contents = await window.api.readDirectory(folderPath);
      if (contents.files && contents.files.length > 0) {
        showAddConfirmModal(contents.files);
      } else {
        alert("このフォルダ内に追加可能な音楽ファイルが見つかりませんでした。");
      }
    } catch (err) {
      console.error("Failed to read folder files for adding:", err);
      alert("フォルダの読み込みに失敗しました。");
    }
  });
  
  item.appendChild(arrow);
  item.appendChild(icon);
  item.appendChild(label);
  item.appendChild(btnAdd);
  node.appendChild(item);
  
  arrow.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    const hasExpandedClass = arrow.classList.contains('expanded');
    
    if (hasExpandedClass) {
      const childrenContainer = node.querySelector('.tree-children');
      if (childrenContainer) childrenContainer.style.display = 'none';
      arrow.classList.remove('expanded');
    } else {
      arrow.classList.add('expanded');
      
      let childrenContainer = node.querySelector('.tree-children');
      if (!childrenContainer) {
        childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children';
        node.appendChild(childrenContainer);
        
        try {
          const contents = await window.api.readDirectory(folderPath);
          if (contents.folders.length === 0) {
            arrow.style.visibility = 'hidden';
          } else {
            contents.folders.forEach(sub => {
              const childNode = createFolderTreeNode(sub.name, sub.path);
              childrenContainer.appendChild(childNode);
            });
          }
        } catch (err) {
          console.error("Failed to read directory:", err);
        }
      } else {
        childrenContainer.style.display = 'block';
      }
    }
  });
  
  item.addEventListener('click', async () => {
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    
    const contents = await window.api.readDirectory(folderPath);
    selectFolder(folderPath, contents.folders, contents.files);
  });
  
  item.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    arrow.click();
  });
  
  return node;
}

function selectFolder(folderPath, folders, files) {
  currentPathText.textContent = folderPath;
  currentFolderFiles = files;
  
  // 選択状態をクリア
  clearFileSelection();
  
  // 前回開いていたフォルダパスを保存
  localStorage.setItem('explayer_last_folder', folderPath);
  
  // プレイリストタブを開いている場合でもエクスプローラ表示に強制切り替え
  if (currentTab !== 'files') {
    switchTab('files');
  } else {
    renderFileList(files);
  }
}

// システムの初期ドライブ/マイミュージックを表示する処理
async function initSystemRoots() {
  folderTree.innerHTML = '';
  try {
    const roots = await window.api.getSystemRoots();
    roots.forEach(root => {
      const node = createSystemRootNode(root.name, root.path, root.type);
      folderTree.appendChild(node);
    });
  } catch (e) {
    console.error('Failed to load system roots:', e);
    folderTree.innerHTML = '<div class="empty-state"><p>フォルダ読み込みエラー</p></div>';
  }
}

function createSystemRootNode(name, folderPath, type) {
  const node = document.createElement('div');
  node.className = 'tree-node root-node';
  node.dataset.path = folderPath;
  
  const item = document.createElement('div');
  item.className = 'tree-item';
  
  const arrow = document.createElement('span');
  arrow.className = 'tree-arrow';
  arrow.innerHTML = '<span class="material-icons-round">play_arrow</span>';
  
  const icon = document.createElement('span');
  icon.className = 'tree-icon material-icons-round';
  icon.textContent = type === 'music' ? 'library_music' : 'dns';
  
  const label = document.createElement('span');
  label.className = 'tree-label';
  label.textContent = name;
  
  // 演奏リストに追加ボタン (ホバー時に表示)
  const btnAdd = document.createElement('button');
  btnAdd.className = 'btn-tree-add';
  btnAdd.title = 'このフォルダ内のすべての曲を演奏リストに追加';
  btnAdd.innerHTML = '<span class="material-icons-round">playlist_add</span>';
  btnAdd.addEventListener('click', async (e) => {
    e.stopPropagation(); // フォルダ選択やツリー展開を防ぐ
    try {
      const contents = await window.api.readDirectory(folderPath);
      if (contents.files && contents.files.length > 0) {
        showAddConfirmModal(contents.files);
      } else {
        alert("このフォルダ内に追加可能な音楽ファイルが見つかりませんでした。");
      }
    } catch (err) {
      console.error("Failed to read folder files for adding:", err);
      alert("フォルダの読み込みに失敗しました。");
    }
  });
  
  item.appendChild(arrow);
  item.appendChild(icon);
  item.appendChild(label);
  item.appendChild(btnAdd);
  node.appendChild(item);
  
  arrow.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    const hasExpandedClass = arrow.classList.contains('expanded');
    
    if (hasExpandedClass) {
      const childrenContainer = node.querySelector('.tree-children');
      if (childrenContainer) childrenContainer.style.display = 'none';
      arrow.classList.remove('expanded');
    } else {
      arrow.classList.add('expanded');
      
      let childrenContainer = node.querySelector('.tree-children');
      if (!childrenContainer) {
        childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children';
        node.appendChild(childrenContainer);
        
        try {
          const contents = await window.api.readDirectory(folderPath);
          if (contents.folders.length === 0) {
            arrow.style.visibility = 'hidden';
          } else {
            contents.folders.forEach(sub => {
              const childNode = createFolderTreeNode(sub.name, sub.path);
              childrenContainer.appendChild(childNode);
            });
          }
        } catch (err) {
          console.error("Failed to read directory:", err);
        }
      } else {
        childrenContainer.style.display = 'block';
      }
    }
  });
  
  item.addEventListener('click', async () => {
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    
    const contents = await window.api.readDirectory(folderPath);
    selectFolder(folderPath, contents.folders, contents.files);
  });
  
  item.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    arrow.click();
  });
  
  return node;
}

// 前回開いていたフォルダの復元
// 前回開いていたフォルダの復元（ツリー自動展開付き）
async function restoreLastFolder() {
  const lastFolder = localStorage.getItem('explayer_last_folder');
  if (lastFolder) {
    try {
      // 1. ファイルリストのロード
      const contents = await window.api.readDirectory(lastFolder);
      selectFolder(lastFolder, contents.folders, contents.files);
      
      // 2. フォルダツリーを該当パスまで自動的に展開
      setTimeout(async () => {
        await expandTreeToPath(lastFolder);
      }, 300);
    } catch (e) {
      console.error('Failed to restore last folder:', e);
    }
  }
}

// システムルートからターゲットパスまで順番に展開して掘り下げる非同期処理
async function expandTreeToPath(targetPath) {
  if (!targetPath) return;
  
  const normalizedTarget = targetPath.replace(/\\/g, '/');
  
  // 1. トップレベルのルートノードからターゲットパスの部分文字列として合致するものを探す
  const rootNodes = Array.from(folderTree.querySelectorAll('.root-node'));
  let currentNode = null;
  let currentPath = "";
  
  for (const node of rootNodes) {
    const nodePath = node.dataset.path.replace(/\\/g, '/');
    if (normalizedTarget.startsWith(nodePath) && nodePath.length > currentPath.length) {
      currentNode = node;
      currentPath = nodePath;
    }
  }
  
  if (!currentNode) return;
  
  // 2. ターゲットパスに完全に一致するまでツリーを順番に展開して掘り下げる
  while (currentPath.toLowerCase() !== normalizedTarget.toLowerCase()) {
    // 現在のノードを展開する
    await expandTreeNode(currentNode);
    
    const childrenContainer = currentNode.querySelector('.tree-children');
    if (!childrenContainer) break;
    
    // 子ノードからターゲットパスの前半部分に最も一致するノードを探す
    const childNodes = Array.from(childrenContainer.querySelectorAll(':scope > .tree-node'));
    let nextNode = null;
    
    for (const child of childNodes) {
      const childPath = child.dataset.path.replace(/\\/g, '/');
      if (normalizedTarget.startsWith(childPath)) {
        if (!nextNode || childPath.length > nextNode.dataset.path.replace(/\\/g, '/').length) {
          nextNode = child;
        }
      }
    }
    
    if (!nextNode) break; // これ以上の子ノードが見つからない場合は終了
    
    currentNode = nextNode;
    currentPath = nextNode.dataset.path.replace(/\\/g, '/');
  }
  
  // 3. 最終ターゲットノードをハイライトし、スクロールする
  if (currentNode) {
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
    const item = currentNode.querySelector('.tree-item');
    if (item) {
      item.classList.add('active');
      currentNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

// 特定のフォルダノードを展開する
async function expandTreeNode(node) {
  const arrow = node.querySelector('.tree-arrow');
  if (!arrow || arrow.classList.contains('expanded')) return; // 既に展開済みの場合はスキップ
  
  const folderPath = node.dataset.path;
  arrow.classList.add('expanded');
  
  let childrenContainer = node.querySelector('.tree-children');
  if (!childrenContainer) {
    childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    node.appendChild(childrenContainer);
    
    try {
      const contents = await window.api.readDirectory(folderPath);
      if (contents.folders.length === 0) {
        arrow.style.visibility = 'hidden';
      } else {
        contents.folders.forEach(sub => {
          const childNode = createFolderTreeNode(sub.name, sub.path);
          childrenContainer.appendChild(childNode);
        });
      }
    } catch (e) {
      console.error('Failed to read subdirectories:', e);
    }
  } else {
    childrenContainer.style.display = 'block';
  }
}

// コンパクトモード（最小化表示）切り替え処理
function toggleCompactMode() {
  const isCompact = !document.body.classList.contains('compact-mode');
  setCompactModeState(isCompact);
}

function setCompactModeState(isCompact) {
  document.body.classList.toggle('compact-mode', isCompact);
  
  // プレイリスト詳細が表示されている状態（active） ＝ 通常モード（!isCompact）
  if (isCompact) {
    btnPlaylistToggle.classList.remove('active');
  } else {
    btnPlaylistToggle.classList.add('active');
  }
  
  localStorage.setItem('explayer_compact_mode', isCompact ? 'true' : 'false');
  
  // メインプロセスへ通知してウィンドウサイズを変更
  window.api.setCompactMode(isCompact);
}

function loadSavedCompactMode() {
  const saved = localStorage.getItem('explayer_compact_mode');
  const isCompact = saved === 'true';
  setCompactModeState(isCompact);
}

// ==========================================================================
// 4. ファイルリスト & 演奏リスト (タブ表示) の処理
// ==========================================================================

function renderFileList(files) {
  fileListBody.innerHTML = '';
  
  const isPlaylistTab = currentTab === 'playlist';
  
  // ソートを適用した複製配列を作成
  const sortedFiles = getSortedFileList(files);
  
  if (sortedFiles.length === 0) {
    const msg = isPlaylistTab ? "演奏リストが空です。" : "このフォルダに音楽ファイルはありません。";
    fileListBody.innerHTML = `<tr><td colspan="4" class="no-files">${msg}</td></tr>`;
    return;
  }
  
  sortedFiles.forEach((file, index) => {
    const tr = document.createElement('tr');
    tr.dataset.path = file.path;
    tr.dataset.index = index;
    
    // クラス設定 (再生中または選択中)
    const currentPlayingTrack = playlists[playingPlaylistName]?.[currentTrackIndex];
    const isCurrentPlaying = isPlaylistTab && 
                             currentPlaylistName === playingPlaylistName && 
                             currentPlayingTrack && 
                             currentPlayingTrack.path === file.path;
    if (isCurrentPlaying) {
      tr.className = 'playing';
    }
    if (selectedIndices.includes(index)) {
      tr.classList.add('selected');
    }
    
    const tdIcon = document.createElement('td');
    const iconSpan = document.createElement('span');
    iconSpan.className = 'file-icon material-icons-round';
    iconSpan.textContent = file.ext === '.mid' || file.ext === '.midi' ? 'music_note' : 'audiotrack';
    tdIcon.appendChild(iconSpan);
    
    const tdName = document.createElement('td');
    tdName.textContent = file.name;
    
    const tdType = document.createElement('td');
    tdType.textContent = file.ext.toUpperCase().substring(1);
    
    const tdAction = document.createElement('td');
    tdAction.style.textAlign = 'center';
    
    const btnAction = document.createElement('button');
    btnAction.className = 'btn-row-action';
    
    if (isPlaylistTab) {
      btnAction.title = '演奏リストから削除';
      btnAction.innerHTML = '<span class="material-icons-round">delete_outline</span>';
      btnAction.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromPlaylist(index);
      });
    } else {
      btnAction.title = '演奏リストに追加';
      btnAction.innerHTML = '<span class="material-icons-round">add</span>';
      btnAction.addEventListener('click', (e) => {
        e.stopPropagation();
        showAddConfirmModal([file]);
      });
    }
    tdAction.appendChild(btnAction);
    
    tr.appendChild(tdIcon);
    tr.appendChild(tdName);
    tr.appendChild(tdType);
    tr.appendChild(tdAction);
    
    // マウスドラッグ・Shift/Ctrl複数選択イベント
    tr.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // 左クリックのみ
      isDraggingFiles = true;
      const idx = parseInt(tr.dataset.index);

      if (e.shiftKey && lastSelectedIndex >= 0) {
        // Shift + クリック: 範囲選択
        const start = Math.min(lastSelectedIndex, idx);
        const end = Math.max(lastSelectedIndex, idx);
        selectedIndices = [];
        for (let i = start; i <= end; i++) {
          selectedIndices.push(i);
        }
      } else if (e.ctrlKey) {
        // Ctrl + クリック: 個別トグル選択
        const sIdx = selectedIndices.indexOf(idx);
        if (sIdx >= 0) {
          selectedIndices.splice(sIdx, 1);
        } else {
          selectedIndices.push(idx);
        }
        lastSelectedIndex = idx;
      } else {
        // 通常クリック
        selectedIndices = [idx];
        lastSelectedIndex = idx;
      }
      updateSelectionUI();
      e.preventDefault(); // テキスト選択等を防止
    });

    tr.addEventListener('mouseenter', () => {
      if (isDraggingFiles && lastSelectedIndex >= 0) {
        const idx = parseInt(tr.dataset.index);
        const start = Math.min(lastSelectedIndex, idx);
        const end = Math.max(lastSelectedIndex, idx);
        selectedIndices = [];
        for (let i = start; i <= end; i++) {
          selectedIndices.push(i);
        }
        updateSelectionUI();
      }
    });
    
    tr.addEventListener('dblclick', () => {
      if (isPlaylistTab) {
        playTrack(index);
      } else {
        // エクスプローラ側でのダブルクリック：追加＆即再生
        showAddConfirmModal([file], true);
      }
    });
    
    fileListBody.appendChild(tr);
  });
}

function handleSearch() {
  const query = fileSearch.value.toLowerCase().trim();
  const sourceList = currentTab === 'playlist' ? playlist : currentFolderFiles;
  
  if (query === '') {
    renderFileList(sourceList);
    return;
  }
  
  const filtered = sourceList.filter(file => file.name.toLowerCase().includes(query));
  renderFileList(filtered);
}

function switchTab(tab) {
  currentTab = tab;
  
  tabFiles.classList.toggle('active', tab === 'files');
  
  btnClearPlaylist.style.display = (tab === 'playlist' && playlist.length > 0) ? 'inline-block' : 'none';
  
  // タブ切り替え時に選択状態をクリア
  clearFileSelection();
  
  if (tab === 'playlist') {
    renderFileList(playlist);
  } else {
    renderFileList(currentFolderFiles);
  }

  // プレイリストの動的タブバーの描画更新
  renderPlaylistTabs();
}

// ==========================================================================
// 5. 演奏リスト（プレイリスト）管理
// ==========================================================================

function loadSavedPlaylist() {
  const savedPlaylists = localStorage.getItem('explayer_playlists');
  if (savedPlaylists) {
    try {
      playlists = JSON.parse(savedPlaylists);
    } catch (e) {
      playlists = { "デフォルト": [] };
    }
  } else {
    playlists = { "デフォルト": [] };
  }

  // 古い形式の単一プレイリストデータが残っていれば移行する
  const oldSaved = localStorage.getItem('explayer_playlist');
  if (oldSaved && (!playlists["デフォルト"] || playlists["デフォルト"].length === 0)) {
    try {
      playlists["デフォルト"] = JSON.parse(oldSaved);
      localStorage.removeItem('explayer_playlist');
    } catch (e) {}
  }

  const savedCurrentName = localStorage.getItem('explayer_current_playlist_name');
  if (savedCurrentName && playlists[savedCurrentName]) {
    currentPlaylistName = savedCurrentName;
  } else {
    const keys = Object.keys(playlists);
    currentPlaylistName = keys.length > 0 ? keys[0] : "デフォルト";
  }

  if (!playlists[currentPlaylistName]) {
    playlists[currentPlaylistName] = [];
  }

  playlist = playlists[currentPlaylistName];
  
  renderPlaylistTabs();
  updatePlaylistCount();
}

function savePlaylist() {
  playlists[currentPlaylistName] = playlist;
  localStorage.setItem('explayer_playlists', JSON.stringify(playlists));
  localStorage.setItem('explayer_current_playlist_name', currentPlaylistName);
  updatePlaylistCount();
  renderPlaylistTabs();
  
  if (currentTab === 'playlist') {
    btnClearPlaylist.style.display = playlist.length > 0 ? 'inline-block' : 'none';
  }
}

function updatePlaylistCount() {
  if (playlistCount) {
    playlistCount.textContent = playlist.length;
  }
}

function addOrGetFromPlaylist(file) {
  const idx = playlist.findIndex(f => f.path === file.path);
  if (idx >= 0) return idx;
  
  playlist.push(file);
  savePlaylist();
  return playlist.length - 1;
}

function addToPlaylist(file) {
  const idx = playlist.findIndex(f => f.path === file.path);
  if (idx < 0) {
    playlist.push(file);
    savePlaylist();
    if (currentTab === 'playlist') {
      renderFileList(playlist);
    }
  }
}

function removeFromPlaylist(index) {
  playlist.splice(index, 1);
  savePlaylist();
  
  if (currentTrackIndex === index) {
    stopCurrentPlayback();
    currentTrackIndex = -1;
  } else if (currentTrackIndex > index) {
    currentTrackIndex--;
  }
  
  updateFileListHighlight();
  if (currentTab === 'playlist') {
    renderFileList(playlist);
  }
}

function clearPlaylist() {
  if (confirm("演奏リストをクリアしますか？")) {
    playlist = [];
    savePlaylist();
    stopCurrentPlayback();
    currentTrackIndex = -1;
    renderFileList([]);
  }
}

// ==========================================================================
// 6. 再生ロジック (オーディオ & MIDI)
// ==========================================================================

async function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  
  initAudioEngine();
  
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  stopCurrentPlayback();
  
  currentTrackIndex = index;
  playingPlaylistName = currentPlaylistName;
  const track = playlist[index];
  
  // UIの更新 (液晶画面、テーブルのハイライト)
  if (lcdTrackTitle) lcdTrackTitle.textContent = track.name;
  if (lcdFilePath) lcdFilePath.textContent = track.path;
  if (lcdFormat) lcdFormat.textContent = track.ext.toUpperCase().substring(1);
  if (lcdPlaylist) lcdPlaylist.textContent = playingPlaylistName;
  updateFileListHighlight();
  
  const fileExtension = track.ext.toLowerCase();
  
  if (fileExtension === '.mid' || fileExtension === '.midi') {
    await playMidi(track.path);
  } else {
    await playAudio(track.path);
  }

  
  setPlayingState(true);
}

function stopCurrentPlayback() {
  if (audioTag) {
    audioTag.pause();
    audioTag.src = '';
  }
  
  if (midiSequencer) {
    midiSequencer.stop();
    midiSequencer = null;
  }
  
  if (updateProgressInterval) {
    clearInterval(updateProgressInterval);
    updateProgressInterval = null;
  }
  
  setPlayingState(false);
  if (lcdProgressBar) lcdProgressBar.style.width = '0%';
  if (timelineSlider) {
    timelineSlider.value = 0;
    timelineSlider.style.background = ''; // 背景色のリセット
  }
  if (lcdCurrentTime) lcdCurrentTime.textContent = "00:00";
  if (lcdTotalTime) lcdTotalTime.textContent = "00:00";
  
  if (lcdTrackTitle) lcdTrackTitle.textContent = "No Track Selected";
  if (lcdFilePath) lcdFilePath.textContent = "No Track Selected";
  if (lcdPlaylist) lcdPlaylist.textContent = "NONE";
}

async function playAudio(filePath) {
  try {
    // media:// プロトコルを利用してローカルファイルを直接読み込ませる (クエリパラメータ方式)
    const mediaUrl = `media://load/?path=${encodeURIComponent(filePath)}`;

    audioTag.src = mediaUrl;
    await audioTag.play();
    if (speedSlider) {
      audioTag.playbackRate = speedSlider.value / 100;
    }
  } catch (error) {
    console.error("Play audio failed:", error);
    if (lcdTrackTitle) lcdTrackTitle.textContent = "Playback Error";
  }
}


async function playMidi(filePath) {
  if (!midiSynth && !isMidiLoading) {
    isMidiLoading = true;
    lcdTrackTitle.textContent = "Loading SoundFont...";
    try {
      const response = await fetch(SOUNDFONT_URL);
      if (!response.ok) throw new Error("Failed to load SoundFont");
      const sf2Buffer = await response.arrayBuffer();
      
      midiSynth = new SpessaSynth.Synth(analyserNode, sf2Buffer);
      isMidiLoading = false;
      lcdTrackTitle.textContent = "SoundFont Loaded";
    } catch (e) {
      console.error(e);
      lcdTrackTitle.textContent = "SoundFont Load Error";
      isMidiLoading = false;
      return;
    }
  }
  
  if (isMidiLoading) {
    setTimeout(() => playTrack(currentTrackIndex), 1000);
    return;
  }
  
  try {
    // media:// プロトコルを利用してMIDIファイルをフェッチし、ArrayBufferを取得
    const mediaUrl = `media://${encodeURIComponent(filePath.replace(/\\/g, '/'))}`;
    const response = await fetch(mediaUrl);
    if (!response.ok) throw new Error("Failed to fetch MIDI file");
    
    const arrayBuffer = await response.arrayBuffer();
    const midiHandler = new SpessaSynth.MIDIHandler(new Uint8Array(arrayBuffer));
    midiSequencer = new SpessaSynth.Sequencer(midiHandler, midiSynth);

    
    midiSequencer.playbackRate = speedSlider.value / 100;
    midiSequencer.play();
    
    const totalDuration = midiSequencer.duration;
    lcdTotalTime.textContent = formatTime(totalDuration);
    timelineSlider.max = Math.floor(totalDuration);
    
    updateProgressInterval = setInterval(updateMidiProgress, 250);
  } catch (error) {
    console.error("Play MIDI failed:", error);
    lcdTrackTitle.textContent = "MIDI Playback Error";
  }
}

function updateMidiProgress() {
  if (!midiSequencer || isSeeking) return;
  
  const currentTime = midiSequencer.currentTime;
  const totalTime = midiSequencer.duration;
  
  if (lcdCurrentTime) lcdCurrentTime.textContent = formatTime(currentTime);
  if (timelineSlider) {
    timelineSlider.value = Math.floor(currentTime);
    const percent = totalTime > 0 ? (currentTime / totalTime) * 100 : 0;
    const activeColor = '#ffffff';
    const trackColor = 'rgba(255, 255, 255, 0.2)';
    timelineSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`;
  }
  
  if (currentTime >= totalTime - 0.1) {
    clearInterval(updateProgressInterval);
    handleTrackEnded();
  }
}

function handleTimeUpdate() {
  if (!audioTag || midiSequencer || isSeeking) return;
  
  const current = audioTag.currentTime;
  const total = audioTag.duration || 0;
  
  if (lcdCurrentTime) lcdCurrentTime.textContent = formatTime(current);
  if (lcdTotalTime && total > 0) lcdTotalTime.textContent = formatTime(total); // 総再生時間の更新バグ修正
  
  if (timelineSlider) {
    timelineSlider.max = Math.floor(total);
    timelineSlider.value = Math.floor(current);
    const percent = total > 0 ? (current / total) * 100 : 0;
    const activeColor = '#ffffff';
    const trackColor = 'rgba(255, 255, 255, 0.2)';
    timelineSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`;
  }
}

function handleTrackEnded() {
  if (repeatMode === 'track') {
    playTrack(currentTrackIndex);
  } else if (repeatMode === 'list') {
    handleNextTrack();
  } else { // repeatMode === 'none' (リピートなし)
    if (playlist.length === 0) return;
    // 最後の曲であれば停止、そうでなければ次の曲へ
    if (currentTrackIndex >= playlist.length - 1) {
      stopCurrentPlayback();
    } else {
      handleNextTrack();
    }
  }
}

function handlePrevTrack() {
  if (playlist.length === 0) return;
  
  let targetIndex = currentTrackIndex - 1;
  if (targetIndex < 0) {
    targetIndex = playlist.length - 1;
  }
  playTrack(targetIndex);
}

function handleNextTrack() {
  if (playlist.length === 0) return;
  
  let targetIndex;
  if (isShuffle) {
    targetIndex = Math.floor(Math.random() * playlist.length);
  } else {
    targetIndex = currentTrackIndex + 1;
    if (targetIndex >= playlist.length) {
      targetIndex = 0;
    }
  }
  playTrack(targetIndex);
}

function handlePlayPause() {
  if (currentTrackIndex === -1 && playlist.length > 0) {
    playTrack(0);
    return;
  }
  
  if (midiSequencer) {
    if (isPlaying) {
      midiSequencer.pause();
      setPlayingState(false);
    } else {
      midiSequencer.play();
      setPlayingState(true);
    }
  } else if (audioTag) {
    if (isPlaying) {
      audioTag.pause();
      setPlayingState(false);
    } else {
      audioTag.play();
      setPlayingState(true);
    }
  }
}

function handleStop() {
  stopCurrentPlayback();
}

function setPlayingState(playing) {
  isPlaying = playing;
  if (playing) {
    playPauseIcon.textContent = 'pause';
    btnPlayPause.title = '一時停止';
  } else {
    playPauseIcon.textContent = 'play_arrow';
    btnPlayPause.title = '再生';
  }
  renderPlaylistTabs();
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle('active', isShuffle);
}

function toggleLoop() {
  if (repeatMode === 'none') {
    repeatMode = 'list';
  } else if (repeatMode === 'list') {
    repeatMode = 'track';
  } else {
    repeatMode = 'none';
  }
  updateRepeatButtonUI();
}

function updateRepeatButtonUI() {
  const loopIcon = btnLoop.querySelector('.material-icons-round');
  if (!loopIcon) return;

  if (repeatMode === 'none') {
    btnLoop.classList.remove('active');
    btnLoop.title = 'リピート: OFF';
    loopIcon.textContent = 'repeat';
  } else if (repeatMode === 'list') {
    btnLoop.classList.add('active');
    btnLoop.title = 'リピート: 全体ループ';
    loopIcon.textContent = 'repeat';
  } else if (repeatMode === 'track') {
    btnLoop.classList.add('active');
    btnLoop.title = 'リピート: 1曲ループ';
    loopIcon.textContent = 'repeat_one';
  }
}

// マウスホイールでの音量増減処理
function handleMouseWheelVolume(event) {
  let vol = parseInt(volumeSlider.value);
  if (event.deltaY < 0) {
    // 上スクロール: 音量アップ (+5)
    vol = Math.min(100, vol + 5);
  } else if (event.deltaY > 0) {
    // 下スクロール: 音量ダウン (-5)
    vol = Math.max(0, vol - 5);
  }
  volumeSlider.value = vol;
  handleVolumeChange();
}

function handleTimelineInput() {
  isSeeking = true;
  if (lcdCurrentTime) lcdCurrentTime.textContent = formatTime(timelineSlider.value);
  
  // ドラッグ中につまみの位置に合わせてシークバーの背景色グラデーションをリアルタイム更新する
  const current = parseFloat(timelineSlider.value);
  const total = parseFloat(timelineSlider.max) || 0;
  const percent = total > 0 ? (current / total) * 100 : 0;
  const activeColor = '#ffffff';
  const trackColor = 'rgba(255, 255, 255, 0.2)';
  timelineSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`;
}

function handleTimelineChange() {
  const seekTime = parseFloat(timelineSlider.value);
  if (midiSequencer) {
    midiSequencer.currentTime = seekTime;
    midiSequencer.playbackRate = speedSlider.value / 100;
  } else if (audioTag) {
    audioTag.currentTime = seekTime;
    if (speedSlider) {
      audioTag.playbackRate = speedSlider.value / 100;
    }
  }
  isSeeking = false;
}

function updateFileListHighlight() {
  const isPlaylistTab = currentTab === 'playlist';
  const currentPlayingTrack = playlists[playingPlaylistName]?.[currentTrackIndex];
  
  document.querySelectorAll('#file-list-body tr').forEach(tr => {
    const itemPath = tr.dataset.path;
    const isCurrentPlaying = isPlaylistTab && 
                             currentPlaylistName === playingPlaylistName && 
                             currentPlayingTrack && 
                             itemPath === currentPlayingTrack.path;
                             
    if (isCurrentPlaying) {
      tr.classList.add('playing');
    } else {
      tr.classList.remove('playing');
    }
  });
}

// ==========================================================================
// 7. 音響調整 (EQ & Volume & Speed)
// ==========================================================================

function toggleFxPopup() {
  fxPopup.classList.toggle('hidden');
}

function closeFxPopup() {
  fxPopup.classList.add('hidden');
}

function handleVolumeChange() {
  if (!volumeSlider) return;
  const vol = volumeSlider.value / 100;
  if (volumeVal) volumeVal.textContent = `${volumeSlider.value}%`;
  
  if (gainNode) gainNode.gain.value = vol;
  
  if (volumeBtn) {
    if (vol === 0) {
      volumeBtn.textContent = 'volume_off';
    } else if (vol < 0.5) {
      volumeBtn.textContent = 'volume_down';
    } else {
      volumeBtn.textContent = 'volume_up';
    }
  }
  
  localStorage.setItem('explayer_volume', volumeSlider.value);
  updateVolumeSliderBackground();
}

function loadSavedVolume() {
  if (!volumeSlider) return;
  const savedVol = localStorage.getItem('explayer_volume');
  if (savedVol !== null) {
    volumeSlider.value = savedVol;
  } else {
    volumeSlider.value = 80;
  }
  
  // UIの同期
  if (volumeVal) volumeVal.textContent = `${volumeSlider.value}%`;
  const vol = volumeSlider.value / 100;
  if (volumeBtn) {
    if (vol === 0) {
      volumeBtn.textContent = 'volume_off';
    } else if (vol < 0.5) {
      volumeBtn.textContent = 'volume_down';
    } else {
      volumeBtn.textContent = 'volume_up';
    }
  }
  updateVolumeSliderBackground();
}

function updateVolumeSliderBackground() {
  const value = volumeSlider.value;
  const percent = value;
  const activeColor = 'var(--text-primary)';
  const trackColor = 'rgba(128, 128, 128, 0.2)';
  volumeSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percent}%, ${trackColor} ${percent}%, ${trackColor} 100%)`;
}

let isMuted = false;
let preMuteVolume = 80;

function toggleMute() {
  if (isMuted) {
    volumeSlider.value = preMuteVolume;
    isMuted = false;
  } else {
    preMuteVolume = volumeSlider.value;
    volumeSlider.value = 0;
    isMuted = true;
  }
  handleVolumeChange();
}

function handleSpeedChange() {
  if (!speedSlider) return;
  const speed = speedSlider.value / 100;
  if (lcdSpeedVal) lcdSpeedVal.textContent = `${speed.toFixed(2)}x`;
  if (speedPopVal) speedPopVal.textContent = `${speed.toFixed(2)}x`;
  
  if (audioTag) audioTag.playbackRate = speed;
  if (midiSequencer) midiSequencer.playbackRate = speed;
}

function resetSpeed() {
  speedSlider.value = 100;
  handleSpeedChange();
}

function handleEQChange(band, value) {
  const db = parseFloat(value);
  const valEl = document.getElementById(`eq-${band}-val`);
  if (valEl) valEl.textContent = `${db > 0 ? '+' : ''}${db}dB`;
  
  localStorage.setItem(`explayer_eq_${band}`, value);
  
  if (!audioCtx) return;
  
  switch (band) {
    case 'low':
      if (eqLowNode) eqLowNode.gain.value = db;
      break;
    case 'mid':
      if (eqMidNode) eqMidNode.gain.value = db;
      break;
    case 'high':
      if (eqHighNode) eqHighNode.gain.value = db;
      break;
  }
}

function loadSavedEQ() {
  const low = localStorage.getItem('explayer_eq_low') || '0';
  const mid = localStorage.getItem('explayer_eq_mid') || '0';
  const high = localStorage.getItem('explayer_eq_high') || '0';
  
  eqLow.value = low;
  eqMid.value = mid;
  eqHigh.value = high;
  
  updateEQLabel('low', low);
  updateEQLabel('mid', mid);
  updateEQLabel('high', high);
}

function updateEQLabel(band, value) {
  const db = parseFloat(value);
  const valEl = document.getElementById(`eq-${band}-val`);
  if (valEl) {
    valEl.textContent = `${db > 0 ? '+' : ''}${db}dB`;
  }
}

// ==========================================================================
// 8. 液晶パネル表示制御 & トグル
// ==========================================================================

function loadSavedLcdVisibility() {
  const visible = localStorage.getItem('explayer_lcd_visible') !== 'false'; // デフォルトは表示
  setLcdPanelVisibility(visible);
}

function toggleLcdPanel() {
  const isCurrentlyVisible = !lcdPanel.classList.contains('hidden');
  setLcdPanelVisibility(!isCurrentlyVisible);
}

function setLcdPanelVisibility(visible) {
  if (visible) {
    lcdPanel.classList.remove('hidden');
    btnLcdToggle.classList.add('active');
    localStorage.setItem('explayer_lcd_visible', 'true');
  } else {
    lcdPanel.classList.add('hidden');
    btnLcdToggle.classList.remove('active');
    localStorage.setItem('explayer_lcd_visible', 'false');
  }
  
  // サイズ再計算をトリガー
  setTimeout(() => {
    resizeCanvas();
    if (!isPlaying) drawEmptyAnalyzer();
  }, 250); // アニメーション時間（styles.cssの0.2s）に合わせる
}

// ==========================================================================
// 9. カラーテーマ切り替え
// ==========================================================================

function loadSavedTheme() {
  const theme = localStorage.getItem('explayer_theme') || 'dark-mono';
  switchTheme(theme);
  themeSelector.value = theme;
}

function switchTheme(theme) {
  document.body.className = `theme-${theme}`;
  localStorage.setItem('explayer_theme', theme);
  
  updateVolumeSliderBackground();
  
  if (!isPlaying) {
    drawEmptyAnalyzer();
  }
}

// ==========================================================================
// 10. ビジュアライザー (スペクトラムアナライザー) 描画
// ==========================================================================

function resizeCanvas() {
  const container = analyzerCanvas.parentElement;
  if (!container) return;
  
  // 親コンテナに正数サイズがある場合のみ適用
  if (container.clientWidth > 0 && container.clientHeight > 0) {
    analyzerCanvas.width = container.clientWidth;
    analyzerCanvas.height = container.clientHeight;
  }
}

function drawEmptyAnalyzer() {
  const width = analyzerCanvas.width;
  const height = analyzerCanvas.height;
  
  canvasCtx.clearRect(0, 0, width, height);
  
  const isLight = document.body.className.includes('light-mono');
  canvasCtx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
  canvasCtx.lineWidth = 1;
  const gridSpacing = 8;
  
  for (let x = 0; x < width; x += gridSpacing) {
    canvasCtx.beginPath();
    canvasCtx.moveTo(x, 0);
    canvasCtx.lineTo(x, height);
    canvasCtx.stroke();
  }
  for (let y = 0; y < height; y += gridSpacing) {
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, y);
    canvasCtx.lineTo(width, y);
    canvasCtx.stroke();
  }
  
  // 波形ベースライン
  canvasCtx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)';
  canvasCtx.lineWidth = 1.5;
  canvasCtx.beginPath();
  canvasCtx.moveTo(0, height - 6);
  canvasCtx.lineTo(width, height - 6);
  canvasCtx.stroke();
}

function startVisualizer() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  function draw() {
    animationFrameId = requestAnimationFrame(draw);
    
    // 液晶パネルが隠れている場合は描画処理を完全にスキップして描画負荷をゼロにする
    if (lcdPanel && lcdPanel.classList.contains('hidden')) {
      return;
    }
    
    analyserNode.getByteFrequencyData(dataArray);
    
    const width = analyzerCanvas.width;
    const height = analyzerCanvas.height;
    
    canvasCtx.clearRect(0, 0, width, height);
    
    const theme = document.body.className;
    const isLight = theme.includes('light-mono');
    
    // 背景グリッド
    canvasCtx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.02)';
    canvasCtx.lineWidth = 1;
    const gridSpacing = 6;
    for (let x = 0; x < width; x += gridSpacing) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, 0);
      canvasCtx.lineTo(x, height);
      canvasCtx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      canvasCtx.beginPath();
      canvasCtx.moveTo(0, y);
      canvasCtx.lineTo(width, y);
      canvasCtx.stroke();
    }
    
    // 影の設定 (ループの外側で1回だけ設定することでCPU/GPU負荷を激減させる)
    if (!isLight) {
      canvasCtx.shadowBlur = 3;
      if (theme.includes('cyber')) {
        canvasCtx.shadowColor = 'rgba(0, 243, 255, 0.4)';
      } else if (theme.includes('sakura')) {
        canvasCtx.shadowColor = 'rgba(255, 183, 197, 0.4)';
      } else if (theme.includes('midnight')) {
        canvasCtx.shadowColor = 'rgba(255, 215, 0, 0.4)';
      } else if (theme.includes('retro')) {
        canvasCtx.shadowColor = 'rgba(255, 140, 0, 0.4)';
      } else {
        canvasCtx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      }
    } else {
      canvasCtx.shadowBlur = 0;
    }
    
    // バーの描画
    const barWidth = (width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * (height - 10);
      if (barHeight < 1) barHeight = 1;
      
      const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
      
      if (isLight) {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        gradient.addColorStop(0.5, 'rgba(80, 80, 80, 0.9)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0.9)');
      } else if (theme.includes('cyber')) {
        gradient.addColorStop(0, 'rgba(0, 150, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 243, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(57, 255, 20, 0.9)');
      } else if (theme.includes('sakura')) {
        gradient.addColorStop(0, 'rgba(132, 94, 97, 0.8)');
        gradient.addColorStop(0.5, 'rgba(220, 167, 171, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 183, 197, 0.9)');
      } else if (theme.includes('midnight')) {
        gradient.addColorStop(0, 'rgba(71, 85, 105, 0.8)');
        gradient.addColorStop(0.5, 'rgba(148, 163, 184, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.9)');
      } else if (theme.includes('retro')) {
        gradient.addColorStop(0, 'rgba(139, 90, 43, 0.8)');
        gradient.addColorStop(0.5, 'rgba(205, 133, 63, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 140, 0, 0.9)');
      } else {
        gradient.addColorStop(0, 'rgba(220, 220, 220, 0.85)');
        gradient.addColorStop(0.5, 'rgba(170, 170, 170, 0.9)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.9)');
      }
      
      canvasCtx.fillStyle = gradient;
      
      const barY = height - barHeight - 3;
      drawRoundedRect(canvasCtx, x, barY, barWidth - 1.5, barHeight, 1.5);
      
      x += barWidth + 0.5;
    }
    canvasCtx.shadowBlur = 0;
  }
  
  draw();
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// ==========================================================================
// 11. ユーティリティ関数
// ==========================================================================

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

let pendingPlayAfterAdd = false;

// プレイリストの動的タブUIの描画更新
function renderPlaylistTabs() {
  const container = document.getElementById('playlist-tabs-container');
  if (!container) return;

  container.innerHTML = '';
  Object.keys(playlists).forEach(name => {
    const btn = document.createElement('button');
    const isActive = name === currentPlaylistName && currentTab === 'playlist';
    const isCurrentlyPlayingThis = name === playingPlaylistName && isPlaying;
    btn.className = `tab-button tab-button-playlist ${isActive ? 'active' : ''} ${isCurrentlyPlayingThis ? 'playing' : ''}`;
    
    // リスト名と曲数
    const labelSpan = document.createElement('span');
    if (isCurrentlyPlayingThis) {
      labelSpan.innerHTML = `<span class="material-icons-round tab-play-icon" style="font-size: 12.5px; vertical-align: middle; margin-right: 4px; display: inline-flex; align-items: center; justify-content: center; height: 12px; line-height: 1;">volume_up</span>${name} (${playlists[name].length})`;
    } else {
      labelSpan.textContent = `${name} (${playlists[name].length})`;
    }
    btn.appendChild(labelSpan);
    
    // 削除ボタン (最低1つのプレイリストを残す)
    const keys = Object.keys(playlists);
    if (keys.length > 1) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn-tab-close';
      closeBtn.innerHTML = '<span class="material-icons-round">close</span>';
      closeBtn.title = '演奏リストを削除';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // タブ切り替えを防ぐ
        deletePlaylistByName(name);
      });
      btn.appendChild(closeBtn);
    }
    
    btn.addEventListener('click', () => {
      switchPlaylist(name);
      switchTab('playlist');
    });
    
    container.appendChild(btn);
  });
}

// プレイリスト切り替え
function switchPlaylist(name) {
  if (!playlists[name]) return;
  
  playlists[currentPlaylistName] = playlist;
  currentPlaylistName = name;
  playlist = playlists[name];
  
  savePlaylist();
  
  if (currentTab === 'playlist') {
    renderFileList(playlist);
  }
  updateFileListHighlight();
}

// 新規プレイリスト作成モーダルを開く
function handleCreateNewPlaylistClick() {
  if (newPlaylistModal && newPlaylistInputName) {
    newPlaylistInputName.value = '';
    newPlaylistModal.classList.remove('hidden');
    setTimeout(() => newPlaylistInputName.focus(), 50);
  }
}

// 新規プレイリスト作成モーダルを閉じる
function closeNewPlaylistModal() {
  if (newPlaylistModal) {
    newPlaylistModal.classList.add('hidden');
  }
}

// 新規プレイリスト作成の確定処理
function confirmCreateNewPlaylist() {
  if (!newPlaylistInputName) return;
  
  const name = newPlaylistInputName.value;
  const trimmed = name.trim();
  if (!trimmed) {
    alert("演奏リスト名を入力してください。");
    return;
  }
  if (playlists[trimmed]) {
    alert("その演奏リスト名は既に存在します。");
    return;
  }

  playlists[trimmed] = [];
  closeNewPlaylistModal();
  switchPlaylist(trimmed);
  switchTab('playlist'); // プレイリスト表示へ切り替え
}

// プレイリストの削除 (名前指定)
function deletePlaylistByName(name) {
  const keys = Object.keys(playlists);
  if (keys.length <= 1) {
    alert("これ以上演奏リストを削除できません。最低1つのリストが必要です。");
    return;
  }

  if (confirm(`演奏リスト「${name}」を削除しますか？`)) {
    // 削除対象の再生状態の停止
    if (name === currentPlaylistName) {
      stopCurrentPlayback();
      currentTrackIndex = -1;
    }

    delete playlists[name];
    
    // 残りのリストに切り替え
    const remainingKeys = Object.keys(playlists);
    const nextActive = remainingKeys.includes(currentPlaylistName) ? currentPlaylistName : remainingKeys[0];
    switchPlaylist(nextActive);
  }
}

// 選択状態のUI更新
function updateSelectionUI() {
  const rows = fileListBody.querySelectorAll('tr');
  rows.forEach(tr => {
    const idx = parseInt(tr.dataset.index);
    if (isNaN(idx)) return;
    if (selectedIndices.includes(idx)) {
      tr.classList.add('selected');
    } else {
      tr.classList.remove('selected');
    }
  });

  const selectedActions = document.getElementById('selected-actions');
  if (selectedActions) {
    if (selectedIndices.length > 1) {
      selectedActions.style.display = 'flex';
      
      const btnAddSelected = document.getElementById('btn-add-selected');
      const btnDeleteSelected = document.getElementById('btn-delete-selected');
      
      if (currentTab === 'files') {
        if (btnAddSelected) btnAddSelected.style.display = 'inline-flex';
        if (btnDeleteSelected) btnDeleteSelected.style.display = 'none';
        const countEl = document.getElementById('selected-count');
        if (countEl) countEl.textContent = selectedIndices.length;
      } else { // 'playlist' タブ
        if (btnAddSelected) btnAddSelected.style.display = 'none';
        if (btnDeleteSelected) btnDeleteSelected.style.display = 'inline-flex';
        const deleteCountEl = document.getElementById('selected-delete-count');
        if (deleteCountEl) deleteCountEl.textContent = selectedIndices.length;
      }
    } else {
      selectedActions.style.display = 'none';
    }
  }
}

// 演奏リストの選択項目を一括削除するクリック処理
function handleDeleteSelectedClick() {
  if (selectedIndices.length === 0) return;
  
  if (confirm(`選択した ${selectedIndices.length} 曲を演奏リストから削除しますか？`)) {
    // ソートが効いている状態でも正しく削除できるようにするため、
    // ソート後の画面表示されている順序のリスト（sortedSource）から選択されたファイルのパスを取得します。
    const sortedSource = getSortedFileList(playlist);
    const pathsToRemove = selectedIndices.map(idx => sortedSource[idx]?.path).filter(Boolean);
    
    const currentPlayingTrack = playlists[playingPlaylistName]?.[currentTrackIndex];
    const playingPath = currentPlayingTrack ? currentPlayingTrack.path : null;
    
    // 元のプレイリストから、選択されたパスと一致するファイルを削除
    playlist = playlist.filter(file => !pathsToRemove.includes(file.path));
    
    savePlaylist();
    
    // 再生中だった曲の位置を再計算する
    if (playingPath) {
      const newPlayingIdx = playlist.findIndex(f => f.path === playingPath);
      if (newPlayingIdx >= 0) {
        currentTrackIndex = newPlayingIdx;
      } else {
        stopCurrentPlayback();
        currentTrackIndex = -1;
      }
    } else {
      currentTrackIndex = -1;
    }
    
    clearFileSelection();
    renderFileList(playlist);
    updateFileListHighlight();
  }
}

// 選択クリア
function clearFileSelection() {
  selectedIndices = [];
  lastSelectedIndex = -1;
  updateSelectionUI();
}

// 選択項目を一括で追加するクリック処理
function handleAddSelectedClick() {
  if (selectedIndices.length === 0) return;
  
  const sourceList = currentTab === 'files' ? currentFolderFiles : playlist;
  const sortedSource = getSortedFileList(sourceList);
  const filesToAdd = selectedIndices.map(idx => sortedSource[idx]).filter(Boolean);
  
  if (filesToAdd.length > 0) {
    showAddConfirmModal(filesToAdd);
  }
}

// モーダルオープン
function showAddConfirmModal(files, playAfterAdd = false) {
  pendingAddFiles = files;
  pendingPlayAfterAdd = playAfterAdd;

  if (addConfirmText) {
    addConfirmText.textContent = `選択した ${files.length} 曲を演奏リストに追加しますか？`;
  }

  const modalSelect = document.getElementById('modal-playlist-select');
  if (modalSelect) {
    modalSelect.innerHTML = '';
    Object.keys(playlists).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === currentPlaylistName) {
        opt.selected = true;
      }
      modalSelect.appendChild(opt);
    });
  }

  if (modalCreateNewCheck) {
    modalCreateNewCheck.checked = false;
  }
  if (modalNewPlaylistField) {
    modalNewPlaylistField.classList.add('hidden');
  }
  if (modalNewPlaylistName) {
    modalNewPlaylistName.value = '';
  }

  if (addConfirmModal) {
    addConfirmModal.classList.remove('hidden');
  }
}

// モーダルクローズ
function closeAddConfirmModal() {
  if (addConfirmModal) {
    addConfirmModal.classList.add('hidden');
  }
  pendingAddFiles = [];
  pendingPlayAfterAdd = false;
}

// モーダル確定処理
function confirmAddPendingFiles() {
  if (pendingAddFiles.length === 0) return;

  let targetPlaylistName = currentPlaylistName;

  if (modalCreateNewCheck && modalCreateNewCheck.checked) {
    const newName = modalNewPlaylistName.value.trim();
    if (!newName) {
      alert("新規作成する演奏リスト名を入力してください。");
      return;
    }
    if (playlists[newName]) {
      alert("その演奏リスト名は既に存在します。");
      return;
    }
    
    playlists[newName] = [];
    targetPlaylistName = newName;
  } else {
    const modalSelect = document.getElementById('modal-playlist-select');
    if (modalSelect) {
      targetPlaylistName = modalSelect.value;
    }
  }

  const targetList = playlists[targetPlaylistName] || [];
  let addedCount = 0;
  pendingAddFiles.forEach(file => {
    const exists = targetList.some(f => f.path === file.path);
    if (!exists) {
      targetList.push(file);
      addedCount++;
    }
  });

  playlists[targetPlaylistName] = targetList;
  
  if (currentPlaylistName !== targetPlaylistName) {
    switchPlaylist(targetPlaylistName);
    switchTab('playlist');
  } else {
    playlist = targetList;
    savePlaylist();
    if (currentTab === 'playlist') {
      renderFileList(playlist);
    }
  }

  if (pendingPlayAfterAdd && pendingAddFiles.length > 0) {
    const playFile = pendingAddFiles[0];
    const playIdx = playlist.findIndex(f => f.path === playFile.path);
    if (playIdx >= 0) {
      playTrack(playIdx);
    }
  }

  closeAddConfirmModal();
  clearFileSelection();
}

// 名前ソート切り替え
function toggleNameSort() {
  // 1. ソート方向を切り替える
  sortDirection = (sortDirection === 'none') ? 'asc' : (sortDirection === 'asc' ? 'desc' : 'none');
  
  // 2. 選択状態の再マッピング (ファイルパスベース)
  const sourceList = currentTab === 'playlist' ? playlist : currentFolderFiles;
  const query = fileSearch.value.toLowerCase().trim();
  const activeList = query === '' ? sourceList : sourceList.filter(file => file.name.toLowerCase().includes(query));
  
  // ソート切り替え前のリストで選択されているファイルのパスを抽出
  const originalSorted = getSortedFileList(activeList);
  const selectedPaths = selectedIndices.map(idx => originalSorted[idx]?.path).filter(Boolean);
  
  // 3. UIの再描画
  updateSortIndicatorUI();
  
  if (currentTab === 'playlist') {
    renderFileList(playlist);
  } else {
    renderFileList(currentFolderFiles);
  }
  
  // 4. ソート適用後のリストでインデックスを再マッピングしてハイライトを更新
  const newSorted = getSortedFileList(activeList);
  selectedIndices = selectedPaths.map(path => newSorted.findIndex(f => f.path === path)).filter(idx => idx >= 0);
  updateSelectionUI();
}

// ソートされたファイル配列を取得
function getSortedFileList(files) {
  if (sortDirection === 'none') {
    return [...files];
  }
  
  const sorted = [...files];
  sorted.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    
    if (sortDirection === 'asc') {
      return nameA.localeCompare(nameB, 'ja', { numeric: true, sensitivity: 'base' });
    } else {
      return nameB.localeCompare(nameA, 'ja', { numeric: true, sensitivity: 'base' });
    }
  });
  
  return sorted;
}

// ソートインジケーター表示の更新
function updateSortIndicatorUI() {
  const indicator = document.getElementById('sort-indicator');
  if (!indicator) return;
  
  if (sortDirection === 'asc') {
    indicator.textContent = '▲';
  } else if (sortDirection === 'desc') {
    indicator.textContent = '▼';
  } else {
    indicator.textContent = '';
  }
}

// ドラッグ中のオートスクロール開始
function startAutoScroll() {
  if (autoScrollTimer) return;
  
  autoScrollTimer = setInterval(() => {
    if (!isDraggingFiles) {
      stopAutoScroll();
      return;
    }
    
    const container = document.querySelector('.file-list-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const scrollSpeed = 8; // スクロール速度（ピクセル）
    let scrolled = false;
    
    if (lastDragY < rect.top + 20) {
      // 上スクロール
      container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
      scrolled = true;
    } else if (lastDragY > rect.bottom - 20) {
      // 下スクロール
      container.scrollTop = Math.min(container.scrollHeight - container.clientHeight, container.scrollTop + scrollSpeed);
      scrolled = true;
    }
    
    if (scrolled) {
      // スクロールされた結果、マウス座標の下に入ってきた行を検知して選択範囲を更新
      const element = document.elementFromPoint(lastDragX, lastDragY);
      if (element) {
        const tr = element.closest('#file-list-body tr');
        if (tr) {
          const idx = parseInt(tr.dataset.index);
          if (!isNaN(idx) && lastSelectedIndex >= 0) {
            const start = Math.min(lastSelectedIndex, idx);
            const end = Math.max(lastSelectedIndex, idx);
            selectedIndices = [];
            for (let i = start; i <= end; i++) {
              selectedIndices.push(i);
            }
            updateSelectionUI();
          }
        }
      }
    }
  }, 30);
}

// ドラッグ中のオートスクロール停止
function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
}

// 最前面表示の読み込みと適用
function loadSavedAlwaysOnTop() {
  const saved = localStorage.getItem('explayer_always_on_top') === 'true';
  setAlwaysOnTopState(saved);
}

function toggleAlwaysOnTop() {
  const active = !btnAlwaysOnTop.classList.contains('active');
  setAlwaysOnTopState(active);
}

function setAlwaysOnTopState(active) {
  if (!btnAlwaysOnTop) return;
  if (active) {
    btnAlwaysOnTop.classList.add('active');
  } else {
    btnAlwaysOnTop.classList.remove('active');
  }
  localStorage.setItem('explayer_always_on_top', active ? 'true' : 'false');
  window.api.setAlwaysOnTop(active);
}

// ファイル関連付けの初期化
async function initFileAssociation() {
  if (chkAssociation) {
    try {
      const isAssociated = await window.api.checkAssociation();
      chkAssociation.checked = isAssociated;
    } catch (e) {
      console.error('Failed to check association:', e);
    }
  }
}

// ファイル関連付けトグル処理
async function handleAssociationToggle() {
  if (!chkAssociation) return;
  const enable = chkAssociation.checked;
  try {
    const success = await window.api.setAssociation(enable);
    if (!success) {
      alert('ファイルの関連付け設定の更新に失敗しました。');
      chkAssociation.checked = !enable; // 状態を戻す
    }
  } catch (e) {
    console.error('Failed to set association:', e);
    alert('関連付け設定の処理中にエラーが発生しました。');
    chkAssociation.checked = !enable;
  }
}

// 起動時および二重起動時のファイル引数を処理
async function handleStartAndArgsFiles() {
  // 1. 1つのインスタンス起動時に渡されたファイルを取得
  try {
    const startFile = await window.api.getStartFile();
    if (startFile) {
      await playDirectFile(startFile);
    }
  } catch (e) {
    console.error('Failed to handle start file:', e);
  }

  // 2. 二重起動時にメインプロセスから送られてくるファイルを処理
  window.api.onOpenFile(async (filePath) => {
    await playDirectFile(filePath);
  });
}

// 指定したファイルを「デフォルト」プレイリストに追加して即再生する
async function playDirectFile(filePath) {
  if (!filePath) return;

  // バックスラッシュまたはスラッシュからファイル名を取得
  const lastSep = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
  const fileName = lastSep >= 0 ? filePath.substring(lastSep + 1) : filePath;
  const dotIndex = filePath.lastIndexOf('.');
  const ext = dotIndex >= 0 ? filePath.substring(dotIndex).toLowerCase() : '';

  const fileObj = {
    name: fileName,
    path: filePath,
    ext: ext,
    type: 'file'
  };

  // 「デフォルト」プレイリストを取得、なければ作成
  if (!playlists["デフォルト"]) {
    playlists["デフォルト"] = [];
  }

  const defaultList = playlists["デフォルト"];
  let index = defaultList.findIndex(f => f.path === filePath);

  if (index === -1) {
    defaultList.push(fileObj);
    playlists["デフォルト"] = defaultList;
    index = defaultList.length - 1;
  }

  // もし現在アクティブなプレイリストが「デフォルト」でなければ切り替える
  if (currentPlaylistName !== "デフォルト") {
    switchPlaylist("デフォルト");
  } else {
    playlist = defaultList;
  }

  savePlaylist();

  if (currentTab !== 'playlist') {
    switchTab('playlist');
  } else {
    renderFileList(playlist);
  }

  // 再生
  await playTrack(index);
}

// 起動
init();

