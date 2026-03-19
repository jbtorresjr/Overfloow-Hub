const fs = require('fs');
let code = fs.readFileSync('C:/Devs/PlataformaOF/OverfloowHub/public/js/work.js', 'utf8');

const targetStr = `// ─── Auth Guard ────────────────────────────────────────
const _raw = sessionStorage.getItem('of_user');
const WUSER = _raw ? JSON.parse(_raw) : null;
if (!WUSER) window.location.href = '/login';

// ─── Demo Data ─────────────────────────────────────────
const CLIENTES = [
    { id: 1, nome: 'KIFF FOODS S/A', cor: '#C4380C' },
    { id: 2, nome: 'PJ CONTABILIDADE DIGITAL LTDA', cor: '#0A6E5D' },
    { id: 3, nome: 'Overfloow (Interno)', cor: '#3A7BD5' },
];

const PROJETOS = [
    { id: 1, clienteId: 1, nome: 'BPO-Tesouraria-01', status: 'ATIVO', permiteHE: true, permiteBH: false, cor: '#C4380C' },
    { id: 2, clienteId: 1, nome: 'BPO-Fiscal-01', status: 'ATIVO', permiteHE: false, permiteBH: true, cor: '#C4380C' },
    { id: 3, clienteId: 2, nome: 'CONT-Fiscal-2026', status: 'ATIVO', permiteHE: false, permiteBH: true, cor: '#0A6E5D' },
    { id: 4, clienteId: 2, nome: 'CONT-Obrigações-2026', status: 'PAUSADO', permiteHE: false, permiteBH: false, cor: '#0A6E5D' },
    { id: 5, clienteId: 3, nome: 'DEV-Platform-01', status: 'ATIVO', permiteHE: true, permiteBH: true, cor: '#3A7BD5' },
    { id: 6, clienteId: 3, nome: 'MKT-Connect-01', status: 'ATIVO', permiteHE: false, permiteBH: false, cor: '#3A7BD5' },
];

const EQUIPE = [
    // Sócios
    { nome: 'Jaime', cargo: 'CEO', tipo: 'SOCIO', cor: '#1A3A6C', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 176, bhSaldo: 0 },
    { nome: 'Gustavo', cargo: 'Gerente TIC', tipo: 'SOCIO', cor: '#2658A8', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 160, bhSaldo: 0 },
    { nome: 'Nadir', cargo: 'Sócia', tipo: 'SOCIO', cor: '#5A2D82', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 120, bhSaldo: 0 },
    { nome: 'Érica', cargo: 'Gerente DEV', tipo: 'SOCIO', cor: '#0A6E5D', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 144, bhSaldo: 0 },
    { nome: 'Duda', cargo: 'Gerente BPO', tipo: 'SOCIO', cor: '#C4380C', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 168, bhSaldo: 0 },
    // CLT
    { nome: 'Colaborador 1', cargo: 'Analista BPO', tipo: 'CLT', cor: '#4B5563', jornada: 'CLT_40', he: true, bh: false, horasMes: 192, bhSaldo: 4 },
    { nome: 'Colaborador 2', cargo: 'Assistente DEV', tipo: 'CLT', cor: '#6B7280', jornada: 'CLT_40', he: false, bh: true, horasMes: 176, bhSaldo: -2 },
    { nome: 'Colaborador 3', cargo: 'Assistente BPO', tipo: 'CLT', cor: '#374151', jornada: 'CLT_40', he: true, bh: true, horasMes: 184, bhSaldo: 8 },
];

const JORNADAS = {
    CLT_40: { label: 'CLT 40h/semana', icone: '📄', detalhe: '08h00 – 12h00 / 13h00 – 17h00, seg – sex · 1h almoço · 40h semanais' },
    SOCIO_FLEX: { label: 'Sócio — Flex', icone: '⭐', detalhe: 'Horário flexível · Distribuição de lucros proporcional às horas trabalhadas' },
};

// ─── Módulos disponíveis ───────────────────────────────
const MODULOS_WORK = [
    { id: 'ponto', label: 'Ponto & Atividades', icon: '⏱️' },
    { id: 'projetos', label: 'Projetos', icon: '🗂️' },
    { id: 'reembolso', label: 'Reembolsos', icon: '💳' },
    { id: 'equipe', label: 'Equipe', icon: '👥' },
    { id: 'reunioes', label: 'Reuniões', icon: '📅' },
    { id: 'custos', label: 'Custos de Clientes', icon: '💰' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
];

// ─── Estado global ─────────────────────────────────────
const State = {
    moduloAtivo: 'ponto',
    pontoEventos: [],    // eventos do dia
    apontamentos: [],    // apontamentos do dia
    heAtivo: false,
    bhAtivo: false,
};

// ─── Carga de estado da API ───────────────────────────
async function carregarDadosServidor() {
    if (!WUSER?.id) return;
    const dateQuery = toDateKey(new Date());
    try {
        const resPonto = await fetch(\`/api/ponto?userId=\${WUSER.id}&date=\${dateQuery}\`);
        if(resPonto.ok) State.pontoEventos = await resPonto.json();
        
        const resApont = await fetch(\`/api/apontamentos?userId=\${WUSER.id}&date=\${dateQuery}\`);
        if(resApont.ok) State.apontamentos = await resApont.json();

        const tipos = State.pontoEventos.map(e => e.tipo);
        const lastHE = [...tipos].reverse().find(t => t.startsWith('HE_'));
        State.heAtivo = lastHE === 'HE_INICIO';
        const lastBH = [...tipos].reverse().find(t => t.startsWith('BH_'));
        State.bhAtivo = lastBH === 'BH_INICIO';

        renderTimeline();
        renderApontamentos();
    } catch(e) {
        console.error('Erro ao carregar dados do servidor:', e);
    }
}

// ─── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    buildWorkNav();
    buildUserBadge();
    renderPontoData();
    renderTimeline();
    renderApontamentos();
    popularClienteSelect();
    popularReimbClienteSelect();
    renderProjetos();
    renderEquipe();
    renderRelatorios();
    renderReimbolsos();
    carregarDadosServidor();
});

// ─── Nav dinâmica ──────────────────────────────────────
function buildWorkNav() {
    const nav = document.getElementById('work-nav');
    if (!nav) return;
    nav.innerHTML = '';
    const modAtivos = MODULOS_WORK.filter(m => {
        if (m.id === 'admin') {
            return ['ADMIN', 'BPO', 'GERENTE_DEV'].includes(WUSER.grupo);
        }
        return true;
    });
    modAtivos.forEach((m, i) => {
        const btn = document.createElement('button');
        btn.id = \`wn-\${m.id}\`;
        btn.className = \`work-nav-btn\${i === 0 ? ' active' : ''}\`;
        btn.innerHTML = \`<span class="work-nav-icon">\${m.icon}</span>\${m.label}\`;
        btn.onclick = () => setWorkModulo(m.id);
        nav.appendChild(btn);
    });
}

function setWorkModulo(mod) {
    State.moduloAtivo = mod;
    document.querySelectorAll('.work-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(\`wn-\${mod}\`);
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.work-modulo').forEach(m => m.classList.add('hidden'));
    const el = document.getElementById(\`mod-\${mod}\`);
    if (el) el.classList.remove('hidden');
    if (mod === 'custos') initCustos();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Badge de usuário ──────────────────────────────────
function buildUserBadge() {
    if (!WUSER) return;
    const el = document.getElementById('w-initial');
    if (el) el.textContent = (WUSER.nome || '?').charAt(0).toUpperCase();
    const nome = document.getElementById('w-menu-nome');
    const grupo = document.getElementById('w-menu-grupo');
    if (nome) nome.textContent = WUSER.nome || '—';
    if (grupo) grupo.textContent = WUSER.grupo || '—';
    const badge = document.getElementById('w-badge');
    if (badge) badge.style.background = WUSER.cor || '#E05B1A';
}
function toggleWMenu() {
    document.getElementById('w-menu')?.classList.toggle('open');
}
document.addEventListener('click', e => {
    const b = document.getElementById('w-badge');
    if (b && !b.contains(e.target))
        document.getElementById('w-menu')?.classList.remove('open');
});
function wLogout() {
    sessionStorage.removeItem('of_user');
    window.location.href = '/login';
}

// ══════════════════════════════════════════════════════
// MÓDULO: PONTO CLT
// ══════════════════════════════════════════════════════

const PONTO_SEQ = ['ENTRADA', 'SAIDA_ALMOCO', 'RETORNO_ALMOCO', 'SAIDA'];
const PONTO_META = {
    ENTRADA: { label: 'Entrada', dot: '#22C55E', emoji: '🟢' },
    SAIDA_ALMOCO: { label: 'Saída Almoço', dot: '#F59E0B', emoji: '🌭' },
    RETORNO_ALMOCO: { label: 'Retorno Almoço', dot: '#60A5FA', emoji: '🔙' },
    SAIDA: { label: 'Saída', dot: '#EF4444', emoji: '🔴' },
    HE_INICIO: { label: 'Hora Extra ↗', dot: '#A78BFA', emoji: '⚡' },
    HE_FIM: { label: 'Hora Extra ↘', dot: '#7C3AED', emoji: '⚡' },
    BH_INICIO: { label: 'Banco Horas ↗', dot: '#60A5FA', emoji: '🏦' },
    BH_FIM: { label: 'Banco Horas ↘', dot: '#1D4ED8', emoji: '🏦' },
};

function toDateKey(d) {
    return d.toISOString().slice(0, 10);
}
function formatHora(d) {
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function formatMinutos(min) {
    const h = Math.floor(Math.abs(min) / 60);
    const m = Math.abs(min) % 60;
    return \`\${h}h\${m.toString().padStart(2, '0')}\`;
}

function renderPontoData() {
    const now = new Date();
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    document.getElementById('ponto-date').textContent =
        \`\${now.getDate().toString().padStart(2, '0')} de \${meses[now.getMonth()].charAt(0).toUpperCase() + meses[now.getMonth()].slice(1)} de \${now.getFullYear()}\`;
    document.getElementById('ponto-weekday').textContent = dias[now.getDay()];
    document.getElementById('apont-date-label').textContent =
        \`\${dias[now.getDay()]}, \${now.getDate().toString().padStart(2, '0')}/\${(now.getMonth() + 1).toString().padStart(2, '0')}\`;
}

function atualizarLocal() {
    const sel = document.getElementById('ponto-local').value;
    const labels = { HOME_OFFICE: '🏠 Home Office', CLIENTE: '🏢 Cliente', ESCRITORIO: '🏬 Escritório' };
    document.getElementById('ponto-local-badge').textContent = labels[sel] || sel;
}

function renderTimeline() {
    const tl = document.getElementById('ponto-timeline');
    if (!tl) return;

    if (State.pontoEventos.length === 0) {
        tl.innerHTML = '<div class="ponto-empty">Nenhum registro hoje. Marque sua entrada!</div>';
    } else {
        tl.innerHTML = State.pontoEventos.map(ev => {
            const meta = PONTO_META[ev.tipo] || { label: ev.tipo, dot: '#888', emoji: '●' };
            return \`<div class="ponto-event">
        <div class="ponto-event-dot" style="background:\${meta.dot}"></div>
        <span class="ponto-event-label">\${meta.emoji} \${meta.label}</span>
        <span class="ponto-event-hora">\${formatHora(ev.hora)}</span>
      </div>\`;
        }).join('');
    }

    const tipos = State.pontoEventos.map(e => e.tipo);
    let proximoSeq = null;
    for (const s of PONTO_SEQ) {
        if (!tipos.includes(s)) { proximoSeq = s; break; }
    }

    const btn = document.getElementById('ponto-btn-main');
    const extrasDiv = document.getElementById('ponto-btns-extra');

    if (!proximoSeq) {
        if(btn) {
            btn.textContent = '✅ Dia encerrado';
            btn.disabled = true;
            btn.style.background = 'rgba(34,197,94,.15)';
            btn.style.color = '#4ADE80';
        }
        if(extrasDiv) extrasDiv.style.display = 'none';
    } else {
        const meta = PONTO_META[proximoSeq];
        if(btn) {
            btn.innerHTML = \`<span>\${meta.emoji}</span> \${meta.label}\`;
            btn.disabled = false;
            const cores = { ENTRADA: '#22C55E', SAIDA_ALMOCO: '#F59E0B', RETORNO_ALMOCO: '#3A7BD5', SAIDA: '#EF4444' };
            btn.style.background = \`linear-gradient(135deg, \${cores[proximoSeq]}, \${cores[proximoSeq]}CC)\`;
            btn.style.color = '#fff';
        }
        const podeExtra = tipos.includes('RETORNO_ALMOCO') && !tipos.includes('SAIDA');
        if(extrasDiv) extrasDiv.style.display = podeExtra ? 'grid' : 'none';
    }

    calcularTotais();
}

async function apiPostPonto(tipo, local) {
    if (!WUSER?.id) return false;
    try {
        const payload = { userId: WUSER.id, tipo, hora: new Date().toISOString(), local };
        const res = await fetch('/api/ponto', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        return res.ok;
    } catch(e) {
        return false;
    }
}

async function registrarPonto() {
    const tipos = State.pontoEventos.map(e => e.tipo);
    let proximo = null;
    for (const s of PONTO_SEQ) {
        if (!tipos.includes(s)) { proximo = s; break; }
    }
    if (!proximo) return;

    const btn = document.getElementById('ponto-btn-main');
    if(btn) btn.disabled = true;

    const local = document.getElementById('ponto-local')?.value || 'HOME_OFFICE';
    State.pontoEventos.push({ tipo: proximo, hora: new Date().toISOString(), local });
    renderTimeline();

    const ok = await apiPostPonto(proximo, local);
    if(ok) {
        wToast(\`\${PONTO_META[proximo].emoji} \${PONTO_META[proximo].label} registrada!\`, 'success');
        await carregarDadosServidor();
    } else {
        wToast('Erro ao salvar no servidor', 'error');
        State.pontoEventos.pop();
        renderTimeline();
        if(btn) btn.disabled = false;
    }
}

async function registrarHE() {
    const tipos = State.pontoEventos.map(e => e.tipo);
    const tipo = (!State.heAtivo && !tipos.includes('HE_INICIO')) ? 'HE_INICIO' : 'HE_FIM';
    const local = 'HOME_OFFICE';

    State.pontoEventos.push({ tipo, hora: new Date().toISOString(), local });
    State.heAtivo = (tipo === 'HE_INICIO');
    document.getElementById('btn-he').textContent = State.heAtivo ? '⚡ Fim H. Extra' : '⚡ Hora Extra';
    renderTimeline();

    const ok = await apiPostPonto(tipo, local);
    if(ok) {
        wToast(State.heAtivo ? '⚡ Hora Extra iniciada!' : '⚡ Hora Extra encerrada!', 'warn');
        await carregarDadosServidor();
    } else {
        wToast('Erro ao salvar no servidor', 'error');
        State.pontoEventos.pop();
        State.heAtivo = !State.heAtivo;
        document.getElementById('btn-he').textContent = State.heAtivo ? '⚡ Fim H. Extra' : '⚡ Hora Extra';
        renderTimeline();
    }
}

async function registrarBH() {
    const tipos = State.pontoEventos.map(e => e.tipo);
    const tipo = (!State.bhAtivo && !tipos.includes('BH_INICIO')) ? 'BH_INICIO' : 'BH_FIM';
    const local = 'HOME_OFFICE';

    State.pontoEventos.push({ tipo, hora: new Date().toISOString(), local });
    State.bhAtivo = (tipo === 'BH_INICIO');
    document.getElementById('btn-bh').textContent = State.bhAtivo ? '🏦 Fim B. Horas' : '🏦 Banco Horas';
    renderTimeline();

    const ok = await apiPostPonto(tipo, local);
    if(ok) {
        wToast(State.bhAtivo ? '🏦 Banco de Horas iniciado!' : '🏦 Banco de Horas encerrado!', 'warn');
        await carregarDadosServidor();
    } else {
        wToast('Erro ao salvar no servidor', 'error');
        State.pontoEventos.pop();
        State.bhAtivo = !State.bhAtivo;
        document.getElementById('btn-bh').textContent = State.bhAtivo ? '🏦 Fim B. Horas' : '🏦 Banco Horas';
        renderTimeline();
    }
}

function calcularTotais() {
    const evs = State.pontoEventos;
    let normalMin = 0;
    const ent = evs.find(e => e.tipo === 'ENTRADA');
    const sAlm = evs.find(e => e.tipo === 'SAIDA_ALMOCO');
    const retAlm = evs.find(e => e.tipo === 'RETORNO_ALMOCO');
    const sai = evs.find(e => e.tipo === 'SAIDA');
    if (ent && sAlm) normalMin += (new Date(sAlm.hora) - new Date(ent.hora)) / 60000;
    if (retAlm && sai) normalMin += (new Date(sai.hora) - new Date(retAlm.hora)) / 60000;
    else if (retAlm) normalMin += (new Date() - new Date(retAlm.hora)) / 60000;

    let heMin = 0;
    const heI = evs.find(e => e.tipo === 'HE_INICIO');
    const heF = evs.find(e => e.tipo === 'HE_FIM');
    if (heI && heF) heMin = (new Date(heF.hora) - new Date(heI.hora)) / 60000;
    else if (heI) heMin = (new Date() - new Date(heI.hora)) / 60000;

    let bhMin = 0;
    const bhI = evs.find(e => e.tipo === 'BH_INICIO');
    const bhF = evs.find(e => e.tipo === 'BH_FIM');
    if (bhI && bhF) bhMin = (new Date(bhF.hora) - new Date(bhI.hora)) / 60000;
    else if (bhI) bhMin = (new Date() - new Date(bhI.hora)) / 60000;

    const el = id => document.getElementById(id);
    if (el('total-normal')) el('total-normal').textContent = formatMinutos(Math.max(0, Math.round(normalMin)));
    if (el('total-he')) el('total-he').textContent = formatMinutos(Math.max(0, Math.round(heMin)));
    if (el('total-bh')) el('total-bh').textContent = formatMinutos(Math.max(0, Math.round(bhMin)));
}

// ══════════════════════════════════════════════════════
// MÓDULO: APONTAMENTOS DE HORAS / TIMESHEET
// ══════════════════════════════════════════════════════

function toggleFormApont() {
    const card = document.getElementById('apont-form-card');
    if (card) card.classList.toggle('hidden');
}

function popularClienteSelect() {
    const sel = document.getElementById('apont-cliente');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecionar cliente...</option>' + 
        CLIENTES.map(c => \`<option value="\${c.id}" data-cor="\${c.cor}">\${c.nome}</option>\`).join('');
}

function renderProjetos() {
    const sel = document.getElementById('apont-projeto');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecionar projeto...</option>' + 
        PROJETOS.map(p => \`<option value="\${p.id}">\${p.nome}</option>\`).join('');
}

async function salvarApont() {
    if (!WUSER?.id) return wToast('Usuário não autenticado', 'error');

    const formBtn = document.querySelector('#apont-form-card .btn-primary');
    if(formBtn) formBtn.textContent = 'Salvando...';

    const clienteId = parseInt(document.getElementById('apont-cliente').value);
    const projetoId = parseInt(document.getElementById('apont-projeto').value);
    const inicio = document.getElementById('apont-inicio').value;
    const fim = document.getElementById('apont-fim').value;
    const desc = document.getElementById('apont-desc').value.trim();
    const tipo = document.getElementById('apont-tipo').value;

    if (!clienteId || !projetoId || !inicio || !fim || !desc) {
        if(formBtn) formBtn.textContent = 'Salvar Atividade';
        return wToast('Preencha todos os campos obrigatórios!', 'error');
    }
    if (inicio >= fim) {
        if(formBtn) formBtn.textContent = 'Salvar Atividade';
        return wToast('A hora fim deve ser após a hora início!', 'error');
    }

    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);
    const totalMin = (hf * 60 + mf) - (hi * 60 + mi);

    try {
        const payload = {
            userId: WUSER.id,
            clienteId, projetoId, inicio, fim, desc, tipo, totalMin,
            data: toDateKey(new Date())
        };

        const res = await fetch('/api/apontamentos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Falha HTTP');

        wToast('✅ Apontamento salvo!', 'success');
        
        document.getElementById('apont-desc').value = '';
        document.getElementById('apont-cliente').value = '';
        document.getElementById('apont-projeto').innerHTML = '<option value="">Selecionar projeto...</option>';
        toggleFormApont();
        
        await carregarDadosServidor();
    } catch(e) {
        console.error(e);
        wToast('Erro ao salvar apontamento no servidor', 'error');
    } finally {
        if(formBtn) formBtn.textContent = 'Salvar Atividade';
    }
}

function renderApontamentos() {
    const list = document.getElementById('apont-list');
    if (!list) return;
    if (State.apontamentos.length === 0) {
        list.innerHTML = \`<div class="apont-empty">
      <span class="apont-empty-icon">📋</span>
      Nenhuma atividade registrada hoje.<br>Clique em <strong>+ Nova Atividade</strong> para começar.
    </div>\`;
        return;
    }
    const tipoLabel = { NORMAL: 'Normal', HE: 'Hora Extra', BH_CREDITO: 'Banco Horas' };
    list.innerHTML = State.apontamentos.map(a => \`
    <div class="apont-item">
      <div class="apont-item-cor" style="background:\${a.clienteCor || '#0ea5e9'}"></div>
      <div class="apont-item-body">
        <div class="apont-item-proj">\${a.projetoNome}</div>
        <div class="apont-item-cliente">\${a.clienteNome}</div>
        <div class="apont-item-desc">\${a.desc}</div>
      </div>
      <div class="apont-item-right">
        <div class="apont-item-horas">\${formatMinutos(a.totalMin)}</div>
        <div class="apont-item-range">\${a.inicio} – \${a.fim}</div>
        <div class="apont-item-tipo">\${tipoLabel[a.tipo] || a.tipo}</div>
      </div>
    </div>\`).join('');
}
`;

const startIdx = code.indexOf('// ─── Auth Guard ────────────────────────────────────────');
const endIdx = code.indexOf('function fecharModal()');
if(startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + targetStr + '\n\n' + code.substring(endIdx);
    fs.writeFileSync('C:/Devs/PlataformaOF/OverfloowHub/public/js/work.js', code);
    console.log('Work.js Fixed with absolute surgery!');
} else {
    console.log('Error: Could not find markers. startIdx=', startIdx, 'endIdx=', endIdx);
}
