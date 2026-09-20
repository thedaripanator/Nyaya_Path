# Nyaya Path Frontend

Frontend prototype for **Nyaya Path**, an AI-powered legal accessibility platform.

## Stack

- React 18
- Vite
- JavaScript
- Tailwind CSS
- Lucide React

## Run in VS Code

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Important

This version is frontend-only and uses mock data/service functions. The service layer is intentionally separated so a future Node.js/Express/FastAPI/NLP/RAG backend can replace the mock implementations.

## Main areas

- Landing page
- Login / Register
- Dashboard
- Ask Nyaya AI
- Laws
- Law details
- Judgments
- Judgment details
- Document analysis
- Global search
- Profile
- Settings
- Help / disclaimer

## Future integration

Replace the functions in `src/services/apiService.js` with Axios/API calls.

Recommended future architecture:

React → Node/Express API → Database/Auth → NLP/RAG service → Legal datasets/vector DB

Do not put API keys or secrets in the frontend.
