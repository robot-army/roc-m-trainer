const scenarios = [
  {
    id: 1,
    prompt: 'Your engine has failed and you are drifting toward rocks at position 46°08\'N, 061°02\'W. Make the correct radio call.',
    requiredWords: ['mayday', 'position', 'engine', 'drifting', 'rocks'],
    expectedPriority: 'mayday'
  },
  {
    id: 2,
    prompt: 'You have a crew member with chest pain and need urgent medical assistance. You are close to a reef. Make the appropriate call.',
    requiredWords: ['pan', 'medical', 'urgent', 'position', 'assistance'],
    expectedPriority: 'pan pan'
  },
  {
    id: 3,
    prompt: 'A squall is approaching and there is a drifting navigation marker in the channel. Warn nearby vessels with the correct safety call.',
    requiredWords: ['securite', 'safety', 'navigation', 'weather', 'warning'],
    expectedPriority: 'securite'
  }
];

const phoneticAlphabet = [
  ['A', 'Alpha'], ['B', 'Bravo'], ['C', 'Charlie'], ['D', 'Delta'], ['E', 'Echo'],
  ['F', 'Foxtrot'], ['G', 'Golf'], ['H', 'Hotel'], ['I', 'India'], ['J', 'Juliett'],
  ['K', 'Kilo'], ['L', 'Lima'], ['M', 'Mike'], ['N', 'November'], ['O', 'Oscar'],
  ['P', 'Papa'], ['Q', 'Quebec'], ['R', 'Romeo'], ['S', 'Sierra'], ['T', 'Tango'],
  ['U', 'Uniform'], ['V', 'Victor'], ['W', 'Whiskey'], ['X', 'X-ray'], ['Y', 'Yankee'],
  ['Z', 'Zulu']
];

const scenarioText = document.getElementById('scenario-text');
const transcriptBox = document.getElementById('transcript');
const scoreList = document.getElementById('score-list');
const statusIndicator = document.getElementById('status-indicator');
const unsupported = document.getElementById('unsupported');
const startButton = document.getElementById('start-recognition');
const stopButton = document.getElementById('stop-recognition');
const playPromptButton = document.getElementById('play-prompt');
const nextScenarioButton = document.getElementById('next-scenario');

const tabRadio = document.getElementById('tab-radio');
const tabDrill = document.getElementById('tab-drill');
const modeRadio = document.getElementById('mode-radio');
const modeDrill = document.getElementById('mode-drill');

const drillLetterEl = document.getElementById('drill-letter');
const drillScoreEl = document.getElementById('drill-score');
const drillStreakEl = document.getElementById('drill-streak');
const drillAccuracyEl = document.getElementById('drill-accuracy');
const drillStatusEl = document.getElementById('drill-status');
const drillHeardEl = document.getElementById('drill-heard');
const drillStartButton = document.getElementById('drill-start');
const drillStopButton = document.getElementById('drill-stop');
const drillSkipButton = document.getElementById('drill-skip');
const drillRecordToggle = document.getElementById('drill-record-toggle');
const drillRecordingPanel = document.getElementById('drill-recording-panel');
const drillRecordingDownload = document.getElementById('drill-recording-download');
const drillRecordingIssue = document.getElementById('drill-recording-issue');

let currentScenario = 0;
let recognition = null;
let transcriptResults = [];

let drillRecognition = null;
let drillActive = false;
let currentDrillEntry = null;
let drillScore = 0;
let drillStreak = 0;
let drillAttempts = 0;
let drillCorrect = 0;
let drillLog = [];

let mediaRecorder = null;
let recordingStream = null;
let recordedChunks = [];
let currentRecordingUrl = null;

const DRILL_LOG_LIMIT = 50;
const DRILL_MATCH_THRESHOLD = 0.5;
const ISSUE_TRACKER_URL = 'https://github.com/robot-army/roc-m-trainer/issues/new';

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j += 1) distances[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost
      );
    }
  }

  return distances[rows - 1][cols - 1];
}

function wordSimilarity(a, b) {
  if (!a.length && !b.length) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function isCloseMatch(spokenText, expectedWord) {
  const normalizedSpoken = normalize(spokenText);
  const expectedNormalized = normalize(expectedWord);

  if (!normalizedSpoken) return false;
  if (normalizedSpoken.includes(expectedNormalized)) return true;

  const tokens = normalizedSpoken.split(' ').filter(Boolean);
  const candidates = tokens.length ? tokens : [normalizedSpoken];

  return candidates.some((token) => wordSimilarity(token, expectedNormalized) >= DRILL_MATCH_THRESHOLD);
}

function getScenario() {
  return scenarios[currentScenario % scenarios.length];
}

function renderScenario() {
  const scenario = getScenario();
  scenarioText.textContent = scenario.prompt;
  transcriptBox.textContent = 'Your spoken transcript will appear here...';
  transcriptResults = [];
  renderChecklist(scenario);
}

function renderChecklist(scenario) {
  const items = [
    { label: 'Priority call', key: 'priority', expected: scenario.expectedPriority },
    ...scenario.requiredWords.map((word) => ({
      label: `Includes “${word}”`,
      key: word,
      expected: word
    }))
  ];

  scoreList.innerHTML = '';

  items.forEach((item) => {
    const row = document.createElement('li');
    row.className = 'score-item';

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;

    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = 'Pending';

    row.appendChild(label);
    row.appendChild(value);
    scoreList.appendChild(row);
  });
}

function updateChecklistWithTranscript(transcript) {
  const scenario = getScenario();
  const normalized = normalize(transcript);
  const rows = [...scoreList.children];

  const priorityStatus = normalized.includes(scenario.expectedPriority)
    ? 'OK'
    : 'Missing';

  const priorityRow = rows[0];
  if (priorityRow) {
    const value = priorityRow.querySelector('.value');
    value.textContent = priorityStatus;
    priorityRow.classList.toggle('valid', priorityStatus === 'OK');
    priorityRow.classList.toggle('missing', priorityStatus === 'Missing');
  }

  scenario.requiredWords.forEach((word, index) => {
    const row = rows[index + 1];
    if (!row) return;

    const value = row.querySelector('.value');
    const matched = normalized.includes(word);
    value.textContent = matched ? 'OK' : 'Missing';
    row.classList.toggle('valid', matched);
    row.classList.toggle('missing', !matched);
  });
}

function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    unsupported.classList.remove('hidden');
    return;
  }

  unsupported.classList.add('hidden');

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      statusIndicator.textContent = 'Listening';
      statusIndicator.style.color = '#b7ffd9';
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += text + ' ';
        } else {
          interimText += text;
        }
      }

      const currentTranscript = (finalText + interimText).trim();
      if (currentTranscript) {
        transcriptBox.textContent = currentTranscript;
        updateChecklistWithTranscript(currentTranscript);
      }
    };

    recognition.onerror = (event) => {
      statusIndicator.textContent = 'Error: ' + event.error;
      statusIndicator.style.color = '#ffb6b6';
    };

    recognition.onend = () => {
      statusIndicator.textContent = 'Idle';
      statusIndicator.style.color = '#d9e8f8';
    };
  }

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
  }
}

function speakPrompt() {
  const scenario = getScenario();
  const utterance = new SpeechSynthesisUtterance(scenario.prompt);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function nextScenario() {
  currentScenario += 1;
  renderScenario();
}

function setMode(mode) {
  const isDrill = mode === 'drill';

  modeRadio.classList.toggle('hidden', isDrill);
  modeDrill.classList.toggle('hidden', !isDrill);
  nextScenarioButton.classList.toggle('hidden', isDrill);

  tabRadio.classList.toggle('active', !isDrill);
  tabDrill.classList.toggle('active', isDrill);
  tabRadio.setAttribute('aria-selected', String(!isDrill));
  tabDrill.setAttribute('aria-selected', String(isDrill));

  stopRecognition();
  stopDrill();
}

function pickDrillEntry() {
  let next = currentDrillEntry;
  while (phoneticAlphabet.length > 1 && next === currentDrillEntry) {
    next = phoneticAlphabet[Math.floor(Math.random() * phoneticAlphabet.length)];
  }
  currentDrillEntry = next || phoneticAlphabet[0];
  drillLetterEl.textContent = currentDrillEntry[0];
}

function updateDrillStats() {
  drillScoreEl.textContent = String(drillScore);
  drillStreakEl.textContent = String(drillStreak);
  const accuracy = drillAttempts === 0 ? 0 : Math.round((drillCorrect / drillAttempts) * 100);
  drillAccuracyEl.textContent = accuracy + '%';
}

function appendDrillLogEntry(entry) {
  drillLog.push(entry);
  if (drillLog.length > DRILL_LOG_LIMIT) {
    drillLog = drillLog.slice(-DRILL_LOG_LIMIT);
  }
  drillHeardEl.textContent = drillLog.join('\n');
  drillHeardEl.scrollTop = drillHeardEl.scrollHeight;
}

function checkDrillAnswer(spokenText) {
  const expectedEntry = currentDrillEntry;
  const isCorrect = isCloseMatch(spokenText, expectedEntry[1]);

  drillAttempts += 1;
  if (isCorrect) {
    drillCorrect += 1;
    drillScore += 10;
    drillStreak += 1;
  } else {
    drillStreak = 0;
  }

  updateDrillStats();
  appendDrillLogEntry(
    `Expected ${expectedEntry[0]} \u2192 ${expectedEntry[1]}  |  Heard: "${spokenText.trim()}"  |  ${isCorrect ? 'Correct' : 'Incorrect'}`
  );

  setTimeout(pickDrillEntry, 700);
}

function buildDebugIssueUrl() {
  const title = 'Phonetic drill misrecognition report';
  const recentLog = drillLog.slice(-20).join('\n') || '(no session log yet)';
  const body = [
    'Describe what happened (which letter, what you said, what was heard instead):',
    '',
    '---',
    'Attach the downloaded roc-m-drill-session.webm recording to this issue using the',
    'file attachment area below before submitting.',
    '',
    'Recent session log:',
    recentLog
  ].join('\n');

  return `${ISSUE_TRACKER_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

async function startAudioRecording() {
  if (!drillRecordToggle.checked) return;

  drillRecordingPanel.classList.add('hidden');

  if (!window.MediaRecorder || !navigator.mediaDevices) {
    drillStatusEl.textContent = 'Audio recording not supported in this browser';
    return;
  }

  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    drillStatusEl.textContent = 'Microphone permission denied for recording';
    return;
  }

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(recordingStream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    if (currentRecordingUrl) {
      URL.revokeObjectURL(currentRecordingUrl);
    }
    currentRecordingUrl = URL.createObjectURL(blob);

    drillRecordingDownload.href = currentRecordingUrl;
    drillRecordingIssue.href = buildDebugIssueUrl();
    drillRecordingPanel.classList.remove('hidden');
  };

  mediaRecorder.start();
}

function stopAudioRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (recordingStream) {
    recordingStream.getTracks().forEach((track) => track.stop());
    recordingStream = null;
  }
}

async function startDrill() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    unsupported.classList.remove('hidden');
    return;
  }

  unsupported.classList.add('hidden');
  drillActive = true;

  await startAudioRecording();

  if (!drillRecognition) {
    drillRecognition = new SpeechRecognition();
    drillRecognition.lang = 'en-US';
    drillRecognition.continuous = true;
    drillRecognition.interimResults = false;

    drillRecognition.onstart = () => {
      drillStatusEl.textContent = 'Listening';
      drillStatusEl.style.color = '#b7ffd9';
    };

    drillRecognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          checkDrillAnswer(result[0].transcript);
        }
      }
    };

    drillRecognition.onerror = (event) => {
      // "no-speech" happens constantly on mobile Chrome between phrases; the
      // upcoming onend handler will restart listening, so don't treat it as fatal.
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }

      drillActive = false;
      drillStatusEl.textContent = 'Error: ' + event.error;
      drillStatusEl.style.color = '#ffb6b6';
    };

    drillRecognition.onend = () => {
      if (!drillActive) {
        drillStatusEl.textContent = 'Idle';
        drillStatusEl.style.color = '#d9e8f8';
        return;
      }

      // Mobile Chrome silently stops recognition after every utterance even
      // with continuous=true, so restart it to keep the drill running.
      try {
        drillRecognition.start();
      } catch (err) {
        // ignore duplicate-start errors from rapid restarts
      }
    };
  }

  if (!currentDrillEntry) {
    pickDrillEntry();
  }

  drillRecognition.start();
}

function stopDrill() {
  drillActive = false;
  if (drillRecognition) {
    drillRecognition.stop();
  }
  stopAudioRecording();
}

startButton.addEventListener('click', startRecognition);
stopButton.addEventListener('click', stopRecognition);
playPromptButton.addEventListener('click', speakPrompt);
nextScenarioButton.addEventListener('click', nextScenario);

tabRadio.addEventListener('click', () => setMode('radio'));
tabDrill.addEventListener('click', () => setMode('drill'));
drillStartButton.addEventListener('click', startDrill);
drillStopButton.addEventListener('click', stopDrill);
drillSkipButton.addEventListener('click', pickDrillEntry);

pickDrillEntry();
updateDrillStats();
renderScenario();
