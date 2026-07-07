#!/bin/bash
# ── OpenCargo — Seed Data ─────────────────────────────
# Uso: ./scripts/seed.sh [--reset]
#
# Opções:
#   --reset    Remove dados existentes antes de inserir

set -e

echo "🌱 OpenCargo - Inserindo dados de exemplo..."

# Verifica se está na raiz do projeto
if [ ! -d "backend" ]; then
  echo "❌ Execute este script da raiz do projeto OpenCargo."
  exit 1
fi

# Verifica Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado."
  exit 1
fi

# Verifica se o .env existe, se não, copia do .env.example
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "📄 Arquivo .env criado a partir de .env.example"
fi

# Executa o seed script do backend
cd backend
node scripts/seed.js "$@"
cd ..

echo ""
echo "💡 Para explorar o sistema, faça login com:"
echo "   admin@opencargo.com / 123456"
