# Frontend - Guia Rápido

## 🚀 Comandos Principais

```bash
# Instalar dependências
cd frontend
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # React Contexts (AuthContext)
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # API e serviços (api.ts)
│   ├── stores/          # Zustand stores (authStore.ts)
│   ├── types/           # TypeScript types
│   ├── utils/           # Funções utilitárias
│   ├── App.tsx          # Componente principal
│   ├── main.tsx         # Entry point
│   └── index.css        # Estilos globais
└── public/              # Assets estáticos
```

## 🔐 Autenticação

### Usar o Hook de Autenticação

```tsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  const handleLogin = async () => {
    try {
      await login('email@example.com', 'password')
      // Login bem-sucedido
    } catch (error) {
      // Tratar erro
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <p>Olá, {user.name}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Usar o Store Diretamente

```tsx
import { useAuthStore } from './stores/authStore'

function MyComponent() {
  const { user, login, logout } = useAuthStore()
  
  // Usar as funções do store
}
```

## 🌐 Fazer Chamadas à API

```tsx
import api from './services/api'

// GET request
const response = await api.get('/courses')
const courses = response.data

// POST request
const response = await api.post('/courses', {
  title: 'Novo Curso',
  description: 'Descrição do curso'
})

// PUT/PATCH request
await api.patch('/courses/123', {
  title: 'Título Atualizado'
})

// DELETE request
await api.delete('/courses/123')
```

## 🎨 Usar Tailwind CSS

```tsx
// Classes utilitárias
<div className="flex items-center justify-center min-h-screen bg-gray-50">
  <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">
      Título
    </h1>
    <button className="w-full bg-primary-600 text-white py-2 px-4 rounded hover:bg-primary-700">
      Botão
    </button>
  </div>
</div>

// Responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Conteúdo */}
</div>
```

## 🛣️ Rotas

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
      </Routes>
    </Router>
  )
}
```

### Navegação Programática

```tsx
import { useNavigate } from 'react-router-dom'

function MyComponent() {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/courses')
  }

  return <button onClick={handleClick}>Ver Cursos</button>
}
```

### Links

```tsx
import { Link } from 'react-router-dom'

<Link to="/courses" className="text-primary-600 hover:underline">
  Ver Cursos
</Link>
```

## 📝 TypeScript

### Usar Tipos

```tsx
import { Course, User, StudentProgress } from './types'

interface Props {
  course: Course
  onEnroll: (courseId: string) => void
}

function CourseCard({ course, onEnroll }: Props) {
  return (
    <div>
      <h2>{course.title}</h2>
      <button onClick={() => onEnroll(course.id)}>
        Matricular
      </button>
    </div>
  )
}
```

## 🔄 Estado Global (Zustand)

### Criar um Store

```tsx
import { create } from 'zustand'

interface CourseState {
  courses: Course[]
  loading: boolean
  fetchCourses: () => Promise<void>
}

export const useCourseStore = create<CourseState>((set) => ({
  courses: [],
  loading: false,
  
  fetchCourses: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/courses')
      set({ courses: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
    }
  }
}))
```

### Usar o Store

```tsx
import { useCourseStore } from './stores/courseStore'

function CourseList() {
  const { courses, loading, fetchCourses } = useCourseStore()

  useEffect(() => {
    fetchCourses()
  }, [])

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
```

## 🎯 Componentes Comuns

### Loading Spinner

```tsx
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  )
}
```

### Error Message

```tsx
function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
      {message}
    </div>
  )
}
```

### Button

```tsx
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded font-medium transition-colors"
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100"
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  )
}
```

## 🔒 Rotas Protegidas

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Uso
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
```

## 🌍 Variáveis de Ambiente

```tsx
// Acessar variáveis de ambiente
const apiUrl = import.meta.env.VITE_API_URL

// Verificar modo de desenvolvimento
if (import.meta.env.DEV) {
  console.log('Modo de desenvolvimento')
}

// Verificar modo de produção
if (import.meta.env.PROD) {
  console.log('Modo de produção')
}
```

## 📱 Responsividade

```tsx
// Breakpoints do Tailwind
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

<div className="
  text-sm sm:text-base md:text-lg lg:text-xl
  p-2 sm:p-4 md:p-6 lg:p-8
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
">
  Conteúdo responsivo
</div>
```

## 🎨 Cores do Tema

```tsx
// Cores primárias (azul)
bg-primary-50   // Mais claro
bg-primary-100
bg-primary-200
bg-primary-300
bg-primary-400
bg-primary-500
bg-primary-600  // Cor principal
bg-primary-700
bg-primary-800
bg-primary-900  // Mais escuro

// Uso
<button className="bg-primary-600 hover:bg-primary-700 text-white">
  Botão
</button>
```

## 🐛 Debug

```tsx
// Console log em desenvolvimento
if (import.meta.env.DEV) {
  console.log('Debug info:', data)
}

// React DevTools
// Instalar extensão do navegador para inspecionar componentes

// Zustand DevTools
import { devtools } from 'zustand/middleware'

export const useStore = create(
  devtools((set) => ({
    // store state
  }))
)
```

## 📚 Recursos Úteis

- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Axios Docs](https://axios-http.com/)

---

**Última atualização**: 12/11/2025
