#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "=== TDOIA · MVP com previsões Python ==="
python3 - <<'PY'
try:
 import pandas,numpy,sklearn,openpyxl
 print('Dependências Python encontradas.')
except Exception as exc:
 print('Instale as dependências: python3 -m pip install -r requirements.txt')
 print('Detalhes:',exc)
 raise SystemExit(1)
PY
if [ "$?" != 0 ]; then read -p 'Pressione Enter para encerrar...'; exit 1; fi
if [ -z "$OPENAI_API_KEY" ];then
 echo "ChatGPT não configurado (opcional). Os modelos Python funcionam sem chave de API."
fi
python3 servidor_chat.py &
PID=$!
sleep 2
open 'http://127.0.0.1:8765/index.html'
wait "$PID"
