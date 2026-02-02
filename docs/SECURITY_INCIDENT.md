# Security Incident Report - 2026-02-02 (Credential Leak)

## 🚨 Incident Description
Hardcoded administrative credentials (email and password) were inadvertently committed to the source code repository in `scripts/reset-admin.ts`. This poses a security risk if the repository history is publicly accessible or shared with unauthorized parties.

## 🛠️ Remediation Steps Taken
1.  **Code Fix:** `scripts/reset-admin.ts` has been refactored to require `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. It no longer contains secrets.
2.  **Validation:** The script now checks for these variables and fails securely if safe defaults are not found.
3.  **Logs:** The script no longer prints the plain text password to the console.

## 🔄 Credential Rotation Runbook (Action Required)
Since the previous credentials were exposed in git history, they must be considered compromised.

### 1. Rotate Admin Password
Use the patched script locally to set a **NEW, STRONG** password.

**Instruction:**
```powershell
# In your local terminal (Powershell):
$env:ADMIN_EMAIL="Tom@budgalong.app"
$env:ADMIN_PASSWORD="<NEW-SECURE-PASSWORD-HERE>"
npx tsx scripts/reset-admin.ts
```

### 2. Update Environment Variables (Vercel/Supabase)
If these credentials were used in any CI/CD or production environment variables (e.g., `SEED_ADMIN_PASSWORD`), update them immediately in the Vercel Dashboard.

## 🧹 Git History Cleanup (Critical)
To verify the repository is clean, you must rewrite the git history to remove the compromised file version.

**WARNING:** This rewrites history. Verify you have a backup.

### Prerequisite
Install `git-filter-repo` (Python tool) or use BFG Repo-Cleaner.

### Cleanup Commands (PowerShell Example)

```powershell
# 1. Create a fresh clone (Safe check) or backup branch
git checkout -b backup-leak-history

# 2. Switch back to main
git checkout main

# 3. Use BFG or Filter-Repo to scrub the file content "reset-admin.ts"
# (See detailed guide below if using BFG)

# ALTERNATIVE (Simpler Manual Fix without nuking history if private repo):
# Since we just overwrote the file in the latest commit, the OLD commits still have it.
# If this is a PUBLIC repo, you MUST use BFG/Filter-Repo.
# If PRIVATE team repo, ensure all devs pull the latest and rotate creds.
```

## ✅ Post-Incident Checklist
- [x] Hardcoded secrets removed from `main` branch.
- [ ] Admin password rotated in Production (Database).
- [ ] Admin password rotated in Development (Local DB).
- [ ] If Repo is Public: History rewrite confirmed.
- [ ] All other developers notified to pull latest changes.
