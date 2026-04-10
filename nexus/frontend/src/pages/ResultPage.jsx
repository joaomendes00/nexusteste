import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  GitCompare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import api from "../services/api";

function Section({ icon: Icon, title, children, color = "brand" }) {
  const colors = {
    brand: "bg-brand-50 border-brand-200 text-brand-700",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700",
    blue: "bg-sky-50 border-sky-200 text-sky-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-5 py-3 border-b flex items-center gap-2 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function asText(item) {
  if (item == null) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    return (
      item.text ||
      item.description ||
      item.titulo ||
      item.title ||
      JSON.stringify(item)
    );
  }
  return String(item);
}

/**
 * Tenta extrair o JSON do relatório caso `report_markdown` venha como string
 * bruta (ex.: quando a IA responde com ```json ... ``` ou JSON puro).
 */
function parseReport(result) {
  let reportMd = result.report_markdown || "";
  let novelties = Array.isArray(result.novelties_json)
    ? result.novelties_json
    : [];
  let suggestions = Array.isArray(result.suggestions_json)
    ? result.suggestions_json
    : [];

  const trimmed = reportMd.trim();
  const looksLikeJson =
    trimmed.startsWith("{") || trimmed.startsWith("```");

  if (looksLikeJson) {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const candidate = fence ? fence[1] : trimmed;
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed.report_markdown === "string") {
        reportMd = parsed.report_markdown;
      }
      if (Array.isArray(parsed.novelties) && novelties.length === 0) {
        novelties = parsed.novelties;
      }
      if (Array.isArray(parsed.suggestions) && suggestions.length === 0) {
        suggestions = parsed.suggestions;
      }
    } catch {
      // não era JSON válido — mantém o texto original
    }
  }

  return { reportMd, novelties, suggestions };
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/comparisons/${id}/result`)
      .then((res) => setResult(res.data))
      .catch(() => setError("Resultado não encontrado"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate("/upload")}
          className="text-brand-500 hover:text-brand-700 font-medium text-sm"
        >
          Voltar ao upload
        </button>
      </div>
    );
  }

  const { reportMd, novelties, suggestions } = parseReport(result);
  const diff = result.diff_json;
  const diffItems = Array.isArray(diff)
    ? diff
    : diff?.differences || diff?.changes || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-brand-500">Nexus</h1>
          <nav className="flex gap-4">
            <button
              onClick={() => navigate("/upload")}
              className="text-sm text-gray-600 hover:text-brand-500 font-medium transition"
            >
              Nova comparação
            </button>
            <button
              onClick={() => navigate("/history")}
              className="text-sm text-gray-600 hover:text-brand-500 font-medium transition"
            >
              Histórico
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <button
          onClick={() => navigate("/history")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao histórico
        </button>

        <Section icon={Sparkles} title="Relatório da análise" color="brand">
          <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-brand-500">
            <ReactMarkdown>{reportMd}</ReactMarkdown>
          </div>
        </Section>

        {novelties.length > 0 && (
          <Section
            icon={Lightbulb}
            title="Novidades identificadas"
            color="green"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {novelties.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 leading-relaxed"
                >
                  {asText(item)}
                </div>
              ))}
            </div>
          </Section>
        )}

        {suggestions.length > 0 && (
          <Section
            icon={Lightbulb}
            title="Sugestões de melhoria"
            color="blue"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestions.map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-sky-50 border border-sky-200 text-sm text-sky-900 leading-relaxed"
                >
                  {asText(item)}
                </div>
              ))}
            </div>
          </Section>
        )}

        {Array.isArray(diffItems) && diffItems.length > 0 && (
          <Section icon={GitCompare} title="Diferenças encontradas" color="brand">
            <div className="space-y-4">
              {diffItems.map((d, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-700">
                      {d.seção || d.secao || d.section || `Item ${i + 1}`}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        d.tipo === "adição" || d.type === "addition"
                          ? "bg-emerald-100 text-emerald-700"
                          : d.tipo === "remoção" || d.type === "removal"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {d.tipo || d.type || "alteração"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-200">
                    <div className="p-4">
                      <p className="text-xs font-medium text-gray-400 mb-1">Antigo</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {d.texto_antigo || d.old_text || "—"}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-medium text-gray-400 mb-1">Novo</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {d.texto_novo || d.new_text || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}
