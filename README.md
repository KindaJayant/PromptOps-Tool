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
│   ├── llm.py           # OpenRouter integration & Jinja2 logic
│   ├── cli.py           # [NEW] Headless CLI diagnostic tool
│   ├── requirements.txt
│   └── .env             # API Keys (not in git)
├── frontend/
...
```

## Setup Instructions

...
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
   # Make sure you are inside the backend directory
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
- **Parallel Execution:** [NEW] Run multiple test cases concurrently using `asyncio.gather`.
- **Prompt Templating:** [NEW] Support for dynamic prompts using **Jinja2** variables (e.g., `{{variable}}`).
- **LLM Judge:** Automatically evaluate prompt outputs using an LLM judge with scoring and reasoning.
- **Analytics:** [NEW] Track pass rates and average scores across prompt versions.
- **CLI Tool:** [NEW] Manage prompts and run tests directly from the terminal.
- **Tags:** Label versions as `production`, `staging`, or `experiment`.

## CLI Usage

Run tests for a specific version from the terminal:
```bash
python backend/cli.py run <version_id>
```
List all prompts:
```bash
python backend/cli.py list
```
