import express from 'express';
import { messageClaude } from './claude.js';
import fs from 'fs/promises'
import path from 'path';
import { DATA, FRONTEND } from './paths.js';

const REVIEWS = path.join(DATA, 'reviews.jsonl');
const MAX_HISTORY_TOKENS = 20000;
const CHARS_PER_TOKEN = 3.5;
const AUDIENCES = ['client', 'support'];

await fs.mkdir(DATA, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.static(FRONTEND));

const estimateTokens = messages =>
    Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / CHARS_PER_TOKEN);

function validateConversation(messages) {
    if (!Array.isArray(messages) || !messages.length) return 'Envie a pergunta.';
    const valid = messages.every((m, i) =>
        m?.role === (i % 2 === 0 ? 'user' : 'assistant') &&
        typeof m.content === 'string' && m.content.trim());
    if (!valid || messages.at(-1).role !== 'user') return 'Conversa em formato inválido.';
    if (estimateTokens(messages) > MAX_HISTORY_TOKENS) return 'Conversa muito longa. Comece uma nova.';
    return null;
}

app.post('/askclaude', async (req, res) => {
    const error = validateConversation(req.body?.messages);
    if (error) return res.status(400).json({ error });

    const audience = req.body?.audience;
    if (!AUDIENCES.includes(audience)) {
        return res.status(400).json({ error: 'Público inválido' });
    }

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    const send = event => res.write(JSON.stringify(event) + '\n');

    try {
        const result = await messageClaude(req.body.messages, {
            audience,
            onText: text => send({ type: 'text', text }),
            onTool: name => send({ type: 'tool', name }),
        });
        send({ type: 'done', ...result });
    } catch (err) {
        console.error(err);
        send({ type: 'error', error: 'Não foi possível responder agora.' });
    }
    res.end();
});

app.post('/review', async (req, res) => {
    const { tools, q, response, review, obs, usage, history, audience } = req.body ?? {};

    if (!q || !response) {
        return res.status(400).json({ error: 'Faltou a pergunta ou a resposta' });
    }
    const opt = ['incorreto', 'parcialmente_incorreto', 'parcialmente_correto', 'correto'];
    if (!opt.includes(review)) {
        return res.status(400).json({ error: 'Avaliação inválida' });
    }
    const reg = {
        date: new Date().toISOString(),
        q,
        response,
        review,
        obs: obs ?? '',
        usage,
        tools: tools ?? [],
        history: Array.isArray(history) ? history : [],
        audience: AUDIENCES.includes(audience) ? audience : null,
    };

    try {
        await fs.appendFile(REVIEWS, JSON.stringify(reg) + '\n', 'utf-8');
        res.status(201).json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Não foi possível salvar.' });
    }
});

app.listen(8080, () => console.log('http://localhost:8080'))