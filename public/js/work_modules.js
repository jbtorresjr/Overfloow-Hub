// ══════════════════════════════════════════════════════
// EXTENSÃO DO APP WORK: Módulos Secundários Restaurados
// ══════════════════════════════════════════════════════

// -- REEMBOLSOS ----------------------------------------
function popularReimbClienteSelect() {
    const sel = document.getElementById('reimb-cliente');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecionar cliente...</option>' + 
        (window.CLIENTES || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function reimb_filtrarProjetos() {
    const cliId = parseInt(document.getElementById('reimb-cliente').value);
    const selP = document.getElementById('reimb-projeto');
    if (!selP) return;
    selP.innerHTML = '<option value="">Selecionar projeto...</option>';
    if (!cliId) return;
    const projs = (window.PROJETOS || []).filter(p => p.clienteId === cliId);
    selP.innerHTML += projs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

function novaReimb() {
    const form = document.getElementById('reimb-form');
    if(form) form.classList.toggle('hidden');
}

function renderReimbolsos() {
    const lista = document.getElementById('reimb-lista');
    if(!lista) return;
    lista.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhuma solicitação de reembolso no momento.</div>';
}

// -- EQUIPE --------------------------------------------
function renderEquipe() {
    const grid = document.getElementById('equipe-grid');
    if(!grid) return;
    if(!window.EQUIPE) return;
    grid.innerHTML = window.EQUIPE.map(e => `
        <div class="w-card" style="padding: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${e.cor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">${e.nome.charAt(0)}</div>
                <div>
                    <div style="font-weight: 600;">${e.nome}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${e.cargo}</div>
                </div>
            </div>
            <div style="font-size: 0.85rem;">
                <div><strong style="color:var(--text)">Vínculo:</strong> ${e.tipo}</div>
                <div><strong style="color:var(--text)">Jornada:</strong> ${e.horasMes}h/mês</div>
                <div><strong style="color:var(--text)">Banco Horas:</strong> <span style="color: ${e.bhSaldo >= 0 ? '#22c55e' : '#ef4444'}">${e.bhSaldo}h</span></div>
            </div>
        </div>
    `).join('');
}

function setEquipeTab(tab) {
    ['equipe', 'jornadas', 'dist'].forEach(t => {
        const btn = document.getElementById(`etab-${t}`);
        const div = document.getElementById(`equipe-tab-${t}`);
        if(btn) btn.classList.remove('active');
        if(div) div.classList.add('hidden');
    });
    const btnAtivo = document.getElementById(`etab-${tab}`);
    const divAtivo = document.getElementById(`equipe-tab-${tab}`);
    if(btnAtivo) btnAtivo.classList.add('active');
    if(divAtivo) divAtivo.classList.remove('hidden');
}

// -- RELATÓRIOS -----------------------------------------
function renderRelatorios() {
    const grid = document.getElementById('relat-kpis-grid');
    if(!grid) return;
    grid.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-label">Horas Apontadas</div>
            <div class="kpi-val">142h</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Projetos Ativos</div>
            <div class="kpi-val">8</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Reembolsos Pendentes</div>
            <div class="kpi-val">R$ 450,00</div>
        </div>
    `;
}

function setRelatTab(tab) {
    ['kpis', 'horas', 'rateio', 'reimb'].forEach(t => {
        const btn = document.getElementById(`rtab-${t}`);
        const div = document.getElementById(`relat-tab-${t}`);
        if(btn) btn.classList.remove('active');
        if(div) div.classList.add('hidden');
    });
    const btnAtivo = document.getElementById(`rtab-${tab}`);
    const divAtivo = document.getElementById(`relat-tab-${tab}`);
    if(btnAtivo) btnAtivo.classList.add('active');
    if(divAtivo) divAtivo.classList.remove('hidden');
}

// -- REUNIÕES -----------------------------------------
function setReunTab(tab) {
    ['agenda', 'lista', 'form'].forEach(t => {
        const btn = document.getElementById(`rtab2-${t}`);
        const div = document.getElementById(`reun-tab-${t}`);
        if(btn) btn.classList.remove('active');
        if(div) div.classList.add('hidden');
    });
    const btnAtivo = document.getElementById(`rtab2-${tab}`);
    const divAtivo = document.getElementById(`reun-tab-${tab}`);
    if(btnAtivo) btnAtivo.classList.add('active');
    if(divAtivo) divAtivo.classList.remove('hidden');
}

function novaReuniao() {
    setReunTab('form');
    // Popula clientes ao abrir o form
    popularReunClienteSelect();
}

function renderProjetosGrid() {
    const g = document.getElementById('proj-grid');
    if (!g) return;
    const projs = window.PROJETOS || [];
    if (projs.length === 0) {
        g.innerHTML = '<div style="padding:24px; color:var(--text-muted); text-align:center">Nenhum projeto cadastrado. Clique em <strong>+ Novo Projeto</strong> para começar.</div>';
        return;
    }
    g.innerHTML = projs.map(p => {
        const cli = (window.CLIENTES || []).find(c => c.id === p.clienteId);
        const cliNome = cli ? cli.nome : `Cliente #${p.clienteId}`;
        const cliCor  = cli ? cli.cor : p.cor;
        return `
        <div class="w-card" style="padding:16px; border-left:3px solid ${p.cor}">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div style="font-weight:600; color:${p.cor}; font-size:1rem">${p.nome}</div>
                <div class="status-badge ${(p.status||'').toLowerCase()}">${p.status}</div>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cliCor};margin-right:5px"></span>${cliNome}
            </div>
            <div style="font-size:0.82rem; color:var(--text); display:flex; gap:12px; margin-bottom:10px;">
                <span>HE: ${p.permiteHE ? '✅' : '❌'}</span>
                <span>BH: ${p.permiteBH ? '✅' : '❌'}</span>
            </div>
            <div style="display:flex; gap:8px; justify-content:flex-end">
                <button onclick="editarProjeto(${p.id})" style="background:rgba(58,123,213,.12);border:1px solid rgba(58,123,213,.3);color:#3A7BD5;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.78rem">✏️ Editar</button>
                <button onclick="excluirProjeto(${p.id})" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.78rem">🗑 Excluir</button>
            </div>
        </div>`;
    }).join('');
}

function toggleFormProjeto() {
    const form = document.getElementById('proj-form');
    if (!form) return;
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) popularProjetoClienteSelect();
}

function popularProjetoClienteSelect() {
    const sel = document.getElementById('proj-cliente');
    if (!sel) return;
    sel.innerHTML = '<option value="">Selecionar cliente...</option>' + 
        (window.CLIENTES || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

async function salvarProjeto() {
    const btn = document.querySelector('#proj-form .btn-save');
    const clienteId = parseInt(document.getElementById('proj-cliente').value);
    const nome = document.getElementById('proj-nome').value.trim();
    const cor = document.getElementById('proj-cor').value;
    const permiteHE = document.getElementById('proj-he').checked;
    const permiteBH = document.getElementById('proj-bh').checked;

    if (!clienteId || !nome) return wToast('Preencha Cliente e Nome do Projeto!', 'error');

    if(btn) btn.textContent = 'Salvando...';
    try {
        const res = await fetch('/api/projetos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ clienteId, nome, cor, permiteHE, permiteBH, status: 'ATIVO' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha');

        wToast('✅ Projeto criado!', 'success');
        // Recarrega projetos da API
        const resProjs = await fetch('/api/projetos');
        if(resProjs.ok) window.PROJETOS = await resProjs.json();
        renderProjetosGrid();
        toggleFormProjeto();
        // Resetar form
        document.getElementById('proj-nome').value = '';
        document.getElementById('proj-cliente').value = '';
    } catch(e) {
        console.error(e);
        wToast('Erro ao salvar projeto.', 'error');
    } finally {
        if(btn) btn.textContent = '+ Salvar Projeto';
    }
}

// -- REUNIÕES: handlers de salvar ---------------------
function popularReunClienteSelect() {
    const sel = document.getElementById('reun-cliente');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Nenhum / Interno —</option>' +
        (window.CLIENTES || []).map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    // Limpa o select de projeto ao recarregar clientes
    const selP = document.getElementById('reun-projeto');
    if (selP) selP.innerHTML = '<option value="">— Nenhum projeto —</option>';
}

function reun_filtrarProjetos() {
    const cliId = parseInt(document.getElementById('reun-cliente')?.value);
    const selP  = document.getElementById('reun-projeto');
    if (!selP) return;
    selP.innerHTML = '<option value="">— Nenhum projeto —</option>';
    if (!cliId) return;
    const projs = (window.PROJETOS || []).filter(p => p.clienteId === cliId);
    if (projs.length === 0) {
        selP.innerHTML += '<option disabled>⚠️ Nenhum projeto cadastrado para este cliente</option>';
        return;
    }
    selP.innerHTML += projs.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
}

async function salvarReuniao() {
    const btn = document.querySelector('[onclick="salvarReuniao()"]');
    const titulo = document.getElementById('reun-titulo')?.value?.trim();
    const data_hora_date = document.getElementById('reun-data')?.value;
    const hora_inicio = document.getElementById('reun-hora-inicio')?.value;
    const hora_fim = document.getElementById('reun-hora-fim')?.value;
    const link_meet = document.getElementById('reun-link')?.value?.trim();
    const clienteId = document.getElementById('reun-cliente')?.value || null;
    const projetoId = document.getElementById('reun-projeto')?.value || null;
    const pauta = document.getElementById('reun-pauta')?.value?.trim();

    if (!titulo || !data_hora_date || !hora_inicio) return wToast('Preencha Título, Data e Hora!', 'error');

    const data_hora = `${data_hora_date}T${hora_inicio}:00`;
    let duracao_m = 60;
    if (hora_inicio && hora_fim) {
        const [hi, mi] = hora_inicio.split(':').map(Number);
        const [hf, mf] = hora_fim.split(':').map(Number);
        duracao_m = Math.max(30, (hf * 60 + mf) - (hi * 60 + mi));
    }
    const criadorId = (window.WUSER || window._wuser)?.id;
    if (!criadorId) return wToast('Usuário não autenticado', 'error');

    if(btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }
    try {
        const res = await fetch('/api/reunioes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, data_hora, duracao_m, link_meet, clienteId, projetoId, pauta, criadorId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha');
        wToast('✅ Reunião agendada!', 'success');
        setReunTab('agenda');
        // Limpar form
        ['reun-titulo','reun-data','reun-hora-inicio','reun-hora-fim','reun-link','reun-pauta'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        document.getElementById('reun-cliente').value = '';
        if (document.getElementById('reun-projeto')) document.getElementById('reun-projeto').innerHTML = '<option value="">— Nenhum projeto —</option>';
    } catch(e) {
        console.error(e);
        wToast(`Erro ao salvar reunião: ${e.message}`, 'error');
    } finally {
        if(btn) { btn.textContent = '💾 Salvar Reunião'; btn.disabled = false; }
    }
}

// -- REEMBOLSOS: handler de salvar --------------------
async function salvarReimbolso() {
    const btn = document.querySelector('[onclick="salvarReimbolso()"]');
    const userId = (window.WUSER || window._wuser)?.id;
    const clienteId = document.getElementById('reimb-cliente')?.value;
    const projetoId = document.getElementById('reimb-projeto')?.value;
    const periodo_ref = document.getElementById('reimb-periodo')?.value?.trim();
    const observacao = document.getElementById('reimb-obs')?.value?.trim();
    const chave_pix = document.getElementById('reimb-pix')?.value?.trim();

    if (!userId) return wToast('Usuário não autenticado', 'error');
    if (!clienteId || !periodo_ref) return wToast('Preencha Cliente e Período de Referência!', 'error');

    // Coleta itens da tabela de despesas
    const linhas = document.querySelectorAll('#reimb-itens-tbody tr');
    const itens = [];
    linhas.forEach(tr => {
        const tds = tr.querySelectorAll('td input, td select');
        if(tds.length >= 4) {
            itens.push({
                doc_fiscal: tds[0]?.value || '-',
                fornecedor: tds[1]?.value || '-',
                forma_pgto: tds[2]?.value || 'Cartão',
                valor: parseFloat(tds[3]?.value || 0)
            });
        }
    });

    if(btn) btn.textContent = 'Enviando...';
    try {
        const res = await fetch('/api/reembolsos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, clienteId, projetoId, periodo_ref, observacao, chave_pix, itens })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha');
        wToast('✅ Solicitação enviada!', 'success');
        novaReimb(); // fecha form
    } catch(e) {
        console.error(e);
        wToast('Erro ao enviar reembolso.', 'error');
    } finally {
        if(btn) btn.textContent = '📤 Enviar Solicitação';
    }
}

// Global para injetar no documento principal
window.popularReimbClienteSelect = popularReimbClienteSelect;
window.renderReimbolsos = renderReimbolsos;
window.renderEquipe = renderEquipe;
window.renderRelatorios = renderRelatorios;
window.renderProjetosGrid = renderProjetosGrid;
window.toggleFormProjeto = toggleFormProjeto;
window.salvarProjeto = salvarProjeto;
window.popularProjetoClienteSelect = popularProjetoClienteSelect;
window.salvarReuniao = salvarReuniao;
window.salvarReimbolso = salvarReimbolso;
window.popularReunClienteSelect = popularReunClienteSelect;
window.reun_filtrarProjetos = reun_filtrarProjetos;
window.editarProjeto = editarProjeto;
window.excluirProjeto = excluirProjeto;

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderProjetosGrid();
        renderEquipe();
        popularReunClienteSelect();
    }, 400); // Roda depois do carregar inicial
});

// ── Editar Projeto ──────────────────────────────────────
function editarProjeto(id) {
    const p = (window.PROJETOS || []).find(x => x.id === id);
    if (!p) return;
    // Garante que o form está visível com dados preenchidos
    const form = document.getElementById('proj-form');
    if (!form) return;
    popularProjetoClienteSelect();
    document.getElementById('proj-cliente').value = p.clienteId;
    document.getElementById('proj-nome').value = p.nome;
    document.getElementById('proj-cor').value = p.cor || '#3A7BD5';
    if(document.getElementById('proj-he')) document.getElementById('proj-he').checked = p.permiteHE;
    if(document.getElementById('proj-bh')) document.getElementById('proj-bh').checked = p.permiteBH;
    form.dataset.editId = id;
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Muda texto do botão para indicar edição
    const btn = form.querySelector('.btn-save');
    if (btn) btn.textContent = '💾 Salvar Alterações';
}

// ── Excluir Projeto ─────────────────────────────────────
async function excluirProjeto(id) {
    if (!confirm('Deseja excluir PERMANENTEMENTE este projeto?\n\nApontamentos e outros registros vinculados podem ser afetados.')) return;
    try {
        const res = await fetch(`/api/projetos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Falha ao excluir');
        window.PROJETOS = (window.PROJETOS || []).filter(p => p.id !== id);
        renderProjetosGrid();
        wToast('Projeto excluído com sucesso', 'info');
    } catch(e) {
        console.error(e);
        wToast('Erro ao excluir projeto', 'error');
    }
}

// ═══════════════════════════════════════════════════════
// MÓDULO ADMIN
// ═══════════════════════════════════════════════════════

function setAdminTab(tab) {
    ['clientes', 'usuarios'].forEach(t => {
        const btn = document.getElementById(`adm-tab-${t}-btn`);
        const div = document.getElementById(`adm-tab-${t}`);
        if (btn) btn.classList.remove('active');
        if (div) div.classList.add('hidden');
    });
    const btnAtivo = document.getElementById(`adm-tab-${tab}-btn`);
    const divAtivo = document.getElementById(`adm-tab-${tab}`);
    if (btnAtivo) btnAtivo.classList.add('active');
    if (divAtivo) divAtivo.classList.remove('hidden');
    if (tab === 'clientes') renderAdminClientes();
    if (tab === 'usuarios') renderAdminUsuarios();
}

async function renderAdminClientes() {
    const lista = document.getElementById('admin-clientes-lista');
    if (!lista) return;
    lista.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center">Carregando...</div>';
    try {
        const res = await fetch('/api/clientes');
        const clis = res.ok ? await res.json() : [];
        if (clis.length === 0) {
            lista.innerHTML = '<div style="padding:24px;color:var(--text-muted);text-align:center">Nenhum cliente cadastrado.</div>';
            return;
        }
        lista.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:.87rem">
            <thead>
                <tr style="border-bottom:1px solid var(--border);color:var(--text-muted)">
                    <th style="padding:10px 12px;text-align:left;font-weight:600">ID</th>
                    <th style="padding:10px 12px;text-align:left;font-weight:600">Nome</th>
                    <th style="padding:10px 12px;text-align:left;font-weight:600">CNPJ</th>
                    <th style="padding:10px 12px;text-align:left;font-weight:600">Segmento</th>
                    <th style="padding:10px 12px;text-align:center;font-weight:600">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${clis.map(c => `
                <tr style="border-bottom:1px solid var(--border)" class="admin-row">
                    <td style="padding:10px 12px;color:var(--text-muted)">#${c.id}</td>
                    <td style="padding:10px 12px;font-weight:600">${c.nome || c.razao_social || '—'}</td>
                    <td style="padding:10px 12px;color:var(--text-muted);font-family:monospace">${c.cnpj || '—'}</td>
                    <td style="padding:10px 12px;color:var(--text-muted)">${c.segmento || '—'}</td>
                    <td style="padding:10px 12px;text-align:center">
                        <button onclick="editarAdminCliente(${c.id})" style="background:rgba(58,123,213,.12);border:1px solid rgba(58,123,213,.3);color:#3A7BD5;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:.78rem;margin-right:4px">✏️</button>
                        <button onclick="excluirAdminCliente(${c.id})" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#ef4444;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:.78rem">🗑</button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } catch(e) {
        lista.innerHTML = '<div style="padding:16px;color:#ef4444">Erro ao carregar clientes.</div>';
    }
}

function toggleFormAdminCliente() {
    const form = document.getElementById('admin-cliente-form');
    if (!form) return;
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        form.dataset.editId = '';
        ['adm-cli-razao','adm-cli-nome','adm-cli-cnpj','adm-cli-segmento'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
    }
}

async function salvarAdminCliente() {
    const razao_social = document.getElementById('adm-cli-razao')?.value?.trim();
    const nome         = document.getElementById('adm-cli-nome')?.value?.trim();
    const cnpj         = document.getElementById('adm-cli-cnpj')?.value?.trim();
    const segmento     = document.getElementById('adm-cli-segmento')?.value?.trim();
    const form         = document.getElementById('admin-cliente-form');
    const editId       = form?.dataset?.editId;

    if (!razao_social) return wToast('Razão Social é obrigatória', 'error');
    try {
        const method = editId ? 'PUT' : 'POST';
        const url    = editId ? `/api/admin/clientes/${editId}` : '/api/admin/clientes';
        const res    = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ razao_social, nome: nome || razao_social, cnpj, segmento, ativo: true })
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha');
        wToast(editId ? '✅ Cliente atualizado!' : '✅ Cliente cadastrado!', 'success');
        toggleFormAdminCliente();
        renderAdminClientes();
        // Atualiza lista global de clientes
        const resC = await fetch('/api/clientes');
        if (resC.ok) {
            const CORES = ['#C4380C','#0A6E5D','#3A7BD5','#5A2D82','#D4A017','#1B6CA8'];
            window.CLIENTES = (await resC.json()).map((c, i) => ({ ...c, cor: CORES[i % CORES.length] }));
        }
    } catch(e) {
        wToast(`Erro: ${e.message}`, 'error');
    }
}

function editarAdminCliente(id) {
    wToast('Carregando dados do cliente...', 'info');
    fetch(`/api/admin/clientes/${id}`)
        .then(r => r.json())
        .then(c => {
            document.getElementById('adm-cli-razao').value    = c.razao_social || '';
            document.getElementById('adm-cli-nome').value     = c.nome || '';
            document.getElementById('adm-cli-cnpj').value     = c.cnpj || '';
            document.getElementById('adm-cli-segmento').value = c.segmento || '';
            const form = document.getElementById('admin-cliente-form');
            form.dataset.editId = id;
            form.classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        }).catch(() => wToast('Erro ao carregar cliente', 'error'));
}

async function excluirAdminCliente(id) {
    if (!confirm('Excluir este cliente? Projetos e registros vinculados serão afetados.')) return;
    try {
        const res = await fetch(`/api/admin/clientes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error((await res.json()).error || 'Falha');
        wToast('Cliente excluído', 'info');
        renderAdminClientes();
    } catch(e) { wToast(`Erro: ${e.message}`, 'error'); }
}

async function renderAdminUsuarios() {
    const lista = document.getElementById('admin-usuarios-lista');
    if (!lista) return;
    lista.innerHTML = '<div style="padding:16px;color:var(--text-muted);text-align:center">Carregando...</div>';
    try {
        const res  = await fetch('/api/admin/usuarios');
        const usrs = res.ok ? await res.json() : [];
        if (usrs.length === 0) {
            lista.innerHTML = '<div style="padding:24px;color:var(--text-muted);text-align:center">Nenhum usuário cadastrado.</div>';
            return;
        }
        lista.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:.87rem">
            <thead>
                <tr style="border-bottom:1px solid var(--border);color:var(--text-muted)">
                    <th style="padding:10px 12px;text-align:left">Nome</th>
                    <th style="padding:10px 12px;text-align:left">Email</th>
                    <th style="padding:10px 12px;text-align:left">Grupo</th>
                    <th style="padding:10px 12px;text-align:center">Ações</th>
                </tr>
            </thead>
            <tbody>
                ${usrs.map(u => `
                <tr style="border-bottom:1px solid var(--border)" class="admin-row">
                    <td style="padding:10px 12px;font-weight:600">${u.nome}</td>
                    <td style="padding:10px 12px;color:var(--text-muted)">${u.email || '—'}</td>
                    <td style="padding:10px 12px">
                        <span style="background:rgba(224,91,26,.15);border:1px solid rgba(224,91,26,.3);color:var(--work-accent);padding:2px 8px;border-radius:99px;font-size:.72rem;font-weight:700">${u.grupo}</span>
                    </td>
                    <td style="padding:10px 12px;text-align:center">
                        <button onclick="editarGrupoUsuario(${u.id_usuario},'${u.grupo}')" style="background:rgba(58,123,213,.12);border:1px solid rgba(58,123,213,.3);color:#3A7BD5;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:.78rem">✏️ Grupo</button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } catch(e) {
        lista.innerHTML = '<div style="padding:16px;color:#ef4444">Erro ao carregar usuários.</div>';
    }
}

function editarGrupoUsuario(id, grupoAtual) {
    const grupos = ['ADMIN','SOCIO','GERENTE','CLT','PROFESSOR','ALUNO'];
    const novo = prompt(`Grupo atual: ${grupoAtual}\n\nEscolha o novo grupo:\n${grupos.map((g,i)=>`${i+1}. ${g}`).join('\n')}\n\nDigite o nome do grupo:`);
    if (!novo || !grupos.includes(novo.toUpperCase())) return wToast('Grupo inválido', 'error');
    fetch(`/api/admin/usuarios/${id}/grupo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo: novo.toUpperCase() })
    }).then(r => r.json()).then(() => {
        wToast('Grupo atualizado!', 'success');
        renderAdminUsuarios();
    }).catch(() => wToast('Erro ao atualizar grupo', 'error'));
}

// Exports Admin
window.setAdminTab = setAdminTab;
window.renderAdminClientes = renderAdminClientes;
window.toggleFormAdminCliente = toggleFormAdminCliente;
window.salvarAdminCliente = salvarAdminCliente;
window.editarAdminCliente = editarAdminCliente;
window.excluirAdminCliente = excluirAdminCliente;
window.renderAdminUsuarios = renderAdminUsuarios;
window.editarGrupoUsuario = editarGrupoUsuario;
