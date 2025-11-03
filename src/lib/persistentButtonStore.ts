import { create } from 'zustand';
import type { MessageButton } from '../js/types';

/**
 * A persistent button that extends MessageButton with a unique identifier.
 * These buttons are displayed at the bottom of the chat, above the input box.
 */
interface PersistentButton extends MessageButton {
  readonly id: string;
}

interface PersistentButtonStoreState {
  readonly buttons: readonly PersistentButton[];

  // Getters
  /**
   * Returns the current array of persistent buttons.
   */
  readonly getButtons: () => readonly PersistentButton[];

  // Setters
  /**
   * Adds a new persistent button or updates an existing one if a button with the same id already exists.
   * @param button The button configuration with a unique id
   */
  readonly addButton: (button: MessageButton & { readonly id: string }) => void;
  /**
   * Removes a persistent button by its id.
   * @param id The unique identifier of the button to remove
   */
  readonly removeButton: (id: string) => void;
  /**
   * Replaces all persistent buttons with the provided array.
   * @param buttons Array of button configurations with unique ids
   */
  readonly setButtons: (buttons: readonly (MessageButton & { readonly id: string })[]) => void;
  /**
   * Removes all persistent buttons.
   */
  readonly clearButtons: () => void;
}

export const usePersistentButtonStore = create<PersistentButtonStoreState>((set, get) => ({
  buttons: [],

  getButtons: () => {
    return get().buttons;
  },

  addButton: button => {
    const currentButtons = get().buttons;
    // Check if button with same id already exists
    if (currentButtons.some(b => b.id === button.id)) {
      // Update existing button
      set({
        buttons: currentButtons.map(b => (b.id === button.id ? button : b)),
      });
    } else {
      // Add new button
      set({
        buttons: [...currentButtons, button],
      });
    }
  },

  removeButton: id => {
    const currentButtons = get().buttons;
    set({
      buttons: currentButtons.filter(b => b.id !== id),
    });
  },

  setButtons: buttons => {
    set({ buttons });
  },

  clearButtons: () => {
    set({ buttons: [] });
  },
}));
