import fs from 'fs';
import path from 'path';
import { CONTEXT } from '../paths.js'

const perms = JSON.parse(fs.readFileSync(path.join(CONTEXT, 'permissoes.json'), 'utf-8'));

const normalizer = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();


export function searchPerms({ search = '' }) {
    const terms = normalizer(search).split(/\s+/).filter(Boolean);
    if (!terms.length) return 'Informe palavras-chave em "search".';

    const found = perms.filter(p => {
        const text = normalizer(`${p.permissao} ${p.modulos} ${p.observacoes} ${p.pista}`);
        return terms.every(t => text.includes(t));
    });

    if (!found.length) return 'Nenhuma permissão encontrado.';

    const text = found.slice(0, 10)
        .map(p => {
            const descricao = p.observacoes || p.pista || 'Sem descrição documentada.';
            return `${p.permissao} | Confiabilidade: ${p.confiabilidade}\n${descricao.slice(0, 1500)}`;
        })
        .join('\n\n');
    return found.length > 10 ? `${text}\n\n(+${found.length - 10} resultados; refine a busca)` : text;
}

export const toolPerm = {
    name: 'consultar_permissoes',
    description:
        'Consulta as permissões de grupos de usuários do Sirius (nome, módulos e o que a permissão libera). ' +
        'Use quando a dúvida envolver um usuário que não vê um menu, botão ou rotina, ou não consegue fazer uma ação. ' +
        'Informe "search" com 1 a 3 palavras-chave; se não achar, tente sinônimos. ' +
        'Cada resultado traz a confiabilidade da informação: abaixo de 70%, diga ao atendente que a informação ' +
        'não está bem documentada e precisa ser confirmada com a área técnica antes de alterar a permissão.',
    input_schema: {
        type: 'object',
        properties: {
            search: { type: 'string', description: 'Palavras-chave, ex.: "condição de pagamento"' },
        },
        additionalProperties: false,
    },
};