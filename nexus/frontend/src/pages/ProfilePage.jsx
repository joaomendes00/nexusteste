import { useEffect, useState } from "react";
import { Loader2, Save, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import AppHeader from "../components/AppHeader";
import api from "../services/api";

const AREAS = ["Gestão", "Saúde", "TI", "Indústria", "Educação", "Outros"];

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const INTERESSES = ["Presencial", "EAD", "Híbrido"];

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    area: "",
    cargo: "",
    regiao: "",
    interesses: [],
  });

  useEffect(() => {
    api
      .get("/users/profile")
      .then((res) => {
        const u = res.data;
        setForm({
          full_name: u.full_name || "",
          area: u.area || "",
          cargo: u.cargo || "",
          regiao: u.regiao || "",
          interesses: Array.isArray(u.interesses) ? u.interesses : [],
        });
      })
      .catch(() => toast.error("Erro ao carregar perfil"))
      .finally(() => setLoading(false));
  }, []);

  const toggleInteresse = (value) => {
    setForm((f) => ({
      ...f,
      interesses: f.interesses.includes(value)
        ? f.interesses.filter((x) => x !== value)
        : [...f.interesses, value],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/profile", form);
      toast.success("Perfil atualizado");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <UserCircle className="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Meu perfil</h2>
            <p className="text-sm text-gray-500">
              Personalize sua experiência na plataforma
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área de atuação
            </label>
            <select
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white"
            >
              <option value="">Selecione...</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo / Função
            </label>
            <input
              type="text"
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              placeholder="Ex: Coordenador pedagógico"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Região (UF)
            </label>
            <select
              value={form.regiao}
              onChange={(e) => setForm({ ...form, regiao: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none bg-white"
            >
              <option value="">Selecione...</option>
              {ESTADOS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interesses de ensino
            </label>
            <div className="flex flex-wrap gap-3">
              {INTERESSES.map((v) => (
                <label
                  key={v}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                    form.interesses.includes(v)
                      ? "bg-brand-50 border-brand-500 text-brand-700"
                      : "border-gray-300 text-gray-700 hover:border-brand-400"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.interesses.includes(v)}
                    onChange={() => toggleInteresse(v)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium">{v}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 py-2.5 px-6 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
