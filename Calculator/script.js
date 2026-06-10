const display = document.querySelector("#display");
const expressionEl = document.querySelector("#expression");
const buttons = document.querySelectorAll("#buttons button");
const historyList = document.querySelector("#historyList");
const historyEmpty = document.querySelector("#historyEmpty");
const clearHistoryBtn = document.querySelector("#clearHistory");
const themeToggle = document.querySelector("#themeToggle");

const specialChars = ["%", "*", "/", "-", "+", "="];
let output = "";

const HISTORY_KEY = "calculator_history_v1";
const HISTORY_LIMIT = 10;

const getTheme = () => {
  return localStorage.getItem("theme") || "dark";
};

const setTheme = (theme) => {
  const app = document.querySelector("#app");
  app?.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  const icon = themeToggle?.querySelector(".theme-toggle__icon");
  if (icon) icon.textContent = theme === "dark" ? "🌙" : "☀️";
};

const sanitizeAndEvaluate = (expr) => {
  // Convert UI % into /100 occurrences.
  // Example: 50% -> 50/100. (Multiple % are supported.)
  const normalized = expr.replace(/(\d+(?:\.\d+)?)%/g, "$1/100");

  // Only allow digits, operators, parentheses, decimal points, spaces.
  // NOTE: This is still not a full CAS; it's a safety gate before evaluation.
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) {
    throw new Error("Invalid expression");
  }

  // eslint-disable-next-line no-eval
  const result = eval(normalized);
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error("Invalid result");
  }
  return result;
};

const formatResult = (value) => {
  // Avoid long floating point strings.
  const str = String(value);
  if (str.includes("e")) return str;
  const num = Number(value);
  if (Number.isInteger(num)) return String(num);
  return num.toPrecision(12).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
};

const updateDisplay = () => {
  display.value = output;
  expressionEl.textContent = output ? output : " ";
};

const animateButtonPress = (button) => {
  button.classList.remove("is-pressed");
  // Force reflow
  // eslint-disable-next-line no-unused-expressions
  button.offsetWidth;
  button.classList.add("is-pressed");
  setTimeout(() => button.classList.remove("is-pressed"), 140);
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (items) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
};

const renderHistory = () => {
  const items = loadHistory();
  historyList.innerHTML = "";

  if (!items.length) {
    historyEmpty.style.display = "block";
    return;
  }

  historyEmpty.style.display = "none";

  for (const item of items) {
    const li = document.createElement("li");
    li.className = "history__item";
    li.setAttribute("role", "button");
    li.tabIndex = 0;
    li.dataset.value = item.expression;

    li.innerHTML = `
      <div class="history__expr">${item.expression}</div>
      <div class="history__result">= ${item.result}</div>
    `;

    const loadFromHistory = () => {
      output = String(item.expression);
      updateDisplay();
    };

    li.addEventListener("click", loadFromHistory);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        loadFromHistory();
      }
    });

    historyList.appendChild(li);
  }
};

const addHistoryEntry = (expression, result) => {
  const items = loadHistory();
  items.unshift({ expression, result: formatResult(result) });
  saveHistory(items.slice(0, HISTORY_LIMIT));
  renderHistory();
};

const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
};

const calculate = (btnValue, sourceButton = null) => {
  if (sourceButton) animateButtonPress(sourceButton);

  display.focus();

  if (btnValue === "=" && output !== "") {
    try {
      const expr = output;
      const result = sanitizeAndEvaluate(expr);
      output = formatResult(result);
      updateDisplay();
      addHistoryEntry(expr, result);
    } catch {
      output = "Error";
      updateDisplay();
    }
    return;
  }

  if (btnValue === "AC") {
    output = "";
    updateDisplay();
    return;
  }

  if (btnValue === "DEL") {
    output = output.toString().slice(0, -1);
    updateDisplay();
    return;
  }

  if (output === "Error") output = "";

  // If output is empty and button is specialChars then return
  if (output === "" && specialChars.includes(btnValue)) return;

  output += btnValue;
  updateDisplay();
};

buttons.forEach((button) => {
  button.addEventListener("click", (e) => {
    const btnValue = e.currentTarget.dataset.value;
    calculate(btnValue, e.currentTarget);
  });
});

themeToggle?.addEventListener("click", () => {
  const current = getTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
});

clearHistoryBtn?.addEventListener("click", () => {
  clearHistory();
});

// Keyboard support
const keyToValue = (key) => {
  if (/^[0-9]$/.test(key)) return key;
  if (key === ".") return ".";
  if (key === "%") return "%";
  if (key === "*" || key === "/" || key === "+" || key === "-" ) return key;
  if (key === "Enter" || key === "=") return "=";
  if (key === "Backspace") return "DEL";
  if (key === "Escape") return "AC";
  return null;
};

document.addEventListener("keydown", (e) => {
  // Avoid interfering with browser shortcuts.
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  const val = keyToValue(e.key);
  if (!val) return;

  e.preventDefault();

  // Find corresponding button (for press animation), else pass null.
  const btn = Array.from(buttons).find((b) => b.dataset.value === val) || null;
  calculate(val, btn);
});

// Init
setTheme(getTheme());
updateDisplay();
renderHistory();

