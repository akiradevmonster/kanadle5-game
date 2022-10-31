# evaluateGuess Function Implementation Plan

## Overview

The `evaluateGuess` function compares a 5-character guess word with a target word and determines the state of each character:

- **correct**: Character and position both match
- **present**: Character exists in target but at different position
- **absent**: Character does not exist in target

## Function Signature

```typescript
export function evaluateGuess(guess: string, targetWord: string): GuessResult;
```

## Evaluation Timing

- Evaluation is performed after all 5 characters are input
- Results for all 5 characters are returned simultaneously

## Detailed Evaluation Algorithm

### 1. Preprocessing

```typescript
1. Count occurrences of each character in target word
   Example: "ねこねこる" → {ね:2, こ:2, る:1}
2. Initialize result array (5 elements, all undefined)
```

### 2. First Pass: Correct Evaluation

```typescript
FOR i = 0 TO 4:
  IF guess[i] == target[i]:
    result[i] = "correct"
    targetCharCount[guess[i]] -= 1
```

### 3. Second Pass: Present/Absent Evaluation

```typescript
FOR i = 0 TO 4:  // Process from left to right
  IF result[i] == undefined:
    IF targetCharCount[guess[i]] > 0:
      result[i] = "present"
      targetCharCount[guess[i]] -= 1
    ELSE:
      result[i] = "absent"
```

## Processing Example: "ここあねこ" vs "ねこねこる"

### Initial State

- Guess: `[こ,こ,あ,ね,こ]`
- Target: `[ね,こ,ね,こ,る]`
- Target char count: `{ね:2, こ:2, る:1}`

### After First Pass

- Position 1: こ==こ → correct
- Result: `[undefined, correct, undefined, undefined, undefined]`
- Target char count: `{ね:2, こ:1, る:1}`

### Second Pass Processing

1. Position 0: "こ", count 1 → **present**, count 0
2. Position 2: "あ", count 0 → **absent**
3. Position 3: "ね", count 2 → **present**, count 1
4. Position 4: "こ", count 0 → **absent**

### Final Result

`[present, correct, absent, present, absent]`

## Edge Case Specifications

### Multiple Same Characters

- Correct matches consume count first
- Remaining positions assigned present from left to right
- Positions exceeding available count become absent

### All Same Characters

- Input "aaaaa", Target "aaaaa" → All correct
- Input "aaaaa", Target "aabbb" → First 2 correct, rest absent

## Evaluation Priority Principles

1. **Exact position matches (correct) have highest priority**
2. **Left-side characters have priority for present status**
3. **Duplicates exceeding target count are marked absent**

## Test Cases to Implement

### Basic Cases

```typescript
1. No duplicates
Input: あいうえお
Target: あいえかき
Result: correct, correct, absent, present, absent

2. Complete match
Input: あいうえお
Target: あいうえお
Result: correct, correct, correct, correct, correct

3. Target has 2 same chars (input has 1)
Input: あいうえお
Target: ああうえお
Result: correct, absent, correct, correct, correct

4. Target has 2 same chars (input has 2, wrong position)
Input: ああうえお
Target: うえおああ
Result: absent, absent, absent, present, present

5. Input has 2 same chars (target has 1)
Input: ああうえお
Target: あいうえお
Result: correct, absent, correct, correct, correct

6. Complex duplicate pattern
Input: ここここあ
Target: あここうえ
Result: absent, correct, correct, absent, absent

7. All same characters
Input: aaaaa
Target: aaaaa
Result: correct, correct, correct, correct, correct

8. Wrong position duplicates
Input: あいあいあ
Target: いあいあい
Result: present, present, present, present, present
```

### Invalid Input Tests

- Non-hiragana characters
- Including 'を' character
- Null/undefined inputs
- Different length strings

## Example Test

```typescript
test('evaluates exact match correctly', () => {
  const result: GuessResult = evaluateGuess('こんにちは', 'こんにちは');
  expect(result).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
});
```

## Implementation Notes

- Target character count is dynamically updated during evaluation
- Each pass processes all positions independently
- Character normalization (case, width) is outside scope of this specification

## Next Actions

1. Create test file with all specified test cases
2. Implement function following the two-pass algorithm
3. Ensure left-to-right priority for present assignment
4. Refactor for clarity and performance
