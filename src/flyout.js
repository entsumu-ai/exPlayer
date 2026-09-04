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
  const flyoutArtImg = document.getElementById('flyout-album-art');
  const flyoutArtIcon = document.getElementById('flyout-art-icon');
  const flyoutVolumeOsd = document.getElementById('flyout-volume-osd');
  const flyoutOsdVal = document.getElementById('flyout-osd-text');
  const flyoutTooltip = document.getElementById('flyout-tooltip');
  let flyoutOsdTimer = null;

  window.api.onUpdateFlyoutState((state) => {
    if (!state) return;
    
    if (state.title) trackTitleEl.textContent = state.title;
    if (state.playlist) playlistNameEl.textContent = state.playlist;
    if (state.currentTimeStr) currentTimeEl.textContent = state.currentTimeStr;
    if (state.totalTimeStr) totalTimeEl.textContent = state.totalTimeStr;

    // アルバムアートの同期
    if (flyoutArtImg && flyoutArtIcon) {
      if (state.artUrl) {
        flyoutArtImg.src = state.artUrl;
        flyoutArtImg.style.display = 'block';
        flyoutArtIcon.style.display = 'none';
      } else {
        flyoutArtImg.src = '';
        flyoutArtImg.style.display = 'none';
        flyoutArtIcon.style.display = 'inline-block';
      }
    }
    
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

  // 音量変更通知の受信 (OSD表示用)
  if (window.api.onAdjustVolume) {
    window.api.onAdjustVolume(() => {
      // メイン側で同期
    });
  }
}

// シーク操作 & ツールチップ
const flyoutSlider = document.getElementById('flyout-timeline-slider');
const flyoutTooltip = document.getElementById('flyout-tooltip');
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

  // ホバーツールチップ
  flyoutSlider.addEventListener('mousemove', (e) => {
    if (!flyoutTooltip) return;
    const rect = flyoutSlider.getBoundingClientRect();
    if (rect.width <= 0) return;
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    
    // totalTimeStrから秒数を推定、または大まかなパーセント換算
    const totalTimeText = totalTimeEl ? totalTimeEl.textContent : '00:00';
    const parts = totalTimeText.split(':').map(Number);
    const totalSec = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
    const targetSec = totalSec * percent;

    const m = Math.floor(targetSec / 60);
    const s = Math.floor(targetSec % 60);
    flyoutTooltip.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    flyoutTooltip.style.left = `${offsetX}px`;
    flyoutTooltip.classList.add('visible');
  });

  flyoutSlider.addEventListener('mouseleave', () => {
    if (flyoutTooltip) flyoutTooltip.classList.remove('visible');
  });
}

// マウスホイールでの音量操作 & OSD表示
const flyoutVolumeOsd = document.getElementById('flyout-volume-osd');
const flyoutOsdVal = document.getElementById('flyout-osd-text');
let flyoutOsdTimer = null;

function showFlyoutOSD(delta) {
  if (!flyoutVolumeOsd) return;
  flyoutVolumeOsd.classList.remove('hidden');
  clearTimeout(flyoutOsdTimer);
  flyoutOsdTimer = setTimeout(() => {
    flyoutVolumeOsd.classList.add('hidden');
  }, 1000);
}

const handleFlyoutWheelVol = (e) => {
  if (window.api && window.api.adjustVolume) {
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    window.api.adjustVolume(delta);
    showFlyoutOSD(delta);
  }
};
window.addEventListener('wheel', handleFlyoutWheelVol, { passive: true });
document.addEventListener('wheel', handleFlyoutWheelVol, { passive: true });
