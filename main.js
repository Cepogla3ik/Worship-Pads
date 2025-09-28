const launchPadElements = document.querySelectorAll('button');

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

const ctx = new (window.AudioContext || window.webkitAudioContext)();

// Превращаем NodeList в массив, чтобы использовать map
const padsState = Array.from(launchPadElements).map(() => ({
  source: null,
  gainNode: null,
  isPlaying: false
}));

async function playPad(padIndex) {
  const padState = padsState[padIndex];
  if (padState.isPlaying) return;

  const padName = warmPadPitchesArray[padIndex].replace('sharp', '');
  const response = await fetch(`${padName}.mp3`);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, ctx.currentTime); // старт с тишины
  source.connect(gainNode).connect(ctx.destination);

  if (warmPadPitchesArray[padIndex].includes('sharp')) {
    source.detune.value = 100; // +100 центов = полутон выше
  }

  source.start(0);
  gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.5); // fade in 0.5 сек

  padState.source = source;
  padState.gainNode = gainNode;
  padState.isPlaying = true;
}

function stopPad(padIndex) {
  const padState = padsState[padIndex];
  if (!padState.isPlaying || !padState.source) return;

  padState.gainNode.gain.setValueAtTime(padState.gainNode.gain.value, ctx.currentTime);
  padState.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); // fade out 0.5 сек

  setTimeout(() => {
    if (padState.source) {
      padState.source.stop();
      padState.source.disconnect();
      padState.gainNode.disconnect();
      padState.source = null;
      padState.gainNode = null;
      padState.isPlaying = false;
    }
  }, 500);
}

// Назначаем клики на каждый pad
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

// Контроль общей громкости
const volumeSetUpElement = document.querySelector('#volume-set-up');
const volumeValueElement = document.querySelector('#volume-value');
volumeSetUpElement.addEventListener('input', () => {
  const vol = parseFloat(volumeSetUpElement.value);
  volumeValueElement.innerHTML = vol;
  padsState.forEach(pad => {
    if (pad.gainNode) pad.gainNode.gain.setValueAtTime(vol, ctx.currentTime);
  });
});
