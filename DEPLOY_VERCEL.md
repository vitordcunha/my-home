# 🚀 Guia de Deploy na Vercel

Este guia contém todos os passos necessários para fazer o deploy da aplicação **Nossa Casa** na Vercel.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com) (pode usar login do GitHub)
- Node.js instalado
- Git configurado
- Projeto Supabase configurado e funcionando

## 🛠️ Método 1: Deploy via Dashboard da Vercel (Recomendado)

### Passo 1: Preparar o Repositório Git

Se ainda não tiver seu projeto no GitHub, GitLab ou Bitbucket:

```bash
# Inicializar git (se ainda não tiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Preparar para deploy na Vercel"

# Adicionar repositório remoto (criar repositório no GitHub primeiro)
git remote add origin https://github.com/seu-usuario/seu-repositorio.git

# Fazer push
git push -u origin main
```

### Passo 2: Importar Projeto na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"** ou **"Import Project"**
3. Conecte sua conta do GitHub/GitLab/Bitbucket se ainda não tiver
4. Selecione o repositório **my-home**
5. A Vercel detectará automaticamente que é um projeto Vite

### Passo 3: Configurar Variáveis de Ambiente

Na tela de configuração do projeto:

1. Expanda a seção **"Environment Variables"**
2. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL = sua_url_do_supabase
VITE_SUPABASE_ANON_KEY = sua_chave_publica_do_supabase
```

**🔑 Onde encontrar essas variáveis:**

- Acesse seu [Supabase Dashboard](https://app.supabase.com)
- Vá em **Settings** → **API**
- `VITE_SUPABASE_URL` = URL do projeto
- `VITE_SUPABASE_ANON_KEY` = anon/public key

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build e deploy (leva cerca de 1-2 minutos)
3. Pronto! Sua aplicação estará no ar 🎉

## 🖥️ Método 2: Deploy via CLI da Vercel

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Fazer Login

```bash
vercel login
```

Escolha o método de login (GitHub, GitLab, Email, etc.)

### Passo 3: Deploy

No diretório do projeto, execute:

```bash
vercel
```

Durante o processo interativo:

1. **Set up and deploy?** → Yes
2. **Which scope?** → Escolha sua conta
3. **Link to existing project?** → No (primeira vez)
4. **What's your project's name?** → nossa-casa (ou o nome que preferir)
5. **In which directory is your code located?** → ./ (deixar padrão)
6. **Want to modify the settings?** → No (o arquivo vercel.json já está configurado)

### Passo 4: Configurar Variáveis de Ambiente (CLI)

```bash
# Adicionar variáveis de ambiente
vercel env add VITE_SUPABASE_URL production
# Cole o valor quando solicitado

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole o valor quando solicitado
```

### Passo 5: Fazer Deploy em Produção

```bash
vercel --prod
```

## 🔄 Deploys Futuros

### Via Git (Automático)

Após o primeiro deploy via dashboard:

- Cada push para a branch `main` fará deploy automático em produção
- Pushes em outras branches criarão preview deployments

### Via CLI

```bash
# Deploy de preview
vercel

# Deploy em produção
vercel --prod
```

## ⚙️ Configuração Supabase para Produção

Após o deploy, você precisa configurar a URL da Vercel no Supabase:

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **URL Configuration**
3. Adicione a URL da Vercel em **Site URL**: `https://seu-projeto.vercel.app`
4. Adicione também em **Redirect URLs**: `https://seu-projeto.vercel.app/**`

## 🎨 Domínio Personalizado (Opcional)

1. No dashboard da Vercel, vá em **Settings** → **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `nossa-casa.com`)
4. Siga as instruções para configurar DNS

## 📊 Monitoramento

Após o deploy, você pode:

- Ver logs em tempo real no dashboard da Vercel
- Configurar notificações de deploy
- Ver analytics de performance
- Configurar alertas

## 🐛 Troubleshooting

### Erro: "Missing environment variables"

**Solução:** Certifique-se de adicionar todas as variáveis de ambiente necessárias:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Erro 404 ao navegar nas rotas

**Solução:** O arquivo `vercel.json` já está configurado para resolver isso. Se persistir, verifique se o arquivo existe.

### Build falha

**Solução:**

1. Teste o build localmente: `npm run build`
2. Verifique se todas as dependências estão no `package.json`
3. Veja os logs de erro no dashboard da Vercel

### PWA não funciona após deploy

**Solução:** PWAs precisam de HTTPS (Vercel já fornece). Limpe o cache do navegador e tente novamente.

## 🔗 Links Úteis

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel + Vite](https://vercel.com/docs/frameworks/vite)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

## 🎯 Checklist de Deploy

- [ ] Repositório Git criado e código commitado
- [ ] Variáveis de ambiente do Supabase configuradas na Vercel
- [ ] Primeiro deploy realizado com sucesso
- [ ] URL da Vercel adicionada no Supabase (Site URL e Redirect URLs)
- [ ] Testado login e autenticação em produção
- [ ] PWA funcionando corretamente
- [ ] Todas as funcionalidades testadas em produção

---

**Boa sorte com o deploy! 🚀**
