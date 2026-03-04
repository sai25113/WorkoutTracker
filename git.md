## Git setup and workflow (HomeGym)

### 1. Initialize the repo (first time only)

From this folder:

```powershell
cd C:\Users\sai_basuthkar\Downloads\GApp
git init
```

Optionally set name/email just for this repo:

```powershell
git config user.name "Your Name"
git config user.email "you@example.com"
```

### 2. Add / update files and commit

After making changes:

```powershell
# See what changed
git status

# Stage everything (except what .gitignore excludes)
git add .

# Commit with a message
git commit -m "Describe what you changed"
```

To see history:

```powershell
git log --oneline
```

### 3. Connect to a remote (GitHub / GitLab etc.) – one time

After creating an empty repo on the hosting service and copying its URL:

```powershell
git remote add origin https://github.com/your-username/homegym.git
git branch -M main
git push -u origin main
```

### 4. Regular workflow afterwards

1. Make code changes.
2. Run and test the app locally.
3. Commit changes:

   ```powershell
   git add .
   git commit -m "Short message for this change"
   ```

4. Push to remote:

   ```powershell
   git push
   ```