@echo off
rem Started by Windows Task Scheduler every 10 minutes: publishes due Instagram posts and first comments.
cd /d "%~dp0..\.."
if not exist out mkdir out
call npm run -s publish:due >> out\publish-due.log 2>&1
