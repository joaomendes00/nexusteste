import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import AppHeader from "../components/AppHeader";
import api from "../services/api";

const STATUS = {
  pending_review: { label: "Pendente", icon: Clock, color: "text-amber-600 bg-amber-50" },
  processing: { label: "Processando", icon: Loader2, color: "text-blue-600 bg-blue-50" },
  completed: { label: "Concluído", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  failed: { label: "Falhou", icon: XCircle, color: "text-red-600 bg-red-50" },
  queued: { label: "Na fila", icon: Clock, color: "text-gray-600 bg-gray-50" },
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/comparisons/");
      setComparisons(res.data);
    } catch {
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClick = (c) => {
    if (c.status === "completed") navigate(`/result/${c.id}`);
    else if (c.status === "pending_review") navigate(`/review/${c.id}`);
  };

  const markDefinitive = async (c) => {
    setMarking(c.id);
    try {
      await api.post(`/comparisons/${c.id}/mark-definitive`, {});
      toast.success("Marcado como definitivo");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao marcar");
    } finally {
      setMarking(null);
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
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Histórico de comparações
        </h2>

        {comparisons.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma comparação realizada ainda.</p>
            <button
              onClick={() => navigate("/upload")}
              className="mt-4 text-brand-500 hover:text-brand-700 font-medium text-sm transition"
            >
              Criar primeira comparação
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plano antigo
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Plano novo
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisons.map((c) => {
                  const st = STATUS[c.status] || STATUS.queued;
                  const Icon = st.icon;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 text-sm text-gray-800 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {c.is_definitive && (
                            <Lock
                              className="w-4 h-4 text-brand-500 flex-shrink-0"
                              aria-label="Definitivo"
                            />
                          )}
                          <span className="truncate">{c.old_plan_filename}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-800 max-w-[200px] truncate">
                        {c.new_plan_filename}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${st.color}`}
                          >
                            <Icon
                              className={`w-3.5 h-3.5 ${
                                c.status === "processing" ? "animate-spin" : ""
                              }`}
                            />
                            {st.label}
                          </span>
                          {c.is_definitive && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                              <ShieldCheck className="w-3 h-3" />
                              Definitivo
                              {c.version_label ? ` · ${c.version_label}` : ""}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(c.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleClick(c)}
                            className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-700 font-medium transition"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          {c.status === "completed" && !c.is_definitive && (
                            <button
                              onClick={() => markDefinitive(c)}
                              disabled={marking === c.id}
                              className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 font-medium transition disabled:opacity-50"
                            >
                              {marking === c.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ShieldCheck className="w-4 h-4" />
                              )}
                              Marcar definitivo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
