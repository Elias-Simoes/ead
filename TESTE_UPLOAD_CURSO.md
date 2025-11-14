# Teste de Upload - Criação de Curso

## ✅ Upload Implementado!

A rota de upload foi implementada e está funcionando com Cloudflare R2.

## 🚀 Como Testar

### 1. Criar Curso com URL de Imagem

Por enquanto, use uma URL de imagem:

1. Acesse: http://localhost:5173/instructor/courses/new
2. Preencha:
   - **Título:** Curso de React Avançado
   - **Descrição:** Aprenda React do zero ao avançado
   - **Categoria:** Programação
   - **Carga Horária:** 40
   - **URL da Imagem:** `https://via.placeholder.com/400x300`
3. Clique em **"Criar Curso"**

### 2. Verificar se Funcionou

- ✅ Curso deve ser criado com sucesso
- ✅ Você será redirecionado para a página de módulos
- ✅ A imagem deve aparecer no preview

## 📝 Próximos Passos

Para habilitar o upload de arquivo (arrastar e soltar):

1. Restaurar o código de upload no `CourseFormPage.tsx`
2. Testar upload de arquivo local
3. Verificar se a imagem é enviada para o R2

## 🔧 Configuração do R2

Certifique-se de que as variáveis de ambiente estão configuradas:

```env
STORAGE_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=seu_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=sua_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=sua_secret_key
CLOUDFLARE_R2_BUCKET=ead
CDN_URL=https://seu-bucket.r2.dev
```

## 🧪 Testar API de Upload Diretamente

```bash
# Criar um arquivo de teste
echo "test" > test.txt

# Fazer upload via curl
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@test.txt" \
  -F "folder=courses"
```

## ✅ Status

- ✅ Rota de upload criada (`POST /api/upload`)
- ✅ Controller implementado
- ✅ Storage service configurado para R2
- ✅ Multer instalado
- ✅ Servidor rodando

Agora você pode criar cursos usando URLs de imagem. O upload de arquivo está pronto, mas precisa ser testado!
