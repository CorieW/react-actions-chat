import Chat from './components/Chat'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Chat initialMessages={[{
        id: 1,
        type: 'agent',
        content: 'Hello! How can I help you today?',
        timestamp: new Date()
      }]} />
    </div>
  )
}

export default App
