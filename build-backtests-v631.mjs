import fs from 'fs';

const src=JSON.parse(fs.readFileSync('demo-data.json','utf8'));
const items=src.items??[],OUT='backtest-data.json',DAY=86400000,FIVE=5*365.25*DAY;
const priority=['COMPRA_FORTE','ACUMULACAO','REVERSAO_INICIAL','REALIZACAO_PARCIAL','SAIDA_CONFIRMADA','TENDENCIA_ESTICADA','APROXIMACAO'];
const selected=[...items].filter(i=>priority.includes(i.categoria)).sort((a,b)=>priority.indexOf(a.categoria)-priority.indexOf(b.categoria)).slice(0,18);
const benchCache=new Map();
const med=a=>{const x=a.filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2;};
const rnd=(v,d=2)=>Number.isFinite(v)?Number(v.toFixed(d)):null;
function symbol(i){const t=i.ticker.toUpperCase();if(i.market==='BRAZIL')return t+'.SA';if(i.market==='CRYPTO'){const b=t.replace(/USDT$|USD$|BRL$/,'');return b+'-USD';}return t;}
function bench(i){if(i.market==='BRAZIL')return'^BVSP';if(i.market==='AMERICA')return'QQQ';if(i.market==='CRYPTO')return symbol(i).startsWith('BTC-')?null:'BTC-USD';return null;}
async function yahoo(sym){
  const u=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=10y&interval=1d&includeAdjustedClose=true`;
  const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 ScannerQuantDemo/6.3.1'}});if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const j=await r.json(),x=j?.chart?.result?.[0];if(!x)throw new Error('sem histórico');const q=x.indicators?.quote?.[0]??{},adj=x.indicators?.adjclose?.[0]?.adjclose??[],out=[];
  for(let k=0;k<(x.timestamp??[]).length;k++){
    const raw=Number(q.close?.[k]);if(!Number.isFinite(raw)||raw<=0)continue;const a=Number(adj[k]),close=Number.isFinite(a)&&a>0?a:raw,factor=close/raw,hi=Number(q.high?.[k]),lo=Number(q.low?.[k]);
    out.push({ts:new Date(x.timestamp[k]*1000).toISOString(),close,high:Number.isFinite(hi)?hi*factor:close,low:Number.isFinite(lo)?lo*factor:close,vol:Number(q.volume?.[k])||0});
  }
  return out;
}
function sma(v,n){const o=Array(v.length).fill(null);let s=0;for(let i=0;i<v.length;i++){s+=v[i];if(i>=n)s-=v[i-n];if(i>=n-1)o[i]=s/n;}return o;}
function ema(v,n){const o=Array(v.length).fill(null),a=2/(n+1);let e=null;for(let i=0;i<v.length;i++){if(i===n-1){e=v.slice(0,n).reduce((s,x)=>s+x,0)/n;o[i]=e;}else if(i>=n){e=v[i]*a+e*(1-a);o[i]=e;}}return o;}
function rsi(v,n=14){const o=Array(v.length).fill(null);if(v.length<=n)return o;let g=0,l=0;for(let i=1;i<=n;i++){const d=v[i]-v[i-1];d>=0?g+=d:l-=d;}let ag=g/n,al=l/n;o[n]=al===0?100:100-100/(1+ag/al);for(let i=n+1;i<v.length;i++){const d=v[i]-v[i-1];ag=(ag*(n-1)+(d>0?d:0))/n;al=(al*(n-1)+(d<0?-d:0))/n;o[i]=al===0?100:100-100/(1+ag/al);}return o;}
function max(v,n,i){if(i<n-1)return null;let m=-Infinity;for(let k=i-n+1;k<=i;k++)m=Math.max(m,v[k]);return m;}
function ravg(v,n,i){if(i<n-1)return null;let s=0;for(let k=i-n+1;k<=i;k++)s+=v[k];return s/n;}
function regime(mm20,mm50,mm200,p){const c=mm20>mm50,l=p>mm200;return c&&l?'ALTA_TOTAL':c&&!l?'ALTA_CURTO':!c&&l?'ALTA_LONGO':'BAIXA_TOTAL';}
function currentRegime(i){const r=i.regime;if(r&&typeof r==='object')return r.code;const s=String(r??'');if(/Alta Total/i.test(s))return'ALTA_TOTAL';if(/Alta Curto/i.test(s))return'ALTA_CURTO';if(/Alta Longo/i.test(s))return'ALTA_LONGO';if(/Baixa Total/i.test(s))return'BAIXA_TOTAL';return null;}
function bucketVol(v){return !Number.isFinite(v)?'N':v>=1?'H':v>=.7?'M':'L';}
async function build(i){
  const rows=await yahoo(symbol(i)),c=rows.map(x=>x.close),vol=rows.map(x=>x.vol),m20=sma(c,20),m50=sma(c,50),m200=ema(c,200),rr=rsi(c),cut=Date.now()-FIVE,events=[];
  const targetReg=currentRegime(i),targetRsi=Number(i.ifr),targetDD=Number(i.drawdown52),targetVB=bucketVol(Number(i.volRatio));let last=-99;
  for(let k=210;k<rows.length-60;k++){
    if(new Date(rows[k].ts).getTime()<cut)continue;const hi=max(c,252,k),dd=hi?((c[k]/hi)-1)*100:null,av=ravg(vol,10,k),vr=av>0?vol[k]/av:null,rg=regime(m20[k],m50[k],m200[k],c[k]);
    const okRsi=Number.isFinite(targetRsi)&&Number.isFinite(rr[k])?Math.abs(rr[k]-targetRsi)<=7.5:true,okDD=Number.isFinite(targetDD)&&Number.isFinite(dd)?Math.abs(dd-targetDD)<=10:true,okReg=!targetReg||rg===targetReg,okVol=targetVB==='N'||bucketVol(vr)===targetVB;
    if(okRsi&&okDD&&okReg&&okVol&&k-last>=10){events.push({k,price:c[k]});last=k;}
  }
  let bm=null,bLabel=null;const bs=bench(i);if(bs){if(!benchCache.has(bs))benchCache.set(bs,await yahoo(bs));bm=new Map(benchCache.get(bs).map(x=>[x.ts.slice(0,10),x.close]));bLabel=i.market==='BRAZIL'?'Ibovespa':i.market==='AMERICA'?'Nasdaq-100 (QQQ)':'Bitcoin';}
  const summarize=h=>{const rets=[],alph=[];for(const e of events){const end=rows[e.k+h];if(!end)continue;const rt=(end.close/e.price-1)*100;rets.push(rt);if(bm){const a=bm.get(rows[e.k].ts.slice(0,10)),b=bm.get(end.ts.slice(0,10));if(a>0&&b>0)alph.push(rt-(b/a-1)*100);}}const positiveCount=rets.filter(x=>x>0).length;return{n:rets.length,positiveCount,positiveRate:rets.length?rnd(positiveCount/rets.length*100,1):null,medianReturn:rnd(med(rets)),medianAlpha:rnd(med(alph))};};
  const mfe=[],mae=[];for(const e of events){if(!rows[e.k+20])continue;let hi=-Infinity,lo=Infinity;for(let k=e.k+1;k<=e.k+20;k++){hi=Math.max(hi,rows[k].high);lo=Math.min(lo,rows[k].low);}mfe.push((hi/e.price-1)*100);mae.push((lo/e.price-1)*100);}
  const wr=rows.filter(r=>new Date(r.ts).getTime()>=cut);
  return{ticker:i.ticker,market:i.market,category:i.categoria,periodStart:wr[0]?.ts?.slice(0,10)??null,periodEnd:wr.at(-1)?.ts?.slice(0,10)??null,method:'Perfil técnico semelhante: mesma estrutura de tendência, IFR em faixa próxima, distância semelhante da máxima anual e faixa parecida de volume. É uma aproximação estatística da demo, não o replay exato do motor privado.',n:events.length,d5:summarize(5),d20:summarize(20),d60:summarize(60),benchmark:bLabel,risk20:{mfeMedian:rnd(med(mfe)),maeMedian:rnd(med(mae))}};
}
const results={generatedAt:new Date().toISOString(),version:'6.3.1-demo',methodology:'Validação histórica técnica aproximada, com OHLC ajustado de forma consistente e sem look-ahead de fundamentos. O painel privado possui replay do gatilho técnico.',items:{}};
for(const i of selected){const key=`${i.market}:${i.ticker}`;try{results.items[key]=await build(i);console.log('ok',key);}catch(e){results.items[key]={ticker:i.ticker,market:i.market,error:e.message};console.warn('falhou',key,e.message);}await new Promise(r=>setTimeout(r,180));}
fs.writeFileSync(OUT,JSON.stringify(results,null,2));console.log(`Backtests demo V6.3.1: ${Object.keys(results.items).length} -> ${OUT}`);
