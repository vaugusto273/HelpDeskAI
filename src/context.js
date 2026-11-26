const TECH_NOTICE = 'precisa de atendimento técnico da Soft Clever.';
const TECH_ONLY = 'Atendimento feito só pela equipe técnica: oriente o cliente a abrir o atendimento com o suporte da Soft Clever.';
const TECH_ENTRY = /^- \*\*Público:\*\* (somente )?técnico[^/\n]*$/m;
const KEEP_LINES = ['## ', '- **Público:**', '- **Como o cliente relata:**'];

function summarizeTechEntry(section) {
    if (!section.startsWith('## CS-') || !TECH_ENTRY.test(section)) return section;
    const kept = section.split('\n').filter(line => KEEP_LINES.some(start => line.startsWith(start)));
    // A validated client answer stays: from "**Resposta ao cliente" up to the next bold paragraph
    const clientAnswer = section.match(/^\*\*Resposta ao cliente[\s\S]*?(?=\n\*\*)/m)?.[0] ?? '';
    return `${kept.join('\n')}\n\n${clientAnswer}\n\n${TECH_ONLY}\n\n`;
}

export function toClientContext(md) {
    return md
        .split(/(?=^#{1,2} )/m)
        .map(summarizeTechEntry)
        .join('')
        // 1. "[técnico]" items: keep the number and the bold title, drop the how-to
        .replace(/^(\d+\.) \[técnico\] (\*\*[^*]+\*\*).*$/gm, `$1 $2: ${TECH_NOTICE}`)
        // 3. "### ... — somente técnico" subsections (Part 1): keep the title, drop the content
        .replace(/^(### .*— somente técnico.*)\n[\s\S]*?(?=^#{1,3} )/gm, `$1\n\n${TECH_ONLY}\n\n`)
        // 4. Example cases: they describe what the technician did, and rule 3 forbids citing them to clients
        .replace(/^\*\*Casos? de exemplo:\*\*[\s\S]*?(?=^#{1,3} )/gm, '');
}