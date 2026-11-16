# MVP TDOIA — versão preparada para compartilhar com colegas

Esta pasta é a aplicação completa com quatro agentes, dashboards, gráficos interativos e previsões executadas pelo Python.

## Publicar no Render (serviço Python)

1. Crie um repositório **privado** no GitHub e envie o conteúdo desta pasta para a raiz do repositório. Não envie nenhuma chave de API.
2. Entre em https://dashboard.render.com e escolha **New → Blueprint**. Conecte o repositório criado. O Render lerá `render.yaml`.
3. Defina um valor forte para `TEAM_PASSWORD` (segredo). O acesso usa usuário `equipe` e essa senha.
4. Confirme a criação do serviço e aguarde o status **Live**. O Render fornecerá um endereço HTTPS `https://...onrender.com`.
5. Compartilhe o endereço com seus colegas e passe usuário e senha por canal separado.

### Alternativa sem Blueprint
Crie **New → Web Service**, runtime Python, Build Command `pip install -r requirements.txt`, Start Command `python servidor_chat.py`, Health Check `/health`. Em Environment, configure: `TDOIA_HOST=0.0.0.0`, `PUBLIC_MODE=1`, `TEAM_PASSWORD=<sua senha>`. A plataforma fornece `PORT`.

## Recursos e limites

- Os quatro painéis, os gráficos interativos e os cálculos Python estarão disponíveis a quem tiver a senha.
- O chat GPT fica desabilitado por padrão. Se quiser habilitar, adicione no serviço as variáveis `CHAT_ENABLED=1` e `OPENAI_API_KEY` (configuradas somente nas variáveis do servidor, nunca nos arquivos). A API pode gerar cobrança por uso.
- O editor do painel guarda alterações no navegador de quem edita; não sincroniza mudanças entre colegas. Para compartilhar alterações, use o recurso de exportação/importação presente no MVP.
- A aplicação usa um servidor Python simples para apresentação e uso leve por uma equipe pequena. Não é uma solução de segurança empresarial nem dimensionada para tráfego intenso.
- Os dados carregados no explorador do navegador poderão ser vistos pelos colegas com acesso. Revise o conteúdo antes de convidar pessoas. Não publique dados pessoais ou sigilosos.
- Arquivos originais de treinamento e scripts Python permanecem no servidor e não são disponibilizados como downloads diretos. O repositório GitHub privado contém esses arquivos.
- No plano gratuito o serviço pode suspender por inatividade e levar algum tempo para retornar. Confira condições atuais do Render.

## Segurança

Use repositório privado; senha longa e exclusiva em `TEAM_PASSWORD`; não compartilhe essa senha em mensagens públicas. Em caso de dúvida sobre dados da base, não publique antes de verificar as permissões de uso.

## Teste local do modo público

No Terminal, dentro desta pasta, execute `TDOIA_HOST=127.0.0.1 PUBLIC_MODE=1 TEAM_PASSWORD='senha-de-teste' python servidor_chat.py`. Abra `http://127.0.0.1:8765`, usuário `equipe`, senha de teste. Para rodar as previsões instale as bibliotecas em `requirements.txt`.
