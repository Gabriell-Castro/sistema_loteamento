import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

const statusColor = {
  vendido: "status-vendido",
  vazio: "status-vazio",
  pendente: "status-pendente",
};

export default function App() {
  const [quadras, setQuadras] = useState([]);
  const [quadraSelecionada, setQuadraSelecionada] = useState(null);
  const [lotesInterligados, setLotesInterligados] = useState([]);
  const [loteDetalhesVisivel, setLoteDetalhesVisivel] = useState(null);

  const [proprietarioEmEdicao, setProprietarioEmEdicao] = useState(null);
  const detalhesRef = useRef(null);

  const API_BASE_URL = "https://api-loteamento.vercel.app/loteamentos";

  const carregarQuadras = useCallback(async () => {
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setQuadras(data.map((q) => ({ ...q, id: q._id })));
    } catch (err) {
      console.error("Erro ao carregar quadras:", err);
    }
  }, []);

  useEffect(() => {
    carregarQuadras();
  }, [carregarQuadras]);

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

  const atualizarStatus = async (quadraId, loteNumero, novoStatus) => {
    try {
      const quadraToUpdate = quadras.find((q) => q.id === quadraId);
      if (!quadraToUpdate) return;

      const res = await fetch(
        `${API_BASE_URL}/${quadraId}/lotes/${loteNumero}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        }
      );

      if (!res.ok) {
        throw new Error(`Erro ao atualizar status: ${res.status}`);
      }

      const updatedQuadraData = await res.json();
      setQuadras((prev) =>
        prev.map((q) =>
          q.id === updatedQuadraData._id
            ? { ...updatedQuadraData, id: updatedQuadraData._id }
            : q
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar status do lote:", err);
    }
  };

  const adicionarLote = async (quadraId) => {
    try {
      const quadraToUpdate = quadras.find((q) => q.id === quadraId);
      if (!quadraToUpdate) return;

      const novoNumero =
        quadraToUpdate.lotes.length > 0
          ? Math.max(...quadraToUpdate.lotes.map((l) => l.numero)) + 1
          : 1;

      const newLoteData = {
        numero: novoNumero,
        status: "vazio",
        proprietario: {
          nome: "",
          cpf: "",
          telefone: "",
          email: "",
          observacoes: "",
        },
      };

      const res = await fetch(`${API_BASE_URL}/${quadraId}/lotes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoteData),
      });

      if (!res.ok) {
        throw new Error(`Erro ao adicionar lote: ${res.status}`);
      }

      const updatedQuadraData = await res.json();
      setQuadras((prev) =>
        prev.map((q) =>
          q.id === updatedQuadraData._id
            ? { ...updatedQuadraData, id: updatedQuadraData._id }
            : q
        )
      );
    } catch (err) {
      console.error("Erro ao adicionar lote:", err);
    }
  };

  const deletarLote = async (quadraId, loteNumero) => {
    try {
      const quadraToUpdate = quadras.find((q) => q.id === quadraId);
      if (!quadraToUpdate) return;

      const newLotesArray = quadraToUpdate.lotes.filter(
        (l) => l.numero !== loteNumero
      );
      const updatedDataForBackend = {
        _id: quadraToUpdate.id,
        lotes: newLotesArray,
      };

      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDataForBackend),
      });

      if (!res.ok) {
        throw new Error(`Erro ao deletar lote: ${res.status}`);
      }

      const returnedQuadraData = await res.json();
      setQuadras((prev) =>
        prev.map((q) =>
          q.id === returnedQuadraData._id
            ? { ...returnedQuadraData, id: returnedQuadraData._id }
            : q
        )
      );

      if (loteDetalhesVisivel === loteNumero) {
        setLoteDetalhesVisivel(null);
        setProprietarioEmEdicao(null);
      }
    } catch (err) {
      console.error("Erro ao deletar lote:", err);
    }
  };

  const adicionarQuadra = async () => {
    const nome = prompt("Digite o ID (ex: q1, q2) da nova quadra:");
    if (!nome) return;

    const newQuadraDataForBackend = { _id: nome, lotes: [] };

    try {
      const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuadraDataForBackend),
      });

      if (!res.ok) {
        throw new Error(`Erro ao adicionar quadra: ${res.status}`);
      }

      const addedQuadraData = await res.json();
      setQuadras((prev) => [
        ...prev,
        { ...addedQuadraData, id: addedQuadraData._id },
      ]);
    } catch (err) {
      console.error("Erro ao adicionar quadra:", err);
    }
  };

  const deletarQuadra = async (quadraId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${quadraId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Erro ao deletar quadra: ${res.status}`);
      }

      setQuadras((prev) => prev.filter((q) => q.id !== quadraId));
      if (quadraSelecionada?.id === quadraId) setQuadraSelecionada(null);
      setLoteDetalhesVisivel(null);
      setProprietarioEmEdicao(null);
    } catch (err) {
      console.error("Erro ao deletar quadra:", err);
    }
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

  const salvarDadosProprietario = async (
    quadraId,
    loteNumero,
    dadosProprietario
  ) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/${quadraId}/lotes/${loteNumero}/proprietario`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosProprietario),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Erro ao atualizar dados do proprietário: ${res.status}`
        );
      }

      const updatedQuadraData = await res.json();
      setQuadras((prev) =>
        prev.map((q) =>
          q.id === updatedQuadraData._id
            ? { ...updatedQuadraData, id: updatedQuadraData._id }
            : q
        )
      );

      setProprietarioEmEdicao(null);
    } catch (err) {
      console.error("Erro ao salvar dados do proprietário:", err);
    }
  };

  const handleProprietarioInputChange = (e, campo) => {
    setProprietarioEmEdicao((prev) => ({
      ...(prev || {}),
      [campo]: e.target.value,
    }));
  };

  const toggleDetalhesProprietario = async (lote) => {
    if (loteDetalhesVisivel === lote.numero) {
      if (proprietarioEmEdicao) {
        await salvarDadosProprietario(
          quadraSelecionada.id,
          lote.numero,
          proprietarioEmEdicao
        );
      }
      setLoteDetalhesVisivel(null);
      setProprietarioEmEdicao(null);
    } else {
      setLoteDetalhesVisivel(lote.numero);

      setProprietarioEmEdicao(
        lote.proprietario || {
          nome: "",
          cpf: "",
          telefone: "",
          email: "",
          observacoes: "",
        }
      );
    }
  };

  return (
    <div className="container">
      <h1 className="title">MAPA GUILHERME AMORIM</h1>

      <div className="resumo">
        <p>Total de Lotes: {totalLotes}</p>
        <p>Vendidos: {vendidos}</p>
        <p>Vazios: {vazios}</p>
        <p>Pendentes: {pendentes}</p>
        <button className="btn btn-primary" onClick={adicionarQuadra}>
          Adicionar Quadra
        </button>
      </div>

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
                className="btn btn-delete"
              >
                Excluir Quadra
              </button>
            </p>
            <div className="lotes-status">
              {quadra.lotes.map((lote) => (
                <div
                  key={`${quadra.id}-${lote.numero}`}
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
              .lotes.map((lote) => {
                const isDetalhesOpen = loteDetalhesVisivel === lote.numero;
                const currentProprietarioData = isDetalhesOpen
                  ? proprietarioEmEdicao || lote.proprietario || {}
                  : lote.proprietario || {};

                return (
                  <li
                    key={`${quadraSelecionada.id}-${lote.numero}`}
                    className="item-lote"
                  >
                    Lote {lote.numero}
                    <select
                      className={`status-select ${statusColor[lote.status]}`}
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
                    <div className="lote-actions">
                      <button
                        onClick={() => toggleDetalhesProprietario(lote)}
                        className="btn btn-details"
                      >
                        {isDetalhesOpen ? "Salvar" : "Ver Detalhes"}
                      </button>
                      <button
                        onClick={() =>
                          deletarLote(quadraSelecionada.id, lote.numero)
                        }
                        className="btn btn-delete"
                      >
                        Excluir
                      </button>
                    </div>
                    {isDetalhesOpen && (
                      <div className={`detalhes-proprietario show`}>
                        <h3>Dados do Proprietário:</h3>
                        <div className="input-group">
                          <label>Nome:</label>
                          <input
                            type="text"
                            value={currentProprietarioData.nome || ""}
                            onChange={(e) =>
                              handleProprietarioInputChange(e, "nome")
                            }
                          />
                        </div>
                        <div className="input-group">
                          <label>CPF:</label>
                          <input
                            type="text"
                            value={currentProprietarioData.cpf || ""}
                            onChange={(e) =>
                              handleProprietarioInputChange(e, "cpf")
                            }
                          />
                        </div>
                        <div className="input-group">
                          <label>Telefone:</label>
                          <input
                            type="text"
                            value={currentProprietarioData.telefone || ""}
                            onChange={(e) =>
                              handleProprietarioInputChange(e, "telefone")
                            }
                          />
                        </div>
                        <div className="input-group">
                          <label>Email:</label>
                          <input
                            type="email"
                            value={currentProprietarioData.email || ""}
                            onChange={(e) =>
                              handleProprietarioInputChange(e, "email")
                            }
                          />
                        </div>
                        <div className="input-group">
                          <label>Observações:</label>
                          <textarea
                            value={currentProprietarioData.observacoes || ""}
                            onChange={(e) =>
                              handleProprietarioInputChange(e, "observacoes")
                            }
                          ></textarea>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
          <button
            className="btn btn-primary"
            onClick={() => adicionarLote(quadraSelecionada.id)}
          >
            Adicionar Lote
          </button>
        </div>
      )}
    </div>
  );
}
