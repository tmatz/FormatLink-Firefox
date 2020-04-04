function formatURL(format, url, title, text, href, newline) {
  const len = format.length;
  const variables = { url, title, text, href };
  let i = 0;

  function refVariable(name) {
    if (name in variables) {
      return variables[name];
    }
    throw new Error(`unexpected variable name at ${i}`);
  }

  function parseLiteral(str) {
    if (format.substr(i, str.length) === str) {
      i += str.length;
      return str;
    } else {
      return null;
    }
  }

  function parseString() {
    if (i < len) {
      const quote = format.substr(i++, 1);
      const startIndex = i;
      const endIndex = format.indexOf(quote, startIndex);
      if (endIndex >= 0) {
        i = endIndex + 1;
        return format.substr(startIndex, endIndex - startIndex);
      } else {
        const ellipsis = format.length > 5 ? "..." : "";
        const head = format.substr(startIndex, 5) + ellipsis;
        throw new Error(`parse error: regexp not closed -- ${quote}${head}`);
      }
    } else {
      throw new Error("unexpected EOL");
    }
  }

  function processVar(value) {
    let active = true;
    let work = value;
    while (i < len) {
      if (parseLiteral(".s(")) {
        // .s(/arg1/arg2/)
        const arg1 = parseString();
        i--;
        const arg2 = parseString();
        if (!parseLiteral(")")) {
          throw new Error(`missing close parenthesis at ${i}`);
        }
        const regex = new RegExp(arg1, "g");
        if (active) {
          work = work.replace(regex, arg2);
        }
      } else if (parseLiteral(".m(")) {
        // .m(/arg/)
        const arg = parseString();
        if (!parseLiteral(")")) {
          throw new Error(`missing close parenthesis at ${i}`);
        }
        const regex = new RegExp(arg);
        if (!regex.test(work)) {
          active = false;
          work = "";
        }
      } else if (parseLiteral(".m!(")) {
        // .m!(/arg/)
        const arg = parseString();
        if (!parseLiteral(")")) {
          throw new Error(`missing close parenthesis at ${i}`);
        }
        const regex = new RegExp(arg);
        if (regex.test(work)) {
          active = false;
          work = "";
        }
      } else if (parseLiteral(".r(")) {
        // .r(/regex/var/)
        const arg1 = parseString();
        i--;
        const arg2 = parseString();
        const value = refVariable(arg2);
        if (!parseLiteral(")")) {
          throw new Error(`missing close parenthesis at ${i}`);
        }
        const regex = new RegExp(arg1);
        if (active) {
          work = work.replace(regex, value);
        }
      } else if (parseLiteral("}}")) {
        return work;
      }
    }
    throw new Error(`missing close braces at ${i}`);
  }

  let result = "";
  while (i < len) {
    if (parseLiteral("\\")) {
      if (parseLiteral("n")) {
        result += newline;
        //  isWindows ? "\r\n" : "\n";
      } else if (parseLiteral("t")) {
        result += "\t";
      } else {
        result += format.substr(i++, 1);
      }
    } else if (parseLiteral("{{")) {
      if (parseLiteral("title")) {
        result += processVar(title);
      } else if (parseLiteral("url")) {
        result += processVar(url);
      } else if (parseLiteral("text")) {
        result += processVar(text);
      } else if (parseLiteral("href")) {
        result += processVar(href);
      }
    } else {
      result += format.substr(i++, 1);
    }
  }
  return result;
}
