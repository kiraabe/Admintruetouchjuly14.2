import { Pool } from 'pg';
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'configured' : 'not set');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/ecme',
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});
export default pool;
//# sourceMappingURL=connection.js.map