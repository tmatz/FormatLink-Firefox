function populateText(formattedText) {
  const textElem = document.getElementById("textToCopy");
  textElem.value = formattedText;
  textElem.focus();
  textElem.select();
}

function populateFormatGroup(options) {
  const defaultFormat = options["defaultFormat"];
  const group = document.getElementById("formatGroup");
  group.innerHTML = "";
  for (let rule of getRuleCandidates(options)) {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="radio" name="format" id="format${rule.no}" value="${rule.no}">
      </input>`;
    const innerText = document.createTextNode(rule.title);
    if (options["title" + defaultFormat] == rule.title) {
      label.style.fontWeight = "bold";
    }
    label.appendChild(innerText);
    optional(label.querySelector("input"), (input) => {
      input.addEventListener("click", async (e) => {
        populateText(await copyLinkToClipboard(rule.format));
      });
    });
    group.appendChild(label);
  }
  optional(group.querySelector(`input[value="${defaultFormat}"]`), (btn) => {
    btn.checked = true;
  });
}

function getSelectedFormatID() {
  for (let i = 1; i <= FORMAT_MAX_COUNT; ++i) {
    let radio = document.getElementById("format" + i);
    if (radio && radio.checked) {
      return i;
    }
  }
  return undefined;
}

async function init() {
  document
    .getElementById("saveDefaultFormatButton")
    .addEventListener("click", async () => {
      let formatID = getSelectedFormatID();
      if (formatID) {
        await browser.runtime.sendMessage({
          messageID: "update-default-format",
          formatID,
        });
      }
    });

  document.getElementById("openOptionsPage").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
    window.close();
  });

  const options = await gettingOptions();
  const format = options["format" + options.defaultFormat];
  let formattedText = await copyLinkToClipboard(format);
  populateText(formattedText);
  populateFormatGroup(options);
}
document.addEventListener("DOMContentLoaded", init);
