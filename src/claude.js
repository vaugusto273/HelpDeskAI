import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { CONTEXT, ENV } from './paths.js'
import { searchParams, toolParam } from './tools/params.js';
import { searchPerms, toolPerm } from './tools/perms.js';
import { searchCases, toolCases, contextWithoutCases } from './tools/cases.js';
import { searchRejections, toolRejection } from './tools/reject.js';
import { toClientContext } from './context.js';


dotenv.config({ path: ENV });
const anthropic = new Anthropic();

const KNOWLEDGE = {
    client: toClientContext(contextWithoutCases),
    support: contextWithoutCases,
};
const readContext = name => fs.readFileSync(path.join(CONTEXT, name), 'utf-8');
const commonRules = readContext('instrucoes_comum.md');

const INSTRUCTIONS = {
    client: `${commonRules}\n\n${readContext('instrucoes_cliente.md')}`,
    support: `${commonRules}\n\n${readContext('instrucoes_atendente.md')}`,
};

const TOOLS = {
    client: [toolPerm, toolCases, toolRejection],
    support: [toolParam, toolPerm, toolCases, toolRejection],
};

const MAX_ROUNDS = 5;

const handlers = {
    consultar_parametros: searchParams,
    consultar_permissoes: searchPerms,
    buscar_casos: searchCases,
    consultar_rejeicao: searchRejections,
};

function buildParam(messages, audience) {
    return {
        model: process.env.CLAUDE_MODEL_NAME,
        max_tokens: 8000,
        tools: TOOLS[audience],
        system: [{
            type: "text",
            text: `<knowledgebase>\n${KNOWLEDGE[audience]}\n</knowledgebase>`,
            cache_control: { type: "ephemeral", ttl: "1h" }
        },
        {
            type: "text",
            text: INSTRUCTIONS[audience],
            cache_control: { type: "ephemeral", ttl: "1h" }
        }],
        messages,
    }
}

export async function countTokens(q, audience = 'support') {
    const { max_tokens, ...count } = buildParam([{
        role: 'user',
        content: q
    }
    ], audience);
    const r = await anthropic.messages.countTokens(count)
    return r.input_tokens;
}

export async function messageClaude(input, { audience = 'support', onText, onTool } = {}) {
    const messages = typeof input === 'string' ? [{
        role: 'user',
        content: input
    }] : input.map(({ role, content }) => ({ role, content }));
    const uses = [];
    const tools = [];

    for (let round = 0; round < MAX_ROUNDS; round++) {
        const stream = anthropic.messages.stream(buildParam(messages, audience));
        if (onText) stream.on('text', onText);
        const message = await stream.finalMessage();
        uses.push(message.usage);

        if (message.stop_reason !== 'tool_use') {
            const response = message.content
                .filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
            if (!response) console.warn(`Resposta vazia (stop_reason: ${message.stop_reason})`);

            return {
                response: response || 'Não consegui responder a essa pergunta. Pode reformular a dúvida ou falar com o suporte?',
                usage: uses.length === 1 ? uses[0] : uses,
                tools,
                stopReason: message.stop_reason,
            };

        }
        messages.push({ role: 'assistant', content: message.content });
        const results = message.content
            .filter(b => b.type === 'tool_use')
            .map(b => {
                onTool?.(b.name);
                const content = handlers[b.name]?.(b.input, audience) ?? `Ferramenta desconhecida: ${b.name}`;
                tools.push({ name: b.name, input: b.input, result: content.slice(0, 200) });
                return { type: 'tool_result', tool_use_id: b.id, content };
            });

        messages.push({
            role: 'user',
            content: results
        });
        //console.log(results);
    }
    return { response: 'Não consegui concluir a consulta.', usage: uses, tools, stopReason: 'max_rounds' };
}