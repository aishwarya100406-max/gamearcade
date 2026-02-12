import { HashRouter, Routes, Route } from 'react-router-dom';
import GameHub from './GameHub';
import NeonRush from './games/subway/SubwayGame';
import TunnelGame from './games/tunnel/TunnelGame'; // Replacing StackGame

function App() {
  return (
    <HashRouter>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <Routes>
          <Route path="/" element={<GameHub />} />
          <Route path="/runner" element={<NeonRush />} />
          <Route path="/tunnel" element={<TunnelGame />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
