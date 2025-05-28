import { useState, useRef, useEffect } from "react";
import "./App.css";

const initialQuadras = [
  {
    id: "Q1",
    lotes: [
      { numero: 1, status: "vendido" },
      { numero: 2, status: "vazio" },
      { numero: 3, status: "pendente" },
    ],
  },
  {
    id: "Q2",
    lotes: [
      { numero: 1, status: "vazio" },
      { numero: 2, status: "vendido" },
    ],
  },
];

const statusColor = {
  vendido: "status-vendido",
  vazio: "status-vazio",
  pendente: "status-pendente",
};

export default function App() {
  const [quadras, setQuadras] = useState(initialQuadras);
  const [quadraSelecionada, setQuadraSelecionada] = useState(null);
  const [lotesInterligados, setLotesInterligados] = useState([]);
  const detalhesRef = useRef(null);

  useEffect(() => {
    if (quadraSelecionada && detalhesRef.current) {
      detalhesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [quadraSelecionada]);

  const todosLotes = quadras.flatMap((q) => q.lotes);
  const totalLotes = todosLotes.length;
  const vendidos = todosLotes.filter((l) => l.status === "vendido").length;
  const vazios = todosLotes.filter((l) => l.status === "vazio").length;
  const pendentes = todosLotes.filter((l) => l.status === "pendente").length;

  const atualizarStatus = (quadraId, loteNumero, novoStatus) => {
    setQuadras((prev) =>
      prev.map((q) =>
        q.id === quadraId
          ? {
              ...q,
              lotes: q.lotes.map((l) =>
                l.numero === loteNumero ? { ...l, status: novoStatus } : l
              ),
            }
          : q
      )
    );
  };

  const adicionarLote = (quadraId) => {
    setQuadras((prev) =>
      prev.map((q) => {
        if (q.id === quadraId) {
          const novoNumero =
            q.lotes.length > 0
              ? Math.max(...q.lotes.map((l) => l.numero)) + 1
              : 1;
          return {
            ...q,
            lotes: [...q.lotes, { numero: novoNumero, status: "vazio" }],
          };
        }
        return q;
      })
    );
  };

  const deletarLote = (quadraId, loteNumero) => {
    setQuadras((prev) =>
      prev.map((q) =>
        q.id === quadraId
          ? {
              ...q,
              lotes: q.lotes.filter((l) => l.numero !== loteNumero),
            }
          : q
      )
    );
  };

  const adicionarQuadra = () => {
    const nome = prompt("Digite o nome da nova quadra:");
    if (nome) {
      setQuadras([...quadras, { id: nome, lotes: [] }]);
    }
  };

  const deletarQuadra = (quadraId) => {
    setQuadras((prev) => prev.filter((q) => q.id !== quadraId));
    if (quadraSelecionada?.id === quadraId) setQuadraSelecionada(null);
  };

  const interligarLotes = (quadraId, lote1, lote2) => {
    if (!lote2 || isNaN(lote2)) return;
    setLotesInterligados((prev) => [
      ...prev,
      { quadraId, lote1, lote2: parseInt(lote2) },
    ]);
  };

  const verificarInterligacao = (quadraId, loteNumero) => {
    return lotesInterligados.some(
      (i) =>
        i.quadraId === quadraId &&
        (i.lote1 === loteNumero || i.lote2 === loteNumero)
    );
  };

  const desenharLinhas = () => {
    return lotesInterligados.map(({ quadraId, lote1, lote2 }, index) => {
      const quadra = quadras.find((q) => q.id === quadraId);
      if (!quadra) return null;

      const idx1 = quadra.lotes.findIndex((l) => l.numero === lote1);
      const idx2 = quadra.lotes.findIndex((l) => l.numero === lote2);
      if (idx1 === -1 || idx2 === -1) return null;

      const pos1 = 20 + idx1 * 30;
      const pos2 = 20 + idx2 * 30;
      const top = quadras.findIndex((q) => q.id === quadraId) * 100 + 100;

      return (
        <line
          key={index}
          x1={pos1}
          y1={top}
          x2={pos2}
          y2={top}
          stroke="black"
          strokeWidth="2"
        />
      );
    });
  };

  return (
    <div className="container">
      <h1 className="title">Mapa do Loteamento</h1>

      <div className="resumo">
        <p>Total de Lotes: {totalLotes}</p>
        <p>Vendidos: {vendidos}</p>
        <p>Vazios: {vazios}</p>
        <p>Pendentes: {pendentes}</p>
        <button onClick={adicionarQuadra}>Adicionar Quadra</button>
      </div>

      <svg className="linhas-svg">{desenharLinhas()}</svg>

      <div className="quadras-container">
        {quadras.map((quadra) => (
          <div
            key={quadra.id}
            className="quadra"
            onClick={() => setQuadraSelecionada(quadra)}
          >
            <p className="quadra-title">
              Quadra {quadra.id}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletarQuadra(quadra.id);
                }}
                className="btn-delete"
              >
                Excluir Quadra
              </button>
            </p>
            <div className="lotes-status">
              {quadra.lotes.map((lote) => (
                <div
                  key={lote.numero}
                  className={`status-indicator ${statusColor[lote.status]} ${
                    verificarInterligacao(quadra.id, lote.numero)
                      ? "interligado"
                      : ""
                  }`}
                  title={`Lote ${lote.numero} - ${lote.status}`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {quadraSelecionada && (
        <div className="detalhes-quadra" ref={detalhesRef}>
          <h2 className="detalhes-titulo">
            Lotes da Quadra {quadraSelecionada.id}
          </h2>
          <ul className="lista-lotes">
            {quadras
              .find((q) => q.id === quadraSelecionada.id)
              .lotes.map((lote) => (
                <li key={lote.numero} className="item-lote">
                  Lote {lote.numero} -
                  <select
                    value={lote.status}
                    onChange={(e) =>
                      atualizarStatus(
                        quadraSelecionada.id,
                        lote.numero,
                        e.target.value
                      )
                    }
                  >
                    <option value="vendido">Vendido</option>
                    <option value="vazio">Vazio</option>
                    <option value="pendente">Pendente</option>
                  </select>
                  <button
                    onClick={() =>
                      deletarLote(quadraSelecionada.id, lote.numero)
                    }
                    className="btn-delete"
                  >
                    Excluir
                  </button>
                  <button
                    onClick={() => {
                      const outro = prompt(
                        `Interligar Lote ${lote.numero} com qual número?`
                      );
                      if (outro)
                        interligarLotes(
                          quadraSelecionada.id,
                          lote.numero,
                          outro
                        );
                    }}
                    className="btn-interligar"
                  >
                    Interligar
                  </button>
                </li>
              ))}
          </ul>
          <button onClick={() => adicionarLote(quadraSelecionada.id)}>
            Adicionar Lote
          </button>
        </div>
      )}
    </div>
  );
}
