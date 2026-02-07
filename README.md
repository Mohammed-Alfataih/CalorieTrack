# CalorieTrack 🔥

AI-Powered Nutrition Tracker with bilingual support (English/Arabic).

## ⚠️ SECURITY FIRST

**CRITICAL: API Key Security**
- Your Anthropic API key must be kept SECRET
- NEVER commit your `.env` file to git (it's protected by .gitignore)
- NEVER share your API key with anyone
- The backend server (`server.js`) is the ONLY place that uses the key
- Each user must get their own API key from https://console.anthropic.com/

The `.env` file is excluded from this repository. You must create your own from `.env.example`.

## Features

- 🎯 Set daily calorie goals
- 🤖 AI-powered calorie estimation from food names
- 📸 Photo scanning with AI vision to identify food and calories
- 🌍 Full bilingual support (English ↔ Arabic) with instant switching
- 💾 Local storage persistence
- 🌙 Dark theme

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Key

**⚠️ IMPORTANT: Never expose your API key in client-side code in production!**

For development/testing, you have two options:

#### Option A: Environment Variable (Quick Start)

Create a `.env` file in the root directory:

```bash
REACT_APP_ANTHROPIC_API_KEY=your_api_key_here
```

Get your API key from: https://console.anthropic.com/

#### Option B: Backend Proxy (Recommended for Production)

Create a simple Express backend to proxy API requests:

1. Install backend dependencies:
```bash
npm install express cors dotenv
```

2. Create `server.js`:
```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log('Proxy running on port 3001'));
```

3. Update `src/utils/api.js` to use `http://localhost:3001/api/claude` instead of the Anthropic API directly.

4. Start both servers:
```bash
# Terminal 1
node server.js

# Terminal 2
npm start
```

### 3. Run the App

```bash
npm start
```

The app will open at `http://localhost:3000`

## Usage

1. **Set Your Goal**: On first launch, enter your daily calorie target
2. **Add Food**: Type the food name and let AI estimate calories, or enter manually
3. **Scan Photos**: Upload a meal photo and AI will identify the food and calories
4. **Switch Language**: Click EN/العربية to toggle languages instantly
5. **Track Progress**: Watch your daily progress bar fill up

## Tech Stack

- React 18
- Anthropic Claude API (Sonnet 4)
- localStorage for persistence
- CSS Modules for styling

## Project Structure

```
src/
├── components/      # UI components (Header, Toast, Forms, etc.)
├── constants/       # Translations and constants
├── hooks/          # Custom React hooks (useStorage)
├── utils/          # API calls and helpers
├── App.jsx         # Root component
└── index.js        # Entry point
```

## Notes

- All food entries store both English and Arabic names
- Switching language updates all names instantly (no re-fetch)
- Data persists in localStorage
- Photos are previewed locally (not uploaded anywhere except to Claude API)

## Security

**Never commit your `.env` file or expose API keys in production!**

For production deployment:
- Use a backend proxy server
- Store API keys in environment variables on your server
- Use HTTPS
- Implement rate limiting

## License

MIT
