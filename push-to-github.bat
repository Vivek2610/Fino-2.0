@echo off
cd /d "%~dp0"
echo === FINO: push to GitHub ===
if exist "studio-fino-jewellery\.git" (
  echo Removing the studio's nested .git folder...
  rmdir /s /q "studio-fino-jewellery\.git"
)
if not exist ".git" git init
git add .
echo.
echo Checking no secret files are staged (nothing should be listed below):
git ls-files | findstr /i /c:".env.local"
echo.
git commit -m "FINO Jewellery website and Sanity studio" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01FBJmyc6VSTrcXtvH2q9cLY"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/Vivek2610/Fino-2.0.git
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push was rejected. The GitHub repo probably already has files.
  echo Merging them in and trying again...
  git pull origin main --allow-unrelated-histories --no-edit
  git push -u origin main
)
echo.
echo Done. Check https://github.com/Vivek2610/Fino-2.0
pause
