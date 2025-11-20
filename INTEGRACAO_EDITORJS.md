# Integração do EditorJS

## Implementação Concluída

O EditorJS foi integrado com sucesso na seção de "Conteúdo em Texto" do formulário de aulas.

## O que é EditorJS?

EditorJS é um editor de blocos moderno e intuitivo que permite criar conteúdo rico de forma estruturada. Diferente de editores WYSIWYG tradicionais, o EditorJS trabalha com blocos independentes, tornando o conteúdo mais limpo e fácil de manipular.

## Recursos Disponíveis

### Blocos Implementados

1. **Parágrafo** - Texto simples
2. **Títulos** (H1, H2, H3, H4) - Cabeçalhos hierárquicos
3. **Listas** - Ordenadas e não ordenadas
4. **Código** - Blocos de código com syntax highlighting
5. **Código Inline** - Código dentro do texto
6. **Links** - Links clicáveis
7. **Citações** - Blocos de citação com autor
8. **Marcador** - Destacar texto importante
9. **Delimitador** - Separador visual entre seções

### Ferramentas Inline

- **Negrito**
- **Itálico**
- **Código inline**
- **Marcador** (highlight)
- **Link**

## Arquitetura

### Componente: `EditorJS.tsx`

```typescript
<EditorJSComponent
  data={editorData}
  onChange={(data) => handleChange(data)}
  placeholder="Comece a escrever..."
/>
```

**Props:**
- `data`: Dados iniciais do editor (OutputData)
- `onChange`: Callback chamado quando o conteúdo muda
- `placeholder`: Texto de placeholder

### Formato de Dados

O EditorJS salva o conteúdo em formato JSON estruturado:

```json
{
  "time": 1700000000000,
  "blocks": [
    {
      "type": "header",
      "data": {
        "text": "Introdução ao React",
        "level": 2
      }
    },
    {
      "type": "paragraph",
      "data": {
        "text": "React é uma biblioteca JavaScript..."
      }
    },
    {
      "type": "list",
      "data": {
        "style": "unordered",
        "items": [
          "Componentes",
          "Props",
          "State"
        ]
      }
    },
    {
      "type": "code",
      "data": {
        "code": "function App() {\n  return <div>Hello</div>\n}"
      }
    }
  ]
}
```

## Fluxo de Dados

### Criação de Aula

1. Instrutor escreve conteúdo no EditorJS
2. EditorJS chama `onChange` com OutputData
3. OutputData é armazenado no estado do React
4. Ao salvar, OutputData é serializado como JSON
5. JSON é enviado ao backend no campo `text_content`

### Edição de Aula

1. Backend retorna JSON no campo `text_content`
2. JSON é parseado para OutputData
3. OutputData é passado para o EditorJS
4. EditorJS renderiza os blocos
5. Instrutor pode editar
6. Ao salvar, novo JSON é enviado ao backend

## Integração com Backend

### Salvamento

```typescript
const payload = {
  title: 'Título da Aula',
  text_content: JSON.stringify(editorData), // Serializa OutputData
  // ... outros campos
}
```

### Carregamento

```typescript
const lesson = await api.get('/lessons/123')
const textContent = JSON.parse(lesson.text_content) // Parse JSON
setEditorData(textContent)
```

### Compatibilidade

O sistema mantém compatibilidade com aulas antigas que usavam texto simples:

```typescript
// Se text_content não for JSON válido, cria um bloco de parágrafo
try {
  textContent = JSON.parse(lesson.text_content)
} catch {
  textContent = {
    blocks: [{
      type: 'paragraph',
      data: { text: lesson.text_content }
    }]
  }
}
```

## Benefícios

### Para Instrutores

- ✅ Interface intuitiva e moderna
- ✅ Blocos independentes fáceis de reorganizar
- ✅ Suporte nativo para código
- ✅ Formatação rica sem HTML complexo
- ✅ Preview em tempo real

### Para Alunos

- ✅ Conteúdo bem estruturado
- ✅ Código com syntax highlighting
- ✅ Leitura mais agradável
- ✅ Navegação clara entre seções

### Para o Sistema

- ✅ Dados estruturados (JSON)
- ✅ Fácil de parsear e manipular
- ✅ Extensível (novos blocos podem ser adicionados)
- ✅ Compatível com versões antigas

## Exemplos de Uso

### Aula de Programação

```
[Título H2] Introdução ao React

[Parágrafo] React é uma biblioteca JavaScript para construir interfaces.

[Lista]
- Componentes reutilizáveis
- Virtual DOM
- Unidirectional data flow

[Código]
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

[Citação]
"React makes it painless to create interactive UIs"
- React Documentation
```

### Aula Teórica

```
[Título H2] Conceitos Fundamentais

[Parágrafo] Nesta aula vamos explorar os conceitos básicos...

[Título H3] 1. Componentes

[Parágrafo] Componentes são blocos de construção...

[Marcador] Importante: Componentes devem ser puros

[Delimitador]

[Título H3] 2. Props

[Parágrafo] Props são argumentos passados...
```

## Instalação

### Pacotes Instalados

```bash
npm install @editorjs/editorjs
npm install @editorjs/header
npm install @editorjs/list
npm install @editorjs/code
npm install @editorjs/inline-code
npm install @editorjs/link
npm install @editorjs/quote
npm install @editorjs/marker
npm install @editorjs/delimiter
```

## Arquivos Criados/Modificados

### Novos Arquivos

- `frontend/src/components/EditorJS.tsx` - Componente React do EditorJS
- `frontend/src/types/editorjs.d.ts` - Declarações de tipos
- `INTEGRACAO_EDITORJS.md` - Esta documentação

### Arquivos Modificados

- `frontend/src/pages/instructor/LessonFormPage.tsx` - Integração do EditorJS
- `frontend/package.json` - Dependências adicionadas

## Próximos Passos

### Plugins Adicionais (Opcional)

- [ ] **Image** - Upload e inserção de imagens
- [ ] **Table** - Tabelas
- [ ] **Embed** - Incorporar vídeos do YouTube, etc.
- [ ] **Checklist** - Listas de tarefas
- [ ] **Warning** - Blocos de aviso/alerta
- [ ] **Raw HTML** - HTML customizado

### Melhorias

- [ ] Tema customizado para match com o design
- [ ] Atalhos de teclado personalizados
- [ ] Validação de conteúdo
- [ ] Contador de palavras
- [ ] Auto-save

### Player de Aula

- [ ] Renderizar blocos do EditorJS no player
- [ ] Syntax highlighting para código
- [ ] Estilização dos blocos
- [ ] Links clicáveis
- [ ] Citações formatadas

## Testando

1. Acesse a página de criar/editar aula
2. Na seção "Conteúdo em Texto", clique no editor
3. Pressione `Tab` ou clique no `+` para adicionar blocos
4. Experimente diferentes tipos de blocos:
   - Digite `/` para ver menu de blocos
   - Selecione texto para ver ferramentas inline
   - Arraste blocos para reordenar
5. Salve a aula
6. Edite novamente para verificar que o conteúdo foi preservado

## Observações

- O conteúdo é salvo como JSON no banco de dados
- Aulas antigas com texto simples são convertidas automaticamente
- O editor é responsivo e funciona em mobile
- Todos os blocos são opcionais - instrutor escolhe o que usar

## Recursos

- **Documentação Oficial**: https://editorjs.io/
- **GitHub**: https://github.com/codex-team/editor.js
- **Plugins**: https://github.com/editor-js
- **Exemplos**: https://editorjs.io/base-concepts

## Status

✅ EditorJS instalado e configurado
✅ Componente React criado
✅ Integrado no formulário de aulas
✅ Salvamento e carregamento funcionando
✅ Compatibilidade com formato antigo
🔄 Player de aula precisa ser atualizado para renderizar blocos
