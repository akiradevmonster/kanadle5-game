import React from 'react';

/**
 * Character state for visual feedback
 */
type CharacterState = 'default' | 'correct' | 'present' | 'absent';

/**
 * Props for HiraganaKeyboard component
 */
interface HiraganaKeyboardProps {
  onKeyPress: (character: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  characterStates: Record<string, CharacterState>;
  disabled?: boolean;
}

/**
 * Hiragana character layout for the keyboard
 * Updated layout with 'ん' moved to Row 5 for better accessibility
 */
const HIRAGANA_LAYOUT = [
  ['あ', 'か', 'さ', 'た', 'な', 'は', 'ま', 'や', 'ら', 'わ'],
  ['い', 'き', 'し', 'ち', 'に', 'ひ', 'み', '', 'り', ''],
  ['う', 'く', 'す', 'つ', 'ぬ', 'ふ', 'む', 'ゆ', 'る', ''],
  ['え', 'け', 'せ', 'て', 'ね', 'へ', 'め', '', 'れ', ''],
  ['お', 'こ', 'そ', 'と', 'の', 'ほ', 'も', 'よ', 'ろ', 'ん'],
];

/**
 * Special key identifiers
 * TODO: Will be used in future phases for enhanced keyboard functionality
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SPECIAL_KEYS = {
  BACKSPACE: 'BACKSPACE',
  ENTER: 'ENTER',
} as const;

/**
 * Get CSS classes for key based on character state
 */
const getKeyColorClass = (state: CharacterState): string => {
  switch (state) {
    case 'correct':
      return 'bg-green-500 text-white border-green-600';
    case 'present':
      return 'bg-yellow-500 text-white border-yellow-600';
    case 'absent':
      return 'bg-gray-600 text-white border-gray-700';
    default:
      return 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300 active:bg-gray-400';
  }
};

/**
 * HiraganaKeyboard Component
 *
 * Provides an on-screen hiragana keyboard with visual feedback for the Kanadle5 game.
 * Features touch-optimized keys with color-coded feedback based on character usage.
 */
const HiraganaKeyboard: React.FC<HiraganaKeyboardProps> = ({
  onKeyPress,
  onBackspace,
  onEnter,
  characterStates,
  disabled = false,
}) => {
  /**
   * Handle character key press
   */
  const handleCharacterPress = (character: string) => {
    if (disabled || !character) return;
    onKeyPress(character);
  };

  /**
   * Handle backspace key press
   */
  const handleBackspacePress = () => {
    if (disabled) return;
    onBackspace();
  };

  /**
   * Handle enter key press
   */
  const handleEnterPress = () => {
    if (disabled) return;
    onEnter();
  };

  /**
   * Render a character key
   */
  const renderCharacterKey = (character: string, rowIndex: number, colIndex: number) => {
    if (!character) {
      return <div key={`empty-${rowIndex}-${colIndex}`} className="w-8 h-10" />;
    }

    const state = characterStates[character] || 'default';
    const colorClass = getKeyColorClass(state);
    const isDisabled = disabled;

    return (
      <button
        key={`char-${character}`}
        type="button"
        className={`
          w-8 h-10 rounded border-2 text-lg font-medium
          transition-colors duration-150 ease-in-out
          touch-manipulation select-none
          ${colorClass}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={() => handleCharacterPress(character)}
        disabled={isDisabled}
        aria-label={`Hiragana ${character}`}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
      >
        {character}
      </button>
    );
  };

  /**
   * Render special action keys (Backspace, Enter)
   */
  const renderSpecialKeys = () => {
    const specialKeyClass = `
      px-4 h-10 rounded border-2 text-sm font-medium
      transition-colors duration-150 ease-in-out
      touch-manipulation select-none
      ${
        disabled
          ? 'bg-gray-300 text-gray-500 border-gray-400 opacity-50 cursor-not-allowed'
          : 'bg-gray-600 text-white border-gray-700 hover:bg-gray-700 active:bg-gray-800 cursor-pointer'
      }
    `;

    return (
      <div className="flex justify-center gap-4 mt-2">
        <button
          type="button"
          className={specialKeyClass}
          onClick={handleBackspacePress}
          disabled={disabled}
          aria-label="Backspace"
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          削除
        </button>
        <button
          type="button"
          className={specialKeyClass}
          onClick={handleEnterPress}
          disabled={disabled}
          aria-label="Enter"
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          決定
        </button>
      </div>
    );
  };

  return (
    <div className="hiragana-keyboard w-full max-w-md mx-auto">
      {/* Character keys grid */}
      <div className="grid gap-1 mb-2">
        {HIRAGANA_LAYOUT.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex justify-center gap-1">
            {row.map((character, colIndex) => renderCharacterKey(character, rowIndex, colIndex))}
          </div>
        ))}
      </div>

      {/* Special action keys */}
      {renderSpecialKeys()}
    </div>
  );
};

export default HiraganaKeyboard;
