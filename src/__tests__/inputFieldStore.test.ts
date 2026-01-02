import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useInputFieldStore } from '../lib/inputFieldStore';
import type { InputType, InputValidator } from '../lib/inputFieldStore';

describe('Input Field Store Unit Tests', () => {
  beforeEach(() => {
    // Reset store to initial state
    const store = useInputFieldStore.getState();
    store.resetInputField();
    store.resetInputFieldDescription();
    store.resetInputFieldType();
    store.resetInputFieldPlaceholder();
    store.resetInputFieldValidator();
  });

  describe('setInputFieldType and getInputFieldType', () => {
    it('should set and get input type', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldType('email');
      expect(store.getInputFieldType()).toBe('email');

      store.setInputFieldType('password');
      expect(store.getInputFieldType()).toBe('password');
    });

    it('should update actual DOM element type when set', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');
      mockElement.type = 'text';

      store.setInputFieldElement(mockElement);
      store.setInputFieldType('email');

      expect(mockElement.type).toBe('email');
    });

    it('should handle all input types', () => {
      const store = useInputFieldStore.getState();
      const types: InputType[] = [
        'text',
        'password',
        'email',
        'number',
        'tel',
        'url',
        'search',
      ];

      types.forEach(type => {
        store.setInputFieldType(type);
        expect(store.getInputFieldType()).toBe(type);
      });
    });
  });

  describe('setInputFieldPlaceholder and getInputFieldPlaceholder', () => {
    it('should set and get placeholder', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldPlaceholder('Enter your email');
      expect(store.getInputFieldPlaceholder()).toBe('Enter your email');
    });

    it('should have default placeholder', () => {
      const store = useInputFieldStore.getState();
      expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
    });
  });

  describe('setInputFieldDescription and getInputFieldDescription', () => {
    it('should set and get description', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldDescription('Please provide your email address');
      expect(store.getInputFieldDescription()).toBe(
        'Please provide your email address'
      );
    });

    it('should have empty description by default', () => {
      const store = useInputFieldStore.getState();
      expect(store.getInputFieldDescription()).toBe('');
    });
  });

  describe('setInputFieldValidator and getInputFieldValidator', () => {
    it('should set and get validator function', () => {
      const store = useInputFieldStore.getState();
      const validator: InputValidator = (value: string) => value.length > 5;

      store.setInputFieldValidator(validator);
      expect(store.getInputFieldValidator()).toBe(validator);
    });

    it('should validate with boolean return', () => {
      const store = useInputFieldStore.getState();
      const validator: InputValidator = (value: string) => value.length > 3;

      store.setInputFieldValidator(validator);
      const validatorFn = store.getInputFieldValidator();

      expect(validatorFn?.('no')).toBe(false);
      expect(validatorFn?.('valid')).toBe(true);
    });

    it('should validate with string error message return', () => {
      const store = useInputFieldStore.getState();
      const validator: InputValidator = (value: string) =>
        value.includes('@') ? true : 'Must include @ symbol';

      store.setInputFieldValidator(validator);
      const validatorFn = store.getInputFieldValidator();

      expect(validatorFn?.('test')).toBe('Must include @ symbol');
      expect(validatorFn?.('test@example.com')).toBe(true);
    });

    it('should be null by default', () => {
      const store = useInputFieldStore.getState();
      expect(store.getInputFieldValidator()).toBeNull();
    });
  });

  describe('setInputFieldElement and getInputFieldElement', () => {
    it('should set and get input element', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');

      store.setInputFieldElement(mockElement);
      expect(store.getInputFieldElement()).toBe(mockElement);
    });

    it('should accept null', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');

      store.setInputFieldElement(mockElement);
      store.setInputFieldElement(null);

      expect(store.getInputFieldElement()).toBeNull();
    });
  });

  describe('setInputFieldSubmitFunc', () => {
    it('should set and store submit function', () => {
      const submitFunc = vi.fn();

      useInputFieldStore.getState().setInputFieldSubmitFunc(submitFunc);

      // Access the internal state directly
      const state = useInputFieldStore.getState();
      expect(
        (state as unknown as { inputFieldSubmitFunc: (() => void) | null })
          .inputFieldSubmitFunc
      ).toBe(submitFunc);
    });

    it('should accept null', () => {
      const submitFunc = vi.fn();

      useInputFieldStore.getState().setInputFieldSubmitFunc(submitFunc);
      useInputFieldStore.getState().setInputFieldSubmitFunc(null);

      const state = useInputFieldStore.getState();
      expect(
        (state as unknown as { inputFieldSubmitFunc: (() => void) | null })
          .inputFieldSubmitFunc
      ).toBeNull();
    });
  });

  describe('resetInputField', () => {
    it('should reset element and submit function to null', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');
      const submitFunc = vi.fn();

      store.setInputFieldElement(mockElement);
      store.setInputFieldSubmitFunc(submitFunc);

      store.resetInputField();

      expect(store.getInputFieldElement()).toBeNull();
      expect(store.inputFieldSubmitFunc).toBeNull();
    });
  });

  describe('resetInputFieldDescription', () => {
    it('should reset description to empty string', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldDescription('Custom description');
      expect(store.getInputFieldDescription()).toBe('Custom description');

      store.resetInputFieldDescription();
      expect(store.getInputFieldDescription()).toBe('');
    });
  });

  describe('resetInputFieldType', () => {
    it('should reset type to text', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldType('email');
      expect(store.getInputFieldType()).toBe('email');

      store.resetInputFieldType();
      expect(store.getInputFieldType()).toBe('text');
    });

    it('should update DOM element type when reset', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');

      store.setInputFieldElement(mockElement);
      store.setInputFieldType('password');
      expect(mockElement.type).toBe('password');

      store.resetInputFieldType();
      expect(mockElement.type).toBe('text');
    });
  });

  describe('resetInputFieldPlaceholder', () => {
    it('should reset placeholder to default', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldPlaceholder('Custom placeholder');
      expect(store.getInputFieldPlaceholder()).toBe('Custom placeholder');

      store.resetInputFieldPlaceholder();
      expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
    });
  });

  describe('resetInputFieldValidator', () => {
    it('should reset validator to null', () => {
      const store = useInputFieldStore.getState();
      const validator: InputValidator = (value: string) => value.length > 0;

      store.setInputFieldValidator(validator);
      expect(store.getInputFieldValidator()).toBe(validator);

      store.resetInputFieldValidator();
      expect(store.getInputFieldValidator()).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete input field configuration', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');
      const validator: InputValidator = (value: string) =>
        value.includes('@') || 'Must include @';
      const submitFunc = vi.fn();

      store.setInputFieldElement(mockElement);
      store.setInputFieldType('email');
      store.setInputFieldPlaceholder('Enter email');
      store.setInputFieldDescription('We need your email for notifications');
      store.setInputFieldValidator(validator);
      store.setInputFieldSubmitFunc(submitFunc);

      expect(store.getInputFieldType()).toBe('email');
      expect(store.getInputFieldPlaceholder()).toBe('Enter email');
      expect(store.getInputFieldDescription()).toBe(
        'We need your email for notifications'
      );
      expect(store.getInputFieldValidator()).toBe(validator);
      expect(store.getInputFieldElement()).toBe(mockElement);
      expect(mockElement.type).toBe('email');
    });

    it('should handle full reset after configuration', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');
      const validator: InputValidator = (value: string) => value.length > 0;

      store.setInputFieldElement(mockElement);
      store.setInputFieldType('password');
      store.setInputFieldPlaceholder('Enter password');
      store.setInputFieldDescription('Min 8 characters');
      store.setInputFieldValidator(validator);
      store.setInputFieldSubmitFunc(() => {});

      // Reset everything
      store.resetInputField();
      store.resetInputFieldType();
      store.resetInputFieldPlaceholder();
      store.resetInputFieldDescription();
      store.resetInputFieldValidator();

      expect(store.getInputFieldElement()).toBeNull();
      expect(store.getInputFieldType()).toBe('text');
      expect(store.getInputFieldPlaceholder()).toBe('Type your message...');
      expect(store.getInputFieldDescription()).toBe('');
      expect(store.getInputFieldValidator()).toBeNull();
      expect(
        (store as unknown as { inputFieldSubmitFunc: (() => void) | null })
          .inputFieldSubmitFunc
      ).toBeNull();
    });
  });
});
