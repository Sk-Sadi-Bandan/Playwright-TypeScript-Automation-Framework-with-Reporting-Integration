# Contributing / Git Workflow

Follow this workflow to keep branches in sync and avoid unnecessary merge conflicts.

## 1. Clone the repo (first time only)
```
git clone <repo-url>
```

## 2. Sync with main before starting new work
```
git checkout main
git pull origin main
```

## 3. Create your working branch from main
```
git checkout -b feature/<short-description>
```
(or `fix/`, `chore/` — use whichever prefix matches the type of work)

## 4. Install dependencies with `npm ci`, not `npm install`
```
npm ci
```
This installs the exact versions locked in `package-lock.json` instead of re-resolving them — keeps everyone's `node_modules` identical and avoids lockfile drift/conflicts.

## 5. Write your automation code, then commit with a meaningful message
```
git add <files>
git commit -m "test: add login flow regression suite"
```
Avoid `git add .` blindly — review what you're staging first.

## 6. Before pushing, sync with main again
```
git fetch origin
git pull origin main
```
(or `git rebase origin/main` if the team prefers a linear history)

Resolve any conflicts locally — don't push conflicts for someone else to untangle.

## 7. Push your branch
```
git push origin feature/<short-description>
```

## 8. Open a PR
- Clear description: what changed and why
- Link the ticket/task if applicable
- Assign a reviewer + yourself as assignee
- Add relevant labels (e.g. `automation`, `bug`, `needs-review`)
- Double-check the **Files Changed** tab before requesting review — make sure only intended files are included (no stray `node_modules`, `.env`, test-results, etc.)
