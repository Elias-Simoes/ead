# Remoção do Campo "Link Externo"

## Motivo

O campo "Link Externo" era redundante, pois a seção "Recursos da Aula" já permite adicionar links externos através da opção "Link Externo" no gerenciador de recursos.

## Mudanças Realizadas

### Frontend - LessonFormPage.tsx

**Removido:**
1. ❌ Seção completa "Link Externo" da interface
2. ❌ Campo `externalLink` do estado do formulário
3. ❌ Campo `externalLink` do payload de salvamento
4. ❌ Validação de `externalLink`
5. ❌ Logs de debug de `externalLink`
6. ❌ Carregamento de `external_link` do backend

**Mantido:**
- ✅ Seção "Recursos da Aula" com opção de adicionar links
- ✅ Validação: pelo menos um conteúdo (vídeo, texto ou recursos)

### Backend

O campo `external_link` permanece no banco de dados e na API para:
- Compatibilidade com dados antigos
- Possível uso futuro se necessário

Mas não é mais usado pelo frontend.

## Interface Simplificada

Antes:
```
📹 Vídeo da Aula
📝 Conteúdo em Texto
📎 Recursos da Aula (com opção de link)
🔗 Link Externo ← REDUNDANTE
```

Depois:
```
📹 Vídeo da Aula
📝 Conteúdo em Texto
📎 Recursos da Aula (com opção de link)
```

## Como Adicionar Links Agora

Use a seção "Recursos da Aula":
1. Clique em "+ Adicionar Recurso"
2. Selecione "Link Externo" no tipo
3. Preencha título e URL
4. Salve

## Benefícios

- ✅ Interface mais limpa e menos confusa
- ✅ Menos redundância
- ✅ Todos os recursos (incluindo links) em um só lugar
- ✅ Melhor organização

## Arquivos Modificados

- `frontend/src/pages/instructor/LessonFormPage.tsx`

## Status

✅ Campo removido
✅ Interface simplificada
✅ Validação atualizada
✅ Pronto para uso
