import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ShieldCheck,
  BarChart3,
  CheckCircle,
  XCircle,
  Users,
  FileCheck,
  Clock,
  ThumbsUp,
} from "lucide-react";
import toast from "react-hot-toast";
import AppHeader from "../components/AppHeader";
import api from "../services/api";

function StatCard({ icon: Icon, label, value, accent = "brand" }) {
  const colors = {
    brand: "bg-brand-50 text-brand-600 border-brand-200",
    green: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    sky: "bg-sky-50 text-sky-600 border-sky-200",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colors[accent]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        Sem dados de comparações nos últimos 30 dias
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-48 px-2">
      {data.map((d) => {
        const h = (d.count / max) * 100;
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center gap-1 group relative"
          >
            <div
              className="w-full bg-brand-500 rounded-t transition hover:bg-brand-600"
              style={{ height: `${h}%`, minHeight: d.count > 0 ? 4 : 0 }}
            />
            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none transition">
              {d.date}: {d.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [deciding, setDeciding] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        if (res.data.role !== "admin") {
          toast.error("Acesso restrito a administradores");
          navigate("/upload");
        } else {
          loadAll();
        }
      })
      .catch(() => navigate("/"))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    setLoadingPending(true);
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/moderation/pending"),
      ]);
      setAnalytics(analyticsRes.data);
      setPending(pendingRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao carregar dados");
    } finally {
      setLoadingPending(false);
    }
  };

  const decide = async (item, decision) => {
    const key = `${item.comparison_id}-${item.suggestion_index}`;
    setDeciding(key);
    try {
      await api.post("/admin/moderation/decision", {
        comparison_id: item.comparison_id,
        suggestion_index: item.suggestion_index,
        decision,
      });
      toast.success(
        decision === "approve" ? "Sugestão aprovada" : "Sugestão rejeitada"
      );
      setPending((p) => p.filter((x) => `${x.comparison_id}-${x.suggestion_index}` !== key));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao moderar");
    } finally {
      setDeciding(null);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      </div>
    );
  }

  const acceptanceRate =
    analytics && analytics.suggestions_accepted + analytics.suggestions_rejected > 0
      ? Math.round(
          (analytics.suggestions_accepted /
            (analytics.suggestions_accepted + analytics.suggestions_rejected)) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-brand-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Painel administrativo</h2>
            <p className="text-sm text-gray-500">
              Moderação de sugestões e métricas da plataforma
            </p>
          </div>
        </div>

        {/* Analytics */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Analytics
          </h3>

          {analytics ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <StatCard
                  icon={FileCheck}
                  label="Comparações totais"
                  value={analytics.total_comparisons}
                  accent="brand"
                />
                <StatCard
                  icon={Users}
                  label="Usuários ativos"
                  value={analytics.active_users}
                  accent="sky"
                />
                <StatCard
                  icon={ThumbsUp}
                  label="Aceitação sugestões"
                  value={`${acceptanceRate}%`}
                  accent="green"
                />
                <StatCard
                  icon={Clock}
                  label="Tempo médio (s)"
                  value={analytics.avg_processing_time.toFixed(1)}
                  accent="amber"
                />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Comparações por dia (últimos 30 dias)
                </h4>
                <BarChart data={analytics.comparisons_per_day} />
              </div>
            </>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          )}
        </section>

        {/* Moderação */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Moderação de sugestões
            {pending.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {pending.length} pendente{pending.length === 1 ? "" : "s"}
              </span>
            )}
          </h3>

          {loadingPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Nenhuma sugestão pendente de moderação
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((item) => {
                const key = `${item.comparison_id}-${item.suggestion_index}`;
                const busy = deciding === key;
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-amber-200 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          {item.comparison_title}
                        </p>
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded whitespace-nowrap">
                        Confiança: {Math.round((item.confidence_score || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide(item, "approve")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Aprovar
                      </button>
                      <button
                        onClick={() => decide(item, "reject")}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
