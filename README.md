# FlashMind AI 🧠⚡

> **Turn your notes into smarter revision.**

FlashMind AI is an intelligent study application that converts lecture notes, PDFs, textbooks, and class documents into high-yield flashcards with active recall flip review, practice quizzes, study trend analytics, and cross-platform Anki export.

---

## 🌟 Key Features

### 1. Document & Notes Processing
- **PDF Upload**: Extracts text directly from course PDFs and lecture slides with page and word counts.
- **TXT & Markdown Upload**: Instant file reading for lecture notes and study guides.
- **Paste Notes Workspace**: Clean editor with character and word count validation.
- **Text Preview & Editing**: Review and adjust extracted text before generation.

### 2. AI Flashcard Synthesis
- Powered by **Google Gemini 3.8 Flash** via server-side `@google/genai` API endpoints.
- Configurable settings:
  - **Topic / Focus Subject**
  - **Card Count** (4 to 20 cards)
  - **Difficulty Levels** (Easy, Medium, Hard)
  - **Card Types** (Question & Answer, Term & Definition, Mixed)
  - **Target Language** (English, Spanish, French, German, Mandarin, Japanese)
- **Local Extractive Fallback Engine**: Transparent offline/local extraction mode that works seamlessly even without an external API key.
- **Pre-Save Editor**: Edit questions, answers, and explanations, or add custom cards before saving to your library.

### 3. Interactive 3D Study Mode
- 3D perspective flip cards with smooth CSS transforms.
- **Active Retrieval Rating**: Mark cards as **"Know It"** (Mastered) or **"Review Again"** (Needs Practice).
- **Keyboard Shortcuts**:
  - `Space` / `Enter`: Flip card
  - `Arrow Left` / `Arrow Right`: Previous / Next card
  - `1` / `K`: Mark "Know It"
  - `2` / `R`: Mark "Review Again"
  - `S`: Shuffle deck
- **Audio Reader**: Web Speech API audio pronunciation for accessibility.
- **Filter**: Toggle between *All Cards* and *Needs Review*.
- **Celebration**: Confetti milestone celebration with session score upon deck completion.

### 4. Practice Quiz Mode
- Multiple-choice questions (4 options) generated from saved flashcards with plausible distractors.
- Immediate feedback highlighting correct choices and contextual explanations.
- Final scorecard with review breakdown and retry capability.

### 5. Study Trends & Analytics (Recharts)
- Interactive charts built with **Recharts**:
  - **Cards Mastered & Reviewed (Area Chart)**: Daily mastery trajectory over a 7-day rolling cycle.
  - **Daily Study Time (Bar Chart)**: Daily focused revision time in minutes.
- KPI summary: Total study time, weekly cards mastered, weekly review volume, and average daily pace.

### 6. Deck Management & Portability
- Search, filter, and organize decks by subject and difficulty.
- Edit questions and answers anytime.
- **Export Formats**:
  - **Anki TSV** (`Front \t Back \t Tags` format for instant import into Anki).
  - **JSON Backup** for full deck restoration.
- **Import**: JSON deck file importer with schema validation.
- Preloaded sample decks for Cellular Biology, Computer Science Algorithms, and Cognitive Psychology.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion, Recharts, Canvas Confetti
- **Backend**: Express, Node.js, `@google/genai` (Gemini 3.8 Flash), `pdf-parse`
- **Build Tool**: Vite 8, `tsx`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or bun

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd flashmind-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```
*(Note: If no API key is provided, the application will automatically run in Local Extractive Mode.)*

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📦 How to Publish to GitHub

To push this project to a new GitHub repository:

```bash
# 1. Initialize git
git init
git add .
git commit -m "feat: initial commit of FlashMind AI"

# 2. Rename branch to main
git branch -M main

# 3. Create a new repository on GitHub (e.g. at https://github.com/new)
# 4. Link your remote and push:
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

Alternatively, if you use the GitHub CLI (`gh`):
```bash
gh repo create flashmind-ai --public --source=. --remote=origin --push
```

---

## 📄 License
Apache-2.0
