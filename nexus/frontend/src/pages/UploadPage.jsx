import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import AppHeader from "../components/AppHeader";
import api from "../services/api";

function DropZone({ label, file, onFile, onClear }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped?.type === "application/pdf") onFile(dropped);
    },
    [onFile]
  );

  const handleSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) onFile(selected);
  };

  return (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {file ? (
        <div className="border-2 border-brand-200 bg-brand-50 rounded-xl p-6 flex items-center gap-4">
          <FileText className="w-10 h-10 text-brand-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-sm text-gray-500">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-brand-100 text-gray-400 hover:text-red-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
            dragOver
              ? "border-brand-500 bg-brand-50"
              : "border-gray-300 hover:border-brand-400 hover:bg-gray-50"
          }`}
          onClick={() => document.getElementById(`file-${label}`).click()}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium">
            Arraste o PDF aqui ou clique para selecionar
          </p>
          <p className="text-xs text-gray-400 mt-1">Apenas arquivos .pdf</p>
          <input
            id={`file-${label}`}
            type="file"
            accept=".pdf"
            onChange={handleSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!oldFile || !newFile) return;
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("old_plan", oldFile);
      formData.append("new_plan", newFile);
      const res = await api.post("/comparisons/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Planos enviados com sucesso");
      navigate(`/review/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.detail || "Erro ao enviar arquivos";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Comparar planos de curso
          </h2>
          <p className="text-gray-500 mt-2">
            Envie o plano antigo e o novo para análise com IA
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex gap-6 flex-col md:flex-row">
          <DropZone
            label="Plano antigo (PDF)"
            file={oldFile}
            onFile={setOldFile}
            onClear={() => setOldFile(null)}
          />
          <DropZone
            label="Plano novo (PDF)"
            file={newFile}
            onFile={setNewFile}
            onClear={() => setNewFile(null)}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!oldFile || !newFile || loading}
            className="flex items-center gap-2 py-3 px-8 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
            {loading ? "Enviando..." : "Enviar para análise"}
          </button>
        </div>
      </main>
    </div>
  );
}
