/* Chat GPT; conversas separadas para cada agente. Não expõe a chave de API. */
(function(){
 const logs={};
 const titles={marketing:'Agente de Marketing',vendas:'Agente de Vendas',financeiro:'Agente Financeiro',fiscal:'Agente Fiscal',comite:'Comitê de Diretoria'};
 let sending=false;
 const box=document.getElementById('chat-messages'), status=document.getElementById('chat-status'), input=document.getElementById('chat-question');
 function active(){return (typeof area==='string'&&titles[area])?area:'marketing'}
 function append(role,content){const div=document.createElement('div'); div.className='chat-bubble '+role;div.textContent=content;box.appendChild(div);box.scrollTop=box.scrollHeight;return div}
 function refresh(){const a=active();document.getElementById('chat-title').textContent='Converse com '+(titles[a]||'o agente');box.replaceChildren();(logs[a]||[]).forEach(m=>append(m.role,m.content));if(!logs[a]?.length)append('assistant','Faça uma pergunta sobre os resultados e as limitações deste painel.');}
 async function health(){try{const r=await fetch('/api/status',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json();status.textContent=d.configured?'Chat GPT conectado':'Servidor ativo · falta chave de API';status.className='chat-status '+(d.configured?'online':'offline')}catch(_){status.textContent='Chat indisponível · verifique o servidor';status.className='chat-status offline'}}
 const old=window.changeArea;
 if(typeof old==='function')window.changeArea=function(k){old(k);refresh()};
 document.getElementById('chat-form').addEventListener('submit',async e=>{
  e.preventDefault(); if(sending)return;
  const text=input.value.trim();if(!text)return;
  const a=active();logs[a]??=[];
  const history=logs[a].slice(-8).map(x=>({role:x.role==='user'?'user':'assistant',content:x.content}));
  logs[a].push({role:'user',content:text});append('user',text);input.value='';sending=true;document.getElementById('chat-send').disabled=true;
  const pending=append('assistant','Consultando evidências…');
  try{const resp=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent:a,message:text,history})});const result=await resp.json();if(!resp.ok)throw Error(result.error||'Não foi possível consultar o GPT.');pending.textContent=result.answer;logs[a].push({role:'assistant',content:result.answer})}
  catch(err){pending.textContent='Não foi possível responder: '+err.message+' Consulte o administrador do projeto.';pending.classList.add('error')}
  finally{sending=false;document.getElementById('chat-send').disabled=false;box.scrollTop=box.scrollHeight;}
 });
 refresh();health();
})();
