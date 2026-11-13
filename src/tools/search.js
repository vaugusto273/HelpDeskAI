const STOPWORDS = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na',
    'nos', 'nas', 'para', 'pra', 'por', 'com', 'sem', 'que', 'se', 'ao', 'aos', 'ou', 'como',
]);

const SYNONYMS = [
    ['estoque', 'saldo'],
    ['nota', 'nf', 'nfe'],
    ['vendedor', 'representante'],
    ['vender', 'venda'],
    ['cliente', 'consumidor'],
    ['pagar', 'pagamento'],
    ['receber', 'recebimento'],
];

const normalizer = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const stem = w => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w)

export function tokenize(text) {
    return normalizer(text ?? '')
        .split(/[^a-z0-9]+/)
        .filter(w => w && !STOPWORDS.has(w))
        .map(stem);
}

const variantsOf = new Map();
for (const group of SYNONYMS) {
    const words = group.map(w => stem(normalizer(w)));
    for (const w of words) variantsOf.set(w, words);
}
const variants = t => variantsOf.get(t) ?? [t];

export function buildIndex(items, textOf) {
    return items.map(item => ({
        item, tokens: new Set(tokenize(textOf(item)))
    }));
}

export function rankSearch(index, query) {
    const terms = [...new Set(tokenize(query))];
    if (!terms.length) return null;

    const min = Math.ceil(terms.length / 2);
    return index
        .map(({ item, tokens }) => ({
            item,
            score: terms.filter(t => variants(t).some(v => tokens.has(v))).length,
        }))
        .filter(r => r.score >= min)
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);
}