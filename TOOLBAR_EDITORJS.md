# Toolbar do EditorJS

## Implementação Concluída

A toolbar inline e a toolbar de blocos do EditorJS foram configuradas e estilizadas.

## Tipos de Toolbar

### 1. Toolbar Inline (Formatação de Texto)

Aparece quando você **seleciona texto** dentro de um bloco.

#### Ferramentas Disponíveis:

- **Bold (Negrito)** - `Ctrl/Cmd + B`
  - Deixa o texto em negrito
  - Exemplo: **texto em negrito**

- **Italic (Itálico)** - `Ctrl/Cmd + I`
  - Deixa o texto em itálico
  - Exemplo: *texto em itálico*

- **Link** - `Ctrl/Cmd + K`
  - Transforma texto em link clicável
  - Abre popup para inserir URL

- **Inline Code** - `Cmd+Shift+M`
  - Formata texto como código inline
  - Exemplo: `const x = 10`

- **Marker (Highlight)** - `Cmd+Shift+H`
  - Destaca texto com cor de fundo
  - Exemplo: texto destacado

#### Como Usar:

1. Selecione o texto que deseja formatar
2. A toolbar inline aparecerá automaticamente acima do texto
3. Clique no ícone da formatação desejada
4. Ou use os atalhos de teclado

### 2. Toolbar de Blocos (Adicionar Conteúdo)

Aparece ao lado esquerdo de cada bloco quando você passa o mouse.

#### Botão "+" (Adicionar Bloco)

Clique no `+` para ver o menu de blocos disponíveis:

- **Text** - Parágrafo simples
- **Heading** - Títulos (H1, H2, H3, H4)
- **List** - Lista ordenada ou não ordenada
- **Code** - Bloco de código
- **Quote** - Citação
- **Delimiter** - Separador visual

#### Botão "⋮" (Configurações do Bloco)

Clique nos três pontos para:
- Mover bloco para cima
- Mover bloco para baixo
- Deletar bloco

### 3. Toolbar de Conversão

Aparece quando você digita `/` no início de uma linha vazia.

#### Como Usar:

1. Em uma linha vazia, digite `/`
2. Menu de blocos aparecerá
3. Digite para filtrar (ex: `/code`, `/list`)
4. Pressione Enter para selecionar

## Atalhos de Teclado

### Formatação Inline

| Ação | Windows/Linux | Mac |
|------|---------------|-----|
| Negrito | `Ctrl + B` | `Cmd + B` |
| Itálico | `Ctrl + I` | `Cmd + I` |
| Link | `Ctrl + K` | `Cmd + K` |
| Código Inline | `Ctrl + Shift + M` | `Cmd + Shift + M` |
| Highlight | `Ctrl + Shift + H` | `Cmd + Shift + H` |

### Navegação

| Ação | Atalho |
|------|--------|
| Novo bloco | `Enter` |
| Deletar bloco vazio | `Backspace` |
| Mover para bloco anterior | `↑` |
| Mover para próximo bloco | `↓` |
| Abrir menu de blocos | `Tab` ou `/` |

### Blocos

| Ação | Atalho |
|------|--------|
| Transformar em título | `Ctrl/Cmd + Alt + 1-4` |
| Transformar em lista | `Ctrl/Cmd + Shift + L` |

## Estilização Customizada

### Cores e Temas

O CSS customizado (`editorjs.css`) aplica:

- **Toolbar**: Fundo branco, bordas suaves, sombras
- **Hover**: Azul (#1d4ed8) ao passar o mouse
- **Active**: Fundo azul claro quando ativo
- **Highlight**: Amarelo claro (#fef3c7)
- **Código Inline**: Fundo cinza, texto vermelho
- **Links**: Azul com underline
- **Citações**: Borda azul à esquerda

### Responsividade

- Toolbar se adapta a telas menores
- Botões ficam mais próximos em mobile
- Touch-friendly para tablets

## Exemplos de Uso

### Formatação Básica

```
Selecione este texto e clique em Bold
Resultado: **Selecione este texto e clique em Bold**
```

### Código Inline

```
Selecione `console.log()` e clique em Inline Code
Resultado: `console.log()`
```

### Link

```
1. Selecione "documentação oficial"
2. Clique no ícone de link
3. Cole: https://react.dev
4. Resultado: [documentação oficial](https://react.dev)
```

### Highlight

```
Selecione "importante" e clique em Marker
Resultado: importante (com fundo amarelo)
```

## Fluxo de Trabalho Recomendado

### Para Aulas de Programação

1. **Título** - Use H2 para seções principais
2. **Parágrafo** - Explique o conceito
3. **Lista** - Liste pontos importantes
4. **Código** - Mostre exemplos de código
5. **Highlight** - Destaque conceitos-chave
6. **Link** - Referencie documentação

### Para Aulas Teóricas

1. **Título** - H2 para capítulos
2. **Subtítulo** - H3 para seções
3. **Parágrafo** - Conteúdo principal
4. **Citação** - Citações de autores
5. **Delimiter** - Separar seções
6. **Highlight** - Termos importantes

## Dicas de Uso

### Produtividade

1. **Use atalhos** - Mais rápido que clicar
2. **Digite `/`** - Menu rápido de blocos
3. **Tab** - Adicionar novo bloco
4. **Arraste blocos** - Reordene facilmente
5. **Copie/Cole** - Funciona entre blocos

### Formatação

1. **Seja consistente** - Use mesmos níveis de título
2. **Não exagere** - Muito highlight cansa
3. **Código limpo** - Use blocos de código para exemplos
4. **Links úteis** - Adicione referências relevantes
5. **Organize** - Use delimitadores entre seções

### Acessibilidade

1. **Hierarquia de títulos** - H2 → H3 → H4
2. **Texto descritivo em links** - Evite "clique aqui"
3. **Contraste** - Texto legível
4. **Estrutura clara** - Listas e parágrafos bem definidos

## Troubleshooting

### Toolbar não aparece

- **Solução**: Certifique-se de selecionar o texto completamente
- Tente clicar e arrastar para selecionar

### Atalhos não funcionam

- **Solução**: Verifique se está focado no editor
- Alguns navegadores podem ter conflitos de atalhos

### Blocos não aparecem

- **Solução**: Clique no `+` ou digite `/`
- Certifique-se de estar em uma linha vazia

### Formatação não salva

- **Solução**: O EditorJS salva automaticamente
- Verifique se o onChange está funcionando

## Arquivos Relacionados

- `frontend/src/components/EditorJS.tsx` - Componente principal
- `frontend/src/styles/editorjs.css` - Estilos customizados
- `frontend/src/pages/instructor/LessonFormPage.tsx` - Integração

## Recursos Adicionais

- **Documentação**: https://editorjs.io/inline-tools
- **Plugins**: https://github.com/editor-js
- **Exemplos**: https://editorjs.io/demo

## Status

✅ Toolbar inline configurada
✅ Toolbar de blocos configurada
✅ Atalhos de teclado funcionando
✅ CSS customizado aplicado
✅ Responsivo para mobile
✅ Integrado no formulário de aulas
