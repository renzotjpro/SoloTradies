# AI Chat Interface Roadmap

This document outlines the strategy and phased implementation plan for the Smart Invoice AI Chat Interface.

## Phase 1: Foundation & Navigation (Completed)
- [x] Initial design analysis and component architecture planning.
- [x] Set up base route (`/chat`) and integrate with the main application Sidebar.
- [x] Build `ChatHome` layout container matching the UI mockups.
- [x] Implement `HeaderGreeting` with dynamic orange icon styling.
- [x] Implement `PromptInput` with auto-resizing textarea, character limits, and visual aesthetics (glow effects, action buttons).
- [x] Implement `RecentChats` horizontally scrollable carousel components.

## Phase 2: State Management & Transitions (Completed)
- [x] Define local state (`useState` in `chat/page.tsx`) to manage the current active chat session (`ChatView: "home" | "active"`).
- [x] Implement UI transition from "Home" state to "Active Chat" state:
  - Capture the initial prompt submission via `PromptInput.onSubmit`.
  - Unmount `HeaderGreeting` and `RecentChats`, render `ChatActive` view.
  - `PromptInput` reused in compact variant pinned at the bottom.

## Phase 3: Message Thread Interface (Completed)
- [x] Create the `MessageList` component to render the sequence of user and AI messages.
- [x] Create `ChatMessageBubble` UI component:
  - **User Messages**: Right-aligned, brand-600 background, white text, `rounded-tr-none`.
  - **AI Messages**: Left-aligned, white bg with border, Bot avatar, `rounded-tl-none`.
- [x] Add auto-scrolling behavior (`useRef` + `scrollIntoView`) pinned to newest messages.
- [x] Implement `TypingIndicator` (pulsing bouncing dots) while waiting for AI response.
- [x] Extract `InvoiceDraftCard` as reusable component (renders structured data with "Generate PDF" button).

## Phase 4: Backend API Integration (Completed)
- [x] Create `useChat` hook (`src/lib/hooks/useChat.ts`) with non-streaming and streaming modes.
- [x] Implement SSE streaming endpoint (`POST /api/chat/stream`) on FastAPI backend.
- [x] Frontend SSE consumer using `ReadableStream` reader for token-by-token display.
- [x] Streaming cursor (blinking `animate-pulse`) on assistant messages during generation.
- [x] Fallback to non-streaming `POST /api/chat/` on streaming error.
- [x] Merged `/create` page into `/chat` — `/create` now redirects to `/chat`.

## Phase 5: Persistence & Advanced Features (Next Steps)
- [ ] Connect the `RecentChats` components to actual database history.
- [ ] Implement the "All chats" view route (`/chats`) with a searchable history list.
- [ ] Wire up the "Improve Prompt" button to a lightweight LLM endpoint for prompt optimization.
- [ ] Add actionable UI components inside the AI's chat stream (e.g., if the AI drafts an invoice, render a miniature Invoice Preview Card with an "Approve" button directly in the chat).
- [ ] True token-level streaming (refactor LangGraph to use `llm.astream()` instead of simulated word-by-word).
- [ ] Abort/cancel support with `AbortController` and "Stop generating" button.
- [ ] Markdown rendering for assistant responses (`react-markdown`).
