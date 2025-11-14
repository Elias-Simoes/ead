# ✅ Upload com Cloudflare R2 Configurado!

## 🎉 Status

- ✅ Credenciais do R2 adicionadas ao `.env`
- ✅ Rota de upload criada (`POST /api/upload`)
- ✅ Controller implementado
- ✅ Storage service configurado
- ✅ Multer instalado
- ✅ Servidor reiniciado com novas configurações

## 🔧 Configuração

As seguintes variáveis foram adicionadas ao `.env`:

```env
STORAGE_PROVIDER=cloudflare
CLOUDFLARE_R2_ACCOUNT_ID=559ee585bcbe7a3128dcb5524d7bfe5c
CLOUDFLARE_R2_ACCESS_KEY_ID=d85f6bf87ccfacad1b6c275635ecdce
CLOUDFLARE_R2_SECRET_ACCESS_KEY=15266d723a1068a5bf801239519De504aca698fd43fa3c6aa6efd14D4189a74
CLOUDFLARE_R2_BUCKET=ead
CDN_URL=https://pub-d85f6bf87ccfacad1b6c275635ecdce.r2.dev
```

## 🚀 Como Usar

### 1. Criar Curso com URL de Imagem (Funciona Agora)

1. Acesse: http://localhost:5173/instructor/courses/new
2. Preencha os dados do curso
3. No campo "URL da Imagem de Capa", cole uma URL como:
   - `https://via.placeholder.com/400x300`
   - Ou qualquer URL de imagem pública
4. Clique em "Criar Curso"

### 2. Testar Upload de Arquivo via API

```bash
# Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"instructor@example.com","password":"Instructor123!"}'

# Copiar o token da resposta

# Fazer upload de um arquivo
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@caminho/para/sua/imagem.jpg" \
  -F "folder=courses"
```

### 3. Próximo Passo: Restaurar Upload no Frontend

Para habilitar o upload de arquivo no formulário de curso, precisamos restaurar o código original do `CourseFormPage.tsx` que tinha:

- Input de arquivo (file input)
- Preview da imagem
- Upload para `/api/upload` antes de criar o curso

## 📝 Estrutura de Pastas no R2

Os arquivos serão organizados assim:

```
ead/
├── courses/          # Imagens de capa de cursos
├── lessons/          # Vídeos e materiais de aulas
├── certificates/     # Certificados gerados
└── uploads/          # Outros uploads
```

## 🔍 Verificar se Está Funcionando

1. **Teste a rota de upload:**
   ```bash
   node test-create-course.js
   ```

2. **Verifique os logs do servidor:**
   - Deve mostrar "File uploaded successfully" quando fizer upload

3. **Acesse o R2 Dashboard:**
   - https://dash.cloudflare.com/
   - Vá em R2 → Buckets → ead
   - Verifique se os arquivos aparecem lá

## ✅ Próximos Passos

1. Testar criar curso com URL de imagem ✅
2. Restaurar código de upload no frontend
3. Testar upload de arquivo local
4. Implementar upload para vídeos de aulas
5. Implementar upload para materiais complementares

---

**Tudo pronto para usar!** 🎉
