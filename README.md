# Overfloow Hub

Plataforma Overfloow — Hub central integrado: Learn · Work · IAH · Biz · Connect  
Overfloow Apoio Administrativo Ltda©

---

## Pré-requisitos

- **Node.js** instalado (versão 16+)
- **npm** disponível no terminal
- PostgreSQL com banco `datafloow` (para integração futura com Prisma)

---

## Instalação

```bash
# 1. Entrar na pasta do projeto
cd C:\Devs\PlataformaOF\OverfloowHub

# 2. Instalar dependências (apenas 'express')
npm install

# 3. Iniciar o servidor
node server.js
```

## Acessar

Abrir o browser em: **http://localhost:3000**

---

## Estrutura de pastas

```
OverfloowHub\
├── server.js          ← Servidor Express (Hub + Learn + Work + outros apps)
├── package.json
└── public\
    ├── hub.html       ← Hub central (5 cards: Learn, Work, IAH, Biz, Connect)
    ├── index.html     ← App Overfloow Learn
    ├── work.html      ← App Overfloow Work
    ├── login.html     ← Login unificado da plataforma
    ├── css\
    │   ├── style.css  ← Design system Learn
    │   ├── work.css   ← Design system Work
    │   └── print.css  ← Estilos para exportação PDF
    └── js\
        ├── app.js     ← Lógica do Overfloow Learn
        └── work.js    ← Lógica do Overfloow Work
```

---

## Aulas disponíveis

O servidor lê automaticamente os arquivos `.md` de:
```
C:\Devs\PlataformaOF\Overfloow\Aulas\
```

Para adicionar novas aulas, basta colocar o arquivo `.md` nessa pasta
seguindo o padrão de nomenclatura: `XXX-P00-SP00-T00-A000.md`

---

## Exportar PDF

1. Abrir uma aula no viewer
2. Clicar em **"Exportar PDF"** na sidebar
3. Usar `Ctrl+P` ou o diálogo de impressão do browser
4. Selecionar "Salvar como PDF"

> Dica: no Chrome/Edge, selecione **"Sem margens"** para melhor resultado.

---

## Integração com Banco de Dados (Futuro)

O Gustavo (TI&C) usará **Prisma** para integrar com o banco `datafloow` (PostgreSQL).

Quando disponível:
```bash
npm install @prisma/client prisma
npx prisma generate
```

O arquivo `schema.prisma` refletirá o schema SQL definido em:
`C:\Devs\PlataformaOF\Overfloow\Database\overfloow_schema_v1.sql`

Os endpoints da API (`/api/aulas`, `/api/areas`) permanecerão os mesmos —
apenas a fonte de dados mudará de arquivos `.md` para queries Prisma.

---

## Sistema de Cores por Área

| Área | Código | Cor |
|---|---|---|
| Tesouraria | TES | Azul Safira `#1A3A6C` |
| Fiscal/Tributário | FIS | Verde Esmeralda `#0A6E5D` |
| RH Operacional | RHO | Violeta `#5A2D82` |
| Marketing | MKT | Coral `#C4380C` |
| TI&C | TIC | Azul Elétrico `#005FAD` |
| Estoque | EST | Terracota `#8B4513` |
| Compras | COM | Verde Floresta `#2D6A4F` |
| Faturamento | FAT | Âmbar `#A07000` |
| Atendimento | SAC | Rosa Escuro `#A0154A` |

---

Editora Overfloow© | Todos os direitos reservados
