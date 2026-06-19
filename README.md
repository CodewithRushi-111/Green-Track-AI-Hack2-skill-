# 🌿 GreenTrack AI

> Nature-inspired carbon footprint tracking, gamified offsetting, and intelligent climate recommendations. Made for the **Hack2Skill — Carbon Footprint Track** competition.

---

## 🚀 Key Features

### 1. 🤖 AI-Powered Carbon Advisor
* **Personalized Context Injection**: Unlike generic tip generators, our backend queries your lifetime emissions data and injects it directly into the AI's instruction set for bespoke coaching.
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
* **AI Orchestration**: Anthropic API (`anthropic`), Google GenAI (`google-generativeai`), Server-Sent Events (SSE).
* **Testing**: `pytest` integration testing.

---

## 📦 Quick Start

### 1. Prerequisites
Make sure you have Python 3.10+ installed.

### 2. Installation
Clone the repository and set up a virtual environment:
```bash
git clone https://github.com/CodewithRushi-111/Green-Track-AI-Hack2-skill-.git
cd Green-Track-AI-Hack2-skill-
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Setup
Create a `.env` file or export your API credentials:
```env
ANTHROPIC_API_KEY=your_claude_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Application
Start the Flask development server:
```bash
python app.py
```
Open your browser and navigate to `http://127.0.0.1:5000/`.

### 5. Running Tests
Run the 16 integration tests:
```bash
python -m pytest tests/test_suite.py
```

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
