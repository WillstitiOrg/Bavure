import { Navigate } from "react-router-dom"

type Props = {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const citoyen = JSON.parse(sessionStorage.getItem("citoyen") || "null")
  if (!citoyen) return <Navigate to="/login" />
  if (adminOnly && citoyen.role !== "admin") return <Navigate to="/" />

  return <>{children}</>
}