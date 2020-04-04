// This function must be called in a visible page, such as a browserAction popup
// or a content script. Calling it in a background page has no effect!
function FormatLink_copyTextToClipboard(text) {
  function oncopy(event) {
    document.removeEventListener("copy", oncopy, true);
    // Hide the event from the page to prevent tampering.
    event.stopImmediatePropagation();

    // Overwrite the clipboard content.
    event.preventDefault();
    event.clipboardData.setData("text/plain", text);
  }
  document.addEventListener("copy", oncopy, true);

  // Requires the clipboardWrite permission, or a user gesture:
  document.execCommand("copy");
}

function FormatLink_getContentInfo() {
  function getSelectionInfo() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return {
        text: selection.toString().trim(),
        href: selection.anchorNode.parentNode.href,
      };
    } else {
      return {};
    }
  }

  return Object.assign(getSelectionInfo(), {
    title: document.title,
    url: window.location.href,
  });
}
