import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import api from "../services/api";

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [me, setMe] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setMe(res.data))
      .catch(() => setMe(null));
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const linkClass = (path) =>
    `text-sm font-medium transition ${
      isActive(path)
        ? "text-brand-500"
        : "text-gray-600 hover:text-brand-500"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/upload" className="text-xl font-bold text-brand-500">
          Nexus
        </Link>
        <nav className="flex items-center gap-5">
          <Link to="/upload" className={linkClass("/upload")}>
            Nova comparação
          </Link>
          <Link to="/history" className={linkClass("/history")}>
            Histórico
          </Link>
          <Link to="/profile" className={linkClass("/profile")}>
            Meu perfil
          </Link>
          {me?.role === "admin" && (
            <Link to="/admin" className={linkClass("/admin")}>
              Admin
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-500 font-medium transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
