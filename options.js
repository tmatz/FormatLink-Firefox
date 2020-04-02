async function restoreOptions() {
  const options = await gettingOptions();
  for (let i = 1; i <= 9; ++i) {
    document.getElementById("title" + i).value = options["title" + i] || "";
    document.getElementById("format" + i).value = options["format" + i] || "";
  }
  document.getElementById("createSubmenusCheckbox").checked =
    options["createSubmenus"];
}

async function saveOptions(defaultFormatID) {
  let options;
  try {
    options = defaultFormatID
      ? { defaultFormat: defaultFormatID }
      : await gettingOptions();
    for (let i = 1; i <= 9; ++i) {
      options["title" + i] = document.getElementById("title" + i).value;
      options["format" + i] = document.getElementById("format" + i).value;
    }
    options["createSubmenus"] = document.getElementById(
      "createSubmenusCheckbox"
    ).checked;
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
  for (let i = 1; i <= 9; ++i) {
    document.getElementById("title" + i).value =
      DEFAULT_OPTIONS["title" + i] || "";
    document.getElementById("format" + i).value =
      DEFAULT_OPTIONS["format" + i] || "";
  }
  document.getElementById("createSubmenusCheckbox").checked =
    DEFAULT_OPTIONS["createSubmenus"];
  return saveOptions(DEFAULT_OPTIONS["defaultFormat"]);
}

async function swapFormats(e, delta) {
  const i1 = Number(e.target.id.replace(/^[a-z]+/, ""));
  const i2 = i1 + delta;
  if (1 <= i1 && i1 <= 9 && 1 <= i2 && i2 <= 9) {
    const title1 = document.getElementById("title" + i1);
    const format1 = document.getElementById("format" + i1);
    const title2 = document.getElementById("title" + i2);
    const format2 = document.getElementById("format" + i2);
    let tmp = title1.value;
    title1.value = title2.value;
    title2.value = tmp;
    tmp = format1.value;
    format1.value = format2.value;
    format2.value = tmp;
  }
}

async function init() {
  await restoreOptions();
  document.getElementById("saveButton").addEventListener("click", function(e) {
    e.preventDefault();
    saveOptions();
  });
  document
    .getElementById("restoreDefaultsButton")
    .addEventListener("click", function(e) {
      e.preventDefault();
      restoreDefaults();
    });
  for (let i = 1; i <= 8; i++) {
    document.getElementById("swap" + i).addEventListener("click", function(e) {
      e.preventDefault();
      swapFormats(e, 1);
    });
  }
}
document.addEventListener("DOMContentLoaded", init);
