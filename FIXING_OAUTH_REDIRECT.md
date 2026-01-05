# 🔐 Corrigindo Redirecionamento OAuth em Produção

## Problema
Após fazer login com Google em produção, a aplicação redireciona para `localhost:3000` em vez da URL de produção.

## ✅ Solução

### 1. Configurar URLs no Supabase

#### Passo 1: Acessar Configurações
1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Navegue para: **Authentication** → **URL Configuration**

#### Passo 2: Configurar Site URL
Cole a URL de produção da Vercel:
```
https://my-home-ly6yc37cf-vitor852s-projects.vercel.app
```

**⚠️ Importante:** Esta URL muda a cada deploy. Veja a seção "Domínio Permanente" abaixo.

#### Passo 3: Configurar Redirect URLs
Adicione as seguintes URLs (uma por linha):
```
https://my-home-ly6yc37cf-vitor852s-projects.vercel.app/**
http://localhost:3000/**
```

A wildcard `**` permite que todas as rotas funcionem.

#### Passo 4: Salvar
Clique em **Save** no final da página.

---

## 🌐 Configurar Domínio Permanente (RECOMENDADO)

A URL atual da Vercel muda a cada novo deploy. Para evitar reconfigurar sempre:

### Opção A: Domínio Vercel Gratuito

1. **No Dashboard da Vercel:**
   - Acesse: https://vercel.com/vitor852s-projects/my-home
   - Vá em **Settings** → **Domains**
   - Adicione um domínio: `my-home-vitor.vercel.app` (escolha um disponível)
   - Clique em **Add**

2. **No Supabase:**
   - Volte em **Authentication** → **URL Configuration**
   - Atualize **Site URL** para:
     ```
     https://my-home-vitor.vercel.app
     ```
   - Atualize **Redirect URLs** para:
     ```
     https://my-home-vitor.vercel.app/**
     http://localhost:3000/**
     ```

### Opção B: Domínio Personalizado

Se você tem um domínio próprio (ex: `minhacasa.com.br`):

1. **No Dashboard da Vercel:**
   - Vá em **Settings** → **Domains**
   - Adicione seu domínio
   - Siga as instruções para configurar DNS

2. **No Supabase:**
   - Configure com seu domínio personalizado

---

## 🔍 Verificar Configuração do Google OAuth

Se você configurou manualmente as credenciais OAuth do Google:

### Passo 1: Acessar Google Cloud Console
1. Acesse: https://console.cloud.google.com
2. Selecione seu projeto
3. Vá em **APIs & Services** → **Credentials**

### Passo 2: Verificar Redirect URIs
1. Clique nas suas credenciais OAuth 2.0
2. Em **Authorized redirect URIs**, certifique-se de ter:
   ```
   https://oilmgzipghsqjecjtgogo.supabase.co/auth/v1/callback
   ```

### Passo 3: Verificar Authorized JavaScript origins
Adicione suas URLs:
```
https://my-home-ly6yc37cf-vitor852s-projects.vercel.app
http://localhost:3000
```

**Nota:** Se você usa Google OAuth através do Supabase (sem configurar manualmente), o Supabase já gerencia isso automaticamente. Apenas configure as URLs no Supabase.

---

## 🧪 Testar

Após configurar:

1. **Limpe o cache do navegador** ou abra em aba anônima
2. Acesse sua aplicação em produção
3. Tente fazer login com Google
4. Deve redirecionar corretamente para a URL de produção

---

## 📝 Checklist

- [ ] Configurei Site URL no Supabase
- [ ] Configurei Redirect URLs no Supabase
- [ ] (Opcional) Configurei domínio permanente na Vercel
- [ ] Atualizei URLs no Supabase com domínio permanente
- [ ] (Se aplicável) Verifiquei Google OAuth Console
- [ ] Testei login em produção
- [ ] Login funciona e redireciona corretamente

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com/vitor852s-projects/my-home
- **Google Cloud Console:** https://console.cloud.google.com
- **Documentação Supabase Auth:** https://supabase.com/docs/guides/auth

---

## ❓ Problemas Comuns

### "Invalid Redirect URL" no Supabase
- Certifique-se de incluir `/**` no final da URL
- Verifique se não há espaços em branco
- URLs devem começar com `https://` (ou `http://` para localhost)

### Login funciona mas perde sessão
- Verifique variáveis de ambiente na Vercel
- Certifique-se que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas

### Ainda redireciona para localhost
- Limpe cache e cookies do navegador
- Aguarde alguns minutos (mudanças no Supabase podem levar tempo)
- Verifique se salvou as configurações no Supabase

---

**Última atualização:** Janeiro 2026

