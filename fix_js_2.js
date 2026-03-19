const fs = require('fs');
let content = fs.readFileSync('C:/Devs/PlataformaOF/OverfloowHub/public/js/work.js', 'utf8');

const regex = /<div class="reun-modal-sect\/\/ Dados demo — removido carregamento automatico daqui, vao para _custosData como mock somente de ref/g;

const rep = `<div class="reun-modal-section-title">📝 Ata / Encaminhamentos</div>
                    <textarea class="reun-modal-textarea" id="modal-ata-\${r.id}"
                        placeholder="Registre aqui os pontos discutidos, decisões tomadas e próximos passos...">\${r.ata || ''}</textarea>
                </div>
            </div>
            <div class="reun-modal-footer">
                <button class="btn-cancel" onclick="fecharModal()">Fechar</button>
                <button class="btn-save" onclick="salvarAta(\${r.id})">💾 Salvar Ata</button>
            </div>
        </div>
    </div>\`;
    document.getElementById('reun-modal-container').innerHTML = modal;
}

function fecharModal() {
    document.getElementById('reun-modal-container').innerHTML = '';
}

function salvarAta(id) {
    const r = reunState.find(x => x.id === id);
    if (!r) return;
    const ata = document.getElementById(\`modal-ata-\${id}\`)?.value.trim() || '';
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
    wToast(\`Status atualizado: \${STATUS_REUNIAO[status]?.label || status}\`, 'success');
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

// Dados demo — removido carregamento automatico daqui, vao para _custosData como mock somente de ref`;

content = content.replace(regex, rep);

fs.writeFileSync('C:/Devs/PlataformaOF/OverfloowHub/public/js/work.js', content, 'utf8');
console.log('Fixed js syntax no work.js');
