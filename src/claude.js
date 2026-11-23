import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { CONTEXT, ENV } from './paths.js'
import { searchParams, toolParam } from './tools/params.js';
import { searchPerms, toolPerm } from './tools/perms.js';
import { searchCases, toolCases, contextWithoutCases } from './tools/cases.js';
import { searchRejections, toolRejection } from './tools/reject.js';


dotenv.config({ path: ENV });
const anthropic = new Anthropic();

const contextVar = contextWithoutCases;
const instructionVar = fs.readFileSync(path.join(CONTEXT, 'instrucoes.md'), 'utf-8');

const MAX_ROUNDS = 5;

const handlers = {
    consultar_parametros: searchParams,
    consultar_permissoes: searchPerms,
    buscar_casos: searchCases,
    consultar_rejeicao: searchRejections,
};

function buildParam(messages) {
    return {
        model: process.env.CLAUDE_MODEL_NAME,
        max_tokens: 8000,
        tools: [toolParam, toolPerm, toolCases, toolRejection],
        system: [{
            type: "text",
            text: `<knowledgebase>\n${contextVar}\n</knowledgebase>`,
            cache_control: { type: "ephemeral", ttl: "1h" }
        },
        {
            type: "text",
            text: instructionVar,
            cache_control: { type: "ephemeral", ttl: "1h" }
        }],
        messages,
    }
}

export async function countTokens(q) {
    const { max_tokens, ...count } = buildParam([{
        role: 'user',
        content: q
    }
    ]);
    const r = await anthropic.messages.countTokens(count)
    return r.input_tokens;
}

export async function messageClaude(q) {
    const messages = [{
        role: 'user', content: q
    }]
    const uses = [];
    const tools = [];

    for (let round = 0; round < MAX_ROUNDS; round++) {
        const message = await anthropic.messages.create(buildParam(messages));
        uses.push(message.usage);

        if (message.stop_reason !== 'tool_use') {
            const response = message.content
                .filter(b => b.type === 'text').map(b => b.text).join('\n');
            return { response, usage: uses.length === 1 ? uses[0] : uses, tools };

        }
        messages.push({ role: 'assistant', content: message.content });
        const results = message.content
            .filter(b => b.type === 'tool_use')
            .map(b => {
                const content = handlers[b.name]?.(b.input) ?? `Ferramenta desconhecida: ${b.name}`;
                tools.push({ name: b.name, input: b.input, result: content.slice(0, 200) });
                return { type: 'tool_result', tool_use_id: b.id, content };
            });

        messages.push({
            role: 'user',
            content: results
        });
        //console.log(results);
    }
    return { response: 'Não consegui concluir a consulta.', usage: uses, tools };
}