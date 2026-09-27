const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("PostgreSQL conectado com sucesso");
});

pool.on("error", (err) => {
  console.error("Erro PostgreSQL:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
