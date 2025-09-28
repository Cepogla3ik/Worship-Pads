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

const ctx = new(window.AudioContext || window.webkitAudioContext)();

const padsState = Array.from(launchPadElements).map(() => ({
  source: null,
  gainNode: null,
  isPlaying: false
}));

const audioBuffers = [];

launchPadElements.forEach(btn => btn.disabled = true);

async function preloadPads() {
  for (let padName of warmPadPitchesArray) {
    const response = await fetch(`${padName.replace('sharp','')}.mp3`);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    audioBuffers.push(audioBuffer);
  }

  console.log("✅ All pads have been loaded!");
  launchPadElements.forEach(btn => btn.disabled = false);
}


async function playPad(padIndex) {
  const padState = padsState[padIndex];
  if (padState.isPlaying) return;

  const audioBuffer = audioBuffers[padIndex];

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
