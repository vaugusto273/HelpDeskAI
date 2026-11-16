import fs from 'fs';
import path from 'path';
import { CONTEXT } from '../paths.js'
import { buildIndex, rankSearch } from './search.js';

const reject = JSON.parse(fs.readFileSync(path.join(CONTEXT, 'rejections.json'), 'utf-8'));

const index = buildIndex(reject, r => `${r.codigo} ${r.mensagem} ${r.regra}`);

const format = r => [
    `${r.codigo} | ${r.efeito} | ${r.mensagem}`,
    `Regra: ${r.regra.slice(0, 600)}`,
    r.modelo && `Modelo: ${r.modelo}`,
    `Fonte: ${r.origem}${r.situacao_nt ? ` (${r.situacao_nt})` : ''}`,
    r.implementacao_futura === 'SIM' && 'ATENÇÃO: regra de implementação futura, pode ainda não estar valendo.',
    r.ver_no_contexto && `Ver no contexto: ${r.ver_no_contexto}`,
    `O que fazer no Sirius: ${r.o_que_fazer_no_sirius || 'não documentado.'}`,
].filter(Boolean).join('\n');

export function searchRejections({ codes = [], search = '' }) {
    let found;
    if (codes.length) {
        found = reject.filter(r => codes.includes(r.codigo));
    } else {
        found = rankSearch(index, search);
        if (!found) return 'Informe códigos em "codes" ou palavras-chave em "search".';
        found = found.slice(0, 8);
    }
    if (!found.length) return 'Nenhuma rejeição encontrada.';
    return found.map(format).join('\n\n');
}

export const toolRejection = {
    name: 'consultar_rejeicao',
    description:
        'Consulta rejeições da SEFAZ para NF-e e NFC-e (código, mensagem, regra de validação, fonte MOC/NT). ' +
        'Use quando a dúvida citar um código de rejeição ou a mensagem de erro da SEFAZ. ' +
        'Informe "codes" quando houver número; senão "search" com palavras da mensagem. ' +
        'Se vier "Ver no contexto: CS-xx", use essa entrada da base para orientar a solução no Sirius.',
    input_schema: {
        type: 'object',
        properties: {
            codes: { type: 'array', items: { type: 'integer' }, description: 'Códigos de rejeição, ex.: [539, 778]' },
            search: { type: 'string', description: 'Palavras da mensagem de erro, ex.: "NCM inexistente"' },
        },
        additionalProperties: false,
    },
};
