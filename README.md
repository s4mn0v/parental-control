**Simple Parental Control**.
Lightweight Chrome extension that blocks URLs, requires password to remove sites, and allows 30-minute blocking pauses.

---

## 📄 Description.

Parental Control Simple is a Google Chrome extension designed for you to manage and restrict access to unwanted websites. With this tool you will be able to:

* **Block URLs**: Add specific domains or URLs to your blacklist.
* **Delete with password**: For added security, you will need to enter a password before deleting a blocked URL.
* **Temporary pause**: Temporarily unblock a site for 30 minutes by entering the password.

The configuration interface is simple and intuitive, ideal for parents, educators or anyone who needs extra control over browsing.

---

## ⚙️ Features

1. **Dynamic blocking**.
   Uses the Declarative Net Request API to automatically redirect blocked URL requests to a warning page (`blocked.html`).

2. **Secure management**

   * Delete URLs requires validating a password.
   * Pause blocking for 30 minutes is also password protected.

3. **Synergic storage**
   Locked URLs and temporary unlocks data are stored in `chrome.storage.sync`, keeping settings synchronized between devices.

4. **Integrated alarms**
   Creates internal alarms to automatically expire blocking pauses after 30 minutes.

---

## 🚀 Installation

1. Clone this repository:

   ````bash
   git clone https://github.com/tu-usuario/control-parental-simple.git
   ```
2. Open Chrome and navigate to ``chrome://extensions``.
3. Enable `Developer Mode`.
4. Click `Load unzipped extension` and select the project folder.

---

## 🛠️ Usage

1. Click on the extension icon in the toolbar.
2. Go to the **Settings** tab to:

   * Add new URLs.
   * View the list of blocked URLs.
   * Delete or pause a URL (password will be requested).
3. When you try to access a blocked URL, you will be redirected to `blocked.html` with an “Access Denied” message.

---

## 📁 File structure.

- **background.js**: Main blocking logic, rule management and alarms.
-  **blocked.html**: Static page displaying the blocking message.
- **blocked.js**: Controls the redirection and behavior of the blocking page.
- **options.html**: User interface to configure URLs and passwords.
- **options.js**: Logic of the configuration page: manage lists, password prompts and messages.
- **rules.json**: Empty initial rules file for Declarative Net Request.

---

## 🤝 Contributions

Contributions are welcome! If you want to improve the extension, please:

1. make a “fork” of the project.
2. Create a branch with your enhancement: `git checkout -b feature/enhancement-name`.
3. Make your changes and commit.
4. Send a Pull Request describing your modifications.

---

## 📝 License

NO LINCENSE USE IT 4 FUN

<pre>
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣀⣠⣤⣶⣞⡛⠿⠭⣷⡦⢬⣟⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢠⡾⣯⡙⠳⣍⠳⢍⡙⠲⠤⣍⠓⠦⣝⣮⣉⠻⣿⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⡿⢿⣷⣯⣷⣮⣿⣶⣽⠷⠶⠬⠿⠷⠟⠻⠟⠳⠿⢷⡀⠀⠀⠀⠀⠀⠀
⠀⠀⣸⣁⣀⣈⣛⣷⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢧⠀⠀⠀⠀⠀⠀
⠀⣸⣯⣁⣤⣤⣀⠈⢧⠘⣆⢀⣠⠤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠘⡇⠀⠀⠀⠀⠀
⠀⢙⡟⡛⣿⣿⣿⢷⡾⠀⢿⣿⣏⣳⣾⡆⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀
⢀⡞⠸⠀⠉⠉⠁⠀⠀⣠⣼⣿⣿⠀⣽⡇⠀⠀⠀⠀⠀⠀⠀⡼⠁⠀⠀⠀⠀⠀
⣼⡀⣀⡐⢦⢀⣀⠀⣴⣿⣿⡏⢿⣶⣟⣀⣀⣀⣀⣀⣤⣤⠞⠁⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣿⣿⣾⣿⣿⣿⣾⡻⠷⣝⣿⡌⠉⠉⠁⠀⠀⣸⠁⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠈⢻⣿⣿⣿⣿⡟⣿⣟⠻⣿⡿⢿⡇⠀⠀⠀⠀⠀⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⢠⣿⢿⣼⣿⣿⠿⣏⣹⡃⢹⣯⡿⠀⠀⠀⠀⠀⠀⠈⢧⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣽⣿⣿⢿⠹⣿⣇⠿⣾⣷⣼⠟⠁⠀⠀⠀⢀⣠⣴⣶⣾⣷⣶⣄⡀⠀⠀⠀⠀
⠀⢿⣾⡟⢺⣧⣏⣿⡷⢻⠅⠀⠀⠀⢀⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⡀⠀
⠀⠀⠙⠛⠓⠛⠋⣡⣿⣬⣤⣤⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠛⠛
⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠟⠋⠉⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠸⡿⠿⠿⠿⠿⠿⠿⠟⠛⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
</pre>