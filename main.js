const launchPadsContainerElement = document.querySelector('#launch-pads-container');
const launchPadElements = document.querySelectorAll('button');

// update ?
launchPadElements.forEach((launchPad, padIndex) => {
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
  function fadeOut(audio, duration = 500) {
    const step = 50;
    const volumeStep = audio.volume / (duration / step);

    const fade = setInterval(() => {
      if (audio.volume - volumeStep > 0) {
        audio.volume -= volumeStep;
      } else {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        clearInterval(fade);
        audio.volume = 1;
      }
    }, step);
  }
  let isPlaying = null;
  let pad;

  launchPad.onclick = () => {
    if (!isPlaying) {
      pad = new Audio(`${warmPadPitchesArray[padIndex]}.mp3`);
      launchPad.classList.add('launch-pad-playing');
      launchPad.classList.add('slime-pressing');
      pad.currentTime = 0;
      pad.play();
      isPlaying = true;
    } else {
      launchPad.classList.remove('launch-pad-playing');
      launchPad.classList.remove('slime-pressing');
      fadeOut(pad, 3000);
      isPlaying = false;
    }
  }
});


const volumeSetUpElement = document.querySelector('#volume-set-up');
const volumeValueElement = document.querySelector('#volume-value');
volumeSetUpElement.addEventListener('input', () => {
  volumeValueElement.innerHTML = volumeSetUpElement.value;
});







