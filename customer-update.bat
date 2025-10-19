@echo off
echo ========================================
echo    MOUNIFULL CUSTOMER UPDATE
echo ========================================
echo.

REM Check if we're in a git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Not in a git repository!
    pause
    exit /b 1
)

echo Choose update type:
echo.
echo 1. Homepage updates (text, logo, featured products)
echo 2. Product updates (categories, bundles, new products)
echo 3. Content updates (terms, translations, pages)
echo 4. Bug fixes and improvements
echo 5. Custom message
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" set commit_msg=feat: Update homepage content and featured products
if "%choice%"=="2" set commit_msg=feat: Update product categories and bundle offerings
if "%choice%"=="3" set commit_msg=feat: Update website content and translations
if "%choice%"=="4" set commit_msg=fix: Bug fixes and improvements
if "%choice%"=="5" (
    echo Enter custom commit message:
    set /p commit_msg="Commit message: "
)

if "%commit_msg%"=="" (
    echo ❌ Invalid choice!
    pause
    exit /b 1
)

echo.
echo Current status:
git status --short
echo.

echo Adding all files...
git add .
if %errorlevel% neq 0 (
    echo ❌ Error adding files!
    pause
    exit /b 1
)

echo ✅ Files added successfully!
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
echo    CUSTOMER UPDATE COMPLETE! 🎉
echo ========================================
echo.
echo Repository: https://github.com/cowebsLB/mounifull.git
echo.
pause
