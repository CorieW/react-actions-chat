import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

describe('Persistent Button Store Unit Tests', () => {
  beforeEach(() => {
    // Clear buttons before each test
    usePersistentButtonStore.getState().clearButtons();
  });

  describe('addButton', () => {
    it('should add a new button', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({
        id: 'btn1',
        label: 'Button 1',
        onClick: () => {},
      });

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.label).toBe('Button 1');
      expect(buttons[0]?.id).toBe('btn1');
    });

    it('should add multiple buttons', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });
      store.addButton({ id: 'btn3', label: 'Button 3' });

      expect(store.getButtons()).toHaveLength(3);
    });

    it('should update existing button when id matches', () => {
      const store = usePersistentButtonStore.getState();
      const onClick1 = vi.fn();
      const onClick2 = vi.fn();

      store.addButton({
        id: 'btn1',
        label: 'Original',
        onClick: onClick1,
      });

      expect(store.getButtons()[0]?.label).toBe('Original');

      store.addButton({
        id: 'btn1',
        label: 'Updated',
        onClick: onClick2,
      });

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.label).toBe('Updated');
      expect(buttons[0]?.onClick).toBe(onClick2);
    });

    it('should preserve other buttons when updating', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });
      store.addButton({ id: 'btn3', label: 'Button 3' });

      store.addButton({ id: 'btn2', label: 'Updated Button 2' });

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(3);
      expect(buttons[0]?.label).toBe('Button 1');
      expect(buttons[1]?.label).toBe('Updated Button 2');
      expect(buttons[2]?.label).toBe('Button 3');
    });

    it('should handle button with all properties', () => {
      const store = usePersistentButtonStore.getState();
      const onClick = vi.fn();

      store.addButton({
        id: 'btn1',
        label: 'Submit',
        onClick,
        variant: 'success',
        className: 'custom-class',
        style: { backgroundColor: 'red' },
      });

      const button = store.getButtons()[0];
      expect(button?.label).toBe('Submit');
      expect(button?.onClick).toBe(onClick);
      expect(button?.variant).toBe('success');
      expect(button?.className).toBe('custom-class');
      expect(button?.style).toEqual({ backgroundColor: 'red' });
    });
  });

  describe('removeButton', () => {
    it('should remove button by id', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });

      expect(store.getButtons()).toHaveLength(2);

      store.removeButton('btn1');

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.id).toBe('btn2');
    });

    it('should do nothing if button id does not exist', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.removeButton('nonexistent');

      expect(store.getButtons()).toHaveLength(1);
    });

    it('should handle removing from empty store', () => {
      const store = usePersistentButtonStore.getState();

      expect(() => store.removeButton('btn1')).not.toThrow();
      expect(store.getButtons()).toHaveLength(0);
    });

    it('should remove correct button among many', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });
      store.addButton({ id: 'btn3', label: 'Button 3' });
      store.addButton({ id: 'btn4', label: 'Button 4' });

      store.removeButton('btn2');

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(3);
      expect(buttons.find(b => b.id === 'btn2')).toBeUndefined();
      expect(buttons.find(b => b.id === 'btn1')).toBeDefined();
      expect(buttons.find(b => b.id === 'btn3')).toBeDefined();
      expect(buttons.find(b => b.id === 'btn4')).toBeDefined();
    });
  });

  describe('setButtons', () => {
    it('should replace all buttons', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });

      expect(store.getButtons()).toHaveLength(2);

      store.setButtons([
        { id: 'btn3', label: 'New Button 1' },
        { id: 'btn4', label: 'New Button 2' },
        { id: 'btn5', label: 'New Button 3' },
      ]);

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(3);
      expect(buttons[0]?.id).toBe('btn3');
      expect(buttons[1]?.id).toBe('btn4');
      expect(buttons[2]?.id).toBe('btn5');
    });

    it('should handle empty array', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.setButtons([]);

      expect(store.getButtons()).toHaveLength(0);
    });

    it('should accept single button', () => {
      const store = usePersistentButtonStore.getState();

      store.setButtons([{ id: 'btn1', label: 'Only Button' }]);

      expect(store.getButtons()).toHaveLength(1);
    });
  });

  describe('getButtons', () => {
    it('should return current buttons', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(2);
      expect(buttons[0]?.label).toBe('Button 1');
      expect(buttons[1]?.label).toBe('Button 2');
    });

    it('should return empty array when no buttons', () => {
      const store = usePersistentButtonStore.getState();
      expect(store.getButtons()).toEqual([]);
    });

    it('should return readonly array', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      const buttons = store.getButtons();

      // TypeScript should enforce readonly, but we can test that it's an array
      expect(Array.isArray(buttons)).toBe(true);
    });
  });

  describe('clearButtons', () => {
    it('should remove all buttons', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });
      store.addButton({ id: 'btn3', label: 'Button 3' });

      expect(store.getButtons()).toHaveLength(3);

      store.clearButtons();

      expect(store.getButtons()).toEqual([]);
    });

    it('should work on already empty store', () => {
      const store = usePersistentButtonStore.getState();

      expect(() => store.clearButtons()).not.toThrow();
      expect(store.getButtons()).toEqual([]);
    });
  });

  describe('button uniqueness by id', () => {
    it('should enforce uniqueness by id', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'unique', label: 'First' });
      store.addButton({ id: 'unique', label: 'Second' });

      const buttons = store.getButtons();
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.label).toBe('Second');
    });

    it('should allow different ids', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'btn1', label: 'Button 1' });
      store.addButton({ id: 'btn2', label: 'Button 2' });

      expect(store.getButtons()).toHaveLength(2);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex workflow', () => {
      const store = usePersistentButtonStore.getState();
      const onClick1 = vi.fn();
      const onClick2 = vi.fn();

      // Add initial buttons
      store.addButton({ id: 'save', label: 'Save', onClick: onClick1 });
      store.addButton({ id: 'cancel', label: 'Cancel', onClick: onClick2 });
      store.addButton({ id: 'help', label: 'Help' });

      expect(store.getButtons()).toHaveLength(3);

      // Update save button
      store.addButton({
        id: 'save',
        label: 'Save Changes',
        variant: 'success',
      });

      expect(store.getButtons()).toHaveLength(3);
      expect(store.getButtons()[0]?.label).toBe('Save Changes');

      // Remove help button
      store.removeButton('help');

      expect(store.getButtons()).toHaveLength(2);

      // Add new button
      store.addButton({ id: 'delete', label: 'Delete', variant: 'error' });

      expect(store.getButtons()).toHaveLength(3);

      // Clear all
      store.clearButtons();

      expect(store.getButtons()).toEqual([]);
    });

    it('should maintain button order', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'first', label: 'First' });
      store.addButton({ id: 'second', label: 'Second' });
      store.addButton({ id: 'third', label: 'Third' });

      const buttons = store.getButtons();
      expect(buttons[0]?.id).toBe('first');
      expect(buttons[1]?.id).toBe('second');
      expect(buttons[2]?.id).toBe('third');
    });

    it('should handle buttons with various variants', () => {
      const store = usePersistentButtonStore.getState();

      store.addButton({ id: 'default', label: 'Default', variant: 'default' });
      store.addButton({ id: 'success', label: 'Success', variant: 'success' });
      store.addButton({ id: 'error', label: 'Error', variant: 'error' });
      store.addButton({ id: 'warning', label: 'Warning', variant: 'warning' });
      store.addButton({ id: 'info', label: 'Info', variant: 'info' });
      store.addButton({ id: 'dull', label: 'Dull', variant: 'dull' });

      expect(store.getButtons()).toHaveLength(6);
    });
  });
});
