const loadingScreenElement = document.querySelector('#loading-screen');
const padsLoadingElement = document.querySelector('#pads-loading');
const skipLoadingScreenElement = document.querySelector('#skip-loading-screen');
const launchPadElements = document.querySelectorAll('#launch-pads-container button');

skipLoadingScreenElement.onclick = () => {
  padsLoadingElement.style.display = 'none';
  loadingScreenElement.style.display = 'none';
  skipLoadingScreenElement.style.display = 'none';
  progressBarContainer.style.display = 'none';
  
  launchPadElements.forEach(btn => btn.disabled = false);
}

const warmPadPitchesArray = [
  'C-WarmChurchfrontPads',
  'Csharp-WarmChurchfrontPads',
  'D-WarmChurchfrontPads',
  'Dsharp-WarmChurchfrontPads',
  'E-WarmChurchfrontPads',
  'F-WarmChurchfrontPads',
  'Fsharp-WarmChurchfrontPads',
  'G-WarmChurchfrontPads',
  'Gsharp-WarmChurchfrontPads',
  'A-WarmChurchfrontPads',
  'Asharp-WarmChurchfrontPads',
  'B-WarmChurchfrontPads'
];

const ctx = new(window.AudioContext || window.webkitAudioContext)();

const padsState = Array.from(launchPadElements).map(() => ({
  source: null,
  gainNode: null,
  isPlaying: false
}));

launchPadElements.forEach(btn => btn.disabled = true);

const progressBar = document.querySelector('#audio-loading-progress-bar').querySelector('div');
const progressBarContainer = document.querySelector('#audio-loading-progress-bar');
const audioBuffers = new Array(warmPadPitchesArray.length).fill(null);

async function loadPad(padIndex) {
  if (audioBuffers[padIndex]) return audioBuffers[padIndex]; // уже загружен

  const padName = warmPadPitchesArray[padIndex];
  const response = await fetch(`${padName.replace('sharp','')}.mp3`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  audioBuffers[padIndex] = audioBuffer;

  return audioBuffer;
}

async function playPad(padIndex) {
  const padState = padsState[padIndex];
  if (padState.isPlaying) return;

  const audioBuffer = await loadPad(padIndex); // если ещё не загружен — грузим

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;

  const gainNode = ctx.createGain();
  const targetVolume = Number(volumeValueElement.innerText);
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  source.connect(gainNode).connect(ctx.destination);

  if (warmPadPitchesArray[padIndex].includes('sharp')) {
    source.detune.value = 100;
  }

  source.start(0);
  gainNode.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 2);

  padState.source = source;
  padState.gainNode = gainNode;
  padState.isPlaying = true;
}

// кнопки активные сразу
launchPadElements.forEach(btn => btn.disabled = false);

// Фоновая загрузка всех пэдов параллельно
async function preloadPads() {
  const promises = warmPadPitchesArray.map(async (padName, i) => {
    const response = await fetch(`${padName.replace('sharp','')}.mp3`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioBuffers[i] = audioBuffer;

    // прогрессбар
    const loadedCount = audioBuffers.filter(Boolean).length;
    const percent = (loadedCount / warmPadPitchesArray.length) * 100;
    progressBar.style.width = percent + "%";
  });

  await Promise.all(promises);

  padsLoadingElement.style.display = 'none';
  loadingScreenElement.style.display = 'none';
  skipLoadingScreenElement.style.display = 'none';
  progressBarContainer.style.display = 'none';

  console.log("✅ Все пэды загружены!");
}


function stopPad(padIndex) {
  const padState = padsState[padIndex];
  if (!padState.isPlaying || !padState.source) return;

  padState.gainNode.gain.setValueAtTime(padState.gainNode.gain.value, ctx.currentTime);
  padState.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);

  setTimeout(() => {
    if (padState.source) {
      padState.source.stop();
      padState.source.disconnect();
      padState.gainNode.disconnect();
      padState.source = null;
      padState.gainNode = null;
      padState.isPlaying = false;
    }
  }, 2500);
}

launchPadElements.forEach((launchPad, padIndex) => {
  launchPad.addEventListener('click', () => {
    const padState = padsState[padIndex];
    if (!padState.isPlaying) {
      launchPad.classList.add('launch-pad-playing', 'slime-pressing');
      playPad(padIndex);
    } else {
      launchPad.classList.remove('launch-pad-playing', 'slime-pressing');
      stopPad(padIndex);
    }
  });
});

const volumeSetUpElement = document.querySelector('#volume-set-up');
const volumeValueElement = document.querySelector('#volume-value');
volumeSetUpElement.addEventListener('input', () => {
  const vol = parseFloat(volumeSetUpElement.value);
  volumeValueElement.innerText = vol.toFixed(2);

  padsState.forEach(pad => {
    if (pad.gainNode) pad.gainNode.gain.setValueAtTime(vol, ctx.currentTime);
  });
});

preloadPads();

console.log('innerWidth', window.innerWidth);
console.log('innerHeight', window.innerHeight);
