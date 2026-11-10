import express from 'express';
import { messageClaude } from './claude.js';
import fs from 'fs/promises'
import path from 'path';
import { DATA, FRONTEND } from './paths.js';

const REVIEWS = path.join(DATA, 'reviews.jsonl');
await fs.mkdir(DATA, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.static(FRONTEND));
//app.use(express.static('public'));

app.post('/askclaude', async (req, res) => {
    try {
        const q = req.body?.q;
        if (!q || !q.trim()) {
            return res.status(400).json({ erro: 'Envie a pergunta no campo de perguntas' })
        }
        const { response, usage } = await messageClaude(req.body.q);
        res.json({ response, usage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Não foi possível responder agora.' });
    }
});

app.post('/review', async (req, res) => {
    const { q, response, review, obs, usage } = req.body ?? {};

    if (!q || !response) {
        return res.status(400).json({ erro: 'Faltou a pergunta ou a resposta' });
    }
    const opt = ['incorreto', 'parcialmente_incorreto', 'parcialmente_correto', 'correto'];
    if (!opt.includes(review)) {
        return res.status(400).json({ erro: 'Avaliação inválida' });
    }
    const reg = {
        date: new Date().toISOString(),
        q,
        response,
        review,
        obs: obs ?? '',
        usage,
    };

    try {
        await fs.appendFile('reviews.jsonl', JSON.stringify(reg) + '\n', 'utf-8');
        res.status(201).json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Não foi possível salvar.' });
    }
});

app.listen(8080, () => console.log('http://localhost:8080'))