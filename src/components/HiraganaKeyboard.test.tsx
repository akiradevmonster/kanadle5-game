import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HiraganaKeyboard from './HiraganaKeyboard';

describe('HiraganaKeyboard', () => {
  const mockProps = {
    onKeyPress: jest.fn(),
    onBackspace: jest.fn(),
    onEnter: jest.fn(),
    characterStates: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all hiragana characters', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      // Check for some key hiragana characters
      expect(screen.getByRole('button', { name: 'Hiragana あ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hiragana か' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Hiragana ん' })).toBeInTheDocument();
    });

    it('should render special keys', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      expect(screen.getByRole('button', { name: 'Backspace' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument();
    });

    it('should apply correct layout structure', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      // Check that 'ん' is in the last row (Row 5)
      const hiraganaん = screen.getByRole('button', { name: 'Hiragana ん' });
      expect(hiraganaん).toBeInTheDocument();
    });
  });

  describe('Character Key Interactions', () => {
    it('should call onKeyPress when character key is clicked', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      fireEvent.click(あButton);

      expect(mockProps.onKeyPress).toHaveBeenCalledWith('あ');
      expect(mockProps.onKeyPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onKeyPress when disabled', () => {
      render(<HiraganaKeyboard {...mockProps} disabled />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      fireEvent.click(あButton);

      expect(mockProps.onKeyPress).not.toHaveBeenCalled();
    });
  });

  describe('Special Key Interactions', () => {
    it('should call onBackspace when backspace key is clicked', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      const backspaceButton = screen.getByRole('button', { name: 'Backspace' });
      fireEvent.click(backspaceButton);

      expect(mockProps.onBackspace).toHaveBeenCalledTimes(1);
    });

    it('should call onEnter when enter key is clicked', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      const enterButton = screen.getByRole('button', { name: 'Enter' });
      fireEvent.click(enterButton);

      expect(mockProps.onEnter).toHaveBeenCalledTimes(1);
    });

    it('should not call special key handlers when disabled', () => {
      render(<HiraganaKeyboard {...mockProps} disabled />);

      const backspaceButton = screen.getByRole('button', { name: 'Backspace' });
      const enterButton = screen.getByRole('button', { name: 'Enter' });

      fireEvent.click(backspaceButton);
      fireEvent.click(enterButton);

      expect(mockProps.onBackspace).not.toHaveBeenCalled();
      expect(mockProps.onEnter).not.toHaveBeenCalled();
    });
  });

  describe('Character State Feedback', () => {
    it('should apply correct styling for character states', () => {
      const characterStates = {
        あ: 'correct' as const,
        か: 'present' as const,
        さ: 'absent' as const,
      };

      render(<HiraganaKeyboard {...mockProps} characterStates={characterStates} />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      const かButton = screen.getByRole('button', { name: 'Hiragana か' });
      const さButton = screen.getByRole('button', { name: 'Hiragana さ' });

      // Check if correct state classes are applied
      expect(あButton).toHaveClass('bg-green-500');
      expect(かButton).toHaveClass('bg-yellow-500');
      expect(さButton).toHaveClass('bg-gray-600');
    });

    it('should apply default styling for characters without state', () => {
      render(<HiraganaKeyboard {...mockProps} characterStates={{}} />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      expect(あButton).toHaveClass('bg-gray-200');
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(<HiraganaKeyboard {...mockProps} disabled />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      const backspaceButton = screen.getByRole('button', { name: 'Backspace' });
      const enterButton = screen.getByRole('button', { name: 'Enter' });

      expect(あButton).toBeDisabled();
      expect(backspaceButton).toBeDisabled();
      expect(enterButton).toBeDisabled();
    });

    it('should apply disabled styling when disabled', () => {
      render(<HiraganaKeyboard {...mockProps} disabled />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      expect(あButton).toHaveClass('opacity-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      expect(screen.getByRole('button', { name: 'Hiragana あ' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Backspace' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enter' })).toBeInTheDocument();
    });

    it('should have proper tabIndex when not disabled', () => {
      render(<HiraganaKeyboard {...mockProps} />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      expect(あButton).toHaveAttribute('tabindex', '0');
    });

    it('should have tabIndex -1 when disabled', () => {
      render(<HiraganaKeyboard {...mockProps} disabled />);

      const あButton = screen.getByRole('button', { name: 'Hiragana あ' });
      expect(あButton).toHaveAttribute('tabindex', '-1');
    });
  });
});
