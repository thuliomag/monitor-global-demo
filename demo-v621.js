/* Demo pública — paridade visual com a leitura V6.2.1, sem dados pessoais. */
(() => {
  const q=s=>document.querySelector(s);
  const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function scoreOf(i){
    const c=i?.conviccao;
    if(c&&typeof c==='object'&&Number.isFinite(c.pontos))return c.pontos;
    const s=String(c??'');const m=s.match(/score\s*(-?\d+(?:\.\d+)?)/i);if(m)return Number(m[1]);
    const stars=(s.match(/★/g)||[]).length;return stars||null;
  }
  function conv(i){const s=scoreOf(i);if(!Number.isFinite(s))return{stars:'N/D',level:'N/D',score:null};if(s<=0)return{stars:'☆',level:'SEM CONFLUÊNCIA POSITIVA',score:s};if(s===1)return{stars:'★',level:'BAIXA',score:s};if(s===2)return{stars:'★★',level:'MÉDIA',score:s};return{stars:'★★★',level:'ALTA',score:s};}
  function action(i){switch(i.categoria){case'COMPRA_FORTE':return'Entrada técnica forte pelo modelo; preferir execução fracionada e definir invalidação.';case'ACUMULACAO':return'Zona de acumulação em correção; confirmar se tendência, momentum e volume continuam coerentes.';case'REVERSAO_INICIAL':return'Reversão altista em formação; melhora se semanal e volume acompanharem.';case'APROXIMACAO':return'Observar: está perto de um gatilho, mas ainda faltam condições para entrada.';case'TENDENCIA_ESTICADA':return'Tendência forte, porém esticada; ponto de nova entrada é pior e lucro deve ser protegido.';case'REALIZACAO_PARCIAL':return'Perda inicial de força; para posição lucrativa, avaliar proteção/redução.';case'SAIDA_CONFIRMADA':return'Deterioração mais robusta; evitar nova entrada e reavaliar posição existente.';default:return'Sem gatilho operacional forte nesta leitura.';}}
  function factors(i){const good=[],bad=[];const regime=String(i.regime?.label??i.regime??''),mom=String(i.momentum?.label??i.momentum??'');
    if(/Alta Total|Alta Longo/i.test(regime))good.push('Estrutura de longo prazo favorável');else if(/Baixa Total/i.test(regime))bad.push('Tendência estrutural ainda baixista');
    if(/revers|alta/i.test(mom)&&!/baix/i.test(mom))good.push(`Momentum: ${mom}`);if(/deterior|baix/i.test(mom))bad.push(`Momentum: ${mom}`);
    if(Number.isFinite(i.volRatio)){if(i.volRatio>=1)good.push(`Volume relativo ${i.volRatio.toFixed(2)}x confirma melhor o movimento`);else if(i.volRatio<.7)bad.push(`Volume relativo ${i.volRatio.toFixed(2)}x: confirmação fraca`);}
    if(Number.isFinite(i.drawdown52)&&i.drawdown52>=-30&&i.drawdown52<=-5){if(!/Baixa Total/i.test(regime))good.push(`Correção de ${i.drawdown52.toFixed(1)}% dentro de faixa moderada`);else bad.push(`Drawdown ${i.drawdown52.toFixed(1)}% não é confirmação positiva enquanto a tendência for baixista`);}
    if(/acima da referência|materialmente acima|não perseguir/i.test(String(i.valuation??i.valuation?.label??'')))bad.push('Valuation não reforça a entrada');
    return{good,bad};
  }
  function list(xs,empty){return xs.length?`<ul style="margin:5px 0 0;padding-left:18px">${xs.map(x=>`<li>${esc2(x)}</li>`).join('')}</ul>`:`<span class="muted">${esc2(empty)}</span>`;}
  function patchLegend(){if(q('#demoConvLegend'))return;const alerts=q('.alerts');if(!alerts)return;const d=document.createElement('div');d.id='demoConvLegend';d.className='callout';d.innerHTML='<b>Convicção:</b> ☆ score ≤ 0 = sem confluência positiva · ★ score 1 = baixa · ★★ score 2 = média · ★★★ score ≥ 3 = alta. O score é líquido: confirmações somam e alertas descontam; não é simples contagem de indicadores.';alerts.after(d);}
  const prev=window.select;
  if(typeof prev==='function')window.select=function(i){prev(i);if(!i)return;const d=q('#detail'),c=conv(i),f=factors(i);const old=q('#demoSignal');old?.remove();const sec=document.createElement('div');sec.id='demoSignal';sec.className='section';sec.innerHTML=`<h4>Leitura integrada do sinal</h4><div class="box"><b>${esc2(action(i))}</b><br><span class="muted">Convicção: ${c.stars} ${c.level}${Number.isFinite(c.score)?` · score ${c.score}`:''}</span></div><div class="kv" style="margin-top:6px"><div class="metric"><span>O que sustenta</span>${list(f.good,'Nenhuma confirmação adicional forte nesta amostra.')}</div><div class="metric"><span>O que limita</span>${list(f.bad,'Nenhum alerta material adicional.')}</div></div><div class="note" style="margin-top:6px">A demo usa a mesma lógica de leitura do painel privado, mas não publica carteira, histórico, preços de compra ou posições.</div>`;d.appendChild(sec);};
  patchLegend();setTimeout(()=>{patchLegend();if(window.S?.items?.length&&typeof window.select==='function')window.select(window.S.items[0]);},600);
})();
