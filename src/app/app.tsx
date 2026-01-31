import { HashRouter } from 'react-router-dom'
import AppRouter from '../router/app-router'

const App = () => {
  return (
    <HashRouter>
      <AppRouter />
    </HashRouter>
  )
}

export default App
