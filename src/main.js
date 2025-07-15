const countdownEl = document.getElementById('countdown');
const wordEl = document.getElementById('word');
const instructionEl = document.getElementById('instruction');
const permissionBtn = document.getElementById('requestPermission');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const resultListEl = document.getElementById('resultList');

let words = [];
let wordsLoaded = false;
let score = 0;
let timerSeconds = 13;
let timerInterval = null;
let timerRunning = false;
let countdownRunning = false;
let lastTilt = null;
let currentWord = '';
let playedWords = [];

fetch('words.json')
  .then(response => {
    if (!response.ok) throw new Error("words.json nicht gefunden");
    return response.json();
  })
  .then(data => {
    words = data;
    wordsLoaded = true;
    if (isLandscape()) startGame();
  })
  .catch(err => {
    console.error("Fehler beim Laden der Wörter:", err);
    instructionEl.textContent = "Fehler beim Laden der Wörter.";
  });

let fullscreenRequested = false;

function requestFullscreenOnce() {
    if (fullscreenRequested) return;
    fullscreenRequested = true;

    const elem = document.documentElement;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

function startCountdown(seconds = 3) {
  countdownRunning = true;
  let count = seconds;
  countdownEl.style.display = 'block';
  countdownEl.textContent = count;
  wordEl.style.display = 'none';
  timerEl.style.display = 'none';
  scoreEl.style.display = 'none';
  resultListEl.style.display = 'none';

  const interval = setInterval(() => {
    count--;
    countdownEl.textContent = count;
    if (count <= 0) {
      clearInterval(interval);
      countdownEl.style.display = 'none';
      countdownRunning = false;
      displayRandomWord();
      scoreEl.style.display = 'block';
      timerEl.style.display = 'block';
    }
  }, 1000);
}

function displayRandomWord() {
  if (words.length > 0) {
    const randomIndex = Math.floor(Math.random() * words.length);
    currentWord = words[randomIndex];
    wordEl.textContent = currentWord;
    wordEl.style.display = 'block';
    lastTilt = null;
  }
}

function startTimer(seconds = 13) {
  timerSeconds = seconds;
  timerRunning = true;
  updateTimerDisplay();

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!timerRunning) return;

    timerSeconds--;
    updateTimerDisplay();

    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      playedWords.push({ word: currentWord, status: 'offen' });
      showEndInstruction();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const min = Math.floor(timerSeconds / 60);
  const sec = timerSeconds % 60;
  timerEl.textContent = `Verbleibende Zeit: ${min}:${sec.toString().padStart(2, '0')}`;
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function startGame() {
  requestFullscreenOnce();
  instructionEl.style.display = 'none';
  wordEl.style.display = 'none';
  scoreEl.style.display = 'none';
  timerEl.style.display = 'none';
  resultListEl.style.display = 'none';

  playedWords = [];
  score = 0;
  updateScore();
  startCountdown(3);
  startTimer(13);
}

function abortGame() {
  if (timerInterval) clearInterval(timerInterval);
  timerRunning = false;
  countdownRunning = false;
  playedWords.push({ word: currentWord, status: 'offen' });
  showResults();
}

function showEndInstruction() {
  wordEl.style.display = 'none';
  timerEl.style.display = 'none';
  instructionEl.textContent = "Zeit abgelaufen! Bitte Gerät ins Hochformat drehen.";
  instructionEl.style.display = 'block';
}

function showResults() {
  instructionEl.textContent = "Spiel beendet!";
  scoreEl.style.display = 'block';
  resultListEl.innerHTML = "";
  resultListEl.style.display = 'block';

  playedWords.forEach(entry => {
    const p = document.createElement('p');
    p.textContent = entry.word;
    p.className = entry.status;
    resultListEl.appendChild(p);
  });

  const hint = document.createElement('p');
  hint.textContent = "Für eine neue Runde bitte Gerät wieder ins Querformat drehen.";
  hint.style.marginTop = "20px";
  hint.style.fontSize = "1.2em";
  hint.style.fontWeight = "bold";
  hint.style.color = "#ccc";
  resultListEl.appendChild(hint);
}

function handleOrientationChange() {
  if (isLandscape()) {
    if (!timerRunning && wordsLoaded) startGame();
  } else {
    document.body.style.backgroundColor = '#111';

    if (timerRunning) {
      abortGame();
    } else if (!timerRunning && playedWords.length > 0) {
      showResults();
    } else {
      wordEl.style.display = 'none';
      scoreEl.style.display = 'none';
      timerEl.style.display = 'none';
      countdownEl.style.display = 'none';
      instructionEl.textContent = "Drehe dein Gerät ins Querformat…";
      instructionEl.style.display = 'block';
    }
  }
}


window.addEventListener('resize', handleOrientationChange);

function handleTilt(event) {
  if (countdownRunning) return;
  const gamma = event.gamma;
  if (gamma === null || !timerRunning) return;

  let orientation = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  let gekipptNachUnten = false;
  let gekipptNachOben = false;

  if (orientation === 90) {
    gekipptNachUnten = gamma < 50 && gamma > 0;
    gekipptNachOben = gamma > -50 && gamma < 0;
  } else if (orientation === -90 || orientation === 270) {
    gekipptNachUnten = gamma > -50 && gamma < 0;
    gekipptNachOben = gamma < 50 && gamma > 0;
  }

  if (gekipptNachUnten && lastTilt !== 'grün') {
    document.body.style.backgroundColor = 'green';
    lastTilt = 'grün';
  } else if (gekipptNachOben && lastTilt !== 'rot') {
    document.body.style.backgroundColor = 'red';
    lastTilt = 'rot';
  } else if (!gekipptNachUnten && !gekipptNachOben && lastTilt) {
    document.body.style.backgroundColor = '#111';

    if (lastTilt === 'grün') {
      score++;
      playedWords.push({ word: currentWord, status: 'richtig' });
    } else if (lastTilt === 'rot') {
      playedWords.push({ word: currentWord, status: 'falsch' });
    }

    updateScore();
    displayRandomWord();
    lastTilt = null;
  }
}

function enableTiltDetection() {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {

    permissionBtn.style.display = 'block';

    permissionBtn.addEventListener('click', () => {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleTilt);
            permissionBtn.style.display = 'none';
          } else {
            alert("Bewegungserkennung wurde abgelehnt.");
          }
        })
        .catch(console.error);
    });
  } else {
    window.addEventListener('deviceorientation', handleTilt);
  }
}

window.addEventListener('load', () => {
  enableTiltDetection();
  handleOrientationChange();
});
