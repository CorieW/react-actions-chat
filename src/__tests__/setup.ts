import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Mock scrollIntoView which is not implemented in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  HTMLElement.prototype.scrollTo = () => {};

  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', {
      value: () => 'blob:mock-upload-url',
      writable: true,
    });
  }

  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: () => {},
      writable: true,
    });
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
