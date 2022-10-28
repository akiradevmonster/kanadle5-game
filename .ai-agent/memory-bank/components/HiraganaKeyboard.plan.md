# HiraganaKeyboard Component Implementation Plan

## Overview

The HiraganaKeyboard component is a critical UI element for the Kanadle5 game, providing an on-screen hiragana keyboard with visual feedback. This component enables users to input Japanese hiragana characters on mobile devices while providing visual cues about character usage status.

## Requirements Analysis

### Functional Requirements

- **FR6**: On-screen hiragana keyboard with color feedback
- **Character Set**: Basic hiragana characters only (あ-ん, excluding 'を')
- **Touch Operations**: Intuitive input for mobile environments
- **Visual Feedback**: Color-coded character status based on game state
- **Game Integration**: Send input characters to game logic

### Technical Requirements

- **React + TypeScript**: Type safety and maintainability
- **Tailwind CSS**: Mobile-first responsive design
- **Accessibility**: ARIA attributes, keyboard navigation
- **Performance**: Minimize touch delay and optimize rendering

## Component Design

### 1. HiraganaKeyboard Component Interface

```typescript
type CharacterState = 'default' | 'correct' | 'present' | 'absent';

interface HiraganaKeyboardProps {
  onKeyPress: (character: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  characterStates: Record<string, CharacterState>;
  disabled?: boolean;
}
```

### 2. Keyboard Layout Design

```text
Row 1: あ か さ た な は ま や ら わ
Row 2: い き し ち に ひ み   り
Row 3: う く す つ ぬ ふ む ゆ る
Row 4: え け せ て ね へ め   れ
Row 5: お こ そ と の ほ も よ ろ ん
Row 6: [Backspace] [Enter]
```

### 3. Color Feedback System

- **default**: Gray (unused)
- **correct**: Green (correct position)
- **present**: Yellow (correct character, wrong position)
- **absent**: Dark gray (not in word)

## Implementation Phases

### Phase 1: Basic Structure and Layout

1. **Branch Creation**: ✅ `feature/implement-hiragana-keyboard`
2. **Create HiraganaKeyboard.tsx**: Basic component structure
3. **Define Key Layout**: Hiragana character arrays and grid structure
4. **Basic Styling**: Mobile-first design with Tailwind CSS

### Phase 2: Interaction Implementation

1. **Touch Event Handling**: Optimize onTouchStart/onTouchEnd
2. **Click Event Handling**: Mouse operation support
3. **Keyboard Accessibility**: Focus management, ARIA attributes
4. **Special Keys**: Backspace and Enter button implementation

### Phase 3: State Management and Feedback

1. **Character State Management**: Reflect characterStates prop
2. **Color Feedback**: Dynamic style changes
3. **Animations**: Press feedback effects
4. **Disabled State**: Deactivation when game ends

### Phase 4: Integration and Testing

1. **GameBoard Integration**: Implement component interaction
2. **Test Creation**: Jest + React Testing Library
3. **Responsive Adjustments**: Verify behavior on various screen sizes
4. **Performance Optimization**: Memoization, prevent unnecessary re-renders

## Detailed Design

### A. Character Array Definition

```typescript
const HIRAGANA_LAYOUT = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '', 'り', ''],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', ''],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '', 'れ', ''],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'ん'],
];

const SPECIAL_KEYS = {
  BACKSPACE: 'BACKSPACE',
  ENTER: 'ENTER',
} as const;
```

### B. Style Design

- **Key Size**: `w-8 h-10` (mobile optimized)
- **Touch Target**: 44px minimum (accessibility standard)
- **Spacing**: `gap-1` (4px)
- **Font**: `text-lg font-medium`
- **Border Radius**: `rounded` for modern appearance

### C. Accessibility Considerations

- `role="button"` for all keys
- `aria-label="Hiragana {character}"` for screen readers
- `tabIndex` for sequential focus navigation
- High contrast support
- Touch target size compliance (minimum 44px)

## State Color Mapping

```typescript
const getKeyColorClass = (state: CharacterState): string => {
  switch (state) {
    case 'correct':
      return 'bg-green-500 text-white border-green-600';
    case 'present':
      return 'bg-yellow-500 text-white border-yellow-600';
    case 'absent':
      return 'bg-gray-600 text-white border-gray-700';
    default:
      return 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300';
  }
};
```

## Testing Strategy

### 1. Unit Tests

- Verify event firing on character press
- Test backspace and enter button behavior
- Validate color changes based on state
- Test disabled state behavior

### 2. Integration Tests

- GameBoard integration
- Actual game flow operation

### 3. Accessibility Tests

- Screen reader compatibility
- Keyboard navigation
- Touch target size verification

## Performance Considerations

- **Memoization**: Use React.memo for component optimization
- **Event Handlers**: Memoize with useCallback
- **Touch Optimization**: Prevent default touch behaviors where appropriate
- **Virtual Keys**: Consider virtualization for large keyboards (not needed for this layout)

## Security Considerations

- **Input Validation**: Ensure only valid hiragana characters are accepted
- **XSS Prevention**: Proper character encoding and sanitization
- **Event Handling**: Prevent malicious event injection

## Browser Compatibility

- **Mobile Safari**: iOS 14+
- **Chrome Mobile**: Android 8+
- **LINE In-App Browser**: Based on WebView
- **Touch Events**: Fallback to mouse events

## Future Extensibility

- **Keyboard Layouts**: Support for different arrangements
- **Animation Library**: Enhanced press animations
- **Haptic Feedback**: Vibration on supported devices
- **Sound Effects**: Audio feedback for key presses
- **Themes**: Dark/light mode support
