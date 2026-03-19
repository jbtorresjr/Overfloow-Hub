// ─── Auth Guard ───────────────────────────────────────────────────
const _raw = sessionStorage.getItem('of_user');
const AUTH_USER = _raw ? JSON.parse(_raw) : null;

// Se não autenticado, redirecionar para login
if (!AUTH_USER) {
    window.location.href = '/login';
}

// ─── Estado global ────────────────────────────────────────────────
const State = {
    moduloAtivo: 'aula',
    aulas: [],
    aulaAtual: null,
    areas: {},
    filtroArea: null,
    filtroStatus: '',
    busca: '',
};

// ─── Mapeamento de seções das aulas ──────────────────────────────
const SECOES = [
    { num: 1, label: 'Identificação' },
    { num: 2, label: 'Objetivos' },
    { num: 3, label: 'SIPOC' },
    { num: 4, label: 'Parte Teórica' },
    { num: 5, label: 'Parte Prática' },
    { num: 6, label: 'Outras Atividades' },
    { num: 7, label: 'Quadro CHAM-PPRT+QV' },
    { num: 8, label: 'Treinar Agente IA ★' },
];

// ─── Mapa de módulos → ids e labels ──────────────────────────────
const MODULO_MAP = {
    AULAS: { id: 'aula', icon: '📚', label: 'Aulas' },
    EDITORA: { id: 'editora', icon: '📖', label: 'E-Books' },
    AVALIACAO: { id: 'avaliacao', icon: '🏆', label: 'Avaliação' },
    RELATORIOS: { id: 'relatorios', icon: '📊', label: 'Relatórios' },
    ADMIN: { id: 'admin', icon: '⚙️', label: 'Administração' },
};

// ─── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    if (!AUTH_USER) return;  // guard duplo — já redirecionado acima

    // Montar nav dinâmica baseada nas permissões
    buildNav();

    // Badge de usuário
    buildUserBadge();

    // Carregar dados
    await carregarAreas();
    await carregarAulas();
    renderFiltroAreas();
    renderEditaraStats();

    // Admin: popular selects e tabelas
    const temAdmin = AUTH_USER.modulos.some(m =>
        (typeof m === 'string' ? m : m.codigo) === 'ADMIN'
    );
    if (temAdmin) popularAdminGrupos();

});

// ─── Nav dinâmica por permissões ──────────────────────────────────
function buildNav() {
    const nav = document.getElementById('nav-dynamic');
    if (!nav || !AUTH_USER) return;
    nav.innerHTML = '';

    const modulos = AUTH_USER.modulos || [];
    let primeiroAtivo = false;

    modulos.forEach((m) => {
        // m pode ser string ('AULAS') ou objeto ({ codigo: 'AULAS', ... })
        const cod = typeof m === 'string' ? m : (m.codigo || '');
        const info = MODULO_MAP[cod];
        if (!info) return;

        const btn = document.createElement('button');
        btn.id = `nav-${info.id}`;
        btn.className = 'nav-btn' + (!primeiroAtivo ? ' active' : '');
        btn.innerHTML = `<span class="nav-icon">${info.icon}</span><span>${info.label}</span>`;
        btn.onclick = () => setModulo(info.id);
        nav.appendChild(btn);

        if (!primeiroAtivo) {
            primeiroAtivo = true;
            setModulo(info.id);
        }
    });
}

// ─── Badge de usuário ─────────────────────────────────────────────
function buildUserBadge() {
    if (!AUTH_USER) return;
    const inicial = document.getElementById('user-initial');
    const menuNome = document.getElementById('user-menu-nome');
    const menuGrupo = document.getElementById('user-menu-grupo');
    const badge = document.getElementById('user-badge');

    if (inicial) inicial.textContent = AUTH_USER.nome?.charAt(0).toUpperCase() || '?';
    if (menuNome) menuNome.textContent = AUTH_USER.nome || '';
    if (menuGrupo) menuGrupo.textContent = AUTH_USER.grupo || '';
    if (badge) {
        badge.style.setProperty('--badge-cor', AUTH_USER.cor || '#3A7BD5');
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
document.addEventListener('click', e => {
    const badge = document.getElementById('user-badge');
    const menu = document.getElementById('user-menu');
    if (badge && menu && !badge.contains(e.target)) menu.style.display = 'none';
});

function logout() {
    sessionStorage.removeItem('of_user');
    window.location.href = '/login';
}



// ─── Áreas ────────────────────────────────────────────────────────
async function carregarAreas() {
    try {
        const res = await fetch('/api/areas');
        State.areas = await res.json();
    } catch {
        State.areas = {};
    }
}

// ─── Aulas ────────────────────────────────────────────────────────
async function carregarAulas() {
    try {
        const res = await fetch('/api/aulas');
        State.aulas = await res.json();
        renderCatalogo();
    } catch (err) {
        renderCatalogo(); // mostrará empty state
        toast('Erro ao carregar aulas: ' + err.message, 'error');
    }
}

// ─── Módulo ativo ─────────────────────────────────────────────────
function setModulo(mod) {
    State.moduloAtivo = mod;

    // Atualizar nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById(`nav-${mod}`);
    if (navBtn) navBtn.classList.add('active');

    // Mostrar módulo
    document.querySelectorAll('.modulo').forEach(m => m.classList.add('hidden'));
    const el = document.getElementById(`modulo-${mod}`);
    if (el) el.classList.remove('hidden');

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Catálogo ─────────────────────────────────────────────────────
function renderCatalogo() {
    const grid = document.getElementById('catalog-grid');
    const aulasFiltradas = getAulasFiltradas();

    if (!aulasFiltradas.length) {
        grid.innerHTML = `
      <div class="empty-state">
        <span style="font-size:2.5rem">📭</span>
        <p>${State.aulas.length === 0
                ? 'Nenhuma aula encontrada. Verifique a pasta de Aulas.'
                : 'Nenhuma aula corresponde aos filtros selecionados.'}</p>
      </div>`;
        return;
    }

    grid.innerHTML = aulasFiltradas.map(aula => renderCard(aula)).join('');
}

function renderCard(aula) {
    const cor = aula.area?.cor || '#3A7BD5';
    const glow = hexToRgba(cor, 0.15);
    const tempo = aula.tempo?.match(/\d+h[\d]*m?i?n?/)?.[0] || '2h';
    const cham = aula.nivelCHAM?.replace(/·/g, ' · ') || 'C1 · H1 · A1 · M1';
    const statusClass = `badge-status-${aula.status || 'rascunho'}`;
    const statusLabel = { rascunho: 'Rascunho', revisao: 'Em revisão', aprovada: 'Aprovada', publicada: 'Publicada' }[aula.status] || 'Rascunho';

    return `
    <div class="aula-card" style="--card-area-cor:${cor};--card-area-glow:${glow}" onclick="abrirAula('${aula.codigo}')">
      <div class="card-header-row">
        <div class="card-area-badge">${aula.area?.icone || '📚'}</div>
        <div class="card-codes">
          <div class="card-codigo">${aula.codigo}</div>
          <div class="card-area-nome">${aula.area?.nome || aula.areaCod}</div>
        </div>
      </div>
      <div class="card-titulo">${aula.titulo || aula.codigo}</div>
      <div class="card-meta">
        <span class="badge badge-tempo">⏱ ${tempo}</span>
        <span class="badge badge-cham">CHAM ${cham}</span>
        <span class="badge ${statusClass}">${statusLabel}</span>
      </div>
      <div class="card-footer">
        <span class="card-prereq">Pré-req: ${aula.prereq?.substring(0, 30) || '—'}${aula.prereq?.length > 30 ? '…' : ''}</span>
        <button class="btn-view" onclick="event.stopPropagation(); abrirAula('${aula.codigo}')">Ver aula →</button>
      </div>
    </div>`;
}

// ─── Filtros ──────────────────────────────────────────────────────
function getAulasFiltradas() {
    return State.aulas.filter(a => {
        if (State.filtroArea && a.areaCod !== State.filtroArea) return false;
        if (State.filtroStatus && a.status !== State.filtroStatus) return false;
        if (State.busca) {
            const q = State.busca.toLowerCase();
            if (!a.codigo.toLowerCase().includes(q) &&
                !a.titulo.toLowerCase().includes(q) &&
                !(a.area?.nome || '').toLowerCase().includes(q)) return false;
        }
        return true;
    });
}

function filtrarAulas() {
    State.busca = document.getElementById('search-input').value;
    State.filtroStatus = document.getElementById('filter-status').value;
    renderCatalogo();
}

function filtrarArea(areaCod, btn) {
    State.filtroArea = areaCod;
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderCatalogo();
}

function renderFiltroAreas() {
    const container = document.getElementById('filter-areas');
    const areas = Object.entries(State.areas);
    areas.forEach(([cod, area]) => {
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.style.cssText = `--chip-cor:${area.cor}`;
        btn.textContent = `${area.icone} ${area.nome}`;
        btn.onclick = () => filtrarArea(cod, btn);
        btn.addEventListener('click', function () {
            if (State.filtroArea === cod) {
                // toggle off
                State.filtroArea = null;
                document.querySelector('.chip-all').classList.add('active');
                this.classList.remove('active');
                this.style.background = '';
                this.style.color = '';
                this.style.borderColor = '';
            } else {
                document.querySelectorAll('.chip').forEach(c => {
                    c.classList.remove('active');
                    c.style.background = '';
                    c.style.color = '';
                    c.style.borderColor = '';
                });
                State.filtroArea = cod;
                this.classList.add('active');
                this.style.background = area.cor;
                this.style.color = '#fff';
                this.style.borderColor = area.cor;
            }
            renderCatalogo();
        });
        container.appendChild(btn);
    });
}

// ─── Viewer ───────────────────────────────────────────────────────
async function abrirAula(codigo) {
    try {
        toast('Carregando aula…', 'info');
        const res = await fetch(`/api/aulas/${codigo}`);
        if (!res.ok) throw new Error('Aula não encontrada');
        const data = await res.json();
        State.aulaAtual = data;

        // Definir CSS variables da área no viewer
        const cor = data.area?.cor || '#3A7BD5';
        const glow = hexToRgba(cor, 0.15);
        document.documentElement.style.setProperty('--viewer-cor', cor);
        document.documentElement.style.setProperty('--viewer-glow', glow);
        document.documentElement.style.setProperty('--print-area-cor', cor);

        renderViewer(data);
        setModulo('viewer');

    } catch (err) {
        toast('Erro ao carregar aula: ' + err.message, 'error');
    }
}

function renderViewer(data) {
    // Sidebar meta
    document.getElementById('sidebar-meta').innerHTML = `
    <div class="meta-codigo">${data.codigo}</div>
    <div class="meta-titulo">${extrairTitulo(data.conteudo)}</div>
    <div class="meta-area">${data.area?.icone} ${data.area?.nome}</div>`;

    // Sidebar seções
    const nav = document.getElementById('sidebar-sections');
    nav.innerHTML = SECOES.map(s => `
    <button class="section-link" onclick="scrollParaSecao(${s.num}, this)">
      <span class="section-num">${s.num}</span>
      <span class="section-label">${s.label}</span>
    </button>`).join('');

    // Conteúdo renderizado
    const md = processarMarkdown(data.conteudo, data);
    const content = document.getElementById('viewer-content');
    content.innerHTML = marked.parse(md);

    // Pós-processamento: estilizar placeholders de imagem
    estilizarPlaceholders(content, data.area?.cor);

    // Adicionar IDs nas seções para scroll
    adicionarIdSecoes(content);
}

function processarMarkdown(conteudo, data) {
    // Remover as linhas de borda decorativa do .md
    let md = conteudo
        .replace(/^═+.*═+$/gm, '')
        .trim();

    // Adicionar capa virtual no topo
    const titulo = extrairTitulo(conteudo);
    const tempo = extrairCampo(conteudo, 'Tempo Estimado') || '2h';
    const cham = extrairCampo(conteudo, 'Nível CHAM Mínimo — Humano') || '';
    const cor = data.area?.cor || '#3A7BD5';
    const nomeArea = data.area?.nome || '';

    const capa = `
<div class="viewer-cover" style="background: linear-gradient(135deg, ${cor} 0%, var(--bg) 100%);">
  <img src="/logo" class="viewer-cover-logo" alt="Overfloow" onerror="this.style.display='none'" />
  <div>
    <div class="viewer-cover-code">${data.codigo}</div>
    <h1 class="viewer-cover-title">${titulo}</h1>
    <p class="viewer-cover-sub">${nomeArea} | Degust One (Linx)</p>
  </div>
  <div class="viewer-cover-badges">
    <span class="badge">⏱ ${tempo}</span>
    <span class="badge">CHAM ${cham}</span>
    <span class="badge">${data.area?.icone || '📚'} ${nomeArea}</span>
  </div>
</div>`;

    return capa + '\n\n' + md;
}

function estilizarPlaceholders(container, cor) {
    const paragrafos = container.querySelectorAll('p');
    paragrafos.forEach(p => {
        if (p.textContent.includes('🖼️ IMAGEM:')) {
            const desc = p.textContent.replace('[🖼️ IMAGEM:', '').replace(']', '').trim();
            const div = document.createElement('div');
            div.className = 'img-placeholder';
            div.style.cssText = `
        border: 2px dashed ${cor || '#3A7BD5'};
        border-radius: 8px; padding: 32px; text-align: center;
        background: ${hexToRgba(cor || '#3A7BD5', 0.06)};
        color: ${cor || '#3A7BD5'}; margin: 16px 0;
        font-size: .88rem; line-height: 1.5;`;
            div.innerHTML = `
        <div style="font-size:2rem;margin-bottom:8px">🖼️</div>
        <strong>Inserir imagem</strong>
        <p style="margin:6px 0 0;opacity:.8;font-size:.82rem">${desc}</p>`;
            p.replaceWith(div);
        }
    });
}

function adicionarIdSecoes(container) {
    const h2s = container.querySelectorAll('h2');
    h2s.forEach(h2 => {
        const texto = h2.textContent;
        SECOES.forEach(s => {
            if (texto.includes(`[${s.num}]`) || texto.toLowerCase().includes(s.label.toLowerCase().substring(0, 6))) {
                h2.id = `secao-${s.num}`;
            }
        });
    });
}

function scrollParaSecao(num, btn) {
    document.querySelectorAll('.section-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const el = document.getElementById(`secao-${num}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function voltarCatalogo() {
    document.documentElement.style.removeProperty('--viewer-cor');
    document.documentElement.style.removeProperty('--viewer-glow');
    setModulo('aula');
}

// ─── PDF ──────────────────────────────────────────────────────────
function exportarPDF() {
    toast('Preparando PDF…', 'info');
    // Pequeno delay para toast aparecer
    setTimeout(() => {
        document.title = State.aulaAtual?.codigo || 'Overfloow Learn';
        window.print();
        document.title = 'Overfloow Learn';
    }, 300);
}

function exportarCertificado() {
    toast('Preparando certificado…', 'info');
    setTimeout(() => { document.title = 'Certificado Overfloow©'; window.print(); document.title = 'Overfloow Learn'; }, 300);
}

// ─── MÓDULO AVALIAÇÃO ─────────────────────────────────────────────

// ─── Quiz (demo funcional com questões simuladas da SP02-A001) ────
const DEMO_QUESTOES = [
    { dim: 'C', enunciado: 'Qual é a finalidade principal da conferência prévia da NF antes de acessar o sistema?', opcoes: ['Evitar duplicidade e pagamentos incorretos detectando erros antes do lançamento', 'Verificar se a NF está carimbada pelo fornecedor', 'Calcular os impostos retidos manualmente', 'Registrar a data de recebimento no protocolo'], correta: 0, justificativas: ['Correta — a conferência prévia detecta erros antes de qualquer ação no sistema.', 'Incorreta — carimbo não é requisito legal para o lançamento.', 'Incorreta — o cálculo de impostos é feito no sistema após a conferência.', 'Parcialmente correta — o protocolo é importante, mas não é o foco da conferência prévia.'] },
    { dim: 'H', enunciado: 'Durante a conferência do Checklist, você percebe que o CNPJ da NF é diferente do fornecedor esperado. Qual é o passo correto?', opcoes: ['Lançar mesmo assim para não atrasar o pagamento', 'PARAR e contatar o Compras/fornecedor antes de qualquer ação no sistema', 'Corrigir o CNPJ manualmente no sistema', 'Solicitar ao gestor para aprovar mesmo assim'], correta: 1, justificativas: ['Incorreto — lançar com diferença de CNPJ é fraude em potencial.', 'Correta — qualquer divergência de CNPJ exige parada e verificação imediata.', 'Incorreto — o sistema não permite correção de CNPJ de NF já lançada.', 'Incorreto — gestor não deve aprovar lançamento com inconsistência de CNPJ.'] },
    { dim: 'H', enunciado: 'Ao pesquisar a NF no sistema para verificar duplicidade, o sistema retorna um resultado com o mesmo número e CNPJ. O que fazer?', opcoes: ['Confirmar o lançamento assim mesmo — pode ser erro do sistema', 'PARAR imediatamente e notificar o gestor com evidência da duplicidade', 'Excluir o lançamento anterior e lançar o novo', 'Contatar o fornecedor para emitir uma nova NF'], correta: 1, justificativas: ['Incorreto — duplicidade não é erro do sistema, é risco real de pagamento em dobro.', 'Correta — duplicidade detectada exige parada e escalada imediata ao gestor.', 'Incorreto — excluir lançamento anterior sem autorização é inaceitável.', 'Incorreto — o problema não é da NF, é que ela já foi lançada.'] },
    { dim: 'C', enunciado: 'O que é o DANFe?', opcoes: ['O arquivo XML oficial da Nota Fiscal eletrônica', 'O documento auxiliar (versão impressa) da NF-e — apenas para controle operacional', 'O comprovante de pagamento do boleto', 'O recibo assinado pelo fornecedor'], correta: 1, justificativas: ['Incorreto — o XML é o arquivo eletrônico oficial; o DANFe é o auxiliar impresso.', 'Correta — DANFe é a versão impressa auxiliar; o XML é o documento com validade jurídica.', 'Incorreto — comprovante de pagamento é gerado pelo banco após a transação.', 'Incorreto — DANFe não é assinado; é um documento eletrônico com código de barras.'] },
    { dim: 'P', enunciado: 'Qual é a sequência correta do fluxo desta aula?', opcoes: ['Abrir sistema → Lançar NF → Verificar CNPJ → Conferir duplicidade', 'Receber NF → Preencher Checklist → Validar CNPJ → Verificar duplicidade → Abrir formulário', 'Aprovar pagamento → Verificar CNPJ → Lançar NF → Conciliar', 'Conciliar extrato → Lançar NF → Verificar CNPJ → Emitir boleto'], correta: 1, justificativas: ['Incorreto — nunca abrir o sistema antes de conferir a NF fisicamente.', 'Correta — o fluxo começa na conferência física e passa pela validação antes de acessar o sistema.', 'Incorreto — a aprovação é um SP diferente (SP03), posterior ao lançamento.', 'Incorreto — a conciliação é um SP posterior (SP05).'] },
    { dim: 'T', enunciado: 'No Degust One, onde se acessa a pesquisa de duplicidade de NF?', opcoes: ['Menu: Fiscal → Emissão → Nova NF', 'Menu: Financeiro → Contas a Pagar → Consultar Lançamentos', 'Menu: Estoque → Recebimento → Notas Fiscais', 'Menu: Compras → Pedidos → Fornecedores'], correta: 1, justificativas: ['Incorreto — esse menu é para emissão de NF de saída, não consulta de CP.', 'Correta — o caminho correto para verificar duplicidade em CP é Financeiro → CP → Consultar Lançamentos.', 'Incorreto — esse menu é para recebimento de produtos no estoque.', 'Incorreto — esse menu é para gestão de pedidos de compras, não lançamentos financeiros.'] },
    { dim: 'A', enunciado: 'O prazo está apertado e o gestor pressiona para lançar a NF sem fazer a conferência prévia. O que você deve fazer?', opcoes: ['Lançar mesmo sem conferência para não desagradar o gestor', 'Fazer a conferência rapidamente mas sem registrar no checklist', 'MANTER o processo: explicar ao gestor que a conferência leva 10 minutos e protege a empresa de fraudes', 'Pedir ao colega que lance por você para a responsabilidade ser dele'], correta: 2, justificativas: ['Incorreto — pressão de prazo não justifica pular controles internos.', 'Parcialmente correto — fazer a conferência é certo, mas o checklist é obrigatório.', 'Correta — o analista deve manter o processo e explicar o valor da conferência.', 'Incorreto — delegar para escapar da responsabilidade é antiético e gera risco operacional.'] },
    { dim: 'M', enunciado: 'Você recebe uma NF com data de emissão de 45 dias atrás. Não há política escrita da empresa sobre prazo máximo de NFs. O que fazer?', opcoes: ['Lançar normalmente — não há política proibindo', 'Rejeitar a NF sem questionar', 'Consultar o gestor ou o setor fiscal antes de lançar, registrando a situação', 'Lançar mas com data de hoje no campo de emissão'], correta: 2, justificativas: ['Incorreto — ausência de política escrita não significa que o procedimento é seguro.', 'Incorreto — rejeitar sem consultar pode bloquear pagamento legítimo.', 'Correta — situação sem precedente claro exige consulta ao gestor e registro da ocorrência.', 'Incorreto — falsificar a data de emissão é fraude contábil.'] },
];

let quizState = {
    atual: 0, respostas: [], selecionada: null, revelada: false,
    aluno: '', aula: '', turma: ''
};

function iniciarQuiz() {
    const aluno = document.getElementById('quiz-aluno').value;
    const aula = document.getElementById('quiz-aula').value || 'TES-P01-SP02-T07-A001';
    const turma = document.getElementById('quiz-turma').value;
    if (!aluno) { toast('Informe o nome do aluno para iniciar.', 'error'); return; }
    quizState = { atual: 0, respostas: [], selecionada: null, revelada: false, aluno, aula, turma };
    document.getElementById('quiz-container').classList.remove('hidden');
    document.getElementById('quiz-resultado').classList.add('hidden');
    renderQuestao();
}

function renderQuestao() {
    const q = DEMO_QUESTOES[quizState.atual];
    const total = DEMO_QUESTOES.length;
    const prog = ((quizState.atual + 1) / total) * 100;
    document.getElementById('quiz-pos').textContent = `Questão ${quizState.atual + 1} de ${total}`;
    document.getElementById('quiz-dim').textContent = `Dimensão: ${q.dim}`;
    document.getElementById('quiz-progress-fill').style.width = `${prog}%`;

    const isUltima = quizState.atual === total - 1;
    document.getElementById('quiz-next-btn').textContent = isUltima ? 'Ver Resultado ✓' : 'Próxima →';

    document.getElementById('quiz-card').innerHTML = `
    <div class="quiz-enunciado">${quizState.atual + 1}. ${q.enunciado}</div>
    <div class="quiz-opcoes">
      ${q.opcoes.map((txt, i) => `
        <div class="quiz-opcao" id="opcao-${i}" onclick="selecionarOpcao(${i})">
          <div class="opcao-letra">${'ABCD'[i]}</div>
          <div>
            <div class="opcao-texto">${txt}</div>
            <div class="quiz-justificativa" id="just-${i}">${q.justificativas[i]}</div>
          </div>
        </div>`).join('')}
    </div>`;

    quizState.selecionada = quizState.respostas[quizState.atual] ?? null;
    quizState.revelada = false;
    if (quizState.selecionada !== null) aplicarSelecao(quizState.selecionada, false);
}

function selecionarOpcao(i) {
    if (quizState.revelada) return;
    quizState.selecionada = i;
    document.querySelectorAll('.quiz-opcao').forEach(el => el.classList.remove('selecionada'));
    document.getElementById(`opcao-${i}`).classList.add('selecionada');
}

function aplicarSelecao(i, revelar = true) {
    document.querySelectorAll('.quiz-opcao').forEach(el => el.classList.remove('selecionada', 'correta', 'errada', 'revelada'));
    document.getElementById(`opcao-${i}`).classList.add('selecionada');
    if (revelar) {
        const correta = DEMO_QUESTOES[quizState.atual].correta;
        quizState.revelada = true;
        document.getElementById(`opcao-${correta}`).classList.add('correta', 'revelada');
        if (i !== correta) document.getElementById(`opcao-${i}`).classList.add('errada', 'revelada');
        document.querySelectorAll('.quiz-justificativa').forEach(el => el.style.display = 'block');
    }
}

function quizAvancar() {
    if (quizState.selecionada === null) { toast('Selecione uma alternativa antes de avançar.', 'error'); return; }
    if (!quizState.revelada) { aplicarSelecao(quizState.selecionada, true); setTimeout(() => _avancarParaProxima(), 1200); }
    else _avancarParaProxima();
}

function _avancarParaProxima() {
    quizState.respostas[quizState.atual] = quizState.selecionada;
    if (quizState.atual < DEMO_QUESTOES.length - 1) { quizState.atual++; quizState.selecionada = null; renderQuestao(); }
    else mostrarResultado();
}

function quizAnterior() {
    if (quizState.atual > 0) { quizState.atual--; renderQuestao(); }
}

function mostrarResultado() {
    document.getElementById('quiz-container').classList.add('hidden');
    const scores = { C: [], H: [], A: [], M: [], P: [], T: [] };
    quizState.respostas.forEach((resp, i) => {
        const q = DEMO_QUESTOES[i];
        if (!scores[q.dim]) scores[q.dim] = [];
        scores[q.dim].push(resp === q.correta ? 5 : resp !== null ? 2.5 : 0);
    });
    const media = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';
    const cham = ((+media(scores.C) + +media(scores.H) + +(scores.A.length ? media(scores.A) : 2.5) + +(scores.M.length ? media(scores.M) : 2.5)) / 4).toFixed(1);
    const pprt = ((+media(scores.P) + 0 + +(scores.T.length ? media(scores.T) : 2.5)) / 3).toFixed(1);
    const acertos = quizState.respostas.filter((r, i) => r === DEMO_QUESTOES[i].correta).length;
    const pct = Math.round((acertos / DEMO_QUESTOES.length) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '✅' : '📚';
    const msg = pct >= 80 ? 'Excelente domínio!' : pct >= 60 ? 'Aprovado!' : 'Continue estudando!';

    document.getElementById('quiz-resultado').innerHTML = `
    <div class="resultado-emoji">${emoji}</div>
    <div class="resultado-titulo">${msg} — ${acertos}/${DEMO_QUESTOES.length} acertos (${pct}%)</div>
    <p style="color:var(--text-2);margin-bottom:20px">Aluno: <strong>${quizState.aluno}</strong> | Aula: ${quizState.aula}</p>
    <div class="resultado-scores">
      <div class="score-item"><span class="score-val">${media(scores.C)}</span><span class="score-label">C — Conhecimento</span></div>
      <div class="score-item"><span class="score-val">${media(scores.H)}</span><span class="score-label">H — Habilidade</span></div>
      <div class="score-item"><span class="score-val">${cham}</span><span class="score-label">CHAM</span></div>
      <div class="score-item"><span class="score-val">${media(scores.P)}</span><span class="score-label">P — Processo</span></div>
      <div class="score-item"><span class="score-val">${media(scores.T)}</span><span class="score-label">T — Tecnologia</span></div>
      <div class="score-item"><span class="score-val">${pprt}</span><span class="score-label">PPRT</span></div>
    </div>
    <p class="muted">Q e V serão avaliados pelo professor na Sessão QV. Conecte ao banco datafloow para salvar permanentemente.</p>
    <button class="btn-primary" style="margin:20px auto;display:inline-flex" onclick="reiniciarQuiz()">🔄 Novo Quiz</button>`;
    document.getElementById('quiz-resultado').classList.remove('hidden');
    toast(`Quiz concluído! CHAM: ${cham} | PPRT: ${pprt}`, 'success');
}

function reiniciarQuiz() {
    quizState = { atual: 0, respostas: [], selecionada: null, revelada: false, aluno: quizState.aluno, aula: quizState.aula, turma: quizState.turma };
    document.getElementById('quiz-resultado').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');
    renderQuestao();
}

// ─── Módulo QV ───────────────────────────────────────────────────
function abrirSessaoQV() {
    const turma = document.getElementById('qv-turma').value;
    const aula = document.getElementById('qv-aula').value || 'TES-P01-SP02-T07-A001';
    if (!turma) { toast('Informe a turma para abrir a sessão.', 'error'); return; }
    const alunos = ['Ana Souza', 'Bruno Costa', 'Carla Matos'];
    const grid = document.getElementById('qv-grid');
    grid.innerHTML = alunos.map((nome, i) => `
    <div class="qv-card">
      <div class="qv-aluno-nome">👤 ${nome}</div>
      <div class="qv-slider-group">
        <div class="qv-slider-label"><span>Q — Qualidade</span><span id="qv-q-val-${i}">3.0</span></div>
        <input type="range" class="qv-slider" min="0" max="5" step="0.5" value="3"
          oninput="document.getElementById('qv-q-val-${i}').textContent=parseFloat(this.value).toFixed(1);calcQVNota(${i})" />
      </div>
      <div class="qv-slider-group">
        <div class="qv-slider-label"><span>V — Velocidade</span><span id="qv-v-val-${i}">3.0</span></div>
        <input type="range" class="qv-slider" min="0" max="5" step="0.5" value="3"
          oninput="document.getElementById('qv-v-val-${i}').textContent=parseFloat(this.value).toFixed(1);calcQVNota(${i})" />
      </div>
      <div class="qv-nota-display" id="qv-nota-${i}">3.0</div>
    </div>`).join('');
    toast(`Sessão QV aberta — Aula: ${aula} | Turma: ${turma}`, 'success');
}

function calcQVNota(i) {
    const q = parseFloat(document.querySelectorAll('.qv-slider')[i * 2].value);
    const v = parseFloat(document.querySelectorAll('.qv-slider')[i * 2 + 1].value);
    document.getElementById(`qv-nota-${i}`).textContent = ((q + v) / 2).toFixed(1);
}

// ─── Tabs do módulo de avaliação ─────────────────────────────────
function setAvTab(tab, btn) {
    document.querySelectorAll('.av-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.av-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`avpanel-${tab}`).classList.remove('hidden');
    // Popular select de aulas nos formulários
    if (tab === 'quiz' || tab === 'qv') popularSelectAulas();
}

function popularSelectAulas() {
    const selects = ['quiz-aula', 'qv-aula'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el || el.options.length > 1) return;
        State.aulas.forEach(a => el.add(new Option(`${a.codigo} — ${a.titulo?.substring(0, 40)}`, a.codigo)));
    });
}


// ─── Editora Stats ────────────────────────────────────────────────
function renderEditaraStats() {
    const totalAulas = State.aulas.length;
    const totalAreas = new Set(State.aulas.map(a => a.areaCod)).size;
    const totalHoras = State.aulas.length * 2; // TP=2h

    document.getElementById('editora-stats').innerHTML = `
    <div class="stat-item"><span class="stat-num">${totalAulas}</span><span class="stat-label">Aulas</span></div>
    <div class="stat-item"><span class="stat-num">${totalAreas}</span><span class="stat-label">Áreas</span></div>
    <div class="stat-item"><span class="stat-num">${totalHoras}h</span><span class="stat-label">Conteúdo</span></div>`;
}

// ─── Tema ─────────────────────────────────────────────────────────
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
}

// ─── Helpers ──────────────────────────────────────────────────────
function extrairTitulo(conteudo) {
    const match = conteudo.match(/SubProcesso \/ Detalhe\s*\|\s*([^\|]+)/);
    return match ? match[1].trim() : 'Aula';
}

function extrairCampo(conteudo, campo) {
    // Busca em tabela markdown
    const regex = new RegExp(`\\*\\*${campo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*\\s*\\|\\s*([^\\|\\n]+)`);
    const match = conteudo.match(regex);
    return match ? match[1].trim() : null;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function toast(msg, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const div = document.createElement('div');
    div.className = `toast toast-${tipo === 'error' ? 'error' : tipo === 'success' ? 'success' : ''}`;
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

// ─── MÓDULO ADMIN ────────────────────────────────────────────────

// Dados de grupos para demo (espelha os DEMO_USERS do servidor)
const ADMIN_GRUPOS = [
    { codigo: 'ADMIN', nome: 'Administração', cor: '#1A3A6C', descricao: 'Acesso total.', modulos: ['AULAS', 'EDITORA', 'AVALIACAO', 'RELATORIOS', 'ADMIN'] },
    { codigo: 'GERENTE_DEV', nome: 'Gerente DEV', cor: '#5A2D82', descricao: 'Gestão completa sem Admin.', modulos: ['AULAS', 'EDITORA', 'AVALIACAO', 'RELATORIOS'] },
    { codigo: 'PROFESSOR', nome: 'Professor', cor: '#0A6E5D', descricao: 'Aulas, avaliações e relatórios.', modulos: ['AULAS', 'AVALIACAO', 'RELATORIOS'] },
    { codigo: 'ALUNO', nome: 'Aluno', cor: '#A07000', descricao: 'Aulas por CHAM e quizzes.', modulos: ['AULAS', 'AVALIACAO'] },
    { codigo: 'BPO', nome: 'BPO — Gestor', cor: '#C4380C', descricao: 'Avaliações QV e relatórios.', modulos: ['AVALIACAO', 'RELATORIOS'] },
    { codigo: 'IAH', nome: 'IAH — Analista', cor: '#005FAD', descricao: 'Avaliações de agentes de IA.', modulos: ['AVALIACAO'] },
];

const PERM_LABELS = { perm_acesso: 'Acesso', perm_inclusao: 'Inclusão', perm_edicao: 'Edição', perm_exclusao: 'Exclusão', perm_exportacao: 'Exportação', perm_impressao: 'Impressão' };
const MODULO_PERMS = {
    AULAS: { perm_acesso: true, perm_inclusao: false, perm_edicao: false, perm_exclusao: false, perm_exportacao: false, perm_impressao: true },
    EDITORA: { perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
    AVALIACAO: { perm_acesso: true, perm_inclusao: true, perm_edicao: false, perm_exclusao: false, perm_exportacao: true, perm_impressao: true },
    RELATORIOS: { perm_acesso: true, perm_inclusao: false, perm_edicao: false, perm_exclusao: false, perm_exportacao: true, perm_impressao: false },
    ADMIN: { perm_acesso: true, perm_inclusao: true, perm_edicao: true, perm_exclusao: true, perm_exportacao: true, perm_impressao: true },
};

function popularAdminGrupos() {
    // Tabela de grupos
    const tbody = document.getElementById('tbl-grupos-body');
    if (tbody) {
        tbody.innerHTML = ADMIN_GRUPOS.map(g => `
          <tr>
            <td><span style="display:inline-block;width:16px;height:16px;border-radius:4px;background:${g.cor};vertical-align:middle"></span></td>
            <td><code>${g.codigo}</code></td>
            <td>${g.nome}</td>
            <td style="color:var(--text-2);font-size:.86rem">${g.descricao}</td>
            <td>${g.modulos.map(m => `<span class="badge badge-tempo" style="margin:2px">${MODULO_MAP[m]?.icon} ${m}</span>`).join('')}</td>
          </tr>`).join('');
    }
    // Select de grupos para permissões
    const sel = document.getElementById('perm-grupo-sel');
    if (sel) ADMIN_GRUPOS.forEach(g => sel.add(new Option(g.nome, g.codigo)));
}

function setAdminTab(tab, btn) {
    document.querySelectorAll('#modulo-admin .av-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['grupos', 'modulos', 'permissoes'].forEach(t => {
        const el = document.getElementById(`admin-panel-${t}`);
        if (el) el.classList.toggle('hidden', t !== tab);
    });
}

function renderPermissoes(grupoCodigo) {
    const wrap = document.getElementById('perm-table-wrap');
    if (!wrap) return;
    const grupo = ADMIN_GRUPOS.find(g => g.codigo === grupoCodigo);
    if (!grupo) { wrap.innerHTML = '<div class="av-placeholder"><span class="av-placeholder-icon">🔐</span><p>Selecione um grupo.</p></div>'; return; }

    const TODOS_MODULOS = ['AULAS', 'EDITORA', 'AVALIACAO', 'RELATORIOS', 'ADMIN'];
    const permKeys = Object.keys(PERM_LABELS);

    wrap.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr><th>Módulo</th>${permKeys.map(k => `<th>${PERM_LABELS[k]}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${TODOS_MODULOS.map(cod => {
        const temAcesso = grupo.modulos.includes(cod);
        // Permissões baseadas no grupo (simplificado)
        let perms = {};
        if (!temAcesso) { permKeys.forEach(k => perms[k] = false); }
        else if (grupoCodigo === 'ADMIN' || grupoCodigo === 'GERENTE_DEV') { permKeys.forEach(k => perms[k] = true); }
        else { perms = MODULO_PERMS[cod] || {}; }
        return `<tr style="${!temAcesso ? 'opacity:.4' : ''}">
                <td>${MODULO_MAP[cod]?.icon} <strong>${cod}</strong></td>
                ${permKeys.map(k => `<td style="text-align:center">${perms[k] ? '<span style="color:var(--success)">✓</span>' : '<span style="color:var(--danger)">✗</span>'}</td>`).join('')}
              </tr>`;
    }).join('')}
        </tbody>
      </table>`;
}

