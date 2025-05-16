// options.js
document.addEventListener("DOMContentLoaded", () => {
  const blockedUrlList = document.getElementById("blockedUrlList");
  const newUrlInput = document.getElementById("newUrl");
  const addUrlButton = document.getElementById("addUrlButton");
  const messageElement = document.getElementById("message");

  // Password prompt elements
  const passwordPromptContainer = document.getElementById(
    "passwordPromptContainer"
  );
  const promptPasswordInput = document.getElementById("promptPasswordInput");
  const promptConfirmButton = document.getElementById("promptConfirmButton");
  const promptCancelButton = document.getElementById("promptCancelButton");
  const promptMessage = document.getElementById("promptMessage");

  const correctPassword = "password"; // WARNING: Store securely if this were a real product
  let currentAction = null;

  function showMessage(text, type = "success", duration = 3000) {
    messageElement.textContent = text;
    messageElement.className = type;
    if (duration > 0) {
      setTimeout(() => {
        messageElement.textContent = "";
        messageElement.className = "";
      }, duration);
    }
  }

  function showPromptMessage(text, type = "error") {
    promptMessage.textContent = text;
    promptMessage.className = type;
    setTimeout(() => {
      promptMessage.textContent = "";
      promptMessage.className = "";
    }, 3000);
  }

  function openPasswordPrompt(actionType, url) {
    currentAction = { type: actionType, url: url };
    passwordPromptContainer.style.display = "block";
    promptPasswordInput.value = "";
    promptPasswordInput.focus();
    promptMessage.textContent = "";
    if (actionType === "delete") {
      passwordPromptContainer.querySelector(
        "h3"
      ).textContent = `Contraseña para eliminar: ${url}`;
    } else if (actionType === "tempUnblock") {
      passwordPromptContainer.querySelector(
        "h3"
      ).textContent = `Contraseña para pausar (30 min): ${url}`;
    }
  }

  function closePasswordPrompt() {
    passwordPromptContainer.style.display = "none";
    currentAction = null;
    promptPasswordInput.value = "";
  }

  promptConfirmButton.addEventListener("click", () => {
    const password = promptPasswordInput.value;
    if (!currentAction) return;

    if (password === correctPassword) {
      if (currentAction.type === "delete") {
        deleteUrl(currentAction.url);
      } else if (currentAction.type === "tempUnblock") {
        temporarilyUnblockUrl(currentAction.url);
      }
      closePasswordPrompt();
    } else {
      showPromptMessage("Contraseña incorrecta.", "error");
      promptPasswordInput.value = "";
      promptPasswordInput.focus();
    }
  });

  promptCancelButton.addEventListener("click", closePasswordPrompt);

  async function loadBlockedUrls() {
    try {
      const result = await chrome.storage.sync.get([
        "blockedUrls",
        "tempUnblocked",
      ]);
      const blockedUrls = result.blockedUrls || [];
      const tempUnblocked = result.tempUnblocked || {};
      displayBlockedUrls(blockedUrls, tempUnblocked);
    } catch (error) {
      console.error("Error loading URLs:", error);
      showMessage("Error al cargar URLs.", "error");
    }
  }

  function displayBlockedUrls(urls, tempUnblocked) {
    blockedUrlList.innerHTML = "";
    if (urls.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No hay URLs bloqueadas.";
      blockedUrlList.appendChild(li);
      return;
    }

    const now = Date.now();
    urls.forEach((url) => {
      const li = document.createElement("li");

      const urlText = document.createElement("span");
      urlText.className = "url-text";
      urlText.textContent = url;
      li.appendChild(urlText);

      const actionsContainer = document.createElement("div");
      actionsContainer.className = "url-actions";

      if (tempUnblocked[url] && tempUnblocked[url] > now) {
        const timeLeft = Math.round((tempUnblocked[url] - now) / 60000);
        const statusSpan = document.createElement("span");
        statusSpan.textContent = ` (Pausado - ${timeLeft} min restantes) `;
        statusSpan.style.color = "orange";
        urlText.appendChild(statusSpan);
      } else {
        const tempUnblockBtn = document.createElement("button");
        tempUnblockBtn.textContent = "Pausar (30min)";
        tempUnblockBtn.title = "Desbloquear temporalmente por 30 minutos";
        tempUnblockBtn.style.backgroundColor = "#f0ad4e";
        tempUnblockBtn.addEventListener("click", () =>
          openPasswordPrompt("tempUnblock", url)
        );
        actionsContainer.appendChild(tempUnblockBtn);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Eliminar";
      deleteBtn.style.backgroundColor = "#d9534f";
      deleteBtn.addEventListener("click", () =>
        openPasswordPrompt("delete", url)
      );
      actionsContainer.appendChild(deleteBtn);

      li.appendChild(actionsContainer);
      blockedUrlList.appendChild(li);
    });
  }

  addUrlButton.addEventListener("click", async () => {
    let newUrl = newUrlInput.value.trim();
    if (!newUrl) {
      showMessage("El campo de URL no puede estar vacío.", "error");
      return;
    }

    // Normalize URL a bit (remove trailing slash, ensure it's not overly simple)
    if (newUrl.endsWith("/")) {
      newUrl = newUrl.slice(0, -1);
    }
    if (!newUrl.includes(".") && !newUrl.includes("://")) {
      showMessage(
        "Por favor, ingrese una URL o dominio válido (ej: example.com o https://example.com).",
        "error"
      );
      return;
    }

    try {
      const result = await chrome.storage.sync.get(["blockedUrls"]);
      const blockedUrls = result.blockedUrls || [];
      if (blockedUrls.includes(newUrl)) {
        showMessage("Esta URL ya está en la lista.", "error");
      } else {
        blockedUrls.push(newUrl);
        await chrome.storage.sync.set({ blockedUrls: blockedUrls });
        loadBlockedUrls();
        newUrlInput.value = "";
        showMessage("URL añadida exitosamente.", "success");
      }
    } catch (error) {
      console.error("Error adding URL:", error);
      showMessage("Error al añadir URL.", "error");
    }
  });

  async function deleteUrl(urlToDelete) {
    try {
      const result = await chrome.storage.sync.get([
        "blockedUrls",
        "tempUnblocked",
      ]);
      let blockedUrls = result.blockedUrls || [];
      let tempUnblocked = result.tempUnblocked || {};
      const initialLength = blockedUrls.length;

      blockedUrls = blockedUrls.filter((url) => url !== urlToDelete);

      if (blockedUrls.length < initialLength) {
        if (tempUnblocked[urlToDelete]) {
          delete tempUnblocked[urlToDelete];
          chrome.runtime.sendMessage({ type: "CLEAR_ALARM", url: urlToDelete });
        }
        await chrome.storage.sync.set({ blockedUrls, tempUnblocked });
        loadBlockedUrls();
        showMessage("URL eliminada exitosamente.", "success");
      } else {
        showMessage("La URL especificada no se encontró en la lista.", "error");
      }
    } catch (error) {
      console.error("Error deleting URL:", error);
      showMessage("Error al eliminar URL.", "error");
    }
  }

  async function temporarilyUnblockUrl(urlToUnblock) {
    chrome.runtime.sendMessage(
      { type: "TEMP_UNBLOCK_URL", url: urlToUnblock },
      (response) => {
        if (chrome.runtime.lastError) {
          showMessage(`Error: ${chrome.runtime.lastError.message}`, "error");
          console.error(chrome.runtime.lastError);
          return;
        }
        if (response && response.success) {
          showMessage(
            `${urlToUnblock} desbloqueada por 30 minutos.`,
            "info",
            5000
          );
          loadBlockedUrls();
        } else {
          showMessage(
            response ? response.message : "Error al pausar URL.",
            "error"
          );
        }
      }
    );
  }

  // Listen for storage changes to keep UI in sync if changed from elsewhere (unlikely for this simple ext)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (
      namespace === "sync" &&
      (changes.blockedUrls || changes.tempUnblocked)
    ) {
      loadBlockedUrls();
    }
  });

  loadBlockedUrls();
});
