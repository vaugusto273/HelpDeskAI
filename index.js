import 'dotenv/config'; // Carrega as variáveis do arquivo .env
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import readline from 'readline/promises'

// O SDK já vai puxar automaticamente o process.env.ANTHROPIC_API_KEY
const anthropic = new Anthropic();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
const contextVar = fs.readFileSync('context.md', 'utf-8');
const instructionVar = fs.readFileSync('instrucoes.md', 'utf-8');
var question = 'Eu sou um restaurante e quero saber se o sistema consegue auxiliar o artista do show ao vivo do meu restaurante através de uma votação feita dentro do Sirius pelos nossos clientes';

const params = {
    model: process.env.CLAUDE_MODEL_NAME,
    max_tokens: 1024,
    system: [{
        type: "text",
        text: `<base_de_conhecimento>\n${contextVar}</base_de_conhecimento>`,
        cache_control: { type: "ephemeral", ttl: "1h" }
    },
    {
        type: "text",
        text: instructionVar,
        cache_control: { type: "ephemeral", ttl: "1h" }
    }],
    messages: [{
        role: 'user',
        content: question
    }]
}

async function countTokens(params) {
    const { max_tokens, ...count } = params;
    const r = await anthropic.messages.countTokens(count)
    return r
}

async function main() {
    try {
        const totalTokens = await countTokens(params);
        const r = await rl.question('Essa requisição ira custas ' + totalTokens.input_tokens + ' Deseja continua? (S/N)')
        rl.close();

        if (r.trim().toUpperCase() !== 'S') {
            console.log('Pergunta cancelada');
            return;
        }
        const message = await anthropic.messages.create(params);

        const response = message.content
            .filter(bloco => bloco.type === 'text')
            .map(bloco => bloco.text)
            .join('\n');
        console.log(response);
        console.log(message.usage)
    } catch (error) {
        if (error instanceof Anthropic.AuthenticationError) {
            console.error('Chave da API inválida. Confira o ANTHROPIC_API_KEY no .env');
        } else if (error instanceof Anthropic.NotFoundError) {
            console.error(`Modelo não encontrado: "${process.env.CLAUDE_MODEL_NAME}". Confira o CLAUDE_MODEL_NAME no .env`);
        } else if (error instanceof Anthropic.BadRequestError) {
            console.error('Requisição inválida:', error.message);
        } else if (error instanceof Anthropic.RateLimitError) {
            console.error('Muitas requisições. Espere um pouco e tente de novo.');
        } else if (error instanceof Anthropic.InternalServerError) {
            console.error(`A API está com problemas (${error.status}). Tente mais tarde.`);
        } else if (error instanceof Anthropic.APIConnectionTimeoutError) {
            console.error('A API demorou demais para responder.');
        } else if (error instanceof Anthropic.APIConnectionError) {
            console.error('Sem conexão com a API. Confira a internet.');
        } else if (error instanceof Anthropic.APIError) {
            console.error(`Erro da API (${error.status}):`, error.message);
        } else {
            throw error;
        }
    } finally {
        rl.close();
    }
}

main().catch(console.error);
