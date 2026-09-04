const tbTrackTitle = document.getElementById('tb-track-title');
const tbProgressFill = document.getElementById('tb-progress-fill');
const tbCurrentTime = document.getElementById('tb-current-time');
const tbTotalTime = document.getElementById('tb-total-time');
const btnPrev = document.getElementById('tb-btn-prev');
const btnPlay = document.getElementById('tb-btn-play');
const btnNext = document.getElementById('tb-btn-next');
const playIcon = document.getElementById('tb-play-icon');
const btnMain = document.getElementById('tb-btn-main');
const btnClose = document.getElementById('tb-btn-close');

if (window.api) {
  btnMain.addEventListener('click', () => {
    window.api.showMainWindow();
  });

  btnClose.addEventListener('click', () => {
    window.api.hideTaskbarBarWindow();
  });

  btnPrev.addEventListener('click', () => {
    window.api.sendTaskbarBarControl('prev');
  });

  btnPlay.addEventListener('click', () => {
    window.api.sendTaskbarBarControl('play-pause');
  });

  btnNext.addEventListener('click', () => {
    window.api.sendTaskbarBarControl('next');
  });

  window.api.onUpdateTaskbarBarState((state) => {
    if (!state) return;
    
    if (state.title) tbTrackTitle.textContent = state.title;
    if (state.currentTimeStr) tbCurrentTime.textContent = state.currentTimeStr;
    if (state.totalTimeStr) tbTotalTime.textContent = state.totalTimeStr;
    
    if (typeof state.progress === 'number' && !isUserSeeking) {
      const pct = Math.min(100, Math.max(0, state.progress * 100));
      tbProgressFill.style.width = `${pct}%`;
      if (tbSlider) tbSlider.value = pct;
    }
    
    if (typeof state.isPlaying === 'boolean') {
      playIcon.textContent = state.isPlaying ? 'pause' : 'play_arrow';
      btnPlay.title = state.isPlaying ? '一時停止' : '再生';
    }
  });
}

// シーク操作 & ツールチップ
const tbSlider = document.getElementById('tb-timeline-slider');
const tbTooltip = document.getElementById('tb-tooltip');
let isUserSeeking = false;

if (tbSlider) {
  tbSlider.addEventListener('input', (e) => {
    isUserSeeking = true;
    const val = parseFloat(e.target.value);
    tbProgressFill.style.width = `${val}%`;
  });

  tbSlider.addEventListener('change', (e) => {
    isUserSeeking = false;
    const val = parseFloat(e.target.value);
    if (window.api && window.api.seekToPercent) {
      window.api.seekToPercent(val / 100);
    }
  });

  // タイムツールチップ
  tbSlider.addEventListener('mousemove', (e) => {
    if (!tbTooltip) return;
    const rect = tbSlider.getBoundingClientRect();
    if (rect.width <= 0) return;
    const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = offsetX / rect.width;
    
    const totalTimeText = tbTotalTime ? tbTotalTime.textContent : '00:00';
    const parts = totalTimeText.split(':').map(Number);
    const totalSec = parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
    const targetSec = totalSec * percent;

    const m = Math.floor(targetSec / 60);
    const s = Math.floor(targetSec % 60);
    tbTooltip.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    tbTooltip.style.left = `${offsetX}px`;
    tbTooltip.classList.add('visible');
  });

  tbSlider.addEventListener('mouseleave', () => {
    if (tbTooltip) tbTooltip.classList.remove('visible');
  });
}

// マウスホイールでの音量操作 & OSD表示
const tbVolumeOsd = document.getElementById('tb-volume-osd');
const tbOsdText = document.getElementById('tb-osd-text');
let tbOsdTimer = null;

function showTbOSD(delta) {
  if (!tbVolumeOsd) return;
  tbVolumeOsd.classList.remove('hidden');
  clearTimeout(tbOsdTimer);
  tbOsdTimer = setTimeout(() => {
    tbVolumeOsd.classList.add('hidden');
  }, 1000);
}

const handleWheelVol = (e) => {
  if (window.api && window.api.adjustVolume) {
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    window.api.adjustVolume(delta);
    showTbOSD(delta);
  }
};
window.addEventListener('wheel', handleWheelVol, { passive: true });
document.addEventListener('wheel', handleWheelVol, { passive: true });
