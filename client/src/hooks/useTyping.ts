import { useState, useCallback, useRef } from 'react';
import { playKeySound, playErrorSound, playCompleteSound } from '../lib/sounds';
import { ReplayRecorder, type ReplayEvent } from '../lib/replay';

interface TypingState {
  readonly currentIndex: number;
  readonly correctChars: number;
  readonly totalKeystrokes: number;
  readonly errors: ReadonlySet<number>;
  readonly startTime: number | null;
  readonly endTime: number | null;
  readonly wpm: number;
  readonly accuracy: number;
  readonly isComplete: boolean;
}

const INITIAL_STATE: TypingState = {
  currentIndex: 0,
  correctChars: 0,
  totalKeystrokes: 0,
  errors: new Set(),
  startTime: null,
  endTime: null,
  wpm: 0,
  accuracy: 100,
  isComplete: false,
};

export function useTyping(text: string, onProgress?: (state: TypingState) => void, options?: { strictMode?: boolean }) {
  const [state, setState] = useState<TypingState>(INITIAL_STATE);
  const stateRef = useRef(INITIAL_STATE);
  const recorderRef = useRef(new ReplayRecorder());

  const reset = useCallback(() => {
    const newState = { ...INITIAL_STATE, errors: new Set<number>() };
    stateRef.current = newState;
    setState(newState);
    recorderRef.current.reset();
  }, []);

  const getReplayData = useCallback((): readonly ReplayEvent[] => {
    return recorderRef.current.stop();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    if (stateRef.current.isComplete) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key;
    if (key === 'Shift' || key === 'Control' || key === 'Alt' || key === 'Meta' ||
        key === 'CapsLock' || key === 'Tab' || key === 'Escape' ||
        key.startsWith('Arrow') || key.startsWith('F')) return;

    e.preventDefault();

    const current = stateRef.current;
    const now = Date.now();
    const startTime = current.startTime ?? now;

    // Start recording on first keystroke
    if (!current.startTime) {
      recorderRef.current.start();
    }

    if (key === 'Backspace') {
      if (options?.strictMode) return; // Strict mode: no backspace allowed
      if (current.currentIndex > 0) {
        const newIndex = current.currentIndex - 1;
        const newErrors = new Set(current.errors);
        newErrors.delete(newIndex);
        const newState: TypingState = {
          ...current,
          currentIndex: newIndex,
          errors: newErrors,
          startTime,
        };
        stateRef.current = newState;
        setState(newState);
        recorderRef.current.record('Backspace', true);
      }
      return;
    }

    if (key.length !== 1) return;

    const newTotalKeystrokes = current.totalKeystrokes + 1;
    const expectedChar = text[current.currentIndex];
    const isCorrect = key === expectedChar;

    const newCorrectChars = isCorrect ? current.correctChars + 1 : current.correctChars;
    const newErrors = new Set(current.errors);
    if (!isCorrect) {
      newErrors.add(current.currentIndex);
      playErrorSound();
    } else {
      playKeySound();
    }

    // Record for replay
    recorderRef.current.record(key, isCorrect);

    const newIndex = current.currentIndex + 1;
    const elapsedMinutes = (now - startTime) / 60000;
    const newWpm = elapsedMinutes > 0 ? Math.round((newCorrectChars / 5) / elapsedMinutes) : 0;
    const newAccuracy = newTotalKeystrokes > 0
      ? Math.round((newCorrectChars / newTotalKeystrokes) * 100)
      : 100;
    const isComplete = newIndex >= text.length;

    if (isComplete) {
      playCompleteSound();
    }

    const newState: TypingState = {
      currentIndex: newIndex,
      correctChars: newCorrectChars,
      totalKeystrokes: newTotalKeystrokes,
      errors: newErrors,
      startTime,
      endTime: isComplete ? now : null,
      wpm: newWpm,
      accuracy: newAccuracy,
      isComplete,
    };

    stateRef.current = newState;
    setState(newState);
    onProgress?.(newState);
  }, [text, onProgress, options?.strictMode]);

  return { state, handleKeyDown, reset, getReplayData };
}
