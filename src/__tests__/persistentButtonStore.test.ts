import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePersistentButtonStore } from '../lib/persistentButtonStore';

describe('Persistent button store unit tests', () => {
  beforeEach(() => {
    usePersistentButtonStore.getState().clearButtons();
  });

  it('adds new buttons in insertion order', () => {
    const store = usePersistentButtonStore.getState();

    store.addButton({ id: 'first', label: 'First' });
    store.addButton({ id: 'second', label: 'Second' });
    store.addButton({ id: 'third', label: 'Third' });

    expect(store.getButtons().map(button => button.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('updates an existing button when ids match without changing list length', () => {
    const store = usePersistentButtonStore.getState();
    const onClick = vi.fn();

    store.addButton({ id: 'save', label: 'Save' });
    store.addButton({ id: 'cancel', label: 'Cancel' });
    store.addButton({
      id: 'save',
      label: 'Save changes',
      variant: 'success',
      onClick,
      className: 'font-bold',
      style: { backgroundColor: 'green' },
    });

    const buttons = store.getButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toMatchObject({
      id: 'save',
      label: 'Save changes',
      variant: 'success',
      className: 'font-bold',
      style: { backgroundColor: 'green' },
    });
    expect(buttons[0]?.onClick).toBe(onClick);
    expect(buttons[1]?.id).toBe('cancel');
  });

  it('removes a button by id and ignores unknown ids', () => {
    const store = usePersistentButtonStore.getState();

    store.addButton({ id: 'a', label: 'A' });
    store.addButton({ id: 'b', label: 'B' });

    store.removeButton('a');
    expect(store.getButtons().map(button => button.id)).toEqual(['b']);

    store.removeButton('does-not-exist');
    expect(store.getButtons().map(button => button.id)).toEqual(['b']);
  });

  it('replaces the whole collection via setButtons', () => {
    const store = usePersistentButtonStore.getState();

    store.addButton({ id: 'old', label: 'Old' });
    store.setButtons([
      { id: 'new-1', label: 'New 1' },
      { id: 'new-2', label: 'New 2' },
    ]);

    expect(store.getButtons().map(button => button.id)).toEqual([
      'new-1',
      'new-2',
    ]);
  });

  it('clears all buttons', () => {
    const store = usePersistentButtonStore.getState();

    store.addButton({ id: 'x', label: 'X' });
    store.addButton({ id: 'y', label: 'Y' });

    store.clearButtons();
    expect(store.getButtons()).toEqual([]);
  });

  it('supports a realistic add-update-remove workflow', () => {
    const store = usePersistentButtonStore.getState();

    store.addButton({ id: 'save', label: 'Save' });
    store.addButton({ id: 'cancel', label: 'Cancel' });
    store.addButton({ id: 'help', label: 'Help' });

    store.addButton({ id: 'save', label: 'Save now', variant: 'success' });
    store.removeButton('help');

    expect(store.getButtons()).toEqual([
      { id: 'save', label: 'Save now', variant: 'success' },
      { id: 'cancel', label: 'Cancel' },
    ]);
  });
});
