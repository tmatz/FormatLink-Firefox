function formatURL(format, url, title, text, newline) {
  const len = format.length;
  let result = "";
  let i = 0;

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
      return null;
    }
  }

  function processVar(value) {
    let work = value;
    while (i < len) {
      if (parseLiteral(".s(")) {
        let arg1 = parseString();
        if (arg1 && parseLiteral(",")) {
          let arg2 = parseString();
          if (arg2 && parseLiteral(")")) {
            let regex = new RegExp(arg1, "g");
            work = work.replace(regex, arg2);
          } else {
            throw new Error("parse error");
          }
        } else {
          throw new Error("parse error");
        }
      } else if (parseLiteral("}}")) {
        result += work;
        return;
      } else {
        throw new Error("parse error");
      }
    }
  }

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
        processVar(title);
      } else if (parseLiteral("url")) {
        processVar(url);
      } else if (parseLiteral("text")) {
        processVar(text ? text : title);
      }
    } else {
      result += format.substr(i++, 1);
    }
  }
  return result;
}
