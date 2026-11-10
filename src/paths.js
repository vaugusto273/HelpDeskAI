// Caminhos do projeto, resolvidos a partir deste arquivo (e não da pasta de onde o node foi executado).
import path from 'path';
import { fileURLToPath } from 'url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); // pasta backend/
export const CONTEXT = path.join(RAIZ, 'context');   // o que a IA lê
export const DATA = path.join(RAIZ, 'data');         // gerado pelo uso (reviews.jsonl)
export const FRONTEND = path.join(RAIZ, '..', 'frontend');
export const ENV = path.join(RAIZ, '.env');
