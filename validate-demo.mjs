import fs from 'node:fs';
import assert from 'node:assert/strict';

const data = JSON.parse(fs.readFileSync('demo-data.json', 'utf8'));
assert.equal(data.mode, 'DEMO_READ_ONLY');
assert.equal(data.version, '6.8.4-demo');
assert.ok(Number.isFinite(Date.parse(data.marketDataAsOf)), 'Data de mercado obrigatória');
assert.ok(Array.isArray(data.items) && data.items.length > 0, 'Radar vazio');
const allowed = new Set(['mode', 'version', 'marketDataAsOf', 'generatedAt', 'disclaimer', 'items']);
assert.ok(Object.keys(data).every(k => allowed.has(k)), 'Campo não permitido no payload público');
const itemFields = new Set('ticker market strategyViews volumeComparable currency preco variacao categoria status emoji ifr ifrWeekly regime momentum estrutura volRatio drawdown52 dy fundamental valuation conviccao'.split(' '));
const forbidden = /portfolio|position|quantity|entryDate|averageEntry|invested|webhook|secret|token|credential|watchlist|receipt|alerts|stopPrice|purchase/i;
function inspect(value) {
  if (Array.isArray(value)) return value.forEach(inspect);
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbidden.test(key), `Campo privado: ${key}`);
    inspect(child);
  }
  if (typeof value === 'string') assert.ok(!/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value), 'E-mail não permitido');
}
for (const item of data.items) {
  assert.ok(Object.keys(item).every(k => itemFields.has(k)), 'Campo privado no ativo');
  for (const mode of ['CARTEIRA', 'SWING']) {
    assert.equal(item.strategyViews?.[mode]?.version, '6.8.4');
    assert.equal(item.strategyViews[mode].blocks.length, 6);
  }
}
inspect(data);
const html = fs.readFileSync('index.html', 'utf8');
assert.ok(html.includes('6.8.4'));
assert.ok(html.includes('demo-data.json'));
assert.ok(!/https?:\/\//i.test(html), 'Requisição externa não prevista no HTML');
console.log(`Demo pública validada: ${data.items.length} ativos, dados ${data.marketDataAsOf}`);
