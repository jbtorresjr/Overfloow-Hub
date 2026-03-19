const fs = require('fs');
let code = fs.readFileSync('C:/Devs/PlataformaOF/OverfloowHub/public/js/work.js', 'utf8');

// C1 -> carregarDadosServidor
code = code.replace(
    /\/\/ ─── Carga de estado do sessionStorage ────────────────[\s\S]*?\)\(\);/,
    `// ─── Carga de estado da API ───────────────────────────
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
}`
);

// C2 -> Init Call
code = code.replace(
    /renderReimbolsos\(\);\s*\n\}\);/,
    `renderReimbolsos();\n    carregarDadosServidor();\n});`
);

// C3 -> Post Helper and Refactor registrar*
const postHelper = `
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
`;

code = code.replace(
    /function registrarPonto\(\) \{[\s\S]*?wToast\(\`\$\{PONTO_META\[proximo\]\.emoji\} \$\{PONTO_META\[proximo\]\.label\} registrada\!\`, 'success'\);\n\}/,
    `${postHelper}
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
    
    // Optimistic Update
    State.pontoEventos.push({ tipo: proximo, hora: new Date().toISOString(), local });
    renderTimeline();

    const ok = await apiPostPonto(proximo, local);
    if(ok) {
        wToast(\`\${PONTO_META[proximo].emoji} \${PONTO_META[proximo].label} registrada!\`, 'success');
        await carregarDadosServidor();
    } else {
        wToast('Erro ao salvar ponto no servidor', 'error');
        State.pontoEventos.pop();
        renderTimeline();
        if(btn) btn.disabled = false;
    }
}`
);

code = code.replace(
    /function registrarHE\(\) \{[\s\S]*?renderTimeline\(\);\n\}/,
    `async function registrarHE() {
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
}`
);

code = code.replace(
    /function registrarBH\(\) \{[\s\S]*?renderTimeline\(\);\n\}/,
    `async function registrarBH() {
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
}`
);

// Remove salvarPontoDia
code = code.replace(/function salvarPontoDia\(\) \{[\s\S]*?\}\n/, '');

// Apontamentos
code = code.replace(
    /function salvarApont\(\) \{[\s\S]*?wToast\('✅ Apontamento salvo!', 'success'\);\n\}/,
    `async function salvarApont() {
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
        
        // Limpar form
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
}`
);

fs.writeFileSync('C:/Devs/PlataformaOF/OverfloowHub/public/js/work.js', code);
console.log('work.js refatorado para usar fetch na API Ponto e Apontamentos');
