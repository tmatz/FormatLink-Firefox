function copyTextToClipboard(text) {
  // The example will show how data can be copied, but since background
  // pages cannot directly write to the clipboard, we will run a content
  // script that copies the actual content.

  // clipboard-helper.js defines function copyToClipboard.
  const code = "copyToClipboard(" + JSON.stringify(text) + ");";

  browser.tabs.executeScript({
    code: "typeof copyToClipboard === 'function';",
  }).then(results => {
    // The content script's last expression will be true if the function
    // has been defined. If this is not the case, then we need to run
    // clipboard-helper.js to define function copyToClipboard.
    if (!results || results[0] !== true) {
      return browser.tabs.executeScript({
        file: "clipboard-helper.js",
      });
    }
  }).then(() => {
    return browser.tabs.executeScript({
      code,
    });
  }).catch(error => {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error("Failed to copy text: " + error);
  });
}

function tryToGetLinkSelectionText(tab, url, text) {
  if (text) {
    return Promise.resolve(text);
  }
  return browser.tabs.sendMessage(tab.id, {"method": "getSelection"}).
  then(response => {
    var selText = response.selection;
    if (selText) {
      return selText;
    }
    return browser.tabs.executeScript(tab.id, {
      code: `
        var text = '';
        var links = document.querySelectorAll('a');
        for (var i = 0; i < links.length; i++) {
          var link = links[i];
          if (link.href === "${url}") {
            text = link.innerText.trim();
            break
          }
        }
        text;
      `
    }).then(response => {
      return response[0];
    });
  });
}

gettingOptions().then(options => {
  var defaultFormat = options['title' + (options['defaultFormat'] || 1)];
  createContextMenu(defaultFormat).
  then(() => {
    browser.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "format-link-format-default") {
        gettingOptions().then(options => {
          var formatID = options["defaultFormat"];
          var format = options['format' + formatID];
          var url = info.linkUrl ? info.linkUrl : info.pageUrl;
          var title = tab.title;
          var text = info.selectionText;
          try {
            tryToGetLinkSelectionText(tab, url, text).
            then(text => {
              var formattedText = formatURL(format, url, title, text);
              copyTextToClipboard(formattedText);
            });
          } catch (e) {
            console.error("FormatLink extension failed to copy URL to clipboard.");
          }
        });
      }
    });
  }).catch(err => {
    console.error("failed to create context menu", err);
  });
});

browser.commands.onCommand.addListener((command) => {
  if (command === 'format-link-in-default-format') {
    gettingOptions().then(options => {
      browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        if (tabs[0]) {
          var tab = tabs[0];
          try{
            browser.tabs.sendMessage(tab.id, {"method": "getSelection"}).
            then(response => {
              var defaultFormatID = options['defaultFormat'];
              var format = options['format' + defaultFormatID];
              var url = tab.url;
              var title = tab.title;
              var text = response.selection;
              var formattedText = formatURL(format, url, title, text);
              copyTextToClipboard(formattedText);
            }).catch(reason => {
              var defaultFormatID = options['defaultFormat'];
              var format = options['format' + defaultFormatID];
              var url = tab.url;
              var title = tab.title;
              var formattedText = formatURL(format, url, title);
              copyTextToClipboard(formattedText);
            });
          } catch (e) {
            console.error("FormatLink extension failed to copy URL to clipboard.");
          }
        }
      });
    });
  }
});
