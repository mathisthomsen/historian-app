#!/bin/bash

# Test ACME Challenge functionality
echo "Testing ACME Challenge setup..."

# Check if test file exists locally
if [ -f "certbot/www/testfile" ]; then
    echo "✅ Test file exists locally: certbot/www/testfile"
    echo "   Content: $(cat certbot/www/testfile)"
else
    echo "❌ Test file not found locally"
    exit 1
fi

# Test if the file is accessible via HTTP
echo ""
echo "Testing HTTP access to ACME challenge file..."
echo "Try accessing: http://staging.evidoxa.com/.well-known/acme-challenge/testfile"
echo ""

# If you have curl available, you can uncomment this:
# curl -I http://staging.evidoxa.com/.well-known/acme-challenge/testfile

echo "Instructions:"
echo "1. Deploy the updated configuration to staging"
echo "2. Restart the Nginx container"
echo "3. Test the URL above in your browser or with curl"
echo "4. If the file is accessible, proceed with SSL certificate generation"
echo ""
echo "To restart Nginx on the server:"
echo "  docker-compose -f docker-compose.staging.yml restart nginx"
echo ""
echo "To test with curl (replace with your actual domain):"
echo "  curl -I http://staging.evidoxa.com/.well-known/acme-challenge/testfile" 