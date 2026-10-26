import Anthropic from '@anthropic-ai/sdk';
import { messageClaude, countTokens } from './AIAssist.js';
import readline from 'readline/promises';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    try {
        const r = await rl.question('Essa requisição ira custar ' + await countTokens(q) + ' Deseja continuar? (S/N)')

        if (r.trim().toUpperCase() !== 'S') {
            console.log('Pergunta cancelada');
            return;
        }

        const { response, usage } = await messageClaude(q);
        console.log(response);
        console.log(usage);
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

main()
