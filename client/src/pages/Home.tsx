import { useAuthStore } from '../store/authStore'

function Home() {
  const { user } = useAuthStore()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-brand-primary">Home page</h1>
      {user ? (
        <p className="mt-2 text-brand-muted">Logged in as: {user.nickname}</p>
      ) : (
        <p className="mt-2 text-brand-muted">Not logged in</p>
      )}
    </div>
  )
}

export default Home