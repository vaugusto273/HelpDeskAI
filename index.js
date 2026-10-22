import 'dotenv/config'; // Carrega as variáveis do arquivo .env
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

// O SDK já vai puxar automaticamente o process.env.ANTHROPIC_API_KEY
const anthropic = new Anthropic();

function To(params) {
    
}

async function main() {
    const contextVar = fs.readFileSync('context.md', 'utf-8');
    const message = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL_NAME,
        max_tokens: 1024,
        system: [
            {
                type: "text",
                text: contextVar,
                cache_control: {type: "ephemeral"}
            }
        ],
        messages: [
            { role: 'user', content: 'Olá! Como crio um novo produto?' }
        ],
    });

    const response = message.content
        .filter(bloco => bloco.type === 'text')
        .map(bloco => bloco.text)
        .join('\n');
    console.log(response);

}

main().catch(console.error);
