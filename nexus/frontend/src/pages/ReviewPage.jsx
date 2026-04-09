import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
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
      .catch(() => setError("Comparação não encontrada"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async (approved) => {
    setApproving(true);
    setError("");
    try {
      await api.post(`/comparisons/${id}/approve`, { approved });
      navigate(`/result/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao processar");
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error && !comparison) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-500">Nexus</h1>
          <button
            onClick={() => navigate("/upload")}
            className="text-sm text-gray-600 hover:text-brand-500 font-medium transition"
          >
            Nova comparação
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Revisar textos extraídos
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Verifique se os textos foram extraídos corretamente antes de aprovar a análise com IA.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
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
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
