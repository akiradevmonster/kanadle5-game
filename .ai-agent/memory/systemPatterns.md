# System Patterns - Kanadle5 Game

## Architecture Overview

Kanadle5 Game follows a modern frontend-focused architecture built with Next.js, leveraging server-side and client-side rendering as appropriate. The application integrates with LINE's LIFF platform for authentication and sharing, while using Vercel KV as a lightweight data store.

```
┌─────────────────────────────────────────┐
│                                         │
│  ┌─────────────┐      ┌──────────────┐  │
│  │             │      │              │  │
│  │   Next.js   │◄────►│  LINE LIFF   │  │
│  │   Frontend  │      │  Platform    │  │
│  │             │      │              │  │
│  └─────┬───────┘      └──────────────┘  │
│        │                                │
│        ▼                                │
│  ┌─────────────┐      ┌──────────────┐  │
│  │             │      │              │  │
│  │   Next.js   │◄────►│  Vercel KV   │  │
│  │   API Routes│      │  Database    │  │
│  │             │      │              │  │
│  └─────────────┘      └──────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Key Architecture Principles

- **Frontend-First**: Core game logic runs on the client for immediate feedback
- **JAMstack Approach**: Static generation where possible, API routes for dynamic data
- **Mobile Optimization**: Performance and UX optimized for mobile devices
- **Serverless**: Leveraging serverless functions and storage for scalability
- **Minimal State Management**: Simple, focused state without complex libraries

## System Components

### Component 1: Game Core

- **Purpose**: Manage core gameplay logic and user interactions
- **Responsibilities**:
  - Process user inputs and validate against game rules (SERVER-SIDE)
  - Track game state and update UI accordingly (CLIENT-SIDE)
  - Calculate results and maintain game history (SPLIT)
- **Interfaces**:
  - Provides: Game state, validation functions, hiragana input handling
  - Consumes: Word dictionary, daily word selection
- **Technical Details**:
  - Client: React hooks and context for UI state
  - Server: Next.js API routes for game logic
  - Security: Target word never exposed to client

### Component 2: LINE Integration

- **Purpose**: Handle all LINE platform interactions
- **Responsibilities**:
  - Authenticate users via LINE Login
  - Retrieve user profile information
  - Enable result sharing to LINE
- **Interfaces**:
  - Provides: Authentication status, user profile, sharing functions
  - Consumes: Game results for sharing
- **Technical Details**: Uses LINE LIFF SDK with custom React hooks for integration

### Component 3: Data Persistence

- **Purpose**: Store and retrieve game data
- **Responsibilities**:
  - Save user game history and statistics
  - Retrieve daily word challenges
  - Persist user preferences
- **Interfaces**:
  - Provides: Data access and storage functions
  - Consumes: User ID, game results, preferences
- **Technical Details**: Implemented with Vercel KV, with fallback to local storage for anonymous users

### Component 4: UI System

- **Purpose**: Present game interface and visual feedback
- **Responsibilities**:
  - Display game board and keyboard
  - Provide visual feedback on game progress
  - Adapt to different screen sizes
- **Interfaces**:
  - Provides: Visual components and responsive layouts
  - Consumes: Game state, user inputs
- **Technical Details**: Built with React components styled with Tailwind CSS

## Data Models

### Data Model 1: Word Dictionary

```json
[
  {
    "kana": "あいうえお", // 5-character hiragana word
    "word": "アイウエオ" // Kanji/katakana equivalent for display
  }
]
```

- **Description**: Collection of valid 5-character hiragana words with their meanings. The structure is defined by the `WordEntry` and `WordList` types in `src/types/words.ts`.
- **Validation Rules**: Must be exactly 5 characters, basic hiragana only. Structure enforced by TypeScript types.
- **Storage**: JSON file (`src/data/words.json`) in codebase, potentially cached or copied to database.
- **Usage**: For daily word selection and validating user guesses against the dictionary.

### Data Model 2: Client Game State

```typescript
type GuessResult = ('correct' | 'present' | 'absent')[];

type ClientGameState = {
  // UI state
  currentInput: string; // Current input string
  currentAttempt: number; // Current attempt number (0-7)
  gameStatus: 'playing' | 'won' | 'lost';

  // Display history (without correct answer)
  guesses: string[]; // Confirmed guess history
  guessResults: GuessResult[]; // Evaluation results for each guess

  // UI control
  isLoading: boolean; // API communication flag
  error: string | null; // Error message
};
```

- **Description**: Client-side game state for UI rendering and user interaction
- **Security**: Does not contain target word to prevent cheating
- **Storage**: React state (not persisted)
- **Usage**: UI rendering and user input handling

### Data Model 3: Server Game State

```typescript
type ServerGameState = {
  // Secure information
  targetWord: string; // Target word (absolutely secret)
  gameDate: string; // 'YYYY-MM-DD'

  // Persistent data
  userId?: string; // LINE user ID
  attempts: string[]; // Guess history
  completedAt?: Date; // Game completion time
  isCompleted: boolean; // Completion flag
  attemptCount: number; // Attempt count
};
```

- **Description**: Server-side game state for game logic and persistence
- **Security**: Contains sensitive target word, never exposed to client
- **Storage**: Vercel KV for persistence
- **Usage**: Game validation and progress tracking

### Data Model 3: User Profile

```typescript
type UserProfile = {
  userId: string; // LINE user ID
  displayName: string; // User's name from LINE
  pictureUrl?: string; // User's profile picture URL
  statusMessage?: string; // User's status message
  language?: string; // User's language setting
};
```

- **Description**: User information retrieved from LINE
- **Validation Rules**: Valid LINE user ID required
- **Storage**: Vercel KV, with temporary session storage
- **Usage**: User identification and personalization

### Data Model 4: User Statistics

```typescript
type UserStatistics = {
  userId: string; // LINE user ID
  gamesPlayed: number; // Total games played
  gamesWon: number; // Games successfully completed
  currentStreak: number; // Current consecutive days played
  maxStreak: number; // Maximum consecutive days played
  guessDistribution: Record<number, number>; // Distribution of guesses needed to win
  lastPlayed: string; // Date of last completed game
};
```

- **Description**: Tracks user's gameplay history and statistics
- **Validation Rules**: Non-negative numbers, valid user ID
- **Storage**: Vercel KV
- **Usage**: Performance history display and streak tracking

## API Patterns

### RESTful API Guidelines

- **URL Structure**: `/api/[resource]/[id]` format
- **Resource Naming**: Plural nouns (e.g., `/api/games`)
- **HTTP Methods**:
  - GET: Retrieve data
  - POST: Create new data
  - PUT: Update existing data
  - DELETE: Remove data
- **Status Codes**: Standard HTTP status codes (200, 201, 400, 401, 404, 500)
- **Error Handling**: Consistent error objects with code and message
- **Versioning**: Version in path if needed (`/api/v1/...`)

### API Endpoints

1. **User API** (Planned)

   - `GET /api/user` - Get current user profile
   - `GET /api/user/statistics` - Get user statistics

2. **Game API** (✅ Implemented)

   - `GET /api/game/daily` - Get today's game state (without target word) ✅
   - `POST /api/game/guess` - Submit a guess and get evaluation ✅

3. **Guess API Request/Response**

   ```typescript
   // POST /api/game/guess
   type GuessRequest = {
     guess: string;
     gameDate: string;
   };

   type GuessResponse = {
     result: GuessResult; // Evaluation result only
     gameStatus: 'playing' | 'won' | 'lost';
     attemptCount: number;
     // targetWord is never included
   };
   ```

## Design Patterns

### Frontend Patterns

- **Component Structure**:

  - Atomic design principles
  - Presentational vs. container components
  - Clear component responsibilities

- **State Management**:

  - React Context for app-wide state
  - Local state for component-specific needs
  - Custom hooks for reusable logic

- **Styling Approach**:

  - Tailwind CSS for utility-first styling
  - Mobile-first responsive design
  - Consistent color variables

- **Responsive Design**:

  - Mobile-first breakpoints
  - Viewport units for appropriate sizing
  - Touch-friendly UI elements

- **Accessibility**:
  - Semantic HTML
  - ARIA attributes where needed
  - Keyboard navigation support
  - Sufficient color contrast

### Backend Patterns

- **Service Organization**:

  - Separation of concerns
  - Business logic isolated from API layer
  - Modular service functions

- **Error Handling**:

  - Consistent error structure
  - Proper HTTP status codes
  - Informative but secure error messages

- **Caching**:

  - Cache daily words
  - Cache dictionary validation results
  - Browser caching for static assets

- **Security**:
  - Input validation
  - Rate limiting
  - Authentication via LINE LIFF

### TypeScript Patterns

- **Type Definitions**:

  - Use `type` aliases instead of `interface` to prevent implicit declaration merging
  - Explicit type definitions for all function parameters and return values
  - Strict mode enabled for better type safety

- **Type vs Interface Policy**:
  - Exclusively use `type` for object type definitions
  - Rationale: Prevent hard-to-find bugs caused by implicit interface merging
  - Benefit: More predictable and explicit type behavior

## Performance Considerations

- Mobile-first performance optimizations
- Static generation of non-dynamic content
- Minimal JavaScript payload
- Optimized asset loading
- Efficient state updates to minimize re-renders
- Lazy loading for non-critical components

## Security Patterns

- **Authentication**: LINE Login via LIFF
- **Authorization**: Session validation for protected operations
- **Data Protection**: No sensitive data stored, minimal personal info
- **Input Validation**: Server-side validation of all inputs
- **Rate Limiting**: Protect against abuse of API endpoints

## Internal Function Design

### Function Execution Flow in User Interaction

```
1. [Page Access]
   ↓
   📱 Next.js page.tsx initialization
   ↓
   🔧 getDailyWord(new Date(), wordList) ← Get today's target word (SERVER)
   ↓
   📱 GameBoard component display

2. [Character Input Start]
   ↓
   📱 Hiragana input via Keyboard component
   ↓
   🔧 Per character input: Basic hiragana character validation (CLIENT)

3. [5 Characters Complete & Submit Button Press]
   ↓
   🔧 validateWord(inputWord, dictionary) ← Dictionary check (SERVER)
   ↓
   ❌ false → Error display, continue input
   ✅ true → Proceed

4. [Guess Evaluation Execution]
   ↓
   🔧 evaluateGuess(inputWord, dailyWord) ← Comparison with target (SERVER)
   ↓
   🔧 updateGameState(currentState, inputWord, dailyWord) ← State update (CLIENT/SERVER)
   ↓
   📱 GameBoard re-render (colored feedback display)

5. [Game Continue/End Decision]
   ↓
   🔧 Completion check within updateGameState
   ↓
   Complete → Result screen display
   Continue → Wait for next input (return to step 2)
```

### Core Function Specifications

#### 1. validateWord (Server-side) ✅ Implemented

```typescript
function validateWord(word: string, dictionary: WordEntry[]): boolean;
```

- **Input**: 5-character string, dictionary array of WordEntry objects
- **Output**: Boolean indicating validity
- **Responsibility**: Hiragana character restriction, dictionary existence check
- **Location**: Server-side (used by gameService layer)
- **Security**: Prevents dictionary content exposure to client
- **Status**: Complete with comprehensive test coverage

#### 2. evaluateGuess (Server-side) ✅ Implemented

```typescript
function evaluateGuess(guess: string, target: string): GuessResult;
```

- **Input**: Guess string, target string
- **Output**: Array of character status (correct/present/absent)
- **Responsibility**: Character position and existence determination with two-pass algorithm
- **Location**: Server-side (used by gameService layer)
- **Security**: Prevents target word exposure to client
- **Status**: Complete with comprehensive test coverage including duplicate character handling

#### 3. getDailyWord (Server-side) ✅ Mock Implemented

```typescript
async function getDailyWord(date: Date): Promise<string>;
```

- **Input**: Date
- **Output**: Word for that day
- **Responsibility**: Date-based unique selection (currently returns "つきあかり")
- **Location**: Server-side (used by gameService layer)
- **Security**: Prevents target word exposure to client
- **Status**: Mock implementation complete, full persistence implementation pending

#### 4. updateGameState (Client-side & Server-side) ✅ Implemented

```typescript
// Client-side
function updateClientGameState(
  currentState: ClientGameState,
  guess: string,
  result: GuessResult
): ClientGameState;

// Server-side
function updateServerGameState(
  currentState: ServerGameState,
  guess: string,
  target: string
): ServerGameState;
```

- **Input**: Current state, guess, evaluation result/target
- **Output**: Updated state
- **Responsibility**: Attempt count, completion determination, win/loss detection
- **Location**: Both (separated by respective responsibilities)
- **Status**: Complete with comprehensive test coverage

#### 5. useGameState Hook (Client-side) ✅ Implemented

```typescript
function useGameState(): {
  gameState: ClientGameState;
  updateInput: (input: string) => void;
  clearInput: () => void;
  addGuess: (guess: string, result: GuessResult) => void;
  updateGameStatus: (status: GameStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  resetGame: () => void;
};
```

- **Input**: None
- **Output**: Game state and state management functions
- **Responsibility**: Client-side game state management with React hooks
- **Location**: Client-side React hook
- **Status**: Complete with comprehensive test coverage

#### 6. Game Service Layer ✅ Implemented

```typescript
async function submitGuess(
  guess: string,
  gameDate: string,
  wordList: WordEntry[]
): Promise<GuessResult>;
async function getDailyGameState(gameDate: string): Promise<DailyGameState>;
```

- **Input**: Game parameters and word list
- **Output**: Business logic results
- **Responsibility**: Business logic separation, error handling, API integration
- **Location**: Server-side service layer
- **Status**: Complete with comprehensive test coverage and mocked dependencies

### Security Considerations for Client-Server Separation

- **Client side**: UI state, input processing, display control
- **Server side**: Game logic, target word, dictionary validation
- **API communication**: Submit guess → Receive evaluation result (target word is absolutely never exposed)

### Function Placement Strategy

- `validateWord()` → **Server-side** (dictionary confidentiality)
- `evaluateGuess()` → **Server-side** (requires target word)
- `getDailyWord()` → **Server-side** (target confidentiality)
- `updateGameState()` → **Client/Server both** (respective state updates)

### Open Questions for Future Implementation

1. **Error Handling**: Processing flow for invalid word input, network errors, date change timing
2. **Synchronization Issues**: Game switching at midnight, multiple tabs, offline-online transitions
3. **API Idempotency**: Handling duplicate submissions and network retry scenarios
4. **Game Logic Details**: Character duplicate rules, win/loss determination timing

## Testing Strategy

- **Unit Testing**: ✅ Complete (74 tests passing)

  - Core game logic (validateWord, evaluateGuess, getDailyWord)
  - Utility functions (updateGameState, gameService layer)
  - Component rendering (GameBoard, HiraganaKeyboard)
  - React hooks (useGameState)

- **Integration Testing**: ✅ Complete

  - API endpoints (/api/game/guess, /api/game/daily)
  - Component integration (GameBoard + HiraganaKeyboard)
  - State management integration

- **End-to-End Testing**: 📋 Pending

  - Complete game flows
  - Authentication process
  - Result sharing

- **Performance Testing**: 📋 Pending

  - Load time benchmarks
  - Interaction responsiveness
  - API response times

- **Security Testing**: ✅ Partial
  - Input validation (implemented)
  - Safe data handling practices (implemented)
  - Authentication flow verification (pending LINE LIFF)
