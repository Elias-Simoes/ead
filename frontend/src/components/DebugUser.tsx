import { useAuth } from '../contexts/AuthContext'

export const DebugUser = () => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div className="p-4 bg-yellow-100">Not authenticated</div>
  }

  return (
    <div className="p-4 bg-blue-100">
      <h3 className="font-bold">Debug User Info:</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  )
}
