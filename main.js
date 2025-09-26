let ctx;
let source;
let gainNode;
const fade = 2.5;

async function playPad() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (source) return; // если уже играет, не создаём новый

  const response = await fetch("Pads/Dwell_pads.wav");
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.loop = true;

  gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, ctx.currentTime); // старт с тишины
  source.connect(gainNode).connect(ctx.destination);

  source.detune.value = 0;

  source.start(0);

  // плавный вход (fade in) за 2 секунды
  gainNode.gain.linearRampToValueAtTime(1.0, ctx.currentTime + fade);
}

function stopPad() {
  if (!source) return;

  // плавный выход (fade out) за 2 секунды
  gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime); // берём текущую громкость
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);

  // останавливаем источник после окончания fade out
  setTimeout(() => {
    if (source) {
      source.stop();
      source.disconnect();
      source = null;
      gainNode = null;
    }
  }, fade * 1000); // 2000 мс = время fade out
}

document.getElementById("playBtn").onclick = playPad;
document.getElementById("stopBtn").onclick = stopPad;