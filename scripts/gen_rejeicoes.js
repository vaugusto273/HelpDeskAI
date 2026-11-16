import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { RAIZ, CONTEXT } from '../src/paths.js';

const csv = fs.readFileSync(path.join(RAIZ, 'docs', 'rejeicoes_tabela.csv'), 'utf-8');

const rows = parse(csv, {
    delimiter: ';',
    columns: true,
    bom: true,
    skip_empty_lines: true,
});

const rejec = rows
    .filter(r => Number(r.CODIGO))
    .map(r => ({
        codigo: Number(r.CODIGO),
        efeito: r.EFEITO,
        mensagem: r.MENSAGEM,
        regra: r.REGRA,
        modelo: r.MODELO,
        origem: r.ORIGEM,
        situacao_nt: r.SITUACAO_NT,
        implementacao_futura: r.IMPLEMENTACAO_FUTURA,
        ver_no_contexto: r.VER_NO_CONTEXTO,
        o_que_fazer_no_sirius: r.O_QUE_FAZER_NO_SIRIUS,

    }));

fs.writeFileSync(path.join(CONTEXT, 'rejections.json'), JSON.stringify(rejec, null, 2), 'utf-8');
console.log(`${rejec.length} rejeicoes gravadas.`);

