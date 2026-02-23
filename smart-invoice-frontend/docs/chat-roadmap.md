# AI Chat Interface Roadmap

This document outlines the strategy and phased implementation plan for the Smart Invoice AI Chat Interface.

## Phase 1: Foundation & Navigation (Completed)
- [x] Initial design analysis and component architecture planning.
- [x] Set up base route (`/chat`) and integrate with the main application Sidebar.
- [x] Build `ChatHome` layout container matching the UI mockups.
- [x] Implement `HeaderGreeting` with dynamic orange icon styling.
- [x] Implement `PromptInput` with auto-resizing textarea, character limits, and visual aesthetics (glow effects, action buttons).
- [x] Implement `RecentChats` horizontally scrollable carousel components.

## Phase 2: State Management & Transitions (Next Steps)
- [ ] Define local state or URL state (e.g., `?id=123`) to manage the current active chat session.
- [ ] Implement UI transition from "Home" state to "Active Chat" state:
  - Capture the initial prompt submission.
  - Animate the `PromptInput` locking to the bottom of the view.
  - Fade out or unmount `HeaderGreeting` and `RecentChats`.
  - Render the empty message thread container.

## Phase 3: Message Thread Interface
- [ ] Create the `MessageList` component to render the sequence of user and AI messages.
- [ ] Create `ChatMessage` UI components:
  - **User Messages**: Distinct styling (e.g., aligned right or with varying background color).
  - **AI Messages**: Support for rich text rendering (Markdown, lists, bold text).
- [ ] Add auto-scrolling behavior so the view stays pinned to the newest messages.
- [ ] Implement a loading state (e.g., a pulsing typing indicator or skeleton loader) while waiting for the AI response.

## Phase 4: Backend API Integration
- [ ] Setup API route handlers in Next.js to communicate with your backend (FastAPI/LangGraph).
- [ ] Implement chunked streaming (Server-Sent Events) so the AI responses appear token-by-token in real-time, matching standard AI tooling UX.
- [ ] Implement robust error handling for network failures or timeout scenarios.

## Phase 5: Persistence & Advanced Features
- [ ] Connect the `RecentChats` components to actual database history.
- [ ] Implement the "All chats" view route (`/chats`) with a searchable history list.
- [ ] Wire up the "Improve Prompt" button to a lightweight LLM endpoint for prompt optimization.
- [ ] Add actionable UI components inside the AI's chat stream (e.g., if the AI drafts an invoice, render a miniature Invoice Preview Card with an "Approve" button directly in the chat).
