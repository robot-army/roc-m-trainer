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

const scenarioText = document.getElementById('scenario-text');
const transcriptBox = document.getElementById('transcript');
const scoreList = document.getElementById('score-list');
const statusIndicator = document.getElementById('status-indicator');
const unsupported = document.getElementById('unsupported');
const startButton = document.getElementById('start-recognition');
const stopButton = document.getElementById('stop-recognition');
const playPromptButton = document.getElementById('play-prompt');
const nextScenarioButton = document.getElementById('next-scenario');

let currentScenario = 0;
let recognition = null;
let transcriptResults = [];

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
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

startButton.addEventListener('click', startRecognition);
stopButton.addEventListener('click', stopRecognition);
playPromptButton.addEventListener('click', speakPrompt);
nextScenarioButton.addEventListener('click', nextScenario);

renderScenario();
