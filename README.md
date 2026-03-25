# PromptOps Tool

A version control system for LLM prompts with diffing, testing integration, and rollback support.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite, Lucide React
- **Backend:** FastAPI (Python), SQLAlchemy, Pydantic
- **Database:** SQLite
- **LLM:** Arcee Trinity Large via OpenRouter
- **Diffing:** Python's `difflib`

## Project Structure

```
promptops/
├── backend/
│   ├── main.py          # FastAPI application & routes
│   ├── models.py        # SQLAlchemy database models
│   ├── database.py      # SQLite engine & session setup
│   ├── schemas.py       # Pydantic models for validation
│   ├── llm.py           # OpenRouter API & LLM judge logic
│   ├── requirements.txt
│   └── .env             # API Keys (not in git)
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main application shell
│   │   ├── api.js       # Backend fetch utilities
│   │   └── components/  # Modular UI components
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file and add your OpenRouter API Key:
   ```env
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=arcee/arcee-trinity-large
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`.

## Features

- **Prompt Versioning:** Save new versions with commit messages.
- **Rollback:** Restore any previous version as the new latest.
- **Diff View:** Compare two versions side-by-side with color-coded changes.
- **Test Suite:** Create test cases and run them against any version.
- **LLM Judge:** Automatically evaluate prompt outputs using an LLM judge with scoring and reasoning.
- **Tags:** Label versions as `production`, `staging`, or `experiment`.
