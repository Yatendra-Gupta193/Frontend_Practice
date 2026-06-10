const els = {
  textInput: document.getElementById("textInput"),
  voiceSelect: document.getElementById("voiceSelect"),
  rateRange: document.getElementById("rateRange"),
  pitchRange: document.getElementById("pitchRange"),
  volumeRange: document.getElementById("volumeRange"),

  rateValue: document.getElementById("rateValue"),
  pitchValue: document.getElementById("pitchValue"),
  volumeValue: document.getElementById("volumeValue"),

  speakBtn: document.getElementById("speakBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resumeBtn: document.getElementById("resumeBtn"),
  stopBtn: document.getElementById("stopBtn"),

  copyBtn: document.getElementById("copyBtn"),
  clearBtn: document.getElementById("clearBtn"),

  charCount: document.getElementById("charCount"),
  wordCount: document.getElementById("wordCount"),

  themeBtn: document.getElementById("themeBtn"),
  themeIcon: document.getElementById("themeIcon"),

  speakingIndicator: document.getElementById("speakingIndicator"),
  speakingText: document.getElementById("speakingText"),
};

let voices = [];
let utterance = null;
let isPaused = false;
let isSpeaking = false;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function getText() {
  return (els.textInput.value || "").trim();
}

function updateCounters() {
  const text = els.textInput.value || "";
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  els.charCount.textContent = chars;
  els.wordCount.textContent = String(words);
}

function setTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    els.themeIcon.textContent = "☀";
  } else {
    document.documentElement.removeAttribute("data-theme");
    els.themeIcon.textContent = "🌙";
  }
  localStorage.setItem("tts-theme", theme);
}

function initTheme() {
  const saved = localStorage.getItem("tts-theme");
  setTheme(saved === "light" ? "light" : "dark");
}

function currentSettings() {
  return {
    rate: Number(els.rateRange.value),
    pitch: Number(els.pitchRange.value),
    volume: Number(els.volumeRange.value),
    voice: els.voiceSelect.value,
  };
}

function applyVoiceToUtterance(u) {
  // User selection: default / en / hi (only these 3 options)
  if (!voices || !voices.length) return;

  const choice = (els.voiceSelect.value || "default").toLowerCase();

  const english = voices.find((v) => v && v.lang && /en/i.test(v.lang));
  const hindi = voices.find((v) => v && v.lang && /hi/i.test(v.lang));
  const fallback = voices.find((v) => v) || null;

  if (choice === "hi") {
    u.voice = hindi || english || fallback;
  } else if (choice === "en") {
    u.voice = english || hindi || fallback;
  } else {
    // default: prefer English, then Hindi, then anything
    u.voice = english || hindi || fallback;
  }
}





function setSpeakingUI(state) {
  isSpeaking = state;

  const waves = els.speakingIndicator.querySelector(".waves");
  if (state) {
    waves.classList.add("speaking");
    els.speakingText.textContent = "🔊 Speaking...";
  } else {
    waves.classList.remove("speaking");
    els.speakingText.textContent = "Idle";
  }

  // Buttons
  if (!state) {
    els.speakBtn.disabled = false;
    els.pauseBtn.disabled = true;
    els.resumeBtn.disabled = true;
    els.stopBtn.disabled = true;
    return;
  }

  els.speakBtn.disabled = true;
  els.stopBtn.disabled = false;
  els.pauseBtn.disabled = !window.speechSynthesis || isPaused;
  els.resumeBtn.disabled = !isPaused;
}

function speak() {
  const text = getText();
  if (!text) return;

  const synth = window.speechSynthesis;
  if (!synth) return;

  // Stop any previous utterance
  synth.cancel();
  isPaused = false;

  utterance = new SpeechSynthesisUtterance(text);
  const { rate, pitch, volume } = currentSettings();

  applyVoiceToUtterance(utterance);
  utterance.rate = clamp(rate, 0.1, 10);
  utterance.pitch = clamp(pitch, 0, 2);
  utterance.volume = clamp(volume, 0, 1);

  utterance.onstart = () => {
    isPaused = false;
    setSpeakingUI(true);
  };

  utterance.onpause = () => {
    isPaused = true;
    els.pauseBtn.disabled = true;
    els.resumeBtn.disabled = false;
    els.speakingText.textContent = "⏸ Paused";
  };

  utterance.onresume = () => {
    isPaused = false;
    els.pauseBtn.disabled = false;
    els.resumeBtn.disabled = true;
    els.speakingText.textContent = "🔊 Speaking...";
  };

  utterance.onend = () => {
    isPaused = false;
    utterance = null;
    setSpeakingUI(false);
  };

  utterance.onerror = () => {
    isPaused = false;
    utterance = null;
    setSpeakingUI(false);
  };

  synth.speak(utterance);
}

function pause() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (!isSpeaking || isPaused) return;
  synth.pause();
}

function resume() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (!isSpeaking || !isPaused) return;
  synth.resume();
}

function stop() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  isPaused = false;
  utterance = null;
  setSpeakingUI(false);
}

function populateVoices() {
  const synth = window.speechSynthesis;
  if (!synth) return;

  voices = synth.getVoices() || [];
}



function initVoiceLoading() {
  const synth = window.speechSynthesis;
  if (!synth) return;

  populateVoices();

  // Some browsers load voices asynchronously.
  synth.onvoiceschanged = () => {
    const prev = els.voiceSelect.value;
    populateVoices();
    if (prev) els.voiceSelect.value = prev;
  };
}

function initControls() {
  function syncRate() {
    els.rateValue.textContent = `${Number(els.rateRange.value)}x`;
  }
  function syncPitch() {
    els.pitchValue.textContent = String(Number(els.pitchRange.value));
  }
  function syncVolume() {
    const v = Number(els.volumeRange.value);
    els.volumeValue.textContent = `🔈 ${Math.round(v * 100)}%`;
  }

  els.rateRange.addEventListener("input", syncRate);
  els.pitchRange.addEventListener("input", syncPitch);
  els.volumeRange.addEventListener("input", syncVolume);

  syncRate();
  syncPitch();
  syncVolume();
}

function initActions() {
  els.speakBtn.addEventListener("click", () => speak());
  els.pauseBtn.addEventListener("click", () => pause());
  els.resumeBtn.addEventListener("click", () => resume());
  els.stopBtn.addEventListener("click", () => stop());

  els.copyBtn.addEventListener("click", async () => {
    const text = els.textInput.value || "";
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.textContent = "✅ Copied";
      setTimeout(() => (els.copyBtn.textContent = "📋 Copy"), 900);
    } catch {
      // Fallback
      els.textInput.select();
      document.execCommand("copy");
    }
  });

  els.clearBtn.addEventListener("click", () => {
    stop();
    els.textInput.value = "";
    updateCounters();
  });
}

function initCounters() {
  els.textInput.addEventListener("input", () => {
    updateCounters();
  });
  updateCounters();
}

function initThemeToggle() {
  els.themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    setTheme(cur === "light" ? "dark" : "light");
  });
}

(function init() {
  if (!window.speechSynthesis) {
    els.speakingText.textContent = "Speech Synthesis not supported in this browser";
    // Disable controls
    els.speakBtn.disabled = true;
    els.pauseBtn.disabled = true;
    els.resumeBtn.disabled = true;
    els.stopBtn.disabled = true;
  }

  initTheme();
  initVoiceLoading();
  initControls();
  initActions();
  initCounters();
  initThemeToggle();

  setSpeakingUI(false);

  // Improve UX: allow Ctrl+Enter to Speak
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      speak();
    }
  });
})();

