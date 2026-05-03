/**
 * @fileoverview
 * This file contains the store, used for interacting and managing the persistent buttons.
 */

import { create } from 'zustand';
import type { MessageButton } from '../js/types';

/**
 * A persistent button that extends MessageButton with a unique identifier.
 * These buttons are displayed at the bottom of the chat, above the input box.
 *
 * @property id Unique identifier for the persistent button.
 */
interface PersistentButton extends MessageButton {
  /**
   * Stable identifier for this value.
   */
  readonly id: string;
}

/**
 * Internal persistent button store shape.
 *
 * @property buttons Current persistent buttons shown above the input field.
 * @property getButtons Returns the current array of persistent buttons.
 * @property addButton Adds a new persistent button or updates an existing one with the same id.
 * @property removeButton Removes a persistent button by id.
 * @property setButtons Replaces all persistent buttons with a new array.
 * @property clearButtons Removes all persistent buttons.
 */
interface PersistentButtonStoreState {
  /**
   * Buttons rendered, stored, or customized by this contract.
   */
  readonly buttons: readonly PersistentButton[];
  /**
   * Returns the buttons.
   */
  readonly getButtons: () => readonly PersistentButton[];
  /**
   * Adds or updates a persistent button.
   *
   * @param button - Button to store or update.
   */
  readonly addButton: (
    button: MessageButton & {
      /**
       * Stable identifier for this value.
       */
      readonly id: string;
    }
  ) => void;
  /**
   * Removes a persistent button.
   *
   * @param id - Persistent button identifier to remove.
   */
  readonly removeButton: (id: string) => void;
  /**
   * Replaces persistent buttons.
   *
   * @param buttons - Buttons to render, store, or customize.
   */
  readonly setButtons: (
    buttons: readonly (MessageButton & {
      /**
       * Stable identifier for this value.
       */
      readonly id: string;
    })[]
  ) => void;
  /**
   * Clears the buttons.
   */
  readonly clearButtons: () => void;
}

/**
 * Shared store for buttons that stay visible above the input field.
 */
export const usePersistentButtonStore = create<PersistentButtonStoreState>(
  (set, get) => ({
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
  })
);
