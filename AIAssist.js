import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const anthropic = new Anthropic();

const contextVar = fs.readFileSync('context.md', 'utf-8');
const instructionVar = fs.readFileSync('instrucoes.md', 'utf-8');

function buildParam(q) {
    return {
        model: process.env.CLAUDE_MODEL_NAME,
        max_tokens: 8000,
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
        messages: [{
            role: 'user',
            content: q
        }]
    }
}

export async function countTokens(q) {
    const { max_tokens, ...count } = buildParam(q);
    const r = await anthropic.messages.countTokens(count)
    return r.input_tokens;
}

export async function messageClaude(q) {
    const message = await anthropic.messages.create(buildParam(q));

    const response = message.content
        .filter(bloco => bloco.type === 'text')
        .map(bloco => bloco.text)
        .join('\n');
    return { response, usage: message.usage };
}