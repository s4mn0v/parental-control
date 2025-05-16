// popup.js
document.addEventListener("DOMContentLoaded", function () {
  const openOptionsButton = document.getElementById("openOptions");
  if (openOptionsButton) {
    openOptionsButton.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });
  }
});
