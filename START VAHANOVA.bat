@echo off
title VAHANOVA app server
cd /d "C:\Users\Piyush Semalti\OneDrive\Desktop\Vehicle management"
echo.
echo   VAHANOVA is starting on http://localhost:3002
echo   Keep this window open while you use the app.
echo   Close this window (or press Ctrl+C) to stop the app.
echo.
start "" cmd /c "timeout /t 4 >nul & start http://localhost:3002/login"
npm run start
