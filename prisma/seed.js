/**
 * Seed inicial — Overfloow Hub
 * Cria usuário admin e clientes demo no banco de produção
 *
 * Executar: node prisma/seed.js
 */

'use strict';

require('dotenv').config({ path: '.env' });

const bcrypt = require('bcryptjs');
const prisma = require('./client');

async function main() {
    console.log('\n🌱 Iniciando seed do banco Overfloow...\n');

    // ── Criar perfil admin se não existir ──────────────────────
    const perfilAdmin = await prisma.perfil.upsert({
        where: { nome: 'admin_plataforma' },
        update: {},
        create: {
            nome: 'admin_plataforma',
            descricao: 'Acesso total à plataforma',
            ativo: true,
        },
    });
    console.log(`✅ Perfil: ${perfilAdmin.nome} (id: ${perfilAdmin.id_perfil})`);

    // ── Criar usuário admin ────────────────────────────────────
    const senhaHash = await bcrypt.hash('Admin@2026', 12);

    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@overfloow.com' },
        update: {},
        create: {
            nome: 'Administrador',
            email: 'admin@overfloow.com',
            senha_hash: senhaHash,
            ativo: true,
        },
    });
    console.log(`✅ Usuário: ${admin.nome} <${admin.email}> (id: ${admin.id_usuario})`);

    // ── Vincular perfil admin ao usuário ───────────────────────
    await prisma.usuarioPerfil.upsert({
        where: {
            id_usuario_id_perfil: {
                id_usuario: admin.id_usuario,
                id_perfil: perfilAdmin.id_perfil,
            },
        },
        update: {},
        create: {
            id_usuario: admin.id_usuario,
            id_perfil: perfilAdmin.id_perfil,
        },
    });
    console.log(`✅ Perfil 'admin_plataforma' vinculado ao usuário admin`);

    // ── Criar clientes demo ────────────────────────────────────
    const clientes = [
        { nome: 'KIFF FOODS S/A', razao_social: 'KIFF FOODS S/A', segmento: 'Alimentação', porte: 'PME', id_schema: 'cliente_kiff' },
        { nome: 'PJ Contabilidade Digital', razao_social: 'PJ CONTABILIDADE DIGITAL LTDA', segmento: 'Contabilidade', porte: 'ME', id_schema: 'cliente_pj' },
        { nome: 'Overfloow (Interno)', razao_social: 'OVERFLOOW APOIO ADMINISTRATIVO LTDA', segmento: 'Tecnologia', porte: 'ME', id_schema: 'cliente_1' },
    ];

    for (const cli of clientes) {
        try {
            // Verificar se já existe pelo id_schema (campo unique)
            const existing = await prisma.cliente.findUnique({ where: { id_schema: cli.id_schema } });
            if (!existing) {
                await prisma.cliente.create({ data: { ...cli, ativo: true } });
                console.log(`✅ Cliente: ${cli.nome}`);
            } else {
                console.log(`⏭️  Cliente já existe: ${cli.nome}`);
            }
        } catch (e) {
            console.warn(`⚠️  Cliente ${cli.nome}: ${e.message}`);
        }
    }

    console.log('\n🎉 Seed concluído! Login disponível:');
    console.log('   📧 admin@overfloow.com');
    console.log('   🔑 Admin@2026\n');
}

main()
    .catch(e => {
        console.error('❌ Erro no seed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
