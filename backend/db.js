import pg from "pg";
const { Pool } = pg;

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // 10 secondss
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});

export default pool;
