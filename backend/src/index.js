import { buildApp } from "./app.js";
import { initDatabase } from "./common/database.js";
import { config } from "./common/config.js";

// Inicializa o banco de dados
initDatabase();

async function main() {
  const app = await buildApp();

  try {
    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    console.log(`🚀 OpenCargo API rodando em http://${config.HOST}:${config.PORT}`);
    console.log(`📖 Documentação: http://${config.HOST}:${config.PORT}/docs`);
  } catch (err) {
    console.error("Erro ao iniciar servidor:", err);
    process.exit(1);
  }
}

main();
