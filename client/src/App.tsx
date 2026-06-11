import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import NewsPaper from './pages/Newspaper'
import HomePage from './pages/HomePage'
import PanelAdmin from './pages/PanelAdmin'
import './App.css'
import ProtectedRoute from "./components/ProtectedRoute"
import DerniereEdition from './pages/LastEdition'

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/nouvelle-edition" element={
        <ProtectedRoute>
          <DerniereEdition />
        </ProtectedRoute>
      } />
      <Route path="/newspapers" element={
        <ProtectedRoute>
          <NewsPaper />
        </ProtectedRoute>
      } />
      <Route path="/panel_admin" element={
        <ProtectedRoute adminOnly>
          <PanelAdmin />
        </ProtectedRoute>
      } />
    </Routes>
    </BrowserRouter>
  )
}

export default App