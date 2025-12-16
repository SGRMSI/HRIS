#!/bin/bash

# HRIS MySQL Deployment Script
# This script helps automate the MySQL deployment process

set -e  # Exit on error

echo "=========================================="
echo "HRIS MySQL Deployment Script"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    exit 1
fi

print_info "Current database configuration:"
grep "DB_CONNECTION" .env
echo ""

# Confirm MySQL switch
read -p "Do you want to proceed with MySQL deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled."
    exit 0
fi

# Step 1: Check PHP MySQL extension
print_info "Checking PHP MySQL extension..."
if php -m | grep -q "pdo_mysql"; then
    print_success "PHP MySQL extension is installed"
else
    print_error "PHP MySQL extension is not installed!"
    echo "Please install php-mysql extension and try again."
    exit 1
fi

# Step 2: Test MySQL connection
print_info "Testing MySQL connection..."
DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2)
DB_PORT=$(grep "^DB_PORT=" .env | cut -d '=' -f2)
DB_USERNAME=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)
DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
DB_DATABASE=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2)

# Test connection using PHP
php -r "
try {
    \$pdo = new PDO('mysql:host=$DB_HOST;port=$DB_PORT', '$DB_USERNAME', '$DB_PASSWORD');
    echo 'MySQL connection successful\n';
    exit(0);
} catch (PDOException \$e) {
    echo 'Connection failed: ' . \$e->getMessage() . '\n';
    exit(1);
}
"

if [ $? -eq 0 ]; then
    print_success "MySQL connection successful"
else
    print_error "Failed to connect to MySQL server"
    echo "Please check your database credentials in .env file"
    exit 1
fi

# Step 3: Check if database exists
print_info "Checking if database exists..."
DB_EXISTS=$(php -r "
try {
    \$pdo = new PDO('mysql:host=$DB_HOST;port=$DB_PORT', '$DB_USERNAME', '$DB_PASSWORD');
    \$stmt = \$pdo->query(\"SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$DB_DATABASE'\");
    echo \$stmt->rowCount() > 0 ? 'yes' : 'no';
} catch (PDOException \$e) {
    echo 'error';
}
")

if [ "$DB_EXISTS" = "yes" ]; then
    print_warning "Database '$DB_DATABASE' already exists"
    read -p "Do you want to drop and recreate it? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Dropping existing database..."
        php -r "
        \$pdo = new PDO('mysql:host=$DB_HOST;port=$DB_PORT', '$DB_USERNAME', '$DB_PASSWORD');
        \$pdo->exec('DROP DATABASE IF EXISTS $DB_DATABASE');
        echo 'Database dropped\n';
        "
        RECREATE_DB=true
    else
        RECREATE_DB=false
    fi
else
    print_info "Database does not exist, will create it"
    RECREATE_DB=true
fi

# Step 4: Create database if needed
if [ "$RECREATE_DB" = true ]; then
    print_info "Creating database '$DB_DATABASE'..."
    php -r "
    \$pdo = new PDO('mysql:host=$DB_HOST;port=$DB_PORT', '$DB_USERNAME', '$DB_PASSWORD');
    \$pdo->exec('CREATE DATABASE $DB_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    echo 'Database created\n';
    "
    print_success "Database created successfully"
fi

# Step 5: Clear configuration cache
print_info "Clearing configuration cache..."
php artisan config:clear
php artisan cache:clear
print_success "Cache cleared"

# Step 6: Run migrations
print_info "Running database migrations..."
read -p "Fresh migration with seed data? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan migrate:fresh --seed
else
    php artisan migrate
fi
print_success "Migrations completed"

# Step 7: Create storage link
print_info "Creating storage link..."
php artisan storage:link
print_success "Storage link created"

# Step 8: Set permissions
print_info "Setting storage permissions..."
chmod -R 775 storage bootstrap/cache
print_success "Permissions set"

# Step 9: Test database connection from Laravel
print_info "Testing Laravel database connection..."
php artisan tinker --execute="echo 'Database: ' . DB::connection()->getDatabaseName() . PHP_EOL;"
print_success "Laravel database connection verified"

# Step 10: Display summary
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
print_success "MySQL deployment completed successfully!"
echo ""
echo "Database Configuration:"
echo "  Connection: mysql"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_DATABASE"
echo "  Username: $DB_USERNAME"
echo ""
echo "Next Steps:"
echo "1. Test the application: php artisan serve"
echo "2. Run tests: ./vendor/bin/pest"
echo "3. Review MYSQL_DEPLOYMENT_GUIDE.md for production tips"
echo ""
print_warning "For production deployment:"
echo "  - Set APP_ENV=production"
echo "  - Set APP_DEBUG=false"
echo "  - Generate new APP_KEY"
echo "  - Use strong database password"
echo "  - Configure proper backup strategy"
echo ""
echo "=========================================="
