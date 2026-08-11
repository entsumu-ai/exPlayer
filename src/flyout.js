// Flyout DOM要素の参照
const btnShowMain = document.getElementById('btn-show-main');
const btnCloseFlyout = document.getElementById('btn-close-flyout');
const trackTitleEl = document.getElementById('flyout-track-title');
const playlistNameEl = document.getElementById('flyout-playlist-name');
const progressFill = document.getElementById('flyout-progress-fill');
const currentTimeEl = document.getElementById('flyout-current-time');
const totalTimeEl = document.getElementById('flyout-total-time');
const btnPrev = document.getElementById('flyout-btn-prev');
const btnPlay = document.getElementById('flyout-btn-play');
const btnNext = document.getElementById('flyout-btn-next');
const playIcon = document.getElementById('flyout-play-icon');

// IPC経由のイベントリスナー
if (window.api) {
  // メイン画面を開く
  btnShowMain.addEventListener('click', () => {
    window.api.showMainWindow();
  });

  // Flyoutを閉じる（非表示）
  btnCloseFlyout.addEventListener('click', () => {
    window.api.hideFlyoutWindow();
  });

  // コントロールボタン
  btnPrev.addEventListener('click', () => {
    window.api.sendFlyoutControl('prev');
  });

  btnPlay.addEventListener('click', () => {
    window.api.sendFlyoutControl('play-pause');
  });

  btnNext.addEventListener('click', () => {
    window.api.sendFlyoutControl('next');
  });

  // トラック状態のリアルタイム受信
  window.api.onUpdateFlyoutState((state) => {
    if (!state) return;
    
    if (state.title) trackTitleEl.textContent = state.title;
    if (state.playlist) playlistNameEl.textContent = state.playlist;
    if (state.currentTimeStr) currentTimeEl.textContent = state.currentTimeStr;
    if (state.totalTimeStr) totalTimeEl.textContent = state.totalTimeStr;
    
    if (typeof state.progress === 'number' && !isUserSeeking) {
      const pct = Math.min(100, Math.max(0, state.progress * 100));
      progressFill.style.width = `${pct}%`;
      if (flyoutSlider) flyoutSlider.value = pct;
    }
    
    if (typeof state.isPlaying === 'boolean') {
      playIcon.textContent = state.isPlaying ? 'pause' : 'play_arrow';
      btnPlay.title = state.isPlaying ? '一時停止' : '再生';
    }
  });
}

// シーク操作
const flyoutSlider = document.getElementById('flyout-timeline-slider');
let isUserSeeking = false;

if (flyoutSlider) {
  flyoutSlider.addEventListener('input', (e) => {
    isUserSeeking = true;
    const val = parseFloat(e.target.value);
    progressFill.style.width = `${val}%`;
  });

  flyoutSlider.addEventListener('change', (e) => {
    isUserSeeking = false;
    const val = parseFloat(e.target.value);
    if (window.api && window.api.seekToPercent) {
      window.api.seekToPercent(val / 100);
    }
  });
}

// マウスホイールでの音量操作
document.addEventListener('wheel', (e) => {
  if (window.api && window.api.adjustVolume) {
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    window.api.adjustVolume(delta);
  }
}, { passive: true });
