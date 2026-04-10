import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  Lightbulb,
  GitCompare,
  Download,
  ThumbsUp,
  ThumbsDown,
  FileCode,
  Eye,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import AppHeader from "../components/AppHeader";
import api from "../services/api";

// ---------- helpers ----------

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

function parseReport(result) {
  let reportMd = result.report_markdown || "";
  let novelties = Array.isArray(result.novelties_json)
    ? result.novelties_json
    : [];
  let suggestions = Array.isArray(result.suggestions_json)
    ? result.suggestions_json
    : [];

  const trimmed = reportMd.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("```")) {
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
    } catch {}
  }
  return { reportMd, novelties, suggestions };
}

function diffItemsFrom(diff) {
  if (Array.isArray(diff)) return diff;
  return diff?.differences || diff?.changes || [];
}

function normalizeType(d) {
  const t = (d.tipo || d.type || "").toString().toLowerCase();
  if (t.includes("adi") || t === "addition" || t === "add") return "add";
  if (t.includes("remo") || t === "removal" || t === "remove") return "remove";
  return "modify";
}

// ---------- tabs ----------

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
        active
          ? "border-brand-500 text-brand-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

// ---------- Report tab ----------

function ReportTab({ id, result, onReload }) {
  const { reportMd, novelties, suggestions } = useMemo(
    () => parseReport(result),
    [result]
  );
  const feedback = result.feedback_json || {};
  const [exporting, setExporting] = useState(false);
  const [voting, setVoting] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/comparisons/${id}/export/docx`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus-relatorio-${id.slice(0, 8)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("DOCX exportado");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao exportar DOCX");
    } finally {
      setExporting(false);
    }
  };

  const handleVote = async (index, feedbackValue) => {
    setVoting(`${index}-${feedbackValue}`);
    try {
      await api.post(`/comparisons/${id}/feedback`, {
        suggestion_index: index,
        feedback: feedbackValue,
      });
      toast.success("Feedback registrado");
      await onReload();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao registrar feedback");
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-brand-50 border-b border-brand-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Relatório da análise</h3>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Exportar DOCX
          </button>
        </div>
        <div className="p-5 prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-strong:text-gray-900 prose-a:text-brand-500">
          <ReactMarkdown>{reportMd}</ReactMarkdown>
        </div>
      </div>

      {novelties.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-700">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Novidades identificadas</h3>
          </div>
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {novelties.map((item, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 leading-relaxed"
              >
                {asText(item)}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-sky-50 border-b border-sky-200 flex items-center gap-2 text-sky-700">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Sugestões de melhoria</h3>
          </div>
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {suggestions.map((item, i) => {
              const existingFeedback = feedback[String(i)];
              const isObj = typeof item === "object" && item !== null;
              const confidence = isObj ? item.confidence_score : null;
              return (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-sky-50 border border-sky-200 text-sm text-sky-900 leading-relaxed flex flex-col gap-3"
                >
                  <div>{asText(item)}</div>
                  {confidence != null && (
                    <div className="text-xs text-sky-700">
                      Confiança: {Math.round(confidence * 100)}%
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => handleVote(i, "up")}
                      disabled={!!existingFeedback || voting !== null}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition disabled:cursor-not-allowed ${
                        existingFeedback === "up"
                          ? "bg-emerald-500 text-white"
                          : "bg-white border border-sky-300 text-sky-700 hover:bg-emerald-50 disabled:opacity-50"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Útil
                    </button>
                    <button
                      onClick={() => handleVote(i, "down")}
                      disabled={!!existingFeedback || voting !== null}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition disabled:cursor-not-allowed ${
                        existingFeedback === "down"
                          ? "bg-red-500 text-white"
                          : "bg-white border border-sky-300 text-sky-700 hover:bg-red-50 disabled:opacity-50"
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      Irrelevante
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Visual Comparator tab ----------

function splitIntoSections(text) {
  if (!text) return [];
  // Divide por linhas em branco duplicadas (parágrafos) ou por headings
  const parts = text
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [text];
}

function classifySection(section, diffItems) {
  const lower = section.toLowerCase();
  for (const d of diffItems) {
    const oldT = (d.texto_antigo || d.old_text || "").toLowerCase();
    const newT = (d.texto_novo || d.new_text || "").toLowerCase();
    const type = normalizeType(d);
    if (
      oldT &&
      oldT.length > 20 &&
      (lower.includes(oldT.slice(0, 40)) || oldT.includes(lower.slice(0, 40)))
    ) {
      return type;
    }
    if (
      newT &&
      newT.length > 20 &&
      (lower.includes(newT.slice(0, 40)) || newT.includes(lower.slice(0, 40)))
    ) {
      return type;
    }
  }
  return "identical";
}

function highlightColor(type) {
  if (type === "add") return "bg-[#dcfce7]";
  if (type === "remove") return "bg-[#fee2e2]";
  if (type === "modify") return "bg-[#fef9c3]";
  return "";
}

function VisualComparatorTab({ comparison, result }) {
  const diffItems = useMemo(() => diffItemsFrom(result.diff_json), [result]);
  const [hideIdentical, setHideIdentical] = useState(false);
  const [query, setQuery] = useState("");
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const syncingRef = useRef(false);

  const oldSections = useMemo(
    () => splitIntoSections(comparison.old_plan_text),
    [comparison.old_plan_text]
  );
  const newSections = useMemo(
    () => splitIntoSections(comparison.new_plan_text),
    [comparison.new_plan_text]
  );

  const filteredOld = useMemo(() => {
    return oldSections
      .map((s, i) => ({ text: s, type: classifySection(s, diffItems), idx: i }))
      .filter((x) => (hideIdentical ? x.type !== "identical" : true))
      .filter((x) =>
        query ? x.text.toLowerCase().includes(query.toLowerCase()) : true
      );
  }, [oldSections, diffItems, hideIdentical, query]);

  const filteredNew = useMemo(() => {
    return newSections
      .map((s, i) => ({ text: s, type: classifySection(s, diffItems), idx: i }))
      .filter((x) => (hideIdentical ? x.type !== "identical" : true))
      .filter((x) =>
        query ? x.text.toLowerCase().includes(query.toLowerCase()) : true
      );
  }, [newSections, diffItems, hideIdentical, query]);

  const handleScroll = (source) => () => {
    if (syncingRef.current) return;
    const src = source === "left" ? leftRef.current : rightRef.current;
    const dst = source === "left" ? rightRef.current : leftRef.current;
    if (!src || !dst) return;
    const ratio =
      src.scrollTop / Math.max(1, src.scrollHeight - src.clientHeight);
    syncingRef.current = true;
    dst.scrollTop = ratio * Math.max(1, dst.scrollHeight - dst.clientHeight);
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por palavra-chave..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={hideIdentical}
            onChange={(e) => setHideIdentical(e.target.checked)}
            className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500"
          />
          Ocultar seções idênticas
        </label>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="inline-block w-3 h-3 rounded bg-[#dcfce7] border border-emerald-300" />
          Adição
          <span className="inline-block w-3 h-3 rounded bg-[#fee2e2] border border-red-300 ml-1" />
          Remoção
          <span className="inline-block w-3 h-3 rounded bg-[#fef9c3] border border-amber-300 ml-1" />
          Modificação
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 truncate">
            Plano antigo — {comparison.old_plan_filename}
          </div>
          <div
            ref={leftRef}
            onScroll={handleScroll("left")}
            className="p-4 h-[600px] overflow-y-auto space-y-3 text-sm text-gray-800"
          >
            {filteredOld.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nada a exibir</p>
            ) : (
              filteredOld.map((s) => (
                <div
                  key={s.idx}
                  className={`p-3 rounded whitespace-pre-wrap leading-relaxed ${highlightColor(
                    s.type
                  )}`}
                >
                  {s.text}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 truncate">
            Plano novo — {comparison.new_plan_filename}
          </div>
          <div
            ref={rightRef}
            onScroll={handleScroll("right")}
            className="p-4 h-[600px] overflow-y-auto space-y-3 text-sm text-gray-800"
          >
            {filteredNew.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Nada a exibir</p>
            ) : (
              filteredNew.map((s) => (
                <div
                  key={s.idx}
                  className={`p-3 rounded whitespace-pre-wrap leading-relaxed ${highlightColor(
                    s.type
                  )}`}
                >
                  {s.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Technical Details tab ----------

function TechnicalTab({ result }) {
  const diff = result.diff_json;
  const items = diffItemsFrom(diff);
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-gray-700">
        <FileCode className="w-5 h-5" />
        <h3 className="font-semibold text-sm">Detalhes técnicos do diff</h3>
      </div>
      {items.length === 0 ? (
        <div className="p-5">
          <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-[600px]">
            {JSON.stringify(diff, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {items.map((item, i) => {
            const open = openIdx === i;
            const label =
              item.seção ||
              item.secao ||
              item.section ||
              item.unidade_curricular ||
              `UC / Item ${i + 1}`;
            const type = normalizeType(item);
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-800">
                    {open ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="font-medium">{label}</span>
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      type === "add"
                        ? "bg-emerald-100 text-emerald-700"
                        : type === "remove"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {type === "add"
                      ? "adição"
                      : type === "remove"
                      ? "remoção"
                      : "alteração"}
                  </span>
                </button>
                {open && (
                  <div className="px-5 pb-4">
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- main page ----------

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("report");

  const loadAll = async () => {
    try {
      const [compRes, resRes] = await Promise.all([
        api.get(`/comparisons/${id}`),
        api.get(`/comparisons/${id}/result`),
      ]);
      setComparison(compRes.data);
      setResult(resRes.data);
    } catch {
      setError("Resultado não encontrado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  if (error || !comparison || !result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-red-600">{error || "Erro ao carregar resultado"}</p>
          <button
            onClick={() => navigate("/history")}
            className="text-brand-500 hover:text-brand-700 font-medium text-sm"
          >
            Voltar ao histórico
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <button
          onClick={() => navigate("/history")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao histórico
        </button>

        <div className="border-b border-gray-200 flex gap-1">
          <TabButton
            active={tab === "report"}
            onClick={() => setTab("report")}
            icon={Sparkles}
          >
            Relatório
          </TabButton>
          <TabButton
            active={tab === "visual"}
            onClick={() => setTab("visual")}
            icon={Eye}
          >
            Comparador visual
          </TabButton>
          <TabButton
            active={tab === "technical"}
            onClick={() => setTab("technical")}
            icon={GitCompare}
          >
            Detalhes técnicos
          </TabButton>
        </div>

        {tab === "report" && (
          <ReportTab id={id} result={result} onReload={loadAll} />
        )}
        {tab === "visual" && (
          <VisualComparatorTab comparison={comparison} result={result} />
        )}
        {tab === "technical" && <TechnicalTab result={result} />}
      </main>
    </div>
  );
}
