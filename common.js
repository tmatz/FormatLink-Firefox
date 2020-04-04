const FORMAT_MAX_COUNT = 9;

const DEFAULT_OPTIONS = {
  defaultFormat: "1",
  title1: "Markdown",
  format1: "[{{text.s(/\\[/\\[/).s(/\\]/\\]/)}}]({{url.s(/\\)/%29/)}})",
  title2: "reST",
  format2: "`{{text}} <{{url}}>`_",
  title3: "Text",
  format3: "{{text}}\\n{{url}}",
  title4: "HTML",
  format4: '<a href="{{url.s(/"/&quot;/)}}">{{text.s(/</&lt;/)}}</a>',
  title5: "LaTeX",
  format5: "\\\\href\\{{{url}}\\}\\{{{text}}\\}",
  title6: "",
  format6: "",
  title7: "",
  format7: "",
  title8: "",
  format8: "",
  title9: "",
  format9: "",
  createSubmenus: false,
};

function optional(target, some, none) {
  if (target) {
    return typeof some === "function" ? some(target) : some;
  } else {
    return typeof none === "function" ? none() : none;
  }
}

async function gettingOptions() {
  options = await browser.storage.sync.get(null);
  if (Object.keys(options).length === 0) {
    options = DEFAULT_OPTIONS;
  }
  return options;
}

function* getRules$(options) {
  for (let no = 1; no < 100; no++) {
    const titleKey = "title" + no;
    const formatKey = "format" + no;
    if (!(titleKey in options) || !(formatKey in options)) {
      break;
    }
    yield {
      no: `${no}`,
      title: options[titleKey],
      format: options[formatKey],
    };
  }
}

function getRuleCandidates(options) {
  const found = new Map();
  for (let rule of getRules$(options)) {
    if (!found.has(rule.title) && rule.title && rule.format) {
      found.set(rule.title, rule);
    }
  }
  return found.values();
}

async function saveDefaultFormat(formatID) {
  await browser.storage.sync.set({ defaultFormat: formatID });
}

async function requireContentScript() {
  const results = await browser.tabs.executeScript({
    code: "typeof FormatLink_copyLinkToClipboard === 'function';",
  });
  // The content script's last expression will be true if the function
  // has been defined. If this is not the case, then we need to run
  // content-helper.js to define function copyToClipboard.
  if (!results || results[0] !== true) {
    await browser.tabs.executeScript({
      file: "content-helper.js",
    });
  }
  // content-helper.js defines functions FormatLink_formatLinkAsText
  // and FormatLink_copyLinkToClipboard.
}

async function copyLinkToClipboard(format, linkUrl, linkText) {
  try {
    await requireContentScript();

    const newline = browser.runtime.PlatformOs === "win" ? "\r\n" : "\n";

    const [{ title, url, text, href }] = await browser.tabs.executeScript({
      code: "FormatLink_getContentInfo();",
    });

    const formattedText = formatURL(
      format || "",
      href || linkUrl || url || "",
      title || "",
      text || linkText || title || "",
      url || "",
      newline
    );

    await browser.tabs.executeScript({
      code: `FormatLink_copyTextToClipboard(${JSON.stringify(formattedText)});`,
    });

    return formattedText;
  } catch (err) {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error("Failed to copy text: " + err);
    alert("Failed to copy text: " + err);
  }
}

function creatingContextMenuItem(props) {
  return new Promise((resolve, reject) => {
    browser.contextMenus.create(props, () => {
      const err = browser.runtime.lastError;
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function createContextMenus(options) {
  await browser.contextMenus.removeAll();
  if (options.createSubmenus) {
    for (let rule of getRuleCandidates(options)) {
      await creatingContextMenuItem({
        id: "format-link-format" + rule.no,
        title: "as " + rule.title,
        contexts: ["all"],
      });
    }
  } else {
    const defaultFormat = options["title" + options["defaultFormat"]];
    await creatingContextMenuItem({
      id: "format-link-format-default",
      title: "Format Link as " + defaultFormat,
      contexts: ["all"],
    });
  }
}
