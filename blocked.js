// background.js
const BLOCKED_REDIRECT_URL = chrome.runtime.getURL("blocked.html");

let isInitializingRules = false;

async function updateBlockingRules(blockedUrls = []) {
  console.log("Attempting to update blocking rules with:", blockedUrls);
  let currentRuleIds = [];
  try {
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    currentRuleIds = currentRules.map((rule) => rule.id);
    console.log("Current dynamic rule IDs found:", currentRuleIds);
  } catch (e) {
    console.error("Error fetching current dynamic rules:", e);
  }

  const newRules = [];
  if (blockedUrls.length > 0) {
    blockedUrls.forEach((url, index) => {
      const ruleId = index + 1;
      let urlPattern = url;
      if (!url.includes("://")) {
        urlPattern = "*://" + url;
      }
      if (!url.endsWith("*")) {
        urlPattern += url.endsWith("/") ? "*" : "/*";
      }
      newRules.push({
        id: ruleId,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { url: BLOCKED_REDIRECT_URL },
        },
        condition: {
          urlFilter: urlPattern,
          resourceTypes: ["main_frame"],
        },
      });
    });
  }

  console.log("New rules to be added:", JSON.stringify(newRules));
  console.log("Rule IDs to be removed:", currentRuleIds);

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: currentRuleIds,
      addRules: newRules,
    });
    console.log("DeclarativeNetRequest rules updated successfully.");
    const finalRules = await chrome.declarativeNetRequest.getDynamicRules();
    console.log("Final set of dynamic rules:", JSON.stringify(finalRules));
  } catch (error) {
    console.error("Error updating DeclarativeNetRequest rules:", error);
    console.error("Failed to remove IDs:", currentRuleIds);
    console.error("Failed to add Rules:", JSON.stringify(newRules));
  }
}

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.blockedUrls) {
    console.log("Blocked URLs changed in storage. Updating rules.");
    const newBlockedUrls = changes.blockedUrls.newValue || [];
    updateBlockingRules(newBlockedUrls);
  }
});

// Initialize rules when the extension is installed or updated, or browser starts
async function initializeRules() {
  if (isInitializingRules) {
    console.log("Rule initialization already in progress. Skipping.");
    return;
  }
  isInitializingRules = true;
  console.log("Initializing rules...");

  try {
    const result = await chrome.storage.sync.get(["blockedUrls"]);
    const blockedUrls = result.blockedUrls || [];
    await updateBlockingRules(blockedUrls);
  } catch (error) {
    console.error("Error during rule initialization:", error);
  } finally {
    isInitializingRules = false;
    console.log("Rule initialization finished.");
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed or updated:", details.reason);
  initializeRules();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started. Initializing rules.");
  initializeRules();
});

initializeRules();
