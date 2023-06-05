#!/bin/bash
# Check if mkcert is installed
if ! command -v mkcert &> /dev/null
then
    echo "mkcert could not be found, installing it now"
    # Download mkcert
    wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.3/mkcert-v1.4.3-linux-amd64
    # Make it executable
    chmod +x mkcert-v1.4.3-linux-amd64
    # Rename it to mkcert
    mv mkcert-v1.4.3-linux-amd64 mkcert
    # Move it to /usr/local/bin to make it available systemwide
    sudo mv mkcert /usr/local/bin/
    echo "mkcert installed, moving ahead to install local CA"
    mkcert -install
fi
# Create a local CA
mkcert localhost
