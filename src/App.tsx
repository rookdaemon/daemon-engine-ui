import { ChatView } from './components/ChatView';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1>Daemon Engine UI</h1>
      </header>
      <main className="app-main">
        <ChatView />
      </main>
    </div>
  );
}

export default App;
