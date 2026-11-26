import fs from 'fs';
import path from 'path';
import { CONTEXT } from '../paths.js';
import { buildIndex, rankSearch } from './search.js';

const MARK = `# PARTE 4`;
const md = fs.readFileSync(path.join(CONTEXT, 'context.md'), 'utf-8');
const start = md.indexOf(MARK);
if (start < 0) throw new Error(`"${MARK}" não encontrado no context.md`)

export const contextWithoutCases = md.slice(0, start);

const cases = md.slice(start)
    .split(/^### Caso /m)
    .slice(1)
    .map(block => {
        const [header, ...other] = block.split('\n');
        const [id, date, user] = header.split(' · ').map(s => s.trim());
        const text = other.join('\n');
        return {
            id,
            date,
            user: (user ?? '').replace('público: ', ''),
            problem: text.match(/^Problema: (.*)$/m)?.[1] ?? '',
            solution: text.match(/^Solução registrada: (.*)$/m)?.[1] ?? '',
        };
    });
const forClient = cases.filter(c => c.user !== 'somente técnico');

const INDEXES = {
    client: buildIndex(forClient, c => `${c.problem} ${c.solution}`),
    support: buildIndex(cases, c => `${c.problem} ${c.solution}`),
};

const FORMAT = {
    client: c => `Problema: ${c.problem}\nSolução registrada: ${c.solution}`,
    support: c => `Caso ${c.id} · ${c.date} · público: ${c.user}\nProblema: ${c.problem}\nSolução registrada: ${c.solution}`,
};

export function searchCases({ search = '' }, audience = 'support') {
    const found = rankSearch(INDEXES[audience], search);
    if (!found) return 'Informe palavras-chave em "search".';
    if (!found.length) return 'Nenhum caso encontrado';

    const text = found.slice(0, 5).map(FORMAT[audience]).join('\n\n');
    return found.length > 5 ? `${text}\n\n(+${found.length - 5} casos; refine a busca)` : text;
}

export const toolCases = {
    name: 'buscar_casos',
    description:
        'Busca chamados antigos que não se encaixaram nas soluções consolidadas (Parte 2): situações raras, ' +
        'com o problema e a solução que o técnico registrou. Use quando a Parte 2 não cobrir a dúvida. ' +
        'Informe "search" com 1 a 3 palavras-chave do problema (ex.: "balança", "erro 6098"); se não achar, tente sinônimos. ' +
        'Respeite o público de cada caso: "somente técnico" não pode ser orientado ao cliente.',
    input_schema: {
        type: 'object',
        properties: {
            search: { type: 'string', description: 'Palavras-chave do problema, ex.: "rejeição duplicidade cupom"' },
        },
        additionalProperties: false,
    },
};