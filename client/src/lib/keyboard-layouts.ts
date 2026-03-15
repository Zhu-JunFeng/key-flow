export interface KeyboardLayout {
  readonly id: string;
  readonly name: string;
  readonly rows: readonly (readonly LayoutKey[])[];
}

export interface LayoutKey {
  readonly key: string;
  readonly display?: string;
  readonly secondary?: string;
  readonly finger: number;
  readonly width?: number;
}

// Finger: 1=left pinky 2=left ring 3=left middle 4=left index 5=right index 6=right middle 7=right ring 8=right pinky 9=thumb

const QWERTY_ROWS: readonly (readonly LayoutKey[])[] = [
  [
    { key: '`', display: '`', secondary: '~', finger: 1, width: 3 },
    { key: '1', secondary: '!', finger: 1 }, { key: '2', secondary: '@', finger: 2 },
    { key: '3', secondary: '#', finger: 3 }, { key: '4', secondary: '$', finger: 4 },
    { key: '5', secondary: '%', finger: 4 }, { key: '6', secondary: '^', finger: 5 },
    { key: '7', secondary: '&', finger: 5 }, { key: '8', secondary: '*', finger: 6 },
    { key: '9', secondary: '(', finger: 7 }, { key: '0', secondary: ')', finger: 8 },
    { key: '-', secondary: '_', finger: 8 }, { key: '=', secondary: '+', finger: 8 },
    { key: 'Backspace', display: '⇦', finger: 8, width: 5 },
  ],
  [
    { key: 'Tab', display: 'Tab', finger: 1, width: 4.3 },
    { key: 'q', finger: 1 }, { key: 'w', finger: 2 }, { key: 'e', finger: 3 },
    { key: 'r', finger: 4 }, { key: 't', finger: 4 }, { key: 'y', finger: 5 },
    { key: 'u', finger: 5 }, { key: 'i', finger: 6 }, { key: 'o', finger: 7 },
    { key: 'p', finger: 8 },
    { key: '[', secondary: '{', finger: 8 }, { key: ']', secondary: '}', finger: 8 },
    { key: '\\', secondary: '|', finger: 8, width: 3.7 },
  ],
  [
    { key: 'CapsLock', display: 'Caps', finger: 1, width: 5 },
    { key: 'a', finger: 1 }, { key: 's', finger: 2 }, { key: 'd', finger: 3 },
    { key: 'f', finger: 4 }, { key: 'g', finger: 4 }, { key: 'h', finger: 5 },
    { key: 'j', finger: 5 }, { key: 'k', finger: 6 }, { key: 'l', finger: 7 },
    { key: ';', secondary: ':', finger: 8 }, { key: "'", secondary: '"', finger: 8 },
    { key: 'Enter', display: 'Enter', finger: 8, width: 5.8 },
  ],
  [
    { key: 'ShiftLeft', display: 'Shift', finger: 1, width: 6.5 },
    { key: 'z', finger: 1 }, { key: 'x', finger: 2 }, { key: 'c', finger: 3 },
    { key: 'v', finger: 4 }, { key: 'b', finger: 4 }, { key: 'n', finger: 5 },
    { key: 'm', finger: 5 },
    { key: ',', secondary: '<', finger: 6 }, { key: '.', secondary: '>', finger: 7 },
    { key: '/', secondary: '?', finger: 8 },
    { key: 'ShiftRight', display: 'Shift', finger: 8, width: 7.8 },
  ],
  [
    { key: 'Ctrl', display: 'Ctrl', finger: 1, width: 3.5 },
    { key: 'Alt', display: 'Alt', finger: 1, width: 4 },
    { key: 'Space', display: 'Space', finger: 9, width: 22 },
    { key: 'AltRight', display: 'Alt', finger: 8, width: 4 },
  ],
];

const DVORAK_ROWS: readonly (readonly LayoutKey[])[] = [
  [
    { key: '`', display: '`', secondary: '~', finger: 1, width: 3 },
    { key: '1', secondary: '!', finger: 1 }, { key: '2', secondary: '@', finger: 2 },
    { key: '3', secondary: '#', finger: 3 }, { key: '4', secondary: '$', finger: 4 },
    { key: '5', secondary: '%', finger: 4 }, { key: '6', secondary: '^', finger: 5 },
    { key: '7', secondary: '&', finger: 5 }, { key: '8', secondary: '*', finger: 6 },
    { key: '9', secondary: '(', finger: 7 }, { key: '0', secondary: ')', finger: 8 },
    { key: '[', secondary: '{', finger: 8 }, { key: ']', secondary: '}', finger: 8 },
    { key: 'Backspace', display: '⇦', finger: 8, width: 5 },
  ],
  [
    { key: 'Tab', display: 'Tab', finger: 1, width: 4.3 },
    { key: "'", secondary: '"', finger: 1 }, { key: ',', secondary: '<', finger: 2 },
    { key: '.', secondary: '>', finger: 3 }, { key: 'p', finger: 4 }, { key: 'y', finger: 4 },
    { key: 'f', finger: 5 }, { key: 'g', finger: 5 }, { key: 'c', finger: 6 },
    { key: 'r', finger: 7 }, { key: 'l', finger: 8 },
    { key: '/', secondary: '?', finger: 8 }, { key: '=', secondary: '+', finger: 8 },
    { key: '\\', secondary: '|', finger: 8, width: 3.7 },
  ],
  [
    { key: 'CapsLock', display: 'Caps', finger: 1, width: 5 },
    { key: 'a', finger: 1 }, { key: 'o', finger: 2 }, { key: 'e', finger: 3 },
    { key: 'u', finger: 4 }, { key: 'i', finger: 4 }, { key: 'd', finger: 5 },
    { key: 'h', finger: 5 }, { key: 't', finger: 6 }, { key: 'n', finger: 7 },
    { key: 's', finger: 8 }, { key: '-', secondary: '_', finger: 8 },
    { key: 'Enter', display: 'Enter', finger: 8, width: 5.8 },
  ],
  [
    { key: 'ShiftLeft', display: 'Shift', finger: 1, width: 6.5 },
    { key: ';', secondary: ':', finger: 1 }, { key: 'q', finger: 2 }, { key: 'j', finger: 3 },
    { key: 'k', finger: 4 }, { key: 'x', finger: 4 }, { key: 'b', finger: 5 },
    { key: 'm', finger: 5 }, { key: 'w', finger: 6 }, { key: 'v', finger: 7 },
    { key: 'z', finger: 8 },
    { key: 'ShiftRight', display: 'Shift', finger: 8, width: 7.8 },
  ],
  [
    { key: 'Ctrl', display: 'Ctrl', finger: 1, width: 3.5 },
    { key: 'Alt', display: 'Alt', finger: 1, width: 4 },
    { key: 'Space', display: 'Space', finger: 9, width: 22 },
    { key: 'AltRight', display: 'Alt', finger: 8, width: 4 },
  ],
];

const COLEMAK_ROWS: readonly (readonly LayoutKey[])[] = [
  [
    { key: '`', display: '`', secondary: '~', finger: 1, width: 3 },
    { key: '1', secondary: '!', finger: 1 }, { key: '2', secondary: '@', finger: 2 },
    { key: '3', secondary: '#', finger: 3 }, { key: '4', secondary: '$', finger: 4 },
    { key: '5', secondary: '%', finger: 4 }, { key: '6', secondary: '^', finger: 5 },
    { key: '7', secondary: '&', finger: 5 }, { key: '8', secondary: '*', finger: 6 },
    { key: '9', secondary: '(', finger: 7 }, { key: '0', secondary: ')', finger: 8 },
    { key: '-', secondary: '_', finger: 8 }, { key: '=', secondary: '+', finger: 8 },
    { key: 'Backspace', display: '⇦', finger: 8, width: 5 },
  ],
  [
    { key: 'Tab', display: 'Tab', finger: 1, width: 4.3 },
    { key: 'q', finger: 1 }, { key: 'w', finger: 2 }, { key: 'f', finger: 3 },
    { key: 'p', finger: 4 }, { key: 'g', finger: 4 }, { key: 'j', finger: 5 },
    { key: 'l', finger: 5 }, { key: 'u', finger: 6 }, { key: 'y', finger: 7 },
    { key: ';', secondary: ':', finger: 8 },
    { key: '[', secondary: '{', finger: 8 }, { key: ']', secondary: '}', finger: 8 },
    { key: '\\', secondary: '|', finger: 8, width: 3.7 },
  ],
  [
    { key: 'CapsLock', display: 'Caps', finger: 1, width: 5 },
    { key: 'a', finger: 1 }, { key: 'r', finger: 2 }, { key: 's', finger: 3 },
    { key: 't', finger: 4 }, { key: 'd', finger: 4 }, { key: 'h', finger: 5 },
    { key: 'n', finger: 5 }, { key: 'e', finger: 6 }, { key: 'i', finger: 7 },
    { key: 'o', finger: 8 }, { key: "'", secondary: '"', finger: 8 },
    { key: 'Enter', display: 'Enter', finger: 8, width: 5.8 },
  ],
  [
    { key: 'ShiftLeft', display: 'Shift', finger: 1, width: 6.5 },
    { key: 'z', finger: 1 }, { key: 'x', finger: 2 }, { key: 'c', finger: 3 },
    { key: 'v', finger: 4 }, { key: 'b', finger: 4 }, { key: 'k', finger: 5 },
    { key: 'm', finger: 5 },
    { key: ',', secondary: '<', finger: 6 }, { key: '.', secondary: '>', finger: 7 },
    { key: '/', secondary: '?', finger: 8 },
    { key: 'ShiftRight', display: 'Shift', finger: 8, width: 7.8 },
  ],
  [
    { key: 'Ctrl', display: 'Ctrl', finger: 1, width: 3.5 },
    { key: 'Alt', display: 'Alt', finger: 1, width: 4 },
    { key: 'Space', display: 'Space', finger: 9, width: 22 },
    { key: 'AltRight', display: 'Alt', finger: 8, width: 4 },
  ],
];

export const KEYBOARD_LAYOUTS: readonly KeyboardLayout[] = [
  { id: 'qwerty', name: 'QWERTY', rows: QWERTY_ROWS },
  { id: 'dvorak', name: 'Dvorak', rows: DVORAK_ROWS },
  { id: 'colemak', name: 'Colemak', rows: COLEMAK_ROWS },
];

export function getLayoutById(id: string): KeyboardLayout {
  return KEYBOARD_LAYOUTS.find(l => l.id === id) ?? KEYBOARD_LAYOUTS[0];
}
