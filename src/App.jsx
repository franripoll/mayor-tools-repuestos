import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import ToastContainer from './components/ToastContainer'
import UserSelector from './components/UserSelector'
import Dashboard from './pages/Dashboard'
import Maquinas from './pages/Maquinas'
import Repuestos from './pages/Repuestos'
import Movimientos from './pages/Movimientos'
import Pedidos from './pages/Pedidos'
import Proveedores from './pages/Proveedores'
import Configuracion from './pages/Configuracion'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="maquinas" element={<Maquinas />} />
        <Route path="repuestos" element={<Repuestos />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  )
}

function AppContent() {
  const { usuario } = useApp()
  if (!usuario) return <UserSelector />
  return (
    <>
      <AppRoutes />
      <ToastContainer />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  )
}
