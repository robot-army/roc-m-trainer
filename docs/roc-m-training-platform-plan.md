# ROC-M Audio Exam Training Platform Plan

## 1) Research summary: how the ROC-M exam is actually administered

Based on current Canadian training material and exam descriptions from providers such as CanBoat / NautiSavoir, BoaterSkills, and Sail Canada, the ROC-M exam is generally structured like this:

- It is a Canadian maritime VHF radio certification for recreational / small commercial boat operators.
- The course typically includes a written section and a verbal radio-call section.
- The written portion is commonly described as 60 multiple-choice questions.
- The final verbal exam requires the student to demonstrate the ability to make three radio calls.
- The exam can be arranged either online or in person, often through an approved instructor or exam provider.
- In some programs, the exam is part of the course package and is conducted by video call or in-person with an instructor.
- Students are expected to be able to use proper marine radio procedures, channel usage, the phonetic alphabet, and emergency call structure appropriately.
- A temporary certificate is often issued after the exam while the permanent card is processed.

The most important practical detail for this platform: the final assessment is not just a quiz. It is a live oral communication skill test. The learner must be able to speak clearly, use correct sequence and wording, and make calls in a way that is both exam-correct and operationally safe.

### Key sources reviewed

- CanBoat / NautiSavoir: course page states the exam includes 60 multiple-choice questions and 3 verbal radio calls.
- BoaterSkills: describes ROC-M course and exam done online via Zoom with webcam and microphone.
- Sail Canada: describes instructor-led course delivery and ROC(M) certification framework.
- ISED / Canadian radio operator certification pages: confirm ROC-M is a Canadian certificate required to legally operate marine VHF / MF-HF radio in many Canadian recreational boating contexts.

## 2) Product goal

Build a web-based training platform that helps students master both:

1. the exam requirements of ROC-M,
2. real-world safe radio communication for actual emergency and non-emergency calls.

The product should teach the student to speak naturally, correctly, and calmly on VHF radio under pressure. It should also let instructors assign scenarios and measure progress against exam-style criteria.

## 3) Core training objectives

### A. Written knowledge

- Phonetic alphabet
- Standard marine call procedures and etiquette
- Channel usage (e.g., VHF working channels, emergency channel 16)
- Distress, urgency, and safety priority sequencing
- Vessel identification and position reporting format
- Use of MMSI / DSC basics where relevant
- Common phraseology and shorthand

### B. Oral communication

- Calling procedures with proper greetings and identification
- Clear, calm wording
- Correct use of phraseology such as MAYDAY, PAN PAN, and SECURITE
- Proper transmission timing and brevity
- Ability to maintain composure during flagged emergency scenarios
- Ability to state vessel name, registration, position, and required assistance accurately

### C. Exam simulation

- Timed written quizzes
- Randomized oral call prompts
- Scenario-based training with realistic stress factors
- Scoring against rubrics
- Instructor review and replay

## 4) Recommended toolset

### Frontend

- Next.js (React + TypeScript)
- Tailwind CSS
- Zustand or Redux Toolkit for state management
- Web Audio API and MediaRecorder for mic capture
- Browser-based speech recognition and speech synthesis options

Why:
- fast to build for web,
- good support for interactive scenario UX,
- easy to deploy on web and mobile browsers,
- strong support for audio recording and playback.

### Backend

- FastAPI (Python) or Node.js/NestJS
- PostgreSQL for user data, content, progress, and assessments
- Redis for queues and session state
- Celery (or background jobs) for async scoring and audio processing

Why:
- reliable API layer,
- easy to integrate with audio analysis and ML services,
- supports large content library and user analytics.

### Audio & speech stack

- Browser capture using MediaRecorder / getUserMedia
- OpenAI Whisper or a similar local/cloud speech-to-text engine for transcript review
- Optional phoneme and phrase-level evaluation using a rule-based scorer
- Web Speech API for pronunciation / TTS prompts

Why:
- the real value is not just recording voice but evaluating phrase structure,
- a rule engine can grade whether the student used required elements, even if the exact wording is slightly different.

### Content and assessment engine

- Structured scenario schema in JSON or a custom CMS
- Each scenario includes:
  - objective
  - situation summary
  - required call type
  - channel guidance
  - vessel details
  - expected wording template
  - scoring rubric
  - variation parameters (position, drifting direction, assistance needed, time pressure)

### Analytics and reporting

- Postgres + SQL analytics
- Event tracking for:
  - scenario attempts
  - pass/fail rates
  - common phrase errors
  - delayed or missing report elements
  - phonetic alphabet mistakes

### Deployment

- Frontend: Vercel or similar
- Backend: Render / Railway / Fly.io / Azure Container Apps
- DB: managed Postgres
- Object storage: S3-compatible storage for audio clips

## 5) Recommended MVP scope

### Phase 1: Exam-focused training app

- User login and student profile
- Lesson library for marine radio basics
- Phonetic alphabet trainer
- Phrase library for MAYDAY / PAN PAN / SECURITE
- Scenario list with exam-style prompts
- Text-entry mode for practice calls
- Score summary with pass/fail logic

### Phase 2: Audio training mode

- Real microphone recording
- Playback of student transmission
- Speech-to-text transcript
- Phrase-level comparison against required sequence
- “What you missed” feedback
- “Speak more clearly / say your call sign / say your position / use correct priority word” prompts

### Phase 3: Exam simulator

- 60-question board-style quiz
- 3-call oral exam simulation
- Timer, randomization, and strict rubric checks
- Instructor dashboard
- Bulk scenario generation

## 6) Core functionality by feature

### 1. Scenario engine

Example scenarios:

- “Your engine has failed, you are drifting toward rocks at coordinates X. Make the appropriate radio call.”
- “You have a man overboard near the harbor entrance. Use the correct safety or distress call.”
- “You have a medical emergency aboard and need urgent assistance. State your vessel, position, and nature of the problem.”
- “Your fuel leak is worsening but there is no immediate life threat. Use the proper urgency call.”

Each scenario should generate:

- the context,
- location and coordinates,
- vessel name and call sign,
- environmental conditions,
- required urgency level,
- scoring rubric for required wording.

### 2. Text-mode practice

Students can type a full call and receive immediate feedback, for example:

- missing the proper priority word,
- missing vessel name,
- missing position,
- wrong channel,
- improper use of the phonetic alphabet,
- weak grammar or ambiguous phraseology.

### 3. Voice-mode practice

Students can:

- press a record button,
- speak their call as if on a marine VHF radio,
- hear playback,
- see transcript,
- receive feedback on what they missed.

This is essential because the exam is not purely written. Real radio communication is about vocal clarity and correct sequence.

### 4. Phonetic alphabet trainer

- flashcards and timed drills,
- random calls with scrambled letters,
- “say this in phonetics” mode,
- “type the phonetic version of this call sign” mode,
- voice scoring for pronunciation clarity.

### 5. Distress call training module

This should teach the exact priorities for:

- MAYDAY
- PAN PAN
- SECURITE

The app should include examples like:

- MAYDAY: immediate danger to life
- PAN PAN: urgency, but not immediate life-threatening in the same way
- SECURITE: safety of navigation or weather / hazard message

Students should be trained to distinguish when each is used and how the wording must change.

## 7) Realistic scoring model

The scoring engine should not just be a simple “did they say the word?” check. It should evaluate the radio call in layers:

### Layer 1: Priority and intent

- Was the correct priority word used?
- Did the student choose a call that matches the scenario?

### Layer 2: Required items

- vessel name / call sign
- position
- nature of problem
- assistance required
- time, weather, or risk details when applicable

### Layer 3: Delivery quality

- calm tone
- clear pacing
- no unnecessary chatter
- control and brevity

### Layer 4: Test compliance

- correct use of marine phraseology
- proper order of information
- acceptable universal phrase patterns

## 8) Example practice scenarios for the app

### Example 1: engine failure

Prompt:

“Your engine has failed, you are drifting toward rocks at coordinates 46°08'N, 061°02'W. There are three people aboard. Make the appropriate radio call.”

Expected behavior:

- choose MAYDAY if there is immediate danger to life
- include vessel name / call sign
- include position
- mention nature of distress
- mention number of persons aboard
- request immediate assistance

### Example 2: medical emergency

Prompt:

“One crew member has severe chest pain and is losing consciousness. You are in the channel near a reef. Make the appropriate call.”

Focus:

- urgency and precise wording
- location and type of assistance requested
- calm and clear speaking

### Example 3: weather hazard

Prompt:

“A sudden squall is approaching and a buoy marker is drifting loose in your path. You need to warn nearby vessels.”

Focus:

- SECURITE
- hazard message and relevant area detail
- safety of navigation wording

### Example 4: lost engine or drifting without immediate life peril

Prompt:

“You have a dead engine and are drifting slowly near the shoreline but there is no immediate immediate danger. Make the proper call.”

Focus:

- PAN PAN if urgency is real but life danger is not immediate
- proper assistance request without over-calling MAYDAY

## 9) Exam alignment strategy

This app should explicitly mirror the known exam pattern:

- Written assessment section: 60 multiple-choice items
- Oral test section: 3 radio call demonstrations
- Coverage: emergency, urgency, safety, general radio etiquette, channels, call structure, phonetic alphabet

The platform should show the learner why each call type matters and how to avoid the biggest exam mistakes:

- using MAYDAY in a non-distress situation
- forgetting the position
- failing to say the vessel name
- speaking too fast or not using clear phraseology
- using wrong channel or wrong call priority

## 10) Technical architecture idea

### High-level architecture

- Web app front end for training and exam simulation
- API service for scenarios, user progress, and scoring
- Audio capture service for recording student transmissions
- Transcript service for speech-to-text review
- Scoring engine with declarative rule sets
- Admin dashboard for content creation and instructor review

### Data model

- User
- Course
- Lesson
- Scenario
- Attempt
- Recording
- EvaluationResult
- InstructorFeedback

### Reporting and review

- per-scenario pass/fail breakdown
- aggregate mastery score by skill area
- most common phrase misses
- trend over time
- instructor-reviewed recordings with notes

## 11) Implementation roadmap

### Milestone 1: research and content model

- finalize the required phraseology list
- define the scenario schema
- define scoring rules for each emergency category
- create initial content packs for MAYDAY / PAN PAN / SECURITE

### Milestone 2: MVP web app

- landing page + user auth
- training dashboard
- text-entry call practice
- phonetic alphabet module
- basic scenario list

### Milestone 3: voice training

- record and playback
- transcript review
- scoring by checklist
- instant feedback

### Milestone 4: exam simulator

- mock written assessment
- mock oral assessment
- pass/fail simulation
- instructor review UI

### Milestone 5: production hardening

- accessibility and mobile polish
- audio quality controls
- performance tuning
- privacy and consent flow for audio capture

## 12) Risks and concerns

### Safety risk

This is training, not emergency response. The platform should make clear that it is educational, and the calls should emulate practice scenarios rather than real-world radio traffic.

### Speech evaluation accuracy

AI transcription should be used to support the human review process, not as the sole judge. In safety-critical radio protocol, a hybrid model is best:

- rule-based score + manual instructor review

### Content quality

The phraseology training must be based on valid marine radio standards, not “generic” emergency wording. This is where a strict scenario content library matters.

## 13) Recommended first build decision

The right first version is not an all-in-one “AI examiner.”

Instead, start with:

- scenario library,
- text entry practice,
- audio recording and replay,
- rule-based evaluation,
- instructor dashboard.

That gives the product real value quickly without overbuilding AI before the core pedagogy is proven.

## 14) Final recommendation

Build a web app that feels like a radio simulator, not just a quiz site.

The best learning experience is:

- present a realistic emergency or safety scenario,
- make the student think, speak, and structure the call correctly,
- show them exactly what they missed,
- repeat under pressure,
- then run a mock exam.

This matches the actual ROC-M exam structure and trains the student for real-world performance rather than rote memorization alone.

## 15) Practical next steps

1. Gather the actual course phraseology lists and exact wording conventions.
2. Define a scoring rubric for each emergency call type.
3. Build the first scenario library.
4. Prototype the text and voice workflow.
5. Pilot with 3–5 real students or instructors.
6. Tune the evaluation model based on observed mistakes.

This gives you a product aligned to both exam success and real-world emergency communications.
