# Git Workflow Batch Files for Mounifull

This directory contains helpful batch files to streamline the git workflow for the Mounifull project.

## Available Batch Files

### 1. `quick-commit.bat` ⚡
**Most commonly used** - Quick add, commit, and push workflow.

**Usage:**
```cmd
.\quick-commit.bat
```

**What it does:**
- Adds all files to staging
- Prompts for commit message (or uses default)
- Commits changes
- Pushes to origin main
- Shows success/error messages

### 2. `customer-update.bat` 🛍️
**For customer updates** - Pre-defined commit messages for common update types.

**Usage:**
```cmd
.\customer-update.bat
```

**Options:**
1. Homepage updates (text, logo, featured products)
2. Product updates (categories, bundles, new products)
3. Content updates (terms, translations, pages)
4. Bug fixes and improvements
5. Custom message

### 3. `git-workflow.bat` 🔧
**Full-featured menu** - Complete git workflow with all options.

**Usage:**
```cmd
.\git-workflow.bat
```

**Features:**
- Quick Commit & Push
- Add all files
- Custom commit
- Push to origin main
- Check status
- View recent commits
- Pull latest changes
- Reset last commit (soft)
- View diff

## Quick Start Guide

### For Regular Updates:
1. Make your changes to files
2. Run `.\quick-commit.bat`
3. Enter a commit message or press Enter for default
4. Done! 🎉

### For Customer Updates:
1. Make your changes to files
2. Run `.\customer-update.bat`
3. Choose the type of update (1-5)
4. Done! 🎉

## Examples

### Quick Commit Example:
```cmd
C:\Users\COWebs.lb\Desktop\mounifull\mounifull> .\quick-commit.bat
========================================
   MOUNIFULL QUICK COMMIT AND PUSH
========================================

Current status:
M  index.html
M  js/translations/en.json
?? new-file.js

✅ Files added successfully!

Enter commit message (or press Enter for default):
Commit message: Update homepage and translations

✅ Commit successful!
✅ Push successful!
```

### Customer Update Example:
```cmd
C:\Users\COWebs.lb\Desktop\mounifull\mounifull> .\customer-update.bat
========================================
   MOUNIFULL CUSTOMER UPDATE
========================================

Choose update type:
1. Homepage updates (text, logo, featured products)
2. Product updates (categories, bundles, new products)
3. Content updates (terms, translations, pages)
4. Bug fixes and improvements
5. Custom message

Enter your choice (1-5): 2
```

## Repository Information

- **Repository:** https://github.com/cowebsLB/mounifull.git
- **Main Branch:** main
- **Default Remote:** origin

## Troubleshooting

### If batch file doesn't run:
- Make sure you're in the correct directory
- Use `.\filename.bat` instead of just `filename.bat`
- Check that git is installed and accessible

### If push fails:
- Check your internet connection
- Verify you have push permissions to the repository
- Try pulling first: `git pull origin main`

### If commit fails:
- Check that you have changes to commit
- Verify git is properly configured with your name and email

## Tips

1. **Always check status first** - Run `git status` to see what files have changed
2. **Use descriptive commit messages** - They help track changes over time
3. **Test before committing** - Make sure your changes work as expected
4. **Use customer-update.bat** for client work - It has pre-defined messages
5. **Use quick-commit.bat** for quick fixes and personal updates

## File Structure

```
mounifull/
├── git-workflow.bat          # Full-featured git menu
├── quick-commit.bat          # Quick add, commit, push
├── customer-update.bat       # Customer update workflow
├── GIT-WORKFLOW-README.md    # This file
└── ... (other project files)
```

---

**Happy coding! 🚀**
