#!/bin/bash
# ── OpenCargo — Script de Setup ───────────────────────
# Uso: ./scripts/setup.sh

set -e

echo "🚀 OpenCargo - Setup"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js >= 22."
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Instalar dependências do backend
echo ""
echo "📦 Instalando dependências do backend..."
cd backend
npm install
cd ..

# Criar diretório de dados
mkdir -p backend/data

echo ""
echo "✅ Setup concluído!"
echo ""
echo "Para iniciar o backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Para iniciar com Docker:"
echo "  docker compose up --build"
