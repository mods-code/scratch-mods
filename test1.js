(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('files extension must be run unsandboxed');
  }

  const MODE_MODAL = 'modal';
  const MODE_IMMEDIATELY_SHOW_SELECTOR = 'selector';
  const MODE_ONLY_SELECTOR = 'only-selector';
  const ALL_MODES = [MODE_MODAL, MODE_IMMEDIATELY_SHOW_SELECTOR, MODE_ONLY_SELECTOR];
  let openFileSelectorMode = MODE_MODAL;

  const AS_TEXT = 'text';
  const AS_DATA_URL = 'url';

  /**
   * @param {string} accept See MODE_ constants above
   * @param {string} as See AS_ constants above
   * @returns {Promise<string>} format given by as parameter
   */
  const showFilePrompt = (accept, as) => new Promise((_resolve) => {
    // We can't reliably show an <input> picker without "user interaction" in all environments,
    // so we have to show our own UI anyways. We may as well use this to implement some nice features
    // that native file pickers don't have:
    //  - Easy drag+drop
    //  - Reliable cancel button (input cancel event is still basically nonexistent)
    //    This is important so we can make this just a reporter instead of a command+hat block.
    //    Without an interface, the script would be stalled if the prompt was just cancelled.

    /** @param {string} text */
    const callback = (text) => {
      _resolve(text);
      outer.remove();
      document.body.removeEventListener('keydown', handleKeyDown);
    };

    let isReadingFile = false;

    /** @param {File} file */
    const readFile = (file) => {
      if (isReadingFile) {
        return;
      }
      isReadingFile = true;

      const reader = new FileReader();
      reader.onload = () => {
        callback(/** @type {string} */ (reader.result));
      };
      reader.onerror = () => {
        console.error('Failed to read file as text', reader.error);
        callback('');
      };
      if (as === AS_TEXT) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    };

    /** @param {KeyboardEvent} e */
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        callback('');
      }
    };
    document.body.addEventListener('keydown', handleKeyDown, {
      capture: true
    });

    const INITIAL_BORDER_COLOR = '#888';
    const DROPPING_BORDER_COLOR = '#03a9fc';

    const outer = document.createElement('div');
    outer.className = 'extension-content';
    outer.style.position = 'fixed';
    outer.style.top = '0';
    outer.style.left = '0';
    outer.style.width = '100%';
    outer.style.height = '100%';
    outer.style.display = 'flex';
    outer.style.alignItems = 'center';
    outer.style.justifyContent = 'center';
    outer.style.background = 'rgba(0, 0, 0, 0.5)';
    outer.style.zIndex = '20000';
    outer.style.color = 'black';
    outer.style.colorScheme = 'light';
    outer.addEventListener('dragover', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
          if (as === AS_DATA_URL) {
    const url = e.dataTransfer.getData('URL');
    _resolve(url);
    outer.remove();
  } else {
    const file = e.dataTransfer.files[0];
    if (file) {
      e.preventDefault();
      readFile(file);
    }
  }
});
outer.addEventListener('click', (e) => {
  if (e.target === outer) {
    callback('');
  }
});

const modal = document.createElement('button');
modal.style.boxShadow = '0 0 10px -5px currentColor';
modal.style.cursor = 'pointer';
modal.style.font = 'inherit';
modal.style.background = 'white';
modal.style.padding = '16px';
modal.style.borderRadius = '16px';
modal.style.border = `8px dashed ${INITIAL_BORDER_COLOR}`;
modal.style.position = 'relative';
modal.style.textAlign = 'center';
modal.addEventListener('click', () => {
  input.click();
});
modal.focus();
outer.appendChild(modal);

const input = document.createElement('input');
input.type = 'file';
input.accept = accept;
input.addEventListener('change', (e) => {
  // @ts-expect-error
  const file = e.target.files[0];
  if (file) {
    readFile(file);
  }
});

const urlButton = document.createElement('button');
urlButton.style.marginLeft = '8px';
urlButton.textContent = 'From URL';
urlButton.addEventListener('click', () => {
  if (as === AS_DATA_URL) {
    showUrlPrompt(accept, as).then(_resolve);
  } else {
    throw new Error(`can't fetch from URL as ${as}`);
  }
});

const title = document.createElement('div');
title.textContent = 'Select or drop file';
title.style.fontSize = '1.5em';
title.style.marginBottom = '8px';
modal.appendChild(title);

const subtitle = document.createElement('div');
const formattedAccept = accept || 'any';
subtitle.textContent = `Accepted formats: ${formattedAccept}`;
subtitle.appendChild(urlButton);
modal.appendChild(subtitle);

document.body.appendChild(outer);

if (openFileSelectorMode === MODE_IMMEDIATELY_SHOW_SELECTOR || openFileSelectorMode === MODE_ONLY_SELECTOR) {
  input.click();
}

function showUrlPrompt(accept, as) {
  return new Promise((_resolve) => {
    const modal = document.createElement('div');
    modal.style.boxShadow = '0 0 10px -5px currentColor';
    modal.style.font = 'inherit';
    modal.style.background = 'white';
    modal.style.padding = '16px';
    modal.style.borderRadius = '16px';
    modal.style.position = 'relative';
    modal.style.textAlign = 'center';
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        callback('');
      }
    });
    outer.appendChild(modal);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'URL';
    input.style.width = '100%';
    input.style.marginBottom = '8px';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();
        submitButton.click();
      }
    });
    modal.appendChild(input);

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Fetch';
    submitButton.style.marginLeft = '8px';
    submitButton.addEventListener('click', () => {
      const url = input.value.trim();
     
const url = input.value.trim();

