# Windows Development & Troubleshooting

## 🪟 Common Issue: EPERM / File Locking
If you are developing on Windows, especially if your project is inside a **OneDrive** folder, you may encounter `EPERM` errors during `npm run build` or `npm run dev`.

```
Error: EPERM: operation not permitted, unlink ...\.next\static\...
```

This happens because:
1. **OneDrive** tries to sync files while Next.js is trying to delete/rename them.
2. **VS Code** extensions or the editor itself might hold a lock on files in `.next`.
3. **Antivirus** software might be scanning generated files.

## ✅ Solution 1: Use Clean Build (Recommended)
We have added specific scripts to handle cleanup safely on Windows.

### 🧹 Clean Cache
To manually remove temporary build artifacts (`.next`, `.turbo`, `out`):
```bash
npm run clean
```

### 🔨 Clean Build (Use this if `npm run build` fails)
This command force-cleans the directory before building, reducing the chance of lock conflicts:
```bash
npm run build:clean
```

### 🏃 Clean Dev Server
If the dev server acts up or caches invalid states:
```bash
npm run dev:clean
```

---

## ⚠️ Solution 2: Move Project Outside OneDrive (The "Nuclear" Option)
If you continue to face persistent `EPERM` or file locking issues despite using the clean scripts, the conflict with OneDrive syncing is likely too aggressive.

**Recommendation:** Move your project folder **outside** of OneDrive.

**Steps:**
1. Copy your project folder (e.g., `rosi`).
2. Paste it into a neutral location like `C:\dev\rosi`.
3. Open `C:\dev\rosi` in VS Code.
4. Run `npm install` again to ensure dependencies are linked correctly.
5. Development should be much faster and stable.

---

## 🛠️ General Troubleshooting
- **Close conflicting processes:** Ensure no other terminals or node processes are running the app.
- **Restart VS Code:** Sometimes the editor holds locks on the `.next` folder.
- **Exclusions:** Add the `.next` folder to your Antivirus exclusion list if possible.
