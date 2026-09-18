import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { AmbientBackground } from './components/AmbientBackground';
function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <>
      <AmbientBackground />
      {route === '#/admin' ? <Admin /> : <Home />}
    </>
  );
}

export default App;
