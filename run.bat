@echo off
title CricPredic - Cricket Prediction System
echo.
echo   Starting CricPredic System...
echo   ─────────────────────────────────
echo.
node "%~dp0run.js"
if errorlevel 1 (
    echo.
    echo   [ERROR] Failed to start the system.
    echo   Make sure Node.js and Python are installed.
    echo.
    pause
)
