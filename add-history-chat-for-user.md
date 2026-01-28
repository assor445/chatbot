# Implementation Plan: Chat History Feature

## Goal
Implement a persistent chat history system per user account, allowing users to:
1.  View a list of past conversations in the sidebar.
2.  Create new conversations.
3.  Continue past conversations.
4.  Persist all messages to Supabase.

## 1. Database Schema Design (Supabase)

We need two new tables in Supabase: `chats` and `messages`.

### Table: `chats`
Stores metadata about each conversation.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | `auth.uid()` | Foreign Key to `auth.users` |
| `title` | `text` | `"New Chat"` | Title of the chat (can be auto-generated later) |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | `now()` | Last activity timestamp |

**RLS Policies:**
- Users can select their own chats.
- Users can insert their own chats.
- Users can update their own chats.
- Users can delete their own chats.

### Table: `messages`
Stores the actual chat messages for each conversation.

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `chat_id` | `uuid` | - | Foreign Key to `chats.id` (Cascade Delete) |
| `role` | `text` | - | 'user' or 'assistant' |
| `content` | `text` | - | The message content |
| `created_at` | `timestamptz` | `now()` | Creation timestamp |

**RLS Policies:**
- Users can select messages where `chat_id` belongs to them.
- Users can insert messages to their own chats.

---

## 2. Server Actions & API

We will need Server Attributes/Actions to handle data operations securely.

### `src/utils/supabase/server.ts` or `src/actions/chat.ts`

1.  **`getChats()`**
    *   Fetch all chats for the current user, ordered by `updated_at` descending.
2.  **`getChat(chatId: string)`**
    *   Fetch a specific chat and its messages.
3.  **`createChat(firstMessage: string)`**
    *   Create a new entry in `chats`.
    *   Insert the initial user message into `messages`.
    *   Return the new `chatId`.
4.  **`saveMessage(chatId: string, role: string, content: string)`**
    *   Insert a new message into `messages`.
    *   Update `chats.updated_at`.
5.  **`deleteChat(chatId: string)`**
    *   Delete a chat (messages will cascade delete).

---

## 3. Frontend & UI Changes

### File Structure
```
src/app/chat/
├── page.tsx          -> Acts as "New Chat" page
├── [id]/page.tsx     -> Acts as "Existing Chat" page (Loads history)
├── layout.tsx        -> Contains the Sidebar (Shared across all chat pages)
└── components/
    ├── ChatSidebar.tsx
    └── ChatInterface.tsx -> Refactored core chat logic
```

### Refactoring Strategy
1.  **Extract `ChatInterface`**: Move the current chat logic (input, messages display, `sendMessage`) from `page.tsx` into a reusable component `ChatInterface.tsx`.
2.  **Create `layout.tsx`**: Move the Sidebar into a `layout.tsx` file so it persists across navigation. The Sidebar will fetch and display the list of chats.
3.  **Update `page.tsx`**: It will simply render `<ChatInterface />` with an empty state.
4.  **Create `[id]/page.tsx`**: It will fetch the initial messages for the given `id` and pass them to `<ChatInterface initialMessages={...} chatId={...} />`.

### User Flow
1.  **New Chat**: User visits `/chat`. Enters a message.
    *   App calls `createChat()`.
    *   Redirects user to `/chat/[new_id]` (shallow routing or full navigation).
    *   AI response streams as usual.
2.  **Load History**: User clicks a chat in Sidebar.
    *   Navigates to `/chat/[id]`.
    *   Server Component fetches history.
    *   Chat interface initializes with past messages.
3.  **Continue Chat**: User sends message in `/chat/[id]`.
    *   App calls `saveMessage()` for user input.
    *   App streams AI response and calls `saveMessage()` for assistant output when done.
