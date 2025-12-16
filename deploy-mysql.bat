@echo off
REM HRIS MySQL Deployment Script for Windows
REM This script helps automate the MySQL deployment process

setlocal enabledelayedexpansion

echo ==========================================
echo HRIS MySQL Deployment Script
echo ==========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    exit /b 1
)

echo Current database configuration:
findstr /C:"DB_CONNECTION" .env
echo.

REM Confirm MySQL switch
set /p CONFIRM="Do you want to proceed with MySQL deployment? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo [WARNING] Deployment cancelled.
    exit /b 0
)

REM Step 1: Check PHP MySQL extension
echo.
echo [INFO] Checking PHP MySQL extension...
php -m | findstr /C:"pdo_mysql" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] PHP MySQL extension is installed
) else (
    echo [ERROR] PHP MySQL extension is not installed!
    echo Please install php-mysql extension and try again.
    exit /b 1
)

REM Step 2: Parse database credentials
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_HOST=" .env') do set DB_HOST=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PORT=" .env') do set DB_PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_USERNAME=" .env') do set DB_USERNAME=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_PASSWORD=" .env') do set DB_PASSWORD=%%a
for /f "tokens=2 delims==" %%a in ('findstr /C:"DB_DATABASE=" .env') do set DB_DATABASE=%%a

REM Step 3: Test MySQL connection
echo.
echo [INFO] Testing MySQL connection...
php -r "try { $pdo = new PDO('mysql:host=%DB_HOST%;port=%DB_PORT%', '%DB_USERNAME%', '%DB_PASSWORD%'); echo 'success'; } catch (PDOException $e) { echo 'failed'; exit(1); }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MySQL connection successful
) else (
    echo [ERROR] Failed to connect to MySQL server
    echo Please check your database credentials in .env file
    echo.
    echo Credentials being used:
    echo   Host: %DB_HOST%:%DB_PORT%
    echo   Username: %DB_USERNAME%
    echo   Password: [%DB_PASSWORD%]
    echo.
    pause
    exit /b 1
)

REM Step 4: Check if database exists
echo.
echo [INFO] Checking if database exists...
for /f %%a in ('php -r "try { $pdo = new PDO('mysql:host=%DB_HOST%;port=%DB_PORT%', '%DB_USERNAME%', '%DB_PASSWORD%'); $stmt = $pdo->query(\"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '%DB_DATABASE%'\"); echo $stmt->rowCount() > 0 ? 'yes' : 'no'; } catch (PDOException $e) { echo 'error'; }"') do set DB_EXISTS=%%a

if "%DB_EXISTS%"=="yes" (
    echo [WARNING] Database '%DB_DATABASE%' already exists
    set /p RECREATE="Do you want to drop and recreate it? (y/n): "
    if /i "!RECREATE!"=="y" (
        echo [INFO] Dropping existing database...
        php -r "$pdo = new PDO('mysql:host=%DB_HOST%;port=%DB_PORT%', '%DB_USERNAME%', '%DB_PASSWORD%'); $pdo->exec('DROP DATABASE IF EXISTS %DB_DATABASE%');"
        set RECREATE_DB=true
    ) else (
        set RECREATE_DB=false
    )
) else (
    echo [INFO] Database does not exist, will create it
    set RECREATE_DB=true
)

REM Step 5: Create database if needed
if "%RECREATE_DB%"=="true" (
    echo.
    echo [INFO] Creating database '%DB_DATABASE%'...
    php -r "$pdo = new PDO('mysql:host=%DB_HOST%;port=%DB_PORT%', '%DB_USERNAME%', '%DB_PASSWORD%'); $pdo->exec('CREATE DATABASE %DB_DATABASE% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');"
    if %errorlevel% equ 0 (
        echo [SUCCESS] Database created successfully
    ) else (
        echo [ERROR] Failed to create database
        pause
        exit /b 1
    )
)

REM Step 6: Clear configuration cache
echo.
echo [INFO] Clearing configuration cache...
php artisan config:clear
php artisan cache:clear
echo [SUCCESS] Cache cleared

REM Step 7: Run migrations
echo.
echo [INFO] Running database migrations...
set /p FRESH="Fresh migration with seed data? (y/n): "
if /i "%FRESH%"=="y" (
    php artisan migrate:fresh --seed
) else (
    php artisan migrate
)
if %errorlevel% equ 0 (
    echo [SUCCESS] Migrations completed
) else (
    echo [ERROR] Migration failed
    pause
    exit /b 1
)

REM Step 8: Create storage link
echo.
echo [INFO] Creating storage link...
php artisan storage:link
echo [SUCCESS] Storage link created

REM Step 9: Test database connection from Laravel
echo.
echo [INFO] Testing Laravel database connection...
php artisan tinker --execute="echo 'Database: ' . DB::connection()->getDatabaseName() . PHP_EOL;"
echo [SUCCESS] Laravel database connection verified

REM Step 10: Display summary
echo.
echo ==========================================
echo Deployment Summary
echo ==========================================
echo [SUCCESS] MySQL deployment completed successfully!
echo.
echo Database Configuration:
echo   Connection: mysql
echo   Host: %DB_HOST%:%DB_PORT%
echo   Database: %DB_DATABASE%
echo   Username: %DB_USERNAME%
echo.
echo Next Steps:
echo 1. Test the application: php artisan serve
echo 2. Run tests: vendor\bin\pest
echo 3. Review MYSQL_DEPLOYMENT_GUIDE.md for production tips
echo.
echo [WARNING] For production deployment:
echo   - Set APP_ENV=production
echo   - Set APP_DEBUG=false
echo   - Generate new APP_KEY
echo   - Use strong database password
echo   - Configure proper backup strategy
echo.
echo ==========================================
echo.
pause
