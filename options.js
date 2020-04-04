async function restoreOptions() {
  const options = await gettingOptions();
  for (let elem of document.querySelectorAll(".item--title,.item--format")) {
    elem.value = options[elem.id] || "";
  }
  optional(document.getElementById("default" + options.defaultFormat), (it) => {
    it.checked = true;
  });
  optional(document.getElementById("createSubmenusCheckbox"), (it) => {
    it.checked = options.createSubmenus;
  });
}

async function saveOptions() {
  const options = {};
  try {
    for (let elem of document.querySelectorAll(".item--title,.item--format")) {
      options[elem.id] = elem.value;
    }
    optional(document.getElementById("createSubmenusCheckbox"), (it) => {
      options.createSubmenus = it.checked;
    });
  } catch (err) {
    console.error("failed to get options", err);
  }
  try {
    await browser.storage.sync.set(options);
  } catch (err) {
    console.error("failed to save options", err);
  }
  try {
    await createContextMenus(options);
  } catch (err) {
    console.error("failed to update context menu", err);
  }
}

async function restoreDefaults() {
  const options = DEFAULT_OPTIONS;
  for (let elem of document.querySelectorAll(".item--title,.item--format")) {
    elem.value = options[elem.id] || "";
  }
  optional(document.getElementById("default" + options.defaultFormat), (it) => {
    it.checked = true;
  });
  optional(document.getElementById("createSubmenusCheckbox"), (it) => {
    it.checked = options.createSubmenus;
  });
  await saveOptions();
  await browser.runtime.sendMessage({
    messageID: "update-default-format",
    formatID: options.defaultFormat,
  });
}

async function swapFormats(elem) {
  const i1 = Number(elem.dataNo);
  const i2 = i1 + 1;
  const title1 = document.getElementById("title" + i1);
  const format1 = document.getElementById("format" + i1);
  const title2 = document.getElementById("title" + i2);
  const format2 = document.getElementById("format" + i2);
  if (title1 && format1 && title2 && format2) {
    let tmp = title1.value;
    title1.value = title2.value;
    title2.value = tmp;
    tmp = format1.value;
    format1.value = format2.value;
    format2.value = tmp;
    await saveOptions();
  }
}

async function init() {
  optional(document.getElementById("formatGroup"), (group) => {
    const num = 9;
    const domParser = new DOMParser();
    for (let i = 1; i <= num; i++) {
      const dom = domParser.parseFromString(
        `<input type="radio" id="default${i}" class="item item--${i} item--default" name="defaultFormat"/>
        <input type="text" id="title${i}" class="item item--${i} item--title" placeholder="Title${i}"/>
        <input type="text" id="format${i}" class="item item--${i} item--format" placeholder="Format${i}"/>
        <button id="swap${i}" class="btn item item${i} item--swap">⇕</button>`,
        "text/html"
      );
      if (i == num) {
        optional(dom.querySelector(".item--swap"), (it) => {
          it.remove();
        });
      }
      for (let elem of dom.querySelectorAll("body > *")) {
        group.appendChild(elem);
      }
    }
  });
  for (let elem of document.querySelectorAll(".item")) {
    elem.dataNo = elem.id.replace(/^[a-z-]*/, "");
  }
  await restoreOptions();
  optional(document.getElementById("restoreDefaultsButton"), (elem) => {
    elem.addEventListener("click", (e) => {
      e.preventDefault();
      restoreDefaults();
    });
  });
  optional(document.getElementById("createSubmenusCheckbox"), (elem) => {
    elem.addEventListener("click", (e) => {
      saveOptions();
    });
  });
  for (let elem of document.querySelectorAll("input.item[type=text]")) {
    elem.addEventListener("focus", (e) => {
      e.target.dataSavedValue = e.target.value;
    });
    elem.addEventListener("blur", (e) => {
      if (e.target.dataSavedValue !== e.target.value) {
        delete e.target.dataSavedValue;
        saveOptions();
      }
    });
  }
  for (let elem of document.querySelectorAll(".item--default")) {
    elem.addEventListener("click", (e) => {
      browser.runtime.sendMessage({
        messageID: "update-default-format",
        formatID: e.target.dataNo,
      });
    });
  }
  for (let elem of document.querySelectorAll(".item--swap")) {
    elem.addEventListener("click", (e) => {
      e.preventDefault();
      swapFormats(e.target);
    });
  }
  async function handleMessage(request, sender, sendResponse) {
    if (request.messageID === "update-default-format") {
      const formatID = request.formatID;
      document.getElementById("default" + formatID).checked = true;
    }
  }
  browser.runtime.onMessage.addListener(handleMessage);
}
document.addEventListener("DOMContentLoaded", init);
