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
    store.resetInputFieldSubmitGuard();
    store.resetInputFieldDisabled();
    store.resetInputFieldValue();
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

  describe('setInputFieldSubmitGuard and getInputFieldSubmitGuard', () => {
    it('should set and get a submit guard', () => {
      const store = useInputFieldStore.getState();
      const guard = vi.fn(() => true);

      store.setInputFieldSubmitGuard(guard);

      expect(store.getInputFieldSubmitGuard()).toBe(guard);
    });

    it('should be null by default', () => {
      const store = useInputFieldStore.getState();

      expect(store.getInputFieldSubmitGuard()).toBeNull();
    });
  });

  describe('setInputFieldDisabled and getInputFieldDisabled', () => {
    it('should set and get the disabled state', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldDisabled(true);
      expect(store.getInputFieldDisabled()).toBe(true);

      store.setInputFieldDisabled(false);
      expect(store.getInputFieldDisabled()).toBe(false);
    });

    it('should be false by default', () => {
      const store = useInputFieldStore.getState();

      expect(store.getInputFieldDisabled()).toBe(false);
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

  describe('setInputFieldValue and getInputFieldValue', () => {
    it('should set and get input field value', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldValue('test value');
      expect(store.getInputFieldValue()).toBe('test value');
    });

    it('should have empty string as default value', () => {
      const store = useInputFieldStore.getState();
      expect(store.getInputFieldValue()).toBe('');
    });

    it('should update value multiple times', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldValue('first');
      expect(store.getInputFieldValue()).toBe('first');

      store.setInputFieldValue('second');
      expect(store.getInputFieldValue()).toBe('second');

      store.setInputFieldValue('third');
      expect(store.getInputFieldValue()).toBe('third');
    });

    it('should handle empty string value', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldValue('something');
      store.setInputFieldValue('');

      expect(store.getInputFieldValue()).toBe('');
    });

    it('should handle special characters and whitespace', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldValue('  spaces  ');
      expect(store.getInputFieldValue()).toBe('  spaces  ');

      store.setInputFieldValue('line\nbreak');
      expect(store.getInputFieldValue()).toBe('line\nbreak');

      store.setInputFieldValue('special!@#$%^&*()');
      expect(store.getInputFieldValue()).toBe('special!@#$%^&*()');
    });

    it('should handle long strings', () => {
      const store = useInputFieldStore.getState();
      const longString = 'a'.repeat(1000);

      store.setInputFieldValue(longString);
      expect(store.getInputFieldValue()).toBe(longString);
      expect(store.getInputFieldValue().length).toBe(1000);
    });

    it('should handle unicode characters', () => {
      const store = useInputFieldStore.getState();

      store.setInputFieldValue('Hello 👋 World 🌍');
      expect(store.getInputFieldValue()).toBe('Hello 👋 World 🌍');

      store.setInputFieldValue('日本語');
      expect(store.getInputFieldValue()).toBe('日本語');
    });
  });

  describe('setInputFieldSubmitFunc and getInputFieldSubmitFunc', () => {
    it('should set and get submit function', () => {
      const store = useInputFieldStore.getState();
      const submitFunc = vi.fn();

      store.setInputFieldSubmitFunc(submitFunc);

      const retrievedFunc = store.getInputFieldSubmitFunc();
      expect(retrievedFunc).toBe(submitFunc);
    });

    it('should execute the retrieved submit function', () => {
      const store = useInputFieldStore.getState();
      const submitFunc = vi.fn();

      store.setInputFieldSubmitFunc(submitFunc);

      const retrievedFunc = store.getInputFieldSubmitFunc();
      retrievedFunc?.();

      expect(submitFunc).toHaveBeenCalledTimes(1);
    });

    it('should be null by default', () => {
      const store = useInputFieldStore.getState();
      expect(store.getInputFieldSubmitFunc()).toBeNull();
    });

    it('should accept null', () => {
      const store = useInputFieldStore.getState();
      const submitFunc = vi.fn();

      store.setInputFieldSubmitFunc(submitFunc);
      expect(store.getInputFieldSubmitFunc()).toBe(submitFunc);

      store.setInputFieldSubmitFunc(null);
      expect(store.getInputFieldSubmitFunc()).toBeNull();
    });

    it('should replace previous submit function', () => {
      const store = useInputFieldStore.getState();
      const firstFunc = vi.fn();
      const secondFunc = vi.fn();

      store.setInputFieldSubmitFunc(firstFunc);
      expect(store.getInputFieldSubmitFunc()).toBe(firstFunc);

      store.setInputFieldSubmitFunc(secondFunc);
      expect(store.getInputFieldSubmitFunc()).toBe(secondFunc);
      expect(store.getInputFieldSubmitFunc()).not.toBe(firstFunc);
    });

    it('should preserve function context and arguments', () => {
      const store = useInputFieldStore.getState();
      const result: string[] = [];
      const submitFunc = () => {
        result.push('submitted');
      };

      store.setInputFieldSubmitFunc(submitFunc);

      const retrievedFunc = store.getInputFieldSubmitFunc();
      retrievedFunc?.();
      retrievedFunc?.();

      expect(result).toEqual(['submitted', 'submitted']);
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
      store.setInputFieldValue('user@example.com');

      expect(store.getInputFieldType()).toBe('email');
      expect(store.getInputFieldPlaceholder()).toBe('Enter email');
      expect(store.getInputFieldDescription()).toBe(
        'We need your email for notifications'
      );
      expect(store.getInputFieldValidator()).toBe(validator);
      expect(store.getInputFieldElement()).toBe(mockElement);
      expect(store.getInputFieldValue()).toBe('user@example.com');
      expect(store.getInputFieldSubmitFunc()).toBe(submitFunc);
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
      store.setInputFieldValue('secretpassword');

      expect(store.getInputFieldValue()).toBe('secretpassword');

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
      expect(store.getInputFieldSubmitFunc()).toBeNull();
      // Note: resetInputField does not reset inputFieldValue
      expect(store.getInputFieldValue()).toBe('secretpassword');
    });

    it('should validate input value with validator', () => {
      const store = useInputFieldStore.getState();
      const emailValidator: InputValidator = (value: string) =>
        value.includes('@') && value.includes('.')
          ? true
          : 'Must be a valid email';

      store.setInputFieldValidator(emailValidator);
      store.setInputFieldValue('invalid');

      const validator = store.getInputFieldValidator();
      const validationResult = validator?.(store.getInputFieldValue());

      expect(validationResult).toBe('Must be a valid email');

      store.setInputFieldValue('valid@example.com');
      const validationResult2 = validator?.(store.getInputFieldValue());
      expect(validationResult2).toBe(true);
    });

    it('should handle submit workflow with value', () => {
      const store = useInputFieldStore.getState();
      const submittedValues: string[] = [];

      const submitFunc = () => {
        const value = store.getInputFieldValue();
        submittedValues.push(value);
        store.setInputFieldValue(''); // Clear after submit
      };

      store.setInputFieldSubmitFunc(submitFunc);

      // First submission
      store.setInputFieldValue('first message');
      const func1 = store.getInputFieldSubmitFunc();
      func1?.();

      expect(submittedValues).toEqual(['first message']);
      expect(store.getInputFieldValue()).toBe('');

      // Second submission
      store.setInputFieldValue('second message');
      const func2 = store.getInputFieldSubmitFunc();
      func2?.();

      expect(submittedValues).toEqual(['first message', 'second message']);
      expect(store.getInputFieldValue()).toBe('');
    });

    it('should handle input type changes with value preserved', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');

      store.setInputFieldElement(mockElement);
      store.setInputFieldValue('mypassword');
      store.setInputFieldType('password');

      expect(mockElement.type).toBe('password');
      expect(store.getInputFieldValue()).toBe('mypassword');

      // Change to text type
      store.setInputFieldType('text');

      expect(mockElement.type).toBe('text');
      expect(store.getInputFieldValue()).toBe('mypassword'); // Value preserved
    });

    it('should handle complex validation with different input types', () => {
      const store = useInputFieldStore.getState();

      // Email validation
      const emailValidator: InputValidator = (value: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format';

      store.setInputFieldType('email');
      store.setInputFieldValidator(emailValidator);
      store.setInputFieldValue('test@example.com');

      const emailResult = store.getInputFieldValidator()?.(
        store.getInputFieldValue()
      );
      expect(emailResult).toBe(true);

      // Number validation
      const numberValidator: InputValidator = (value: string) =>
        !isNaN(Number(value)) && Number(value) > 0 ? true : 'Must be positive';

      store.setInputFieldType('number');
      store.setInputFieldValidator(numberValidator);
      store.setInputFieldValue('42');

      const numberResult = store.getInputFieldValidator()?.(
        store.getInputFieldValue()
      );
      expect(numberResult).toBe(true);

      store.setInputFieldValue('-5');
      const negativeResult = store.getInputFieldValidator()?.(
        store.getInputFieldValue()
      );
      expect(negativeResult).toBe('Must be positive');
    });

    it('should maintain separate concerns for value and element', () => {
      const store = useInputFieldStore.getState();
      const mockElement = document.createElement('input');

      // Set value before element
      store.setInputFieldValue('pre-set value');
      expect(store.getInputFieldValue()).toBe('pre-set value');
      expect(store.getInputFieldElement()).toBeNull();

      // Add element
      store.setInputFieldElement(mockElement);
      expect(store.getInputFieldValue()).toBe('pre-set value');
      expect(store.getInputFieldElement()).toBe(mockElement);

      // Remove element
      store.setInputFieldElement(null);
      expect(store.getInputFieldValue()).toBe('pre-set value'); // Value persists
    });
  });
});
