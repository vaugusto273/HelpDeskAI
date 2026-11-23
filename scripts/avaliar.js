import fs from 'fs';
import path from 'path';
import { RAIZ } from '../src/paths.js';
import { messageClaude } from '../src/claude.js';

const penTest = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'eval.json'), 'utf-8'));

const tokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 };

let successes = 0;

for (const itens of penTest) {
    console.log(`\n=== ${itens.id} ===`);

    const { response, usage, tools } = await messageClaude(itens.q);

    // Tokens

    for (const u of [].concat(usage)) {
        tokens.input += u.input_tokens;
        tokens.cacheRead += u.cache_read_input_tokens ?? 0;
        tokens.cacheWrite += u.cache_creation_input_tokens ?? 0;
        tokens.output += u.output_tokens;

    }

    const toolsCalled = tools.map(t => t.name);
    const rText = response.toLowerCase();

    const textIncludes = p => [].concat(p).some(x => rText.includes(x.toLowerCase()));

    // Tools

    let okTools;
    if (itens.tool === '*') {
        okTools = true;
    } else if (itens.tool === null) {
        okTools = toolsCalled.length === 0;
    } else {
        okTools = toolsCalled.includes(itens.tool);
    }


    // contem

    const missing = itens.contem.filter(p => !textIncludes(p));
    const okContent = missing.length === 0;

    // não contém

    const forbid = itens.nao_contem.filter(p => textIncludes(p));
    const okNoContent = forbid.length === 0;

    if (okTools && okContent && okNoContent) {
        successes++;
        console.log(`✅ ${itens.id}`);
    } else {
        console.log(`❌ ${itens.id}`);
        if (tools.length) console.log(`   buscas: ${tools.map(t => `${t.name}(${JSON.stringify(t.input)})`).join(', ')}`);
        if (!okTools) console.log(`   ferramenta: esperava ${itens.tool}, chamou [${toolsCalled.join(', ')}]`);
        if (!okContent) console.log(`   faltou: ${JSON.stringify(missing)}`);
        if (!okNoContent) console.log(`   apareceu proibido: ${JSON.stringify(forbid)}`);
        console.log(`   resposta: ${response.slice(0, 300).replace(/\n/g, ' ')}...`);
    }
}

console.log(`\n${successes} de ${penTest.length} passaram`);
console.log(`Tokens: ${tokens.input} entrada, ${tokens.cacheRead} cache lido, ${tokens.cacheWrite} cache gravado, ${tokens.output} saída`);
