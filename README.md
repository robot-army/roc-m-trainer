# ROC-M browser speech prototype

This project is a lightweight browser-based training prototype for ROC-M-style radio calls. It uses the browser's built-in Web Speech API for speech recognition and speech synthesis, so it works without paid infrastructure.

> Disclaimer: This project is for educational practice only. It is not an official Transport Canada ROC-M exam, certification, or training provider, and it should not be used as a substitute for the official course or examination process.

## What it does

- shows a realistic ROC-M scenario prompt
- reads the scenario aloud with browser TTS
- records the student's spoken response with microphone input
- captures transcript text in the browser
- checks whether the spoken response includes the required distress/urgency/safety vocabulary

## Browser support

This works best in Chrome or Edge, where the Web Speech API is broadly supported.

## Supplemental alphabet practice

These are good generic phonetic alphabet tools to use alongside the ROC-M call practice:

- NATO Alphabet Learning: https://www.natoalphabet.com/
- UniversalAlphabet / NATO translator with audio output: https://universalalphabet.com/
- ICAO reference: https://www.icao.int/

These are not a replacement for ROC-M radio call practice, but they are useful for memorizing the alphabet and hearing the pronunciation clearly.

## Run locally

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Notes

This is an educational prototype only. It is not an official Transport Canada exam simulator.

## Project goals

- prove the browser speech interaction works
- create a template for future ROC-M scenario practice
- keep the app shareable, open-source, and free to run locally
