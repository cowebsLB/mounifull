@echo off
echo ========================================
echo    MOUNIFULL QUICK COMMIT AND PUSH
echo ========================================
echo.

REM Check if we're in a git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Not in a git repository!
    pause
    exit /b 1
)

echo Current status:
git status --short
echo.

REM Add all files
echo Adding all files...
git add .
if %errorlevel% neq 0 (
    echo ❌ Error adding files!
    pause
    exit /b 1
)

echo ✅ Files added successfully!
echo.

REM Get commit message
echo Enter commit message (or press Enter for default):
set /p commit_msg="Commit message: "

REM Use default message if empty
if "%commit_msg%"=="" (
    set commit_msg=feat: Update website content and functionality
)

echo.
echo Committing with message: "%commit_msg%"
git commit -m "%commit_msg%"
if %errorlevel% neq 0 (
    echo ❌ Error committing!
    pause
    exit /b 1
)

echo ✅ Commit successful!
echo.

REM Push to origin main
echo Pushing to origin main...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Error pushing!
    pause
    exit /b 1
)

echo ✅ Push successful!
echo.
echo ========================================
echo    ALL DONE! 🎉
echo ========================================
echo.
pause
