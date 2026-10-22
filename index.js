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

    const totalTokens = await countTokens(params);
    const r = await rl.question('Essa requisição ira custas ' + totalTokens.input_tokens + ' Deseja continua? (S/N)')
    rl.close();

    if(r.trim().toUpperCase() === 'S'){
        const message = await anthropic.messages.create(params);

        const response = message.content
            .filter(bloco => bloco.type === 'text')
            .map(bloco => bloco.text)
            .join('\n');
        console.log(response);
        console.log(message.usage)
    } else
        console.log('Pergunta cancelada')

}

main().catch(console.error);
