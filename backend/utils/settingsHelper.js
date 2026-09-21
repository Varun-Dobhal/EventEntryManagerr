const fs = require("fs");
const path = require("path");

const CONFIG_DIR = path.join(__dirname, "../config");
const SETTINGS_FILE = path.join(CONFIG_DIR, "systemSettings.json");

const DEFAULT_BATCH_SETTINGS = {
  batchSize: 50,
  delayMs: 2000,
  maxRetries: 3,
};

let memoryCache = null;

function ensureConfigFile() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_BATCH_SETTINGS, null, 2), "utf8");
    }
  } catch (err) {
    console.error("[SettingsHelper] Error creating config directory/file:", err.message);
  }
}

function getBatchSettings() {
  if (memoryCache) return memoryCache;

  ensureConfigFile();
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf8");
      const parsed = JSON.parse(data);
      memoryCache = {
        batchSize: Math.max(1, Math.min(500, Number(parsed.batchSize) || DEFAULT_BATCH_SETTINGS.batchSize)),
        delayMs: Math.max(100, Math.min(60000, Number(parsed.delayMs) || DEFAULT_BATCH_SETTINGS.delayMs)),
        maxRetries: Math.max(1, Math.min(10, Number(parsed.maxRetries) || DEFAULT_BATCH_SETTINGS.maxRetries)),
      };
      return memoryCache;
    }
  } catch (err) {
    console.error("[SettingsHelper] Error reading systemSettings.json:", err.message);
  }

  memoryCache = { ...DEFAULT_BATCH_SETTINGS };
  return memoryCache;
}

function saveBatchSettings({ batchSize, delayMs, maxRetries }) {
  ensureConfigFile();
  
  const current = getBatchSettings();
  const updated = {
    batchSize: batchSize !== undefined ? Math.max(1, Math.min(500, Number(batchSize))) : current.batchSize,
    delayMs: delayMs !== undefined ? Math.max(100, Math.min(60000, Number(delayMs))) : current.delayMs,
    maxRetries: maxRetries !== undefined ? Math.max(1, Math.min(10, Number(maxRetries))) : current.maxRetries,
  };

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf8");
    memoryCache = updated;
    console.log("[SettingsHelper] Saved updated batch settings:", updated);
    return updated;
  } catch (err) {
    console.error("[SettingsHelper] Error writing systemSettings.json:", err.message);
    memoryCache = updated;
    return updated;
  }
}

module.exports = {
  getBatchSettings,
  saveBatchSettings,
  DEFAULT_BATCH_SETTINGS,
};
