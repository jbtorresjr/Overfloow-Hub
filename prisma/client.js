/**
 * Prisma Client — Singleton
 * Overfloow Hub | Prisma v5 + adapter-pg
 *
 * v5 usa Pool do pg, diferente do v7 que usa connectionString direto
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let prisma;

function getPrisma() {
    if (!prisma) {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({
            adapter,
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
        });
    }
    return prisma;
}

module.exports = getPrisma();
