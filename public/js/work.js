/**
 * Overfloow Work — Logic
 * Ponto CLT, Apontamentos, Projetos, Equipe, Relatórios
 * BPO Vertical · Gerente: Duda (Maria Eduarda)
 */

// ─── Auth Guard ────────────────────────────────────────
const _raw = sessionStorage.getItem('of_user');
const WUSER = _raw ? JSON.parse(_raw) : null;
if (!WUSER) window.location.href = '/login';

// ─── Demo Data (fallback enquanto não há dados no DB) ──────────
const CORES_CLIENTES = ['#C4380C','#0A6E5D','#3A7BD5','#5A2D82','#1A3A6C','#A07000','#C4380C','#2D6A4F'];

// CLIENTES/PROJETOS/EQUIPE começam como arrays vazios — serão populados pela API
window.CLIENTES = [];
window.PROJETOS = [];

window.EQUIPE = [
    // Sócios — dados estáticos enquanto não há registros no DB
    { nome: 'Jaime', cargo: 'CEO', tipo: 'SOCIO', cor: '#1A3A6C', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 176, bhSaldo: 0 },
    { nome: 'Gustavo', cargo: 'Gerente TIC', tipo: 'SOCIO', cor: '#2658A8', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 160, bhSaldo: 0 },
    { nome: 'Nadir', cargo: 'Sócia', tipo: 'SOCIO', cor: '#5A2D82', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 120, bhSaldo: 0 },
    { nome: 'Érica', cargo: 'Gerente DEV', tipo: 'SOCIO', cor: '#0A6E5D', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 144, bhSaldo: 0 },
    { nome: 'Duda', cargo: 'Gerente BPO', tipo: 'SOCIO', cor: '#C4380C', jornada: 'SOCIO_FLEX', he: false, bh: false, horasMes: 168, bhSaldo: 0 },
];

window.JORNADAS = {
    CLT_40: { label: 'CLT 40h/semana', icone: '📄', detalhe: '08h00 – 12h00 / 13h00 – 17h00, seg – sex · 1h almoço · 40h semanais' },
    SOCIO_FLEX: { label: 'Sócio — Flex', icone: '⭐', detalhe: 'Horário flexível · Distribuição de lucros proporcional às horas trabalhadas' },
};

// ─── Módulos disponíveis ───────────────────────────────
window.MODULOS_WORK = [
    { id: 'ponto',     label: 'Ponto & Atividades',  icon: '⏱️' },
    { id: 'projetos',  label: 'Projetos',             icon: '🗂️' },
    { id: 'reembolso', label: 'Reembolsos',           icon: '💳' },
    { id: 'equipe',    label: 'Equipe',               icon: '👥' },
    { id: 'reunioes',  label: 'Reuniões',             icon: '📅' },
    { id: 'custos',    label: 'Custos de Clientes',   icon: '💰' },
    { id: 'relatorios',label: 'Relatórios',           icon: '📊' },
    { id: 'admin',     label: 'Admin',                icon: '⚙️', grupos: ['ADMIN', 'SOCIO'] },
];

// ─── Estado global ─────────────────────────────────────
window.State = {
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
        // 1. Clientes reais do banco (CRÍTICO: IDs reais para evitar erros de FK)
        const resCli = await fetch('/api/clientes');
        if(resCli.ok) {
            const clientes = await resCli.json();
            if(clientes.length > 0) {
                window.CLIENTES = clientes.map((c, i) => ({
                    ...c,
                    cor: CORES_CLIENTES[i % CORES_CLIENTES.length]
                }));
            }
        }

        // 2. Ponto e Apontamentos do dia
        const resPonto = await fetch(`/api/ponto?userId=${WUSER.id}&date=${dateQuery}`);
        if(resPonto.ok) State.pontoEventos = await resPonto.json();
        
        const resApont = await fetch(`/api/apontamentos?userId=${WUSER.id}&date=${dateQuery}`);
        if(resApont.ok) State.apontamentos = await resApont.json();

        // 3. Projetos
        const resProjs = await fetch('/api/projetos');
        if(resProjs.ok) {
            const projs = await resProjs.json();
            if (projs.length > 0) window.PROJETOS = projs;
        }

        // 4. Equipe (fallback para dados estáticos se DB vazio)
        const resEquipe = await fetch('/api/equipe');
        if(resEquipe.ok) {
            const equipe = await resEquipe.json();
            if (equipe.length > 0) window.EQUIPE = equipe;
        }

        // 5. Estado do ponto
        const tiposPonto = State.pontoEventos.map(e => e.tipo);
        const lastHE = [...tiposPonto].reverse().find(t => t.startsWith('HE_'));
        State.heAtivo = lastHE === 'HE_INICIO';
        const lastBH = [...tiposPonto].reverse().find(t => t.startsWith('BH_'));
        State.bhAtivo = lastBH === 'BH_INICIO';

        // 6. Re-render de todos os módulos
        renderTimeline();
        renderApontamentos();
        popularClienteSelect();
        renderProjetos();
        if(typeof window.popularReimbClienteSelect === 'function') window.popularReimbClienteSelect();
        if(typeof window.renderProjetosGrid === 'function') window.renderProjetosGrid();
        if(typeof window.renderEquipe === 'function') window.renderEquipe();
        if(typeof window.popularReunClienteSelect === 'function') window.popularReunClienteSelect();

    } catch(e) {
        console.error('Erro ao carregar dados do servidor:', e);
    }
}

// ─── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
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
        if (!m.grupos) return true;
        return WUSER && m.grupos.includes(WUSER.grupo);
    });
    modAtivos.forEach((m, i) => {
        const btn = document.createElement('button');
        btn.id = `wn-${m.id}`;
        btn.className = `work-nav-btn${i === 0 ? ' active' : ''}`;
        // Label em span separado para colapsar via CSS
        btn.innerHTML = `<span class="work-nav-icon">${m.icon}</span><span class="work-nav-btn-label">${m.label}</span>`;
        btn.onclick = () => setWorkModulo(m.id);
        nav.appendChild(btn);
    });
}

// ─── Toggle Sidebar ────────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('work-sidebar');
    const btn     = document.getElementById('sidebar-toggle');
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle('sidebar-collapsed');
    if (btn) btn.textContent = collapsed ? '▶' : '◀';
    // Salva preferência
    localStorage.setItem('work_sidebar_collapsed', collapsed ? '1' : '0');
}

// ─── Restaurar estado do sidebar ao carregar
function initSidebar() {
    if (localStorage.getItem('work_sidebar_collapsed') === '1') {
        const sidebar = document.getElementById('work-sidebar');
        const btn     = document.getElementById('sidebar-toggle');
        if (sidebar) sidebar.classList.add('sidebar-collapsed');
        if (btn) btn.textContent = '▶';
    }
}

function setWorkModulo(mod) {
    State.moduloAtivo = mod;
    document.querySelectorAll('.work-nav-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`wn-${mod}`);
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.work-modulo').forEach(m => m.classList.add('hidden'));
    const el = document.getElementById(`mod-${mod}`);
    if (el) el.classList.remove('hidden');

    // Re-renderiza o módulo ao entrar — garante dados atualizados independente do timing
    const safe = (fn) => typeof window[fn] === 'function' && window[fn]();
    switch(mod) {
        case 'ponto':
            renderTimeline();
            renderApontamentos();
            popularClienteSelect();
            break;
        case 'projetos':
            safe('renderProjetosGrid');
            break;
        case 'equipe':
            safe('renderEquipe');
            break;
        case 'reunioes':
            safe('popularReunClienteSelect');
            break;
        case 'reembolso':
            safe('popularReimbClienteSelect');
            safe('renderReimbolsos');
            break;
        case 'custos':
            initCustos();
            break;
        case 'relatorios':
            safe('renderRelatorios');
            break;
        case 'admin':
            // Admin usa suas próprias rotas — sem render aqui por enquanto
            break;
        default:
            console.log('[Work] Módulo sem render definido:', mod);
    }
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
    // Usa data LOCAL (não UTC) para evitar mismatch de data à noite no Brasil (UTC-3)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function formatHora(d) {
    return new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function formatMinutos(min) {
    const h = Math.floor(Math.abs(min) / 60);
    const m = Math.abs(min) % 60;
    return `${h}h${m.toString().padStart(2, '0')}`;
}

function renderPontoData() {
    const now = new Date();
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    document.getElementById('ponto-date').textContent =
        `${now.getDate().toString().padStart(2, '0')} de ${meses[now.getMonth()].charAt(0).toUpperCase() + meses[now.getMonth()].slice(1)} de ${now.getFullYear()}`;
    document.getElementById('ponto-weekday').textContent = dias[now.getDay()];
    document.getElementById('apont-date-label').textContent =
        `${dias[now.getDay()]}, ${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
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
            return `<div class="ponto-event">
        <div class="ponto-event-dot" style="background:${meta.dot}"></div>
        <span class="ponto-event-label">${meta.emoji} ${meta.label}</span>
        <span class="ponto-event-hora">${formatHora(ev.hora)}</span>
      </div>`;
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
            btn.innerHTML = `<span>${meta.emoji}</span> ${meta.label}`;
            btn.disabled = false;
            const cores = { ENTRADA: '#22C55E', SAIDA_ALMOCO: '#F59E0B', RETORNO_ALMOCO: '#3A7BD5', SAIDA: '#EF4444' };
            btn.style.background = `linear-gradient(135deg, ${cores[proximoSeq]}, ${cores[proximoSeq]}CC)`;
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
        wToast(`${PONTO_META[proximo].emoji} ${PONTO_META[proximo].label} registrada!`, 'success');
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
    const card = document.getElementById('apont-form');
    if (!card) return;
    const abrindo = card.classList.contains('hidden');
    card.classList.toggle('hidden');
    if (abrindo) {
        // Sempre atualiza os selects ao abrir o form
        popularClienteSelect();
        document.getElementById('apont-projeto').innerHTML = '<option value="">Selecionar projeto (opcional)...</option>';
    }
}

function popularClienteSelect() {
    const sel = document.getElementById('apont-cliente');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecionar cliente...</option>' + 
        (window.CLIENTES || []).map(c => `<option value="${c.id}" data-cor="${c.cor}">${c.nome}</option>`).join('');
}

function filtrarProjetos() {
    const cliId = parseInt(document.getElementById('apont-cliente').value);
    const selP = document.getElementById('apont-projeto');
    if (!selP) return;
    selP.innerHTML = '<option value="">Selecionar projeto (opcional)...</option>';
    if (!cliId) return;
    const projs = (window.PROJETOS || []).filter(p => p.clienteId === cliId);
    selP.innerHTML += projs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

function renderProjetos() {
    const sel = document.getElementById('apont-projeto');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecionar projeto (opcional)...</option>' + 
        (window.PROJETOS || []).map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

async function salvarApont() {
    if (!WUSER?.id) return wToast('Usuário não autenticado', 'error');

    const formBtn = document.querySelector('#apont-form .btn-save');
    if(formBtn) { formBtn.textContent = 'Salvando...'; formBtn.disabled = true; }

    const clienteId = parseInt(document.getElementById('apont-cliente').value);
    const projetoId = parseInt(document.getElementById('apont-projeto').value);
    const inicio = document.getElementById('apont-inicio').value;
    const fim = document.getElementById('apont-fim').value;
    const desc = document.getElementById('apont-desc').value.trim();
    const tipo = document.getElementById('apont-tipo').value;

    if (!clienteId || !inicio || !fim || !desc) {
        if(formBtn) { formBtn.textContent = 'Salvar Apontamento'; formBtn.disabled = false; }
        return wToast('Preencha Cliente, Hora Início, Hora Fim e Descrição!', 'error');
    }
    if (inicio >= fim) {
        if(formBtn) { formBtn.textContent = 'Salvar Apontamento'; formBtn.disabled = false; }
        return wToast('A hora fim deve ser após a hora início!', 'error');
    }

    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fim.split(':').map(Number);
    const totalMin = (hf * 60 + mf) - (hi * 60 + mi);

    try {
        const payload = {
            userId: WUSER.id,
            clienteId, 
            projetoId: isNaN(projetoId) ? null : projetoId, 
            inicio, fim, desc, tipo, totalMin,
            data: toDateKey(new Date())
        };

        const res = await fetch('/api/apontamentos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
        }

        // Fechar form e limpar campos
        document.getElementById('apont-desc').value = '';
        document.getElementById('apont-inicio').value = '';
        document.getElementById('apont-fim').value = '';
        document.getElementById('apont-cliente').value = '';
        document.getElementById('apont-projeto').innerHTML = '<option value="">Selecionar projeto (opcional)...</option>';
        const card = document.getElementById('apont-form');
        if(card && !card.classList.contains('hidden')) card.classList.add('hidden');

        wToast('✅ Apontamento salvo!', 'success');
        
        // Recarregar apontamentos do dia e projetos (garante que selects funcionem no próximo cadastro)
        const dateQuery = toDateKey(new Date());
        const [resApont, resProjs] = await Promise.all([
            fetch(`/api/apontamentos?userId=${WUSER.id}&date=${dateQuery}`),
            fetch('/api/projetos')
        ]);
        if(resApont.ok) State.apontamentos = await resApont.json();
        if(resProjs.ok) {
            const projs = await resProjs.json();
            if(projs.length > 0) window.PROJETOS = projs;
        }
        renderApontamentos();
        renderProjetos(); // Atualiza o select interno de projetos
        if(typeof window.renderProjetosGrid === 'function') window.renderProjetosGrid();

        // Scroll suave para a lista de apontamentos para o usuário ver o item novo
        const lista = document.getElementById('apont-list');
        if(lista) {
            lista.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            lista.style.transition = 'box-shadow 0.4s';
            lista.style.boxShadow = '0 0 0 2px #22c55e';
            setTimeout(() => { lista.style.boxShadow = ''; }, 1000);
        }

    } catch(e) {
        console.error('[salvarApont]', e);
        wToast(`Erro ao salvar: ${e.message}`, 'error');
    } finally {
        if(formBtn) { formBtn.textContent = 'Salvar Apontamento'; formBtn.disabled = false; }
    }
}

function renderApontamentos() {
    const list = document.getElementById('apont-list');
    if (!list) return;
    const dados = State.apontamentos || [];
    if (dados.length === 0) {
        list.innerHTML = `<div class="apont-empty">
      <span class="apont-empty-icon">📋</span>
      Nenhuma atividade registrada hoje.<br>Clique em <strong>+ Nova Atividade</strong> para começar.
    </div>`;
        return;
    }
    const tipoLabel = { NORMAL: 'Normal', HE: 'Hora Extra', BH_CREDITO: 'Banco Horas' };
    const totalHoras = dados.reduce((acc, a) => acc + (a.totalMin || 0), 0);
    const totalHorasStr = formatMinutos(totalHoras);
    const mostrar = dados.slice(-5).reverse(); // Mostra os últimos 5, mais recentes primeiro
    
    list.style.maxHeight = '360px';
    list.style.overflowY = 'auto';
    list.innerHTML = (dados.length > 5 ? `<div style="padding:6px 12px;font-size:.78rem;color:var(--text-muted);text-align:center;background:var(--bg-ele);border-radius:6px;margin-bottom:8px">
        📋 Total hoje: <strong>${dados.length} apontamentos · ${totalHorasStr}</strong> registradas
    </div>` : '') +
    mostrar.map(a => `
    <div class="apont-item" style="position:relative;">
      <div class="apont-item-cor" style="background:${a.clienteCor || '#0ea5e9'}"></div>
      <div class="apont-item-body">
        <div class="apont-item-proj">${a.projetoNome || 'Geral'}</div>
        <div class="apont-item-cliente">${a.clienteNome}</div>
        <div class="apont-item-desc">${a.desc}</div>
      </div>
      <div class="apont-item-right">
        <div class="apont-item-horas">${formatMinutos(a.totalMin)}</div>
        <div class="apont-item-range">${a.inicio} – ${a.fim}</div>
        <div class="apont-item-tipo">${tipoLabel[a.tipo] || a.tipo}</div>
        <button onclick="deletarApont(${a.id})" title="Excluir" style="background:none;border:none;color:rgba(228,234,246,.3);cursor:pointer;font-size:.9rem;margin-top:4px;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='rgba(228,234,246,.3)'">🗑</button>
      </div>
    </div>`).join('') +
    (dados.length > 5 ? `<div style="padding:8px;text-align:center;font-size:.78rem;color:var(--text-muted)">
        Exibindo os 5 mais recentes de ${dados.length}
    </div>` : '');
}

async function deletarApont(id) {
    if (!confirm('Deseja excluir este apontamento?')) return;
    try {
        const res = await fetch(`/api/apontamentos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Falha ao deletar');
        State.apontamentos = (State.apontamentos || []).filter(a => a.id !== id);
        renderApontamentos();
        wToast('Apontamento excluído', 'info');
    } catch(e) {
        console.error(e);
        wToast('Erro ao excluir apontamento', 'error');
    }
}

function fecharModal() {
    document.getElementById('reun-modal-container').innerHTML = '';
}

function salvarAta(id) {
    const r = reunState.find(x => x.id === id);
    if (!r) return;
    const ata = document.getElementById(`modal-ata-${id}`)?.value.trim() || '';
    r.ata = ata;
    if (r.status === 'AGENDADA' || r.status === 'CONFIRMADA') r.status = 'REALIZADA';
    sessionStorage.setItem(REUNIAO_KEY, JSON.stringify(reunState));
    fecharModal();
    renderReunSemana();
    mostrarReunioesDia(reunDiaSel);
    renderReunLista();
    wToast('📝 Ata salva e reunião marcada como Realizada!', 'success');
}

function atualizarStatusReuniao(id, status) {
    const r = reunState.find(x => x.id === id);
    if (!r) return;
    r.status = status;
    sessionStorage.setItem(REUNIAO_KEY, JSON.stringify(reunState));
    wToast(`Status atualizado: ${STATUS_REUNIAO[status]?.label || status}`, 'success');
}

// ════════════════════════════════════════════════════════
// MÓDULO: CUSTOS DE CLIENTES
// ════════════════════════════════════════════════════════

const CUSTOS_KEY = 'work_custos_v1';

const CUSTO_CATEGORIAS = {
    INFRA_CLOUD: { label: 'Infraestrutura Cloud', icon: '☁️' },
    IA_CREDITOS: { label: 'Créditos de IA', icon: '🤖' },
    DOMINIO: { label: 'Domínio / DNS', icon: '🌐' },
    EMAIL_HOSTING: { label: 'Hospedagem de E-mail', icon: '📧' },
    SOFTWARE_SaaS: { label: 'Software / SaaS', icon: '💿' },
    WHATSAPP_API: { label: 'WhatsApp Business API', icon: '💬' },
    CERTIFICADO_SSL: { label: 'Certificado SSL', icon: '🔐' },
    STORAGE: { label: 'Storage / Backup', icon: '📦' },
    LICENCA: { label: 'Licença de Software', icon: '📄' },
    OUTRO: { label: 'Outro', icon: '📌' },
};

// Dados demo — removido carregamento automatico daqui, vao para _custosData como mock somente de ref
// Agora eh servidor

// ─── Init do módulo ─────────────────────────────────────────
async function initCustos() {
    // Popular selects de cliente (assumindo que CLIENTES ja foi carregado em work.js globalmente)
    const selForm = document.getElementById('custo-cliente');
    const selFilter = document.getElementById('custo-filter-cliente');
    if (selForm) {
        selForm.innerHTML = '<option value="">Selecione...</option>' +
            CLIENTES.map(c => `<option value="${c.id}" data-cor="${c.cor}">${c.nome}</option>`).join('');
    }
    if (selFilter) {
        selFilter.innerHTML = '<option value="">Todos os Clientes</option>' +
            CLIENTES.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    }

    // Data padrão = hoje
    const dataInput = document.getElementById('custo-data');
    if (dataInput) dataInput.value = toDateKey(new Date());

    await fetchCustos();
}

// ─── Fetch da API ───────────────────────────────────────────
async function fetchCustos() {
    try {
        const filtCliente = document.getElementById('custo-filter-cliente')?.value || '';
        const filtDecisao = document.getElementById('custo-filter-decisao')?.value || '';
        
        let url = '/api/custos?';
        if (filtCliente) url += `clienteId=${filtCliente}&`;
        if (filtDecisao) url += `status=${filtDecisao}&`;

        const res = await fetch(url);
        if(!res.ok) throw new Error('Falha HTTP ' + res.status);
        const data = await res.json();
        
        // Mapear p/ formato front-end: id_custo -> id, data_custo -> data
        window._custosData = data.map(c => ({
            id: c.id_custo,
            clienteId: c.id_cliente,
            clienteNome: c.cliente ? (c.cliente.nome_fantasia || c.cliente.razao_social) : `Cliente #${c.id_cliente}`,
            categoria: c.categoria,
            fornecedor: c.descricao.split(' - ')[0] || c.descricao,
            descricao: c.descricao.includes(' - ') ? c.descricao.split(' - ').slice(1).join(' - ') : '',
            data: new Date(c.data_custo).toISOString().split('T')[0],
            valor: Number(c.valor),
            moeda: 'BRL', // default BD
            decisao: c.status,
            comprovante: c.comprovante || '',
            obs: c.observacoes || '',
            criadoEm: c.criado_em,
        }));
        
        renderCustosKpis();
        renderCustosLocal();
    } catch (err) {
        console.error('Erro ao buscar custos:', err);
        wToast('Erro ao carregar custos do servidor.', 'error');
        window._custosData = [];
        renderCustosKpis();
        renderCustosLocal();
    }
}

// ─── Render KPIs ────────────────────────────────────────────
function renderCustosKpis() {
    const data = window._custosData || [];
    const total = data.reduce((s, c) => s + c.valor, 0);
    const pendente = data.filter(c => c.decisao === 'Pendente').reduce((s, c) => s + c.valor, 0);
    const faturar = data.filter(c => c.decisao === 'Faturável').reduce((s, c) => s + c.valor, 0);
    const absorvido = data.filter(c => c.decisao === 'Absorvido').reduce((s, c) => s + c.valor, 0);
    
    // Suporte caso a tela antiga de mock estivesse usando os codigos curtos
    const pendLegacy = data.filter(c => c.decisao === 'PENDENTE').reduce((s, c) => s + c.valor, 0);
    const faturarLegacy = data.filter(c => c.decisao === 'FATURAMENTO').reduce((s, c) => s + c.valor, 0);
    const absorvLegacy = data.filter(c => c.decisao === 'ABSORVIDO').reduce((s, c) => s + c.valor, 0);

    const kpis = document.getElementById('custos-kpis');
    if (!kpis) return;
    kpis.innerHTML = [
        { label: 'Total Geral', val: total, icon: '💰', cor: '#E05B1A' },
        { label: '⏳ Aguardando Decisão', val: pendente + pendLegacy, icon: '⏳', cor: '#F59E0B' },
        { label: '🧾 A Faturar/Reembolsar', val: faturar + faturarLegacy, icon: '🧾', cor: '#0A6E5D' },
        { label: '🏢 Absorvido', val: absorvido + absorvLegacy, icon: '🏢', cor: '#5A2D82' },
    ].map(k => `
        <div class="relat-kpi-card" style="border-top:3px solid ${k.cor}">
            <div class="relat-kpi-val" style="color:${k.cor}">R$ ${k.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div class="relat-kpi-label">${k.label}</div>
        </div>`).join('');
}

// ─── Render Lista ────────────────────────────────────────────
function renderCustosLocal() {
    const data = window._custosData || [];
    const busca = (document.getElementById('custo-filter-busca')?.value || '').toLowerCase();

    // Filtros de cliente e status já vêm do backend api
    const filtrado = data.filter(c => {
        if (busca && ![c.descricao, c.fornecedor, c.clienteNome, c.obs].join(' ').toLowerCase().includes(busca)) return false;
        return true;
    }).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

    const lista = document.getElementById('custos-lista');
    if (!lista) return;

    if (!filtrado.length) {
        lista.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:.9rem">
            Nenhum custo encontrado.</div>`;
        return;
    }

    // Opções de Status compatíveis com as antigas e novas
    const STATUS_MAP = {
        'Pendente': { label: '⏳ Pendente', cor: '#E05B1A' },
        'Reembolsável': { label: '↩️ Reembolso do Cliente', cor: '#3A7BD5' },
        'Faturável': { label: '🧾 Faturamento', cor: '#0A6E5D' },
        'Absorvido': { label: '🏢 Absorvido pela Overfloow', cor: '#5A2D82' },
        'PENDENTE': { label: '⏳ Pendente', cor: '#E05B1A' },
        'REEMBOLSO': { label: '↩️ Reembolso', cor: '#3A7BD5' },
        'FATURAMENTO': { label: '🧾 Faturamento', cor: '#0A6E5D' },
        'ABSORVIDO': { label: '🏢 Absorvido', cor: '#5A2D82' },
    };

    lista.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.83rem">
        <thead>
            <tr style="border-bottom:1px solid var(--border);color:var(--text-muted);font-size:.72rem;text-transform:uppercase;letter-spacing:.04em">
                <th style="text-align:left;padding:8px 10px">Data</th>
                <th style="text-align:left;padding:8px 10px">Cliente</th>
                <th style="text-align:left;padding:8px 10px">Categoria</th>
                <th style="text-align:left;padding:8px 10px">Fornecedor / Descrição</th>
                <th style="text-align:right;padding:8px 10px">Valor</th>
                <th style="text-align:center;padding:8px 10px">Decisão</th>
                <th style="text-align:center;padding:8px 10px">Ação</th>
            </tr>
        </thead>
        <tbody>
            ${filtrado.map(c => {
        const cli = CLIENTES.find(x => x.id === c.clienteId);
        const cat = CUSTO_CATEGORIAS[c.categoria] || { label: c.categoria, icon: '📌' };
        const dec = STATUS_MAP[c.decisao] || { label: c.decisao, cor: '#999' };
        return `
                <tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,.03)'" onmouseout="this.style.background=''">
                    <td style="padding:10px;color:var(--text-muted);white-space:nowrap">${c.data.split('-').reverse().join('/')}</td>
                    <td style="padding:10px">
                        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cli?.cor || '#888'};margin-right:6px"></span>
                        ${c.clienteNome}
                    </td>
                    <td style="padding:10px">${cat.icon} ${cat.label}</td>
                    <td style="padding:10px">
                        <div style="font-weight:500">${c.fornecedor}</div>
                        <div style="font-size:.78rem;color:var(--text-muted);margin-top:2px">${c.descricao}${c.obs ? ' · ' + c.obs : ''}</div>
                    </td>
                    <td style="padding:10px;text-align:right;font-weight:600;font-family:'JetBrains Mono',monospace;color:#E05B1A">
                        R$ ${c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        ${c.moeda !== 'BRL' ? `<div style="font-size:.72rem;color:var(--text-muted);font-weight:400">${c.moeda}</div>` : ''}
                    </td>
                    <td style="padding:10px;text-align:center">
                        <select onchange="mudarDecisaoCusto(${c.id}, this.value)"
                            style="background:${dec.cor}22;border:1px solid ${dec.cor}55;color:${dec.cor};padding:4px 8px;border-radius:20px;font-size:.75rem;cursor:pointer">
                            <option value="Pendente" ${c.decisao === 'Pendente' || c.decisao === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
                            <option value="Reembolsável" ${c.decisao === 'Reembolsável' || c.decisao === 'REEMBOLSO' ? 'selected' : ''}>Reembolso</option>
                            <option value="Faturável" ${c.decisao === 'Faturável' || c.decisao === 'FATURAMENTO' ? 'selected' : ''}>Faturar</option>
                            <option value="Absorvido" ${c.decisao === 'Absorvido' || c.decisao === 'ABSORVIDO' ? 'selected' : ''}>Absorvido</option>
                        </select>
                    </td>
                    <td style="padding:10px;text-align:center">
                        ${c.comprovante ? `<a href="${c.comprovante}" target="_blank" style="color:#3A7BD5;font-size:.78rem">🔗 Ver</a>` : ''}
                        <button onclick="excluirCusto(${c.id})" style="background:none;border:none;color:rgba(228,234,246,.3);cursor:pointer;font-size:.85rem;margin-left:6px" title="Excluir">🗑</button>
                    </td>
                </tr>`;
    }).join('')}
        </tbody>
    </table>`;
}

// ─── Toggle form ────────────────────────────────────────────
function toggleFormCusto() {
    const card = document.getElementById('custo-form-card');
    if (!card) return;
    card.classList.toggle('hidden');
    if (!card.classList.contains('hidden')) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function cancelarCusto() {
    document.getElementById('custo-form-card')?.classList.add('hidden');
}

// ─── Salvar ─────────────────────────────────────────────────
async function salvarCusto() {
    const btnSalvar = document.querySelector('#custo-form-card .btn-primary');
    if(btnSalvar) btnSalvar.textContent = 'Salvando...';

    const clienteId = parseInt(document.getElementById('custo-cliente')?.value);
    const categoria = document.getElementById('custo-categoria')?.value;
    const fornecedor = document.getElementById('custo-fornecedor')?.value.trim();
    const data = document.getElementById('custo-data')?.value;
    const valor = parseFloat(document.getElementById('custo-valor')?.value);
    const descricaoItem = document.getElementById('custo-descricao')?.value.trim();
    const decisao = document.getElementById('custo-decisao')?.value || 'Pendente';
    const comprovante = document.getElementById('custo-comprovante')?.value.trim();
    const obs = document.getElementById('custo-obs')?.value.trim();

    if (!clienteId || !categoria || !fornecedor || !data || !valor || !descricaoItem) {
        wToast('Preencha os campos obrigatórios (*)', 'error'); 
        if(btnSalvar) btnSalvar.textContent = '💾 Adicionar Despesa';
        return;
    }
    if (isNaN(valor) || valor <= 0) {
        wToast('Valor inválido', 'error'); 
        if(btnSalvar) btnSalvar.textContent = '💾 Adicionar Despesa';
        return;
    }

    try {
        const payload = {
            clienteId,
            categoria,
            valor,
            data,
            descricao: `${fornecedor} - ${descricaoItem}`,
            status: decisao,
            comprovante,
            observacoes: obs
        };

        const res = await fetch('/api/custos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if(!res.ok) throw new Error('Falha HTTP');

        // Limpar form
        ['custo-cliente', 'custo-categoria', 'custo-fornecedor', 'custo-valor',
            'custo-descricao', 'custo-comprovante', 'custo-obs'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = el.tagName === 'SELECT' ? '' : '';
            });
        document.getElementById('custo-data').value = toDateKey(new Date());
        document.getElementById('custo-decisao').value = 'Pendente';
        
        cancelarCusto();
        wToast('💰 Custo registrado na base com sucesso!', 'success');
        
        // Recarregar lista do back-end remotamente p atualizar a grade
        await fetchCustos();

    } catch(err) {
        console.error(err);
        wToast('Erro ao salvar no servidor', 'error');
    } finally {
        if(btnSalvar) btnSalvar.textContent = '💾 Adicionar Despesa';
    }
}

// ─── Mudar decisão in-place ──────────────────────────────────
async function mudarDecisaoCusto(id, novoStatus) {
    const c = (window._custosData || []).find(x => x.id === id);
    if (!c) return;
    
    // Otimista na UI
    const statusAntigo = c.decisao;
    c.decisao = novoStatus;
    renderCustosKpis();
    // (A tela ja atualizou no onchange do select, so precisa recalcular KPIs)
    
    try {
        const res = await fetch(`/api/custos/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                clienteId: c.clienteId, 
                descricao: c.fornecedor + ' - ' + c.descricao, // recombine
                categoria: c.categoria, 
                valor: c.valor, 
                data: c.data, 
                status: novoStatus, 
                comprovante: c.comprovante, 
                observacoes: c.obs 
            })
        });
        if(!res.ok) throw new Error('HTTP Fail');
        wToast('Decisão mapeada no banco com sucesso', 'success');
    } catch(e) {
        console.error('Erro na marcacao do status', e);
        // Rollback
        c.decisao = statusAntigo;
        renderCustosKpis();
        renderCustosLocal();
        wToast('Erro ao salvar status', 'error');
    }
}

// ─── Excluir ─────────────────────────────────────────────────
async function excluirCusto(id) {
    if (!confirm('Deseja excluir PERMANENTEMENTE este custo do banco?')) return;
    
    try {
        const res = await fetch(`/api/custos/${id}`, { method: 'DELETE' });
        if(!res.ok) throw new Error('DELETE fail');
        
        window._custosData = (window._custosData || []).filter(c => c.id !== id);
        renderCustosKpis();
        renderCustosLocal();
        wToast('Custo excluído com sucesso do banco!', 'info');
    } catch(e) {
        console.error('Erro ao excluir:', e);
        wToast('Falha na exclusão remota!', 'error');
    }
}
