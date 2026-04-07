import { BrowserRouter, Routes, Route } from "react-router-dom";

function Home() {
  return <h1 className="text-2xl font-bold p-8">Nexus - Home</h1>;
}

function Review() {
  return <h1 className="text-2xl font-bold p-8">Nexus - Review</h1>;
}

function Status() {
  return <h1 className="text-2xl font-bold p-8">Nexus - Status</h1>;
}

function Result() {
  return <h1 className="text-2xl font-bold p-8">Nexus - Resultado</h1>;
}

function History() {
  return <h1 className="text-2xl font-bold p-8">Nexus - Histórico</h1>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<Review />} />
        <Route path="/status/:id" element={<Status />} />
        <Route path="/result/:id" element={<Result />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}
