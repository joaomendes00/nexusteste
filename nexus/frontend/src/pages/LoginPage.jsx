import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, UserPlus, FileSearch } from "lucide-react";
import api from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await api.post("/auth/register", {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
        });
      }
      const res = await api.post(
        "/auth/login",
        new URLSearchParams({
          username: form.email,
          password: form.password,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      localStorage.setItem("token", res.data.access_token);
      navigate("/upload");
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500 mb-4">
            <FileSearch className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nexus</h1>
          <p className="text-gray-500 mt-1">Comparador inteligente de planos de curso</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {isRegister ? "Criar conta" : "Entrar"}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo
                </label>
                <input
                  name="full_name"
                  type="text"
                  required={isRegister}
                  value={form.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                  placeholder="João Silva"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRegister ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="text-sm text-brand-500 hover:text-brand-700 font-medium transition"
            >
              {isRegister
                ? "Já tem conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
