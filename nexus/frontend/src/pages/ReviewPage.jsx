import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import toast from "react-hot-toast";
import AppHeader from "../components/AppHeader";
import api from "../services/api";

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/comparisons/${id}`)
      .then((res) => setComparison(res.data))
      .catch(() => {
        setError("Comparação não encontrada");
        toast.error("Comparação não encontrada");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async (approved) => {
    setApproving(true);
    setError("");
    const slowTimer = setTimeout(() => {
      toast(
        "A análise com IA pode demorar um pouco, aguarde...",
        { icon: "⏳", duration: 5000 }
      );
    }, 8000);
    try {
      await api.post(`/comparisons/${id}/approve`, { approved });
      toast.success(approved ? "Análise concluída" : "Comparação rejeitada");
      navigate(`/result/${id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Erro ao processar";
      setError(msg);
      toast.error(msg);
      setApproving(false);
    } finally {
      clearTimeout(slowTimer);
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

  if (error && !comparison) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Revisar textos extraídos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Verifique se os textos foram extraídos corretamente antes de aprovar
            a análise com IA.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {approving && (
          <div className="mb-4 p-3 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 text-sm flex items-center gap-2">
            <Info className="w-4 h-4" />
            Processando com IA — isso pode levar de 10 a 30 segundos.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 text-sm">
                Plano antigo — {comparison.old_plan_filename}
              </h3>
            </div>
            <div className="p-5 max-h-[500px] overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {comparison.old_plan_text || "Nenhum texto extraído"}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 text-sm">
                Plano novo — {comparison.new_plan_filename}
              </h3>
            </div>
            <div className="p-5 max-h-[500px] overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                {comparison.new_plan_text || "Nenhum texto extraído"}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleApprove(false)}
            disabled={approving}
            className="flex items-center gap-2 py-2.5 px-6 border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg transition disabled:opacity-40"
          >
            <XCircle className="w-5 h-5" />
            Rejeitar
          </button>
          <button
            onClick={() => handleApprove(true)}
            disabled={approving}
            className="flex items-center gap-2 py-2.5 px-6 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition disabled:opacity-40"
          >
            {approving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {approving ? "Processando com IA..." : "Aprovar e analisar"}
          </button>
        </div>
      </main>
    </div>
  );
}
