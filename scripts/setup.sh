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

# Pergunta se deseja popular com dados de exemplo
echo -n "🌱 Deseja popular o banco com dados de exemplo? (s/N): "
read -r resposta
if [ "$resposta" = "s" ] || [ "$resposta" = "S" ]; then
  echo ""
  bash scripts/seed.sh
fi

echo ""
echo "Para iniciar tudo (backend + frontend):"
echo "  npm run dev"
echo ""
echo "Para iniciar apenas o backend:"
echo "  npm run backend"
echo ""
echo "Para iniciar apenas o frontend:"
echo "  npm run frontend"
echo ""
echo "Para iniciar com Docker:"
echo "  npm run docker"
echo ""
echo "Para popular o banco com dados de exemplo (a qualquer momento):"
echo "  npm run seed"
