/**
 * Accessibility Utilities for Literature Components
 * WCAG 2.1 AA compliance helpers
 * @module utils/accessibility
 */

/**
 * Announce message to screen readers
 * Uses ARIA live regions for dynamic content updates
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique ID for accessibility attributes
 */
let idCounter = 0;
export function generateA11yId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  
  return !(
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.hasAttribute('hidden')
  );
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label
  if (element instanceof HTMLInputElement) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Fallback to text content
  return element.textContent || '';
}

/**
 * Keyboard navigation helper for lists
 */
export interface KeyboardNavigationOptions {
  onEnter?: (index: number) => void;
  onEscape?: () => void;
  loop?: boolean;
}

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  setIndex: (index: number) => void,
  options: KeyboardNavigationOptions = {}
) {
  const { onEnter, onEscape, loop = true } = options;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (currentIndex < totalItems - 1) {
        setIndex(currentIndex + 1);
      } else if (loop) {
        setIndex(0);
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      if (currentIndex > 0) {
        setIndex(currentIndex - 1);
      } else if (loop) {
        setIndex(totalItems - 1);
      }
      break;

    case 'Home':
      event.preventDefault();
      setIndex(0);
      break;

    case 'End':
      event.preventDefault();
      setIndex(totalItems - 1);
      break;

    case 'Enter':
      if (onEnter) {
        event.preventDefault();
        onEnter(currentIndex);
      }
      break;

    case 'Escape':
      if (onEscape) {
        event.preventDefault();
        onEscape();
      }
      break;
  }
}

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    // Simple RGB extraction (works for hex colors)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Debounce function for performance (useful for search inputs)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
