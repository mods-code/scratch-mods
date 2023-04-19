(function(Scratch) {
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
   * @param {string} fileName The name of the file to fetch
   * @param {string} url The URL to fetch the file from
   * @returns {Promise<string>} format given by as parameter
   */
  const fetchFile = (accept, as, fileName, url) => new Promise((_resolve) => {
    const callback = (text) => {
      _resolve(text);
    };

    const handleFetchError = (error) => {
      console.error(`Failed to fetch ${fileName} from ${url}`, error);
      callback('');
    };

    const handleFetchSuccess = (response) => {
      if (!response.ok) {
        handleFetchError(response.statusText);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        callback(/** @type {string} */ (reader.result));
      };
      reader.onerror = () => {
        console.error('Failed to read file as text', reader.error);
        callback('');
      };
      if (as === AS_TEXT) {
        reader.readAsText(response.blob());
      } else {
        reader.readAsDataURL(response.blob());
      }
    };

    fetch(url, {
      headers: {
        'Content-Type': accept,
      },
    })
      .then(handleFetchSuccess)
      .catch(handleFetchError);
  });

  document.addEventListener('DOMContentLoaded', () => {
    Scratch.extensions.register('Fetch Files', {
      fetchFile,
    });
  });
})(window.Scratch);
