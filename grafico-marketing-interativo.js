/* Gráfico recalculado a partir das observações de teste do modelo reconstruído. */
(function(){
'use strict';
let selection=20, cost=3, revenue=11;
const nf=(x,dec=0)=>Number(x).toLocaleString('pt-BR',{minimumFractionDigits:dec,maximumFractionDigits:dec});
const curve=()=>window.MODELOS_PYTHON?.marketing_calculado?.curva_teste||[];
const value=d=> ((d.respostas_teste*revenue)-(d.contatos_teste*cost))*(2212/553);
const dataset=()=>curve().map(d=>({...d, profit:value(d)}));
const fmtProfit=n=>(n>=0?'+':'')+nf(n)+' u.m.';
function setSelection(v){selection=Number(v); draw();}
function draw(){
 const root=document.getElementById('mainchart');if(!root||!root.querySelector('#mk-interactive-chart'))return;
 const pts=dataset(), chosen=pts.find(d=>d.cobertura===selection)||pts[0];
 const best=pts.reduce((a,b)=>b.profit>a.profit?b:a), full=pts.find(d=>d.cobertura===100);
 const viable=best.profit>0;
 if(!chosen)return;
 const chart=root.querySelector('#mk-interactive-chart');
 const min=Math.min(0,...pts.map(d=>d.profit)),max=Math.max(0,...pts.map(d=>d.profit)), pad=(max-min)*.12||100;
 const yMin=min-pad,yMax=max+pad;const X=v=>80+(v-5)/95*600,Y=v=>294-(v-yMin)/(yMax-yMin)*248;
 const coords=pts.map(d=>`${X(d.cobertura).toFixed(1)},${Y(d.profit).toFixed(1)}`).join(' ');
 const y0=Y(0);let svg=`<svg viewBox="0 0 720 370" width="100%" role="img" aria-label="Gráfico interativo de lucro estimado por cobertura de clientes"><rect x="0" y="0" width="720" height="370" rx="12" fill="transparent"/>`;
 for(let t=0;t<=4;t++){let v=yMin+(yMax-yMin)*t/4;svg+=`<line x1="80" x2="682" y1="${Y(v)}" y2="${Y(v)}" stroke="#dde3ee" stroke-dasharray="4 4"/><text x="66" y="${Y(v)+4}" font-size="11" fill="#64748b" text-anchor="end">${nf(v)}</text>`}
 svg+=`<line x1="80" x2="682" y1="${y0}" y2="${y0}" stroke="#8fa0b5"/><polyline fill="none" stroke="#6940d8" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" points="${coords}"/>`;
 for(const d of pts){let active=d.cobertura===selection;svg+=`<circle class="mk-chart-point" tabindex="0" role="button" aria-label="Selecionar ${d.cobertura}% dos clientes, lucro ${nf(d.profit)}" data-pct="${d.cobertura}" cx="${X(d.cobertura)}" cy="${Y(d.profit)}" r="${active?7:4.3}" fill="${active?'#6940d8':(d.profit<0?'#d04454':'#6940d8')}" stroke="white" stroke-width="${active?2.4:1.3}"><title>${d.cobertura}% · ${nf(d.contatos_teste)} contatos no teste · lucro estimado ${nf(d.profit)} u.m.</title></circle>`}
 // Destaque visual sem sobrepor textos ao gráfico.
 const bx=X(best.cobertura), by=Y(best.profit);
 svg+=`<line x1="${bx}" x2="${bx}" y1="38" y2="${y0}" stroke="${viable?'#07966f':'#c63d50'}" stroke-width="2.5" stroke-dasharray="6 4"/><circle cx="${bx}" cy="${by}" r="10" fill="${viable?'#07966f':'#c63d50'}" stroke="white" stroke-width="3"/>`;
 svg+=`<line x1="${X(selection)}" x2="${X(selection)}" y1="38" y2="${y0}" stroke="#6940d8" stroke-width="1.7" stroke-dasharray="5 4"/>`;
 for(const v of [5,20,40,60,80,100])svg+=`<text x="${X(v)}" y="337" text-anchor="middle" font-size="11" fill="#64748b">${v}%</text>`;
 svg+=`<text x="380" y="363" text-anchor="middle" font-size="12" fill="#64748b">Percentual da base contatada</text></svg>`;
 chart.innerHTML=svg;
 root.querySelector('#mk-cover').value=String(selection);root.querySelector('#mk-cover-output').textContent=selection+'%';
 root.querySelector('#mk-value').textContent=(chosen.profit>=0?'+':'')+nf(chosen.profit)+' u.m.';
 root.querySelector('#mk-value').style.color=chosen.profit>=0?'#0b916e':'#c63d50';
 root.querySelector('#mk-count').textContent=nf(Math.round(2212*selection/100));
 root.querySelector('#mk-rate').textContent=nf(100*chosen.respostas_teste/chosen.contatos_teste,1)+'%';
 root.querySelector('#mk-selected-summary').textContent=selection+'%';
 root.querySelector('#mk-selected-summary-detail').textContent=fmtProfit(chosen.profit)+' · '+nf(100*chosen.respostas_teste/chosen.contatos_teste,1)+'% de resposta';
 root.querySelector('#mk-best-summary').textContent=viable ? best.cobertura+'%' : 'Revisar';
 root.querySelector('#mk-best-summary-detail').textContent=viable ? (fmtProfit(best.profit)+' · '+nf(best.respostas_teste/best.contatos_teste*100,1)+'% de resposta') : ('Melhor cenário: '+fmtProfit(best.profit));
 const bestCard=root.querySelector('#mk-best-card');
 if(bestCard){bestCard.className='mk-summary-card '+(viable?'mk-summary-card--best':'mk-summary-card--risk');}
 root.querySelector('#mk-recommend').textContent=viable
 ? 'Decisão sugerida: contatar '+best.cobertura+'% dos clientes com maior probabilidade de resposta. Lucro estimado de '+fmtProfit(best.profit)+' contra '+fmtProfit(full.profit)+' ao contatar 100%. Cenário selecionado: '+selection+'% ('+fmtProfit(chosen.profit)+').'
 : 'Decisão sugerida: não lançar a campanha sob as premissas atuais. Mesmo a melhor cobertura avaliada ('+best.cobertura+'%) projeta '+fmtProfit(best.profit)+'. Reveja custo, receita ou segmentação antes de investir.';
 if(typeof window.updateMarketingDecision==='function') window.updateMarketingDecision();
 chart.querySelectorAll('.mk-chart-point').forEach(circle=>{circle.addEventListener('click',()=>setSelection(circle.dataset.pct));circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelection(circle.dataset.pct)}})});
}
window.renderInteractiveMarketing=function(root){
 if(!curve().length){root.innerHTML='<p>Não foi possível carregar a curva calculada. Confira o arquivo dados-calculados.js.</p>';return}
 root.innerHTML=`<div class="mk-controls"><label for="mk-cover">Cobertura de clientes <b id="mk-cover-output">20%</b><input type="range" min="5" max="100" step="5" value="20" id="mk-cover"/></label><label for="mk-cost">Custo por contato (u.m.)<input type="number" id="mk-cost" min="0" max="1000" step="0.5" value="3"/></label><label for="mk-revenue">Receita por resposta (u.m.)<input type="number" id="mk-revenue" min="0" max="1000" step="0.5" value="11"/></label></div><div class="mk-chart-summary"><div class="mk-summary-card"><span>◉ Cobertura selecionada</span><strong id="mk-selected-summary">20%</strong><small id="mk-selected-summary-detail">—</small></div><div class="mk-summary-card mk-summary-card--best" id="mk-best-card"><span>✦ Recomendação do agente</span><strong id="mk-best-summary">—</strong><small id="mk-best-summary-detail">—</small></div></div><div class="mk-chart-legend" aria-label="Legenda do gráfico"><span><i class="mk-legend-dot mk-legend-selection"></i> Cenário selecionado</span><span><i class="mk-legend-dot mk-legend-recommended"></i> Melhor lucro projetado</span><span><i class="mk-legend-dot mk-legend-loss"></i> Projeção negativa</span></div><div id="mk-interactive-chart"></div><div class="mk-results"><div><span>Lucro projetado na cobertura escolhida</span><strong id="mk-value">—</strong></div><div><span>Clientes selecionados (base total)</span><strong id="mk-count">—</strong></div><div><span>Conversão observada no teste</span><strong id="mk-rate">—</strong></div></div><div class="mk-selected" id="mk-recommend"></div><p class="mk-caption">Clique nos pontos do gráfico ou mova o controle. Os cenários são recalculados a partir dos resultados observados no conjunto de teste do modelo reconstruído e projetados proporcionalmente para os 2.212 clientes. O lucro é estimado, não incremental.</p>`;
 root.querySelector('#mk-cover').addEventListener('input',e=>setSelection(e.target.value));
 root.querySelector('#mk-cost').addEventListener('input',e=>{cost=Number(e.target.value);draw()});
 root.querySelector('#mk-revenue').addEventListener('input',e=>{revenue=Number(e.target.value);draw()});
 draw();
};
window.marketingInsightsMarkup=function(){return `<div class="mk-insights-heading"><span class="mk-eyebrow">✦ Insights estratégicos</span><h4>Seis principais achados do Agente de Marketing</h4><p class="mk-footnote">Achados derivados da base de clientes e dos resultados de teste; valores financeiros respondem aos parâmetros da simulação acima.</p></div><div class="mk-insights-grid"><article class="mk-insight"><span class="mk-insight-icon">01</span><h5>Baixa resposta na campanha geral</h5><p>A taxa de resposta histórica é de <strong>15,05%</strong> (333 de 2.212 clientes). A maioria não respondeu à oferta registrada.</p><p class="mk-action"><b>Ação:</b> segmentar a base antes de iniciar novos contatos.</p></article><article class="mk-insight"><span class="mk-insight-icon">02</span><h5>Seleção melhora a eficiência</h5><p>No teste, os <strong>20% mais bem classificados</strong> tiveram <strong id="mk-top20-rate">—</strong> de resposta, acima da média geral.</p><p class="mk-action"><b>Ação:</b> ordenar os clientes pela probabilidade prevista.</p></article><article class="mk-insight"><span class="mk-insight-icon">03</span><h5>Maior conversão não garante maior lucro</h5><p id="mk-insight-tradeoff">—</p><p class="mk-action"><b>Ação:</b> escolher a cobertura pelo resultado financeiro esperado.</p></article><article class="mk-insight"><span class="mk-insight-icon">04</span><h5>Contatar toda a base pode custar caro</h5><p id="mk-insight-mass">—</p><p class="mk-action"><b>Ação:</b> comparar a campanha massiva com uma campanha direcionada.</p></article><article class="mk-insight"><span class="mk-insight-icon">05</span><h5>Modelo útil para priorização</h5><p>A Regressão Logística reconstruída alcançou <strong id="mk-auc-test">—</strong> de AUC no teste: discrimina respostas, mas não garante conversões futuras.</p><p class="mk-action"><b>Ação:</b> monitorar o desempenho com novos clientes.</p></article><article class="mk-insight"><span class="mk-insight-icon">06</span><h5>Rentabilidade precisa de validação real</h5><p>Os lucros projetados usam respostas históricas, custo por contato e receita por resposta. Não medem automaticamente efeito incremental.</p><p class="mk-action"><b>Ação:</b> realizar campanha piloto com grupo de controle.</p></article></div>`;};
window.renderMarketingDecision=function(){
 const node=document.getElementById('marketing-decision');if(!node)return;
 node.innerHTML=`<section class="panel mk-decision"><div class="mk-decision-head"><div><span class="mk-eyebrow">✦ Inteligência de Marketing</span><h3>Análise, conversão e recomendação de campanha</h3><p class="sub">Comparação de cenários com base no teste do modelo de classificação e nas premissas de custo e receita selecionadas acima.</p></div></div><div class="mk-decision-kpis"><div><span>Clientes da base limpa</span><strong>2.212</strong><small>2.240 registros originais</small></div><div><span>Resposta geral da base</span><strong>15,05%</strong><small>333 respostas de 2.212 clientes</small></div><div><span>Melhor cobertura avaliada</span><strong id="mk-best-coverage">—</strong><small>Entre os níveis de 5% a 100%</small></div><div><span>Lucro ao contatar 100%</span><strong id="mk-full-profit">—</strong><small>Projeção para toda a base</small></div></div><div class="mk-decisions"><div><h4>Recomendação do agente</h4><p id="mk-decision-recommendation"></p><p class="mk-footnote">Priorize os clientes por probabilidade de resposta. Histórico de aceites e renda podem auxiliar na análise, mas não substituem a classificação do modelo. Valide a estratégia em um piloto com grupo de controle.</p></div><div><h4>Comparação com 100% de contatos</h4><p id="mk-decision-comparison"></p><p class="mk-footnote">Premissas ajustáveis: custo por contato e receita por resposta. Os resultados são estimativas, não lucro incremental comprovado.</p></div></div><div class="mk-insight-summary"><h4>Prioridade para a próxima campanha</h4><p id="mk-insight-summary-text">—</p></div><h4 class="mk-table-title">Conversão e lucro por cobertura</h4><div class="mk-table-scroll"><table class="mk-scenario-table"><thead><tr><th>Cobertura</th><th>Conversão no teste</th><th>Lucro projetado</th><th>Ação</th></tr></thead><tbody id="mk-table-body"></tbody></table></div><p class="mk-footnote">Há duas análises diferentes: a referência pré-carregada identifica 20% (conversão de 51,8%, lucro de +1.220 u.m.); a reconstrução Python fornece uma curva própria, usada nesta simulação. Não são resultados da mesma execução. A referência não varia com os parâmetros acima.</p></section>`;
 window.updateMarketingDecision();
};
window.updateMarketingDecision=function(){
 const root=document.getElementById('marketing-decision');if(!root||!root.querySelector('#mk-table-body'))return;
 const data=dataset();if(!data.length)return;const best=data.reduce((a,b)=>b.profit>a.profit?b:a);const full=data.find(d=>d.cobertura===100);const chosen=data.find(d=>d.cobertura===selection)||data[0];
 root.querySelector('#mk-best-coverage').textContent=best.cobertura+'%';
 root.querySelector('#mk-full-profit').textContent=fmtProfit(full.profit);
 root.querySelector('#mk-full-profit').className=full.profit<0?'mk-negative':'mk-positive';
 root.querySelector('#mk-decision-recommendation').textContent=best.profit>0 ? 'Com custo de '+nf(cost,2)+' u.m. por contato e receita de '+nf(revenue,2)+' u.m. por resposta, o melhor resultado entre as coberturas testadas ocorre ao contatar '+best.cobertura+'% dos clientes: conversão observada de '+nf(100*best.respostas_teste/best.contatos_teste,1)+'% e lucro projetado de '+fmtProfit(best.profit)+'. Valide essa cobertura em um piloto com grupo de controle.' : 'Com custo de '+nf(cost,2)+' u.m. por contato e receita de '+nf(revenue,2)+' u.m. por resposta, todas as coberturas avaliadas projetam resultado financeiro não positivo. Recomenda-se não iniciar campanha com estas premissas e revisar segmentação e custos.';
 root.querySelector('#mk-decision-comparison').textContent='Na seleção atual ('+selection+'%), o lucro projetado é '+fmtProfit(chosen.profit)+', contra '+fmtProfit(full.profit)+' ao contatar 100% da base. Diferença estimada: '+fmtProfit(chosen.profit-full.profit)+'.';
 const top20=data.find(d=>d.cobertura===20), top15=data.find(d=>d.cobertura===15);
 const logistic=window.MODELOS_PYTHON?.marketing_calculado?.modelos?.find(m=>m.modelo==='Regressão Logística');
 document.getElementById('mk-top20-rate').textContent=nf(100*top20.respostas_teste/top20.contatos_teste,1)+'%';
 document.getElementById('mk-auc-test').textContent=logistic?nf(logistic.auc_teste,4):'não disponível';
 const top15rate=100*top15.respostas_teste/top15.contatos_teste;
 document.getElementById('mk-insight-tradeoff').textContent='A cobertura de 15% tem '+nf(top15rate,1)+'% de conversão no teste. Com as premissas atuais, a maior projeção de lucro é em '+best.cobertura+'% da base ('+fmtProfit(best.profit)+').';
 document.getElementById('mk-insight-mass').textContent='Com os parâmetros atuais, contatar 100% resulta em '+fmtProfit(full.profit)+'. '+(full.profit<0?'O cenário representa perda financeira estimada.':'O resultado é positivo, mas deve ser comparado com coberturas mais seletivas.');
 root.querySelector('#mk-insight-summary-text').textContent=best.profit>0 ? 'Priorizar clientes por probabilidade de resposta. Nas premissas atuais, '+best.cobertura+'% da base apresenta o maior lucro entre as coberturas avaliadas ('+fmtProfit(best.profit)+'), versus '+fmtProfit(full.profit)+' em 100% dos contatos. Validar a estratégia em um piloto controlado antes de ampliar o investimento.' : 'Nenhum cenário de contato avaliado apresenta lucro positivo. Não lançar a campanha nas condições financeiras atuais; revisar custos, receita e seleção.';

 const rows=[15,20,30,50,100];root.querySelector('#mk-table-body').innerHTML=rows.map(p=>{let d=data.find(x=>x.cobertura===p);return '<tr'+(p===selection?' class="mk-row-current"':'')+'><td>'+p+'%</td><td>'+nf(d.respostas_teste/d.contatos_teste*100,1)+'%</td><td class="'+(d.profit<0?'mk-negative':'mk-positive')+'">'+fmtProfit(d.profit)+'</td><td><button type="button" class="mk-pick" data-pct="'+p+'">Selecionar</button></td></tr>'}).join('');
 root.querySelectorAll('.mk-pick').forEach(btn=>btn.addEventListener('click',()=>{setSelection(btn.dataset.pct);document.getElementById('mainchart')?.scrollIntoView({behavior:'smooth',block:'center'})}));
};
})();
