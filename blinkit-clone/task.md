# Checklist: Floating AI Assistant

- [x] Create Pydantic chat request and response schemas in `schemas.py`
- [x] Implement `/api/chat` POST route in FastAPI `main.py`
- [x] Write resilient fallback logic in `/api/chat` to handle cases where `OPENAI_API_KEY` is not present
- [x] Create floating `AIAssistant.tsx` component with preset buttons, scroll view, and chat message list
- [x] Incorporate interactive product cards for each recommended product inside the chat window
- [x] Connect adding and quantity modification within chat cards directly to `CartContext`
- [x] Mount the `AIAssistant` component floating in `Layout.tsx` for global page availability
- [x] Configure SSL bypass using custom `httpx` client in `/api/chat` to resolve local Windows Certificate validation failures
- [x] Configure support for the new Google Gemini `AQ.` API key prefix
- [x] Update model from deprecated `gemini-1.5-flash` to production-ready `gemini-2.5-flash`
- [x] Verify build and test integration
