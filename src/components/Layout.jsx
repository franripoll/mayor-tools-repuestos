import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        minWidth: 0,
        paddingTop: 0,
        overflowX: 'hidden',
      }}>
        {/* Spacer para mobile header */}
        <div style={{ height: 52 }} className="mobile-spacer" />
        <div style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
      <style>{`
        @media (min-width: 768px) {
          .mobile-spacer { display: none !important; }
          main { padding-top: 0; }
        }
      `}</style>
    </div>
  )
}
