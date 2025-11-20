import { useEffect, useRef } from 'react'
import EditorJS, { OutputData } from '@editorjs/editorjs'
// @ts-ignore
import Header from '@editorjs/header'
// @ts-ignore
import List from '@editorjs/list'
// @ts-ignore
import Code from '@editorjs/code'
// @ts-ignore
import InlineCode from '@editorjs/inline-code'
// @ts-ignore
import LinkTool from '@editorjs/link'
// @ts-ignore
import Quote from '@editorjs/quote'
// @ts-ignore
import Marker from '@editorjs/marker'
// @ts-ignore
import Delimiter from '@editorjs/delimiter'
import '../styles/editorjs.css'

interface EditorJSComponentProps {
  data?: OutputData
  onChange: (data: OutputData) => void
  placeholder?: string
}



export const EditorJSComponent = ({ data, onChange, placeholder }: EditorJSComponentProps) => {
  const editorRef = useRef<EditorJS | null>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (!holderRef.current) return

    console.log('🔄 EditorJS useEffect - data recebida:', data)

    // Destruir editor existente se houver
    if (editorRef.current && editorRef.current.destroy) {
      console.log('🗑️ Destruindo editor existente')
      editorRef.current.destroy()
      editorRef.current = null
      isInitialized.current = false
    }

    // Inicializar o editor
    console.log('🆕 Criando novo editor com data:', data)
    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder: placeholder || 'Comece a escrever o conteúdo da aula...',
      data: data,
      onReady: () => {
        console.log('✅ EditorJS pronto com dados:', data)
        isInitialized.current = true
      },
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              placeholder: 'Digite um título',
              levels: [1, 2, 3, 4],
              defaultLevel: 2,
            },
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered',
            },
          },
          code: {
            class: Code,
            config: {
              placeholder: 'Cole ou digite seu código aqui',
            },
          },
          inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+M',
          },
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: '/api/fetchUrl',
            },
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: 'Digite uma citação',
              captionPlaceholder: 'Autor da citação',
            },
          },
          marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+H',
          },
          delimiter: Delimiter,
        },
        inlineToolbar: ['bold', 'italic', 'link', 'inlineCode', 'marker'],
        onChange: async () => {
          if (editorRef.current) {
            const outputData = await editorRef.current.save()
            onChange(outputData)
          }
        },
        minHeight: 300,
      })

    editorRef.current = editor

    // Cleanup
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [data, placeholder]) // Reinicializa quando data ou placeholder mudam

  return (
    <div className="border border-gray-300 rounded-md">
      <div ref={holderRef} className="prose max-w-none p-4" />
    </div>
  )
}
