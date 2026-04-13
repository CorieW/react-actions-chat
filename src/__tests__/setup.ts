import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from 'vitest';

// Mock scrollIntoView which is not implemented in jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  HTMLElement.prototype.scrollTo = () => {};
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
