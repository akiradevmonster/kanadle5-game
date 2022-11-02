# Project Brief - Kanadle5 Game

## Project Overview

Kanadle5 Game is a Japanese (hiragana) version of the popular word-guessing game Wordle. The purpose is to develop and publish a LINE Mini App that allows Japanese users to easily enjoy a daily word puzzle game that leverages their vocabulary skills in short, engaging sessions.

## Core Requirements

### Functional Requirements

- **FR1**: Game with 8 attempts to guess a 5-character hiragana word
- **FR2**: Daily puzzle system with same word for all users
- **FR3**: Result recording and history display for logged-in users
- **FR4**: Emoji-based result sharing without spoilers
- **FR5**: LINE login functionality (optional for users)
- **FR6**: On-screen hiragana keyboard with color feedback

### Non-Functional Requirements

- **NFR1**: Mobile-first responsive UI optimized for LINE environment
- **NFR2**: Fast loading time (<3s initial load)
- **NFR3**: Consistent design with LINE app aesthetics
- **NFR4**: Simple, intuitive UX requiring minimal instructions
- **NFR5**: Compliance with LINE Mini App specifications

## Project Goals

### Primary Goals

1. Create an engaging, daily word puzzle game for Japanese LINE users
2. Build a seamless LINE integration experience
3. Establish a solid foundation for future feature extensions
4. Ensure high-quality user experience on mobile devices

### Success Criteria

- Positive user feedback on gameplay experience
- Increasing daily active users over first 3 months
- High sharing rate (>10% of completed games)
- Low bounce rate (<30% of users leaving without completing a game)
- Technical stability with <1% error rate

## Constraints

- **Time**: Development must be completed within project timeline
- **Resources**: Individual developer with AI agent support
- **Technical**: Must comply with LINE Mini App specifications
- **Platform**: Must work optimally on mobile devices
- **Resource Usage**: Within Vercel free/paid plan limitations

## Stakeholders

- **Users**: Japanese LINE users aged 10-60
- **Developer**: Individual developer with AI agent support
- **Platform**: LINE

## Priority Matrix

| Feature/Requirement      | Priority (1-5) | Complexity (1-5) | Notes                                         |
| ------------------------ | -------------- | ---------------- | --------------------------------------------- |
| Basic gameplay           | 5              | 4                | Core game mechanics                           |
| Daily word system        | 5              | 3                | Word selection and refresh                    |
| LINE login               | 4              | 3                | For user identification and progress tracking |
| Game result storage      | 4              | 3                | For history and statistics                    |
| Sharing functionality    | 3              | 2                | For social engagement                         |
| Keyboard implementation  | 5              | 4                | With hiragana support and color feedback      |
| Performance optimization | 3              | 4                | For smooth mobile experience                  |

## Out of Scope

- Word list creation functionality (word list will be provided)
- Multilingual support
- Complex analysis functionality
- Payment system
- Hard mode (not implemented in initial release)

## Technical Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, LINE LIFF SDK
- **Database**: Vercel KV (Redis-compatible data store) or Supabase
- **Infrastructure**: Vercel (hosting & deployment), GitHub (version control)
- **External APIs**: LINE Login API, LINE Messaging API

## Game Rules Details

- Guess a 5-character hiragana word in 8 attempts
- Only basic hiragana characters allowed (excluding 'を')
- No voiced sounds (濁音), semi-voiced sounds (半濁音), contracted sounds (拗音), double consonants (促音), or long vowels (長音)
- No small characters (ぁぃぅぇぉゃゅょゎ)
- Excluded characters: を (wo) - not used in game words
- Feedback: Green (correct character & position), Yellow (correct character, wrong position), Gray (not in word)
- Dictionary validation of entered words
- Daily reset at 00:00 Japan time

## References

- [Project Word List](/src/data/words.json) - List of valid 5-character hiragana words for the game
- [LINE LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
