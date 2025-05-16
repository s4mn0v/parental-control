// background.js
const BLOCKED_REDIRECT_URL = chrome.runtime.getURL("blocked.html");
const TEMP_UNBLOCK_DURATION_MINUTES = 30;

function getAlarmNameForUrl(url) {
    return `temp-unblock-${url.replace(/[^a-zA-Z0-9-_]/g, '_')}`;
}

async function refreshDeclarativeNetRequestRules() {
    console.log("Refreshing DeclarativeNetRequest rules...");
    try {
        const data = await chrome.storage.sync.get(["blockedUrls", "tempUnblocked"]);
        const masterBlockedUrls = data.blockedUrls || [];
        const tempUnblockedData = data.tempUnblocked || {};
        const now = Date.now();
        let wasTempUnblockedDataModified = false;

        const urlsToActuallyBlock = masterBlockedUrls.filter(url => {
            const unblockExpiry = tempUnblockedData[url];
            if (unblockExpiry && unblockExpiry > now) {
                console.log(`URL "${url}" is temporarily unblocked. Expires at ${new Date(unblockExpiry)}`);
                return false;
            }
            if (unblockExpiry && unblockExpiry <= now) {
                console.log(`Temporary unblock for "${url}" expired. Cleaning up.`);
                delete tempUnblockedData[url];
                wasTempUnblockedDataModified = true;
            }
            return true;
        });

        if (wasTempUnblockedDataModified) {
            await chrome.storage.sync.set({ tempUnblocked: tempUnblockedData });
            console.log("Cleaned up expired tempUnblocked entries from storage during refresh.");
        }

        console.log("Master Blocked URLs:", masterBlockedUrls);
        console.log("Temporarily Unblocked Data (after cleanup in refresh):", tempUnblockedData);
        console.log("URLs to Actually Block Now:", urlsToActuallyBlock);

        await updateBlockingRules(urlsToActuallyBlock);

    } catch (error) {
        console.error("Error refreshing declarativeNetRequest rules:", error);
    }
}

async function updateBlockingRules(urlsToBlock = []) {
    let currentRuleIds = [];
    try {
        const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
        currentRuleIds = currentRules.map((rule) => rule.id);
    } catch (e) {
        console.error("Error fetching current dynamic rules:", e);
    }

    const newRules = [];
    if (urlsToBlock.length > 0) {
        urlsToBlock.forEach((url, index) => {
            const ruleId = index + 1; 

            let urlPattern = url;
            if (!url.includes("://")) { 
                urlPattern = `*://*.${url.replace(/^www\./i, '')}/*`; 
            } else { 
                if (!url.endsWith("*")) {
                    urlPattern += url.endsWith("/") ? "*" : "/*";
                }
            }
            
            newRules.push({
                id: ruleId,
                priority: 1,
                action: { type: "redirect", redirect: { url: BLOCKED_REDIRECT_URL } },
                condition: { urlFilter: urlPattern, resourceTypes: ["main_frame"] },
            });
        });
    }

    try {
        if (currentRuleIds.length > 0 || newRules.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: currentRuleIds,
                addRules: newRules,
            });
            console.log("DeclarativeNetRequest rules updated. New rules:", newRules.length, "Old rules removed:", currentRuleIds.length);
        } else {
            console.log("No changes to DeclarativeNetRequest rules needed.");
        }
    } catch (error) {
        console.error("Error updating DeclarativeNetRequest rules:", error);
        console.error("Problematic newRules:", JSON.stringify(newRules));
    }
}

// --- Listeners ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "TEMP_UNBLOCK_URL") {
        const { url } = request;
        if (!url) {
            sendResponse({ success: false, message: "URL no proporcionada." });
            return true; 
        }

        (async () => {
            try {
                const data = await chrome.storage.sync.get("tempUnblocked");
                const tempUnblocked = data.tempUnblocked || {};
                
                const expiryTime = Date.now() + TEMP_UNBLOCK_DURATION_MINUTES * 60 * 1000;
                tempUnblocked[url] = expiryTime;

                await chrome.storage.sync.set({ tempUnblocked });
                
                const alarmName = getAlarmNameForUrl(url);
                await chrome.alarms.clear(alarmName); 
                chrome.alarms.create(alarmName, { delayInMinutes: TEMP_UNBLOCK_DURATION_MINUTES });
                
                console.log(`URL "${url}" temporarily unblocked. Alarm "${alarmName}" set for ${TEMP_UNBLOCK_DURATION_MINUTES} min.`);
                
                await refreshDeclarativeNetRequestRules(); 
                sendResponse({ success: true });
            } catch (error) {
                console.error("Error temporarily unblocking URL:", error);
                sendResponse({ success: false, message: "Error del servidor interno al pausar." });
            }
        })();
        return true; 
    } else if (request.type === "CLEAR_ALARM") {
        const { url } = request;
        if (url) {
            const alarmName = getAlarmNameForUrl(url);
            chrome.alarms.clear(alarmName, (wasCleared) => {
                console.log(`Alarm "${alarmName}" for URL "${url}" clear attempt. Was cleared: ${wasCleared}`);
            });
        }
        return false; 
    }
    return false; 
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log("Alarm fired:", alarm.name);
    if (alarm.name.startsWith("temp-unblock-")) {
        console.log(`Alarm ${alarm.name} indicates a temporary unblock may have expired. Refreshing rules.`);
        await refreshDeclarativeNetRequestRules();
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync" && (changes.blockedUrls || changes.tempUnblocked)) {
        console.log("Storage changed (blockedUrls or tempUnblocked), refreshing rules.");
        refreshDeclarativeNetRequestRules();
    }
});

// --- Initialization ---
async function initializeExtension() {
    console.log("Initializing extension state...");
    try {
        const data = await chrome.storage.sync.get(["blockedUrls", "tempUnblocked"]);
        const tempUnblocked = data.tempUnblocked || {};
        const now = Date.now();
        let wasTempUnblockedModifiedInInit = false;

        for (const url in tempUnblocked) {
            const expiryTime = tempUnblocked[url];
            if (expiryTime <= now) {
                console.log(`Expired unblock for "${url}" found during initialization. Removing.`);
                delete tempUnblocked[url];
                wasTempUnblockedModifiedInInit = true;
                await chrome.alarms.clear(getAlarmNameForUrl(url));
            } else {
                const remainingTimeMs = expiryTime - now;
                const remainingTimeMin = Math.max(1, Math.ceil(remainingTimeMs / (60 * 1000))); 
                
                const alarmName = getAlarmNameForUrl(url);
                const existingAlarm = await chrome.alarms.get(alarmName).catch(() => null);
                if (!existingAlarm) {
                     console.log(`Active unblock for "${url}" found. Re-creating alarm for ${remainingTimeMin} min.`);
                     await chrome.alarms.clear(alarmName); 
                     chrome.alarms.create(alarmName, { delayInMinutes: remainingTimeMin });
                } else {
                    console.log(`Active unblock for "${url}" found. Alarm already exists for ${alarmName}. Scheduled: ${new Date(existingAlarm.scheduledTime)}`);
                }
            }
        }

        if (wasTempUnblockedModifiedInInit) {
            await chrome.storage.sync.set({ tempUnblocked });
            console.log("Updated tempUnblocked in storage during initialization.");
        }

        await refreshDeclarativeNetRequestRules();
        console.log("Extension initialization complete.");
    } catch (error) {
        console.error("Error during extension initialization:", error);
    }
}

// --- Service Worker Lifecycle ---

chrome.runtime.onInstalled.addListener((details) => {
    console.log("Extension installed or updated:", details.reason);
    initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
    console.log("Browser started. Initializing extension state.");
    initializeExtension();
});

(async () => {
    console.log("Service Worker script evaluating. Performing initial setup.");
    await initializeExtension();
})();