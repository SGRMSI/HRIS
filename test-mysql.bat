@echo off
REM Quick Test Script for MySQL Migration
REM This script runs basic tests to verify MySQL is working

echo ==========================================
echo HRIS MySQL Quick Test
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist artisan (
    echo [ERROR] artisan file not found. Are you in the HRIS directory?
    pause
    exit /b 1
)

echo [1/7] Testing PHP MySQL Extension...
php -r "echo extension_loaded('pdo_mysql') ? '[OK] MySQL extension loaded' : '[ERROR] MySQL extension not found'; echo PHP_EOL;"
echo.

echo [2/7] Checking .env configuration...
findstr /C:"DB_CONNECTION=mysql" .env >nul
if %errorlevel% equ 0 (
    echo [OK] Database set to MySQL
) else (
    echo [ERROR] Database not set to MySQL
    echo Please check your .env file
    pause
    exit /b 1
)
echo.

echo [3/7] Testing MySQL connection...
php -r "try { new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''); echo '[OK] MySQL server is reachable'; } catch (Exception $e) { echo '[ERROR] Cannot connect to MySQL: ' . $e->getMessage(); exit(1); }" 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] MySQL connection failed
    echo Make sure MySQL is running in XAMPP Control Panel
    pause
    exit /b 1
)
echo.

echo [4/7] Checking if database exists...
for /f %%a in ('php -r "try { $pdo = new PDO('mysql:host=127.0.0.1;port=3306', 'root', ''); $stmt = $pdo->query(\"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'hris_db'\"); echo $stmt->rowCount() > 0 ? 'yes' : 'no'; } catch (Exception $e) { echo 'error'; }"') do set DB_EXISTS=%%a

if "%DB_EXISTS%"=="yes" (
    echo [OK] Database 'hris_db' exists
) else (
    echo [WARNING] Database 'hris_db' does not exist
    echo You need to create it or run deploy-mysql.bat
)
echo.

echo [5/7] Testing Laravel database connection...
php artisan tinker --execute="try { DB::connection()->getPdo(); echo '[OK] Laravel connected to: ' . DB::connection()->getDatabaseName(); } catch (Exception \$e) { echo '[ERROR] Laravel connection failed: ' . \$e->getMessage(); }" 2>nul
echo.

echo [6/7] Checking for migrations...
if "%DB_EXISTS%"=="yes" (
    for /f %%a in ('php -r "try { $pdo = new PDO('mysql:host=127.0.0.1;dbname=hris_db', 'root', ''); $stmt = $pdo->query(\"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'hris_db'\"); echo $stmt->fetchColumn(); } catch (Exception $e) { echo '0'; }"') do set TABLE_COUNT=%%a
    
    if !TABLE_COUNT! gtr 0 (
        echo [OK] Database has !TABLE_COUNT! tables
    ) else (
        echo [WARNING] Database is empty - need to run migrations
    )
) else (
    echo [SKIPPED] Database doesn't exist yet
)
echo.

echo [7/7] Checking storage link...
if exist "public\storage" (
    echo [OK] Storage link exists
) else (
    echo [WARNING] Storage link missing - run: php artisan storage:link
)
echo.

echo ==========================================
echo Test Summary
echo ==========================================
echo.

if "%DB_EXISTS%"=="yes" (
    echo Status: Ready to test application
    echo.
    echo Next Steps:
    echo 1. Start server: php artisan serve
    echo 2. Open browser: http://127.0.0.1:8000
    echo 3. Login with: admin@hris.local / password123
) else (
    echo Status: Setup required
    echo.
    echo Next Steps:
    echo 1. Run: deploy-mysql.bat
    echo 2. Follow the prompts
    echo 3. Then test application
)
echo.
echo ==========================================
pause
