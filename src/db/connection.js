"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'not set');
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/ecme',
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
exports.default = pool;
//# sourceMappingURL=connection.js.map