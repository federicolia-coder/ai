#!/bin/bash
set -e

echo "=== Tarry Runtime - VPS Setup ==="

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "Docker installed. Log out and back in, then re-run this script."
    exit 0
fi

# Clone repo if not already cloned
if [ ! -d "ai" ]; then
    echo "Cloning repository..."
    git clone https://github.com/federicolia-coder/ai.git
    cd ai
else
    cd ai
    git pull
fi

# Checkout the branch
git checkout claude/kind-curie-gr779t

# Create model directory
mkdir -p runtime/model/weights

# Download Qwen2.5-1.5B-Instruct Q4_K_M
MODEL_FILE="runtime/model/weights/qwen2.5-1.5b-instruct-q4_k_m.gguf"
if [ ! -f "$MODEL_FILE" ]; then
    echo "Downloading Qwen2.5-1.5B-Instruct Q4_K_M (~1GB)..."
    wget -O "$MODEL_FILE" \
        "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf"
    echo "Model downloaded."
else
    echo "Model already present."
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    SECRET=$(openssl rand -hex 32)
    cat > .env <<EOF
RUNTIME_SECRET=$SECRET
WEB_SEARCH_API_KEY=
WEB_SEARCH_PROVIDER=brave
EOF
    echo "Created .env with generated secret: $SECRET"
    echo "Save this secret — you'll need it for Supabase TARRY_RUNTIME_SECRET"
else
    echo ".env already exists."
fi

# Build and start
echo "Building and starting runtime..."
docker compose up -d --build

echo ""
echo "=== Setup complete ==="
echo "Runtime running on http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "Test with:"
echo "  curl http://localhost:8000/health"
echo ""
echo "Next steps:"
echo "  1. Copy the RUNTIME_SECRET from .env"
echo "  2. Add to Supabase Edge Function secrets:"
echo "     TARRY_RUNTIME_URL = http://YOUR_VPS_IP:8000"
echo "     TARRY_RUNTIME_SECRET = (the secret from .env)"
