# CRM App - Quick Setup Guide

## ONE PLACE FOR ALL SETTINGS!

All configuration is now in **ONE SINGLE FILE**:

```
C:\my-crm-app\.env
```

---

## How to Add Your Gemini API Key

1. Open the file: **`C:\my-crm-app\.env`**
2. Find the line: `GEMINI_API_KEY=`
3. Paste your key right after the `=` sign

**Example:**
```env
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:**
- No spaces around `=`
- No quotes around the key
- Just paste it directly

---

## Testing Your Setup

Run this command to verify everything is working:

```bash
cd backend
python test_config.py
```

You should see:
```
SUCCESS! Gemini API key is loaded and ready!
```

---

## Starting the Application

### 1. Start Database (Docker)
```bash
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## File Structure

```
my-crm-app/
├── .env                    ← PASTE YOUR API KEY HERE! (ONE PLACE!)
├── .env.example            ← Template/example file
├── .gitignore             ← Prevents .env from being committed
├── backend/
│   ├── app/
│   │   ├── config.py      ← Reads from root .env
│   │   └── ...
│   └── test_config.py     ← Test if API key is loaded
└── frontend/
    ├── vite.config.js     ← Configured to read from root .env
    └── ...
```

---

## Troubleshooting

### "AI is in simulated mode"

This means the API key is not loaded. Fix:

1. Open `C:\my-crm-app\.env`
2. Make sure line 6 has your key: `GEMINI_API_KEY=AIzaSy...`
3. **Save the file**
4. Restart the backend server

### Check if key is loaded

```bash
cd backend
python test_config.py
```

Should show:
```
GEMINI_API_KEY: [SET] (39 chars)
```

---

## What Changed?

✅ **Before:** Multiple .env files (confusing!)
- `backend/.env`
- `frontend/.env`

✅ **After:** ONE centralized file!
- `.env` at project root

✅ **Benefits:**
- Paste API key in ONE place
- Both backend and frontend use it
- Easier to manage
- Less confusion

---

## Get Your Gemini API Key

https://aistudio.google.com/app/apikey

1. Click "Create API Key"
2. Copy the key
3. Paste in `.env` file

---

## Need Help?

Run the test script:
```bash
cd backend
python test_config.py
```

It will show you exactly what's loaded and where the file is!
