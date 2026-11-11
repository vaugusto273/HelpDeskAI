import fs from 'fs';
import path from 'path';
import { CONTEXT } from '../paths.js'

const params = JSON.parse(fs.readFileSync(path.join(CONTEXT, 'parametros.json'), 'utf-8'));

const normalizer = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();


export function searchParams({ ids = [], search = '' }) {
    let found;
    if (ids.length) {
        found = params.filter(p => ids.includes(p.id));
    } else {
        const terms = normalizer(search).split(/\s+/).filter(Boolean);
        if (!terms.length) return 'Informe ids ou palavras-chave em "search".'
        found = params.filter(p => {
            const text = normalizer(`${p.descricao} ${p.area} ${p.obs}`);
            return terms.every(t => text.includes(t));
        });
    }
    if (!found.length) return 'Nenhum parâmetro encontrado.';

    const text = found.slice(0, 10)
        .map(p => `ID ${p.id} | ${p.area} | ${p.descricao}\n ${p.obs.slice(0, 1500)}`)
        .join('\n\n');
    return found.length > 10 ? `${text}\n\n(+${found.length - 10} resultados; refine a busca)` : text;
}
export const toolParam = {
    name: 'consultar_parametros',
    description:
        'Consulta a tabela de parâmetros do Sirius (ID, área, descrição e o que o parâmetro faz). ' +
        'Use quando a dúvida envolver um parâmetro pelo número ou um comportamento que pode ser controlado por parâmetro. ' +
        'Informe "ids" quando souber os números; senão, "search" com 1 a 3 palavras-chave. ' +
        'Se não achar, tente outras palavras (sinônimos) antes de desistir.',
    input_schema: {
        type: 'object',
        properties: {
            ids: { type: 'array', items: { type: 'integer' }, description: 'Números dos parâmetros, ex.: [71, 91]' },
            search: { type: 'string', description: 'Palavras-chave, ex.: "saldo negativo"' },
        },
        additionalProperties: false,
    },
};