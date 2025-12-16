@echo off
REM Quick MySQL Command Line Access

echo ==========================================
echo MySQL Database Quick Access
echo ==========================================
echo.
echo Connecting to MySQL as root...
echo Database: hris_db
echo.

REM Using XAMPP's mysql.exe
"C:\xampp\mysql\bin\mysql.exe" -u root hris_db

REM If that doesn't work, try this:
REM php -r "$pdo = new PDO('mysql:host=127.0.0.1;dbname=hris_db', 'root', ''); $result = $pdo->query('SHOW TABLES'); while($row = $result->fetch()) { echo $row[0] . PHP_EOL; }"
