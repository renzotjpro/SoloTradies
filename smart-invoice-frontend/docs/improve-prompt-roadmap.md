# Improve Prompt Feature - Implementation Roadmap

This document outlines the strategy and step-by-step plan for implementing the "Improve Prompt" feature across the frontend and backend of the Smart Invoice application.

## 🎯 Goal
Allow users to write a quick, rough description of their work (e.g., "I work 7 hours in the moal , at 20 h per hour from 21-01 to 22-02") and click an "Improve Prompt" button to have the AI automatically rewrite it into a clear, professional prompt.

## 🏗️ Architecture Strategy
- **Backend**: Create a new lightweight API endpoint in FastAPI that uses the existing LangChain setup to process the prompt improvement request. It should be stateless and fast.
- **Frontend**: Update the `PromptInput` component to handle loading states and make the API call without refreshing the page. The response will replace the text in the active textarea.

---

## 🗺️ Step-by-Step Implementation Plan

### Phase 1: Backend API Development
**Target File**: `smart-invoice-backend/app/api/agent.py`

1. **Create Request/Response Schemas**:
   - Define a Pydantic model `ImprovePromptRequest` that accepts a `prompt` (string).
   - Define a Pydantic model `ImprovePromptResponse` that returns the `improved_prompt` (string).

2. **Implement the Route**:
   - Add a new `POST` route: `@router.post("/improve-prompt", response_model=ImprovePromptResponse)`
   - Inside the route, extract the original prompt from the request.

3. **Integrate LangChain**:
   - Import `get_llm` from `app.agent.llm`.
   - Create a specific system prompt for this task. Example:
     > *"You are an AI assistant for a tradie invoicing app. The user will provide a rough, potentially grammatically incorrect description of their work. Your task is to rewrite it into a clear, professional, and structured text that is easy to understand. Fix spelling mistakes. Return ONLY the improved text, no conversational filler."*
   - Call the LLM with the system prompt and the user's original prompt.
   - Return the improved text in the response.

### Phase 2: Frontend Integration
**Target File**: `smart-invoice-frontend/src/components/chat/PromptInput.tsx`

1. **Add Loading State**:
   - Introduce a new state variable: `const [isImproving, setIsImproving] = useState(false);`
   - Import `<Loader2>` from `lucide-react` to use as a loading spinner.

2. **Implement API Call Logic**:
   - Create an async function `handleImprovePrompt()`.
   - Prevent execution if the prompt is empty or `disabled` is true.
   - Set `isImproving(true)`.
   - Make a `fetch` `POST` request to `http://localhost:8000/api/chat/improve-prompt` (ensure base URL matches your setup).
   - On success, update the main `prompt` state: `setPrompt(data.improved_prompt)`.
   - Handle errors (e.g., show a toast notification if the API fails).
   - Set `isImproving(false)` in a `finally` block.

3. **Update the UI**:
   - Locate the "Improve Prompt" `<button>` element.
   - Add `onClick={handleImprovePrompt}`.
   - Disable the button when `isImproving` is true or `prompt.trim()` is empty.
   - Conditionally render the icon: If `isImproving`, show the `<Loader2 className="w-4 h-4 animate-spin" />` instead of the `<Sparkles>` icon.

### Phase 3: Testing & Polish
1. **Test the Backend**: Use Swagger UI (`http://localhost:8000/docs`) to test the `/improve-prompt` endpoint with sample messy text.
2. **Test the Frontend**: Type a messy prompt in the UI, click the button, and ensure the loading animation plays and the text replaces correctly.
3. **Edge Cases**: Ensure the application doesn't crash if the AI returns an empty string or if the API connection fails. Verify the textarea auto-resizes if the improved prompt is significantly longer than the original.
