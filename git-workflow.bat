@echo off
echo ========================================
echo    MOUNIFULL GIT WORKFLOW HELPER
echo ========================================
echo.

:menu
echo Choose an option:
echo.
echo 1. Quick Commit & Push (add all, commit, push)
echo 2. Add all files
echo 3. Commit with custom message
echo 4. Push to origin main
echo 5. Check status
echo 6. View recent commits
echo 7. Pull latest changes
echo 8. Reset last commit (soft)
echo 9. View diff
echo 0. Exit
echo.
set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto quick_commit_push
if "%choice%"=="2" goto add_all
if "%choice%"=="3" goto custom_commit
if "%choice%"=="4" goto push
if "%choice%"=="5" goto status
if "%choice%"=="6" goto log
if "%choice%"=="7" goto pull
if "%choice%"=="8" goto reset
if "%choice%"=="9" goto diff
if "%choice%"=="0" goto exit
goto menu

:quick_commit_push
echo.
echo ========================================
echo    QUICK COMMIT & PUSH
echo ========================================
echo.
echo Adding all files...
git add .
echo.
echo Files staged. Enter commit message:
set /p commit_msg="Commit message: "
echo.
echo Committing with message: "%commit_msg%"
git commit -m "%commit_msg%"
echo.
echo Pushing to origin main...
git push origin main
echo.
echo ✅ Quick commit & push completed!
echo.
pause
goto menu

:add_all
echo.
echo ========================================
echo    ADDING ALL FILES
echo ========================================
echo.
git add .
echo.
echo ✅ All files added to staging area!
echo.
pause
goto menu

:custom_commit
echo.
echo ========================================
echo    CUSTOM COMMIT
echo ========================================
echo.
echo Enter commit message:
set /p commit_msg="Commit message: "
echo.
echo Committing with message: "%commit_msg%"
git commit -m "%commit_msg%"
echo.
echo ✅ Commit completed!
echo.
pause
goto menu

:push
echo.
echo ========================================
echo    PUSHING TO ORIGIN MAIN
echo ========================================
echo.
git push origin main
echo.
echo ✅ Push completed!
echo.
pause
goto menu

:status
echo.
echo ========================================
echo    GIT STATUS
echo ========================================
echo.
git status
echo.
pause
goto menu

:log
echo.
echo ========================================
echo    RECENT COMMITS
echo ========================================
echo.
git log --oneline -10
echo.
pause
goto menu

:pull
echo.
echo ========================================
echo    PULLING LATEST CHANGES
echo ========================================
echo.
git pull origin main
echo.
echo ✅ Pull completed!
echo.
pause
goto menu

:reset
echo.
echo ========================================
echo    RESET LAST COMMIT (SOFT)
echo ========================================
echo.
echo WARNING: This will undo the last commit but keep changes staged.
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    git reset --soft HEAD~1
    echo ✅ Last commit reset (soft)!
) else (
    echo ❌ Reset cancelled.
)
echo.
pause
goto menu

:diff
echo.
echo ========================================
echo    VIEWING DIFF
echo ========================================
echo.
git diff --cached
echo.
pause
goto menu

:exit
echo.
echo ========================================
echo    GOODBYE!
echo ========================================
echo.
exit /b 0
