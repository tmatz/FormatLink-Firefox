function isLinkable(tab) {
  return tab.url && tab.url.match(/^https?:/i);
}

function showHidePageAction(tab) {
  if (tab) {
    if (isLinkable(tab)) {
      browser.pageAction.show(tab.id);
      browser.browserAction.enable(tab.id);
    } else {
      browser.pageAction.hide(tab.id);
      browser.browserAction.disable(tab.id);
    }
  }
}

(async function() {
  browser.tabs.query({}).then(tabs => tabs.forEach(showHidePageAction));

  browser.tabs.onUpdated.addListener((id, changeInfo, tab) =>
    showHidePageAction(tab)
  );

  browser.commands.onCommand.addListener(async command => {
    try {
      const prefix = "copy-link-in-format";
      if (command.startsWith(prefix)) {
        let formatID = command.substr(prefix.length);
        const options = await gettingOptions();
        const format = options["format" + formatID];
        await copyLinkToClipboard(format);
      }
    } catch (err) {
      console.error(
        "FormatLink extension failed to copy URL to clipboard.",
        err
      );
    }
  });

  try {
    const options = await gettingOptions();
    await createContextMenus(options);
    browser.contextMenus.onClicked.addListener(async (info, tab) => {
      const prefix = "format-link-format";
      if (info.menuItemId.startsWith(prefix)) {
        try {
          const options = await gettingOptions();
          let formatID = info.menuItemId.substr(prefix.length);
          if (formatID === "-default") {
            formatID = options.defaultFormat;
          }
          const format = options["format" + formatID];
          await copyLinkToClipboard(format, info.linkUrl, info.linkText);
        } catch (err) {
          console.error(
            "FormatLink extension failed to copy URL to clipboard.",
            err
          );
        }
      }
    });

    async function handleMessage(request, sender, sendResponse) {
      if (request.messageID === "update-default-format") {
        const formatID = request.formatID;
        await saveDefaultFormat(formatID);

        const options = await gettingOptions();
        const defaultFormat = options["title" + request.formatID];
        await browser.contextMenus.update("format-link-format-default", {
          title: "Format Link as " + defaultFormat
        });
        sendResponse({ response: "default format updated" });
      } else {
        sendResponse({ response: "invalid messageID" });
      }
    }
    browser.runtime.onMessage.addListener(handleMessage);
  } catch (err) {
    console.error(
      "failed to create context menu for FormatLink extension",
      err
    );
  }
})();
