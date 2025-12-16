@echo off
REM Quick Database Reset Script

echo Dropping and recreating hris_db database...
php -r "$pdo = new PDO('mysql:host=127.0.0.1', 'root', ''); $pdo->exec('DROP DATABASE IF EXISTS hris_db'); $pdo->exec('CREATE DATABASE hris_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); echo 'Database reset complete';"

echo.
echo Clearing Laravel caches...
php artisan config:clear
php artisan cache:clear

echo.
echo Running migrations without problematic ones...
php artisan migrate --force

echo.
echo Done! Check for errors above.
pause
