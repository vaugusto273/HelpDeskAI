import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { RAIZ, CONTEXT } from '../src/paths.js';

const csv = fs.readFileSync(path.join(RAIZ, 'docs', 'parametros_tabela.csv'), 'utf-8');

const rows = parse(csv, {
    delimiter: ';',
    columns: true,
    bom: true,
    skip_empty_lines: true,
});

const perms = rows
    .filter(p => p.PERMISSAO)
    .map(p => ({
        permissao: p.PERMISSAO,
        modulos: p.MODULOS,
        observacoes: p.OBSERVACOES,
        pista: p.PISTA_DO_CODIGO,
        confiabilidade: p.CONFIABILIDADE,
    }));

fs.writeFileSync(path.join(CONTEXT, 'permissoes.json'), JSON.stringify(perms, null, 2), 'utf-8');
console.log(`${perms.length} permissões gravadas.`);


fs.writeFileSync(path.join(CONTEXT, 'parametros.json'), JSON.stringify(params, null, 2), 'utf-8');
console.log(`${params.length} parâmetros gravados.`);
