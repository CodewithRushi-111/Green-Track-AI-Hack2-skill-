# 🌿 GreenTrack AI

> Nature-inspired carbon footprint tracking, gamified offsetting, and intelligent climate recommendations. Made for the **Hack2Skill — Carbon Footprint Track** competition.

This repository is organized as a user-friendly, production-ready monorepo with separate frontend and backend directories.

---

## 📁 Repository Structure

```tree
.
├── backend/               # Flask Python REST API & Tests
│   ├── routes/            # Blueprint API endpoints (auth, tracker, etc.)
│   ├── services/          # Business logic layers (Gemini, Claude, Rate Limiter)
│   ├── tests/             # Pytest automated integration test suite
│   ├── app.py             # Flask Entry point & lazy database initializer
│   ├── config.py          # Production & Development database configs
│   ├── database.py        # SQLAlchemy models (User, Challenge, Transactions)
│   ├── commands.py        # CLI database backups utilities
│   └── requirements.txt   # Backend python packages
│
├── frontend/              # Single Page Application (SPA) HTML, CSS, JS
│   ├── css/               # Modular HSL styling sheets
│   ├── js/                # Client state, routing, and component engines
│   └── index.html         # Main app viewport
│
├── .env.example           # Shared environment variable template
├── vercel.json            # Vercel CDN/routing build specs
└── README.md              # Project documentation
```

---

## 🚀 Key Features

### 1. 🤖 AI-Powered Carbon Advisor
* **Personalized Context Injection**: Queries your lifetime emissions data and injects it directly into the AI's instruction set for bespoke coaching.
* **Resilient Multi-LLM Cascading**: Integrates **Anthropic Claude 3.5 Sonnet** as the primary engine. If offline or if API keys are missing, it falls back to **Google Gemini 1.5 Flash**, and finally to a rule-based **Offline Advisor**—ensuring it *never* breaks.
* **Server-Sent Events (SSE)**: Streams responses token-by-token directly to a premium floating chat widget.

### 2. 🗺️ Global Project Impact Map
* **Interactive SVG Visualization**: A custom, responsive low-poly world map highlighting project zones (Madagascar, Netherlands, India, Kenya).
* **Funding State Indicators**: Funded projects glow emerald-green (`var(--accent-color)`), while available projects display soft gold/orange alerts.
* **Interactive Tooltips**: Hover over nodes to see descriptions, active status, and carbon offset rates.

### 3. 🎮 Gamified Eco Challenges & Audits
* **Audit Verification Engine**: Complete carbon-mitigation tasks (like "Switch to LED Bulbs" or "Go Car-Free") and submit text logs which are automatically validated using matching regex checks.
* **Rank Progression System**: Accumulate Green Points to level up from *Eco Apprentice 🍀* to *Green Steward 🌱*, *Carbon Crusader ⚡*, and finally *Planet Guardian 🌍*.

### 4. 📊 Dynamic Visualizations & Dashboard
* **60fps Count-Up Animations**: Counters animate values smoothly on load.
* **Emissions Trendline & Benchmarks**: Compare your personal footprint against global and national climate targets.
* **Scroll Interactions**: Dashboard cards slide in elegantly using `IntersectionObserver`.

---

## 🛠️ Tech Stack

* **Backend**: Python & Flask (modular Blueprint structure, SQLite DB, SQLAlchemy ORM, rate-limiter, JWT tokens).
* **Frontend**: Vanilla HTML5 landmarks, CSS3 HSL design tokens, Single Page Application (SPA) routing, SVG charts.
* **AI Orchestration**: Anthropic API, Google GenAI (`google-generativeai`), Server-Sent Events (SSE).
* **Testing**: `pytest` integration testing.

---

## 📦 Local Quick Start

### 1. Prerequisites
Make sure you have Python 3.10+ installed.

### 2. Installation
Clone the repository and set up a virtual environment:
```bash
git clone https://github.com/CodewithRushi-111/Green-Track-AI-Hack2-skill-.git
cd Green-Track-AI-Hack2-skill-
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Environment Setup
Configure your environment variables:
```bash
cp .env.example .env
```
Fill in your API credentials inside the `.env` file:
* `GEMINI_API_KEY`: Google Generative AI key
* `ANTHROPIC_API_KEY`: Claude API key (optional)

### 4. Run the Application
Start the Flask development server from the backend folder:
```bash
python backend/app.py
```
Open your browser and navigate to `http://127.0.0.1:5000/`.

### 5. Running Tests
Run the integration test suite:
```bash
python -m pytest backend/tests/test_suite.py
```

---

## ☁️ Vercel Deployment

Deploying this monorepo structure to Vercel is fully automated via the root `vercel.json` file. 

1. **Static Frontend**: Served instantly using Vercel's high-speed global CDN (mapping `frontend/` directory).
2. **Serverless API**: Handled in the cloud by the `@vercel/python` builder (running `backend/app.py`).

**Vercel Environment Variables to Set:**
* `GEMINI_API_KEY` (highly recommended to unlock the AI coach)
* `FLASK_ENV` = `production`
* `DATABASE_URL` (optional; if omitted, the backend will auto-provision a SQLite database in Vercel's writable `/tmp` folder)

---

## 🌟 Explore in Demo Mode
If you are a hackathon judge, click **"Explore in Demo Mode"** on the Sign In screen to instantly log in with pre-seeded data including a 5-month downward footprint trend, active offsets, and completed challenges!

---

## 📈 UN Sustainable Development Goals (SDG) Mappings

| Goal | Implementation | Metric |
| :--- | :--- | :--- |
| **SDG 13: Climate Action** | Real-time carbon estimations & offsets funding | Net emissions reduction (kg CO₂) |
| **SDG 7: Affordable & Clean Energy** | Community Solar offset projects & LED challenges | Shift from fossil fuel energy logs |
| **SDG 12: Responsible Consumption** | Composting & zero-meat dietary logging | Diversion of landfill waste |
