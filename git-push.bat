@echo off
echo Checking git status...
git status

echo.
echo Checking remote repositories...
git remote -v

echo.
echo Adding remote repository if not exists...
git remote add origin https://github.com/hamedsepehrnia/whatsapp-messager.git 2>nul

echo.
echo Pushing to GitHub...
git push -u origin master

echo.
echo Done!
pause
