import express from 'express';
import { messageClaude } from './AIAssist.js';
import fs from 'fs/promises'

const app = express();
app.use(express.json());
app.use(express.static('../frontend'));
//app.use(express.static('public'));

app.post('/askclaude', async (req, res) => {
    try {
        const q = req.body?.q;
        if (!q || !q.trim()) {
            return res.status(400).json({erro: 'Envie a pergunta no campo de perguntas'})
        }
        const { response } = await messageClaude(req.body.q);
        res.json({ response });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Não foi possível responder agora.' });
    }
});

app.post('/review', async (req, res) => {
    const { q, response, review, obs } = req.body ?? {};

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
        obs: obs ?? ''
    };

    try {
        await fs.appendFile('reviews.jsonl', JSON.stringify(reg) + '\n', 'utf-8');
        res.status(201).json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Não foi possível salvar.' });
    }
});

app.listen(3002, () => console.log('http://localhost:3002'))