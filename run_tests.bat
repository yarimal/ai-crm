@echo off
echo ========================================
echo Running All Tests
echo ========================================

echo.
echo [1/2] Backend Tests (pytest)
echo ----------------------------------------
cd backend
call pytest -v
if %ERRORLEVEL% NEQ 0 (
    echo Backend tests FAILED!
    exit /b 1
)

echo.
echo [2/2] Frontend Tests (Vitest)
echo ----------------------------------------
cd ..\frontend
call npm test
if %ERRORLEVEL% NEQ 0 (
    echo Frontend tests FAILED!
    exit /b 1
)

echo.
echo ========================================
echo All Tests PASSED!
echo ========================================
