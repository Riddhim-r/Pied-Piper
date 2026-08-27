/**
 * Inverts the case of every character in the given text.
 * Uppercase letters become lowercase, and lowercase letters become uppercase.
 * Non-alphabetic characters (numbers, spaces, punctuation) remain unchanged.
 *
 * Example: "A better PERSON" -> "a BETTER person"
 */
export function invertCase(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const upper = char.toUpperCase();
    const lower = char.toLowerCase();
    if (char === upper && char !== lower) {
      result += lower;
    } else if (char === lower && char !== upper) {
      result += upper;
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Applies case inversion to selected text in an HTMLInputElement or HTMLTextAreaElement.
 * Preserves undo history stack via document.execCommand when possible.
 */
export function invertInputSelectionCase(
  element: HTMLInputElement | HTMLTextAreaElement,
): boolean {
  const start = element.selectionStart;
  const end = element.selectionEnd;
  if (start === null || end === null || start === end) return false;

  const text = element.value.substring(start, end);
  const inverted = invertCase(text);
  if (inverted === text) return false;

  element.focus();
  let success = false;
  try {
    success = document.execCommand('insertText', false, inverted);
  } catch {
    success = false;
  }

  if (!success) {
    element.setRangeText(inverted, start, end, 'select');
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    element.setSelectionRange(start, start + inverted.length);
  }

  return true;
}

/**
 * Applies case inversion to generic window selection (e.g., contenteditable elements).
 */
export function invertWindowSelectionCase(): boolean {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return false;

  const range = sel.getRangeAt(0);
  const selectedText = range.toString();
  if (!selectedText) return false;

  const inverted = invertCase(selectedText);
  if (inverted === selectedText) return false;

  let success = false;
  try {
    success = document.execCommand('insertText', false, inverted);
  } catch {
    success = false;
  }

  if (!success) {
    range.deleteContents();
    const textNode = document.createTextNode(inverted);
    range.insertNode(textNode);

    const newRange = document.createRange();
    newRange.selectNodeContents(textNode);
    sel.removeAllRanges();
    sel.addRange(newRange);
    return true;
  }

  return true;
}

/**
 * Determines whether a typed character at the current offset should be auto-capitalized.
 * Capitalizes at:
 * 1. Start of paragraph / line (offset === 0 or preceding text is whitespace only)
 * 2. Position following sentence-ending punctuation (. ? !) and whitespace (e.g. ". ")
 */
export function shouldCapitalizeSentence(precedingText: string, offsetInParent: number): boolean {
  if (offsetInParent === 0 || precedingText.trim() === '') {
    return true;
  }
  // Match sentence-ending punctuation followed by one or more whitespace characters
  return /(?:^|[.!?])\s+$/.test(precedingText);
}

