import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [auth, setAuth] = useState({ username: "", password: "" });
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem("credentials");
    return saved ? JSON.parse(saved) : { username: "admin", password: "1234" };
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [editIndex, setEditIndex] = useState(null);
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("products");
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    custo: "",
    preco: "",
    historicoCompras: [],
  });
  const [valorFiltro, setValorFiltro] = useState("");
  const [valorForm, setValorForm] = useState({
    nome: "",
    custo: "",
    preco: "",
  });
  const [filtroData, setFiltroData] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [vendas, setVendas] = useState([]);
  const [vendaAtual, setVendaAtual] = useState({
    comprador: "",
    itens: [{ nome: "", quantidade: 1 }],
  });

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("credentials", JSON.stringify(credentials));
  }, [credentials]);

  const handleLogin = () => {
    if (
      auth.username === credentials.username &&
      auth.password === credentials.password
    ) {
      setLoggedIn(true);
      setError("");
      setActivePage("home");
    } else {
      setError("Usuário ou senha inválidos");
    }
  };

  const updateCredentials = () => {
    if (auth.username && auth.password) {
      setCredentials({ ...auth });
      setAuth({ username: "", password: "" });
      setShowSettings(false);
      alert("Login e senha atualizados com sucesso!");
    }
  };

  const addOrUpdateProduct = () => {
    const updatedProduct = {
      ...form,
      custo: form.custo || "",
      preco: form.preco || "",
      historicoCompras: form.historicoCompras || [],
    };

    if (!form.nome) {
      alert("O campo Nome é obrigatório.");
      return;
    }

    if (editIndex !== null) {
      const updatedProducts = [...products];
      updatedProducts[editIndex] = updatedProduct;
      setProducts(updatedProducts);
      setEditIndex(null);
    } else {
      setProducts([...products, updatedProduct]);
    }
    setForm({
      nome: "",
      codigo: "",
      custo: "",
      preco: "",
      historicoCompras: [],
    });
  };

  const handleValorSelect = (nome) => {
    const produto = products.find((p) => p.nome === nome);
    if (produto) {
      setValorForm({
        nome,
        custo: produto.custo || "",
        preco: produto.preco || "",
      });
    }
  };

  const salvarValores = () => {
    const updatedProducts = products.map((p) =>
      p.nome === valorForm.nome
        ? { ...p, custo: valorForm.custo, preco: valorForm.preco }
        : p
    );
    setProducts(updatedProducts);
    alert("Valores atualizados com sucesso!");
  };

  const exportarParaExcel = () => {
    const ws = XLSX.utils.json_to_sheet(vendas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "vendas.xlsx");
  };

  const vendasFiltradas = vendas.filter((v) => {
    const filtroPorData = filtroData ? v.data?.includes(filtroData) : true;
    const filtroPorNome = filtroNome
      ? v.itens?.some((i) =>
          i.nome.toLowerCase().includes(filtroNome.toLowerCase())
        )
      : true;
    return filtroPorData && filtroPorNome;
  });

  const produtosFiltrados = products.filter((p) =>
    p.nome.toLowerCase().includes(valorFiltro.toLowerCase())
  );

  const renderVoltarButton = () => (
    <button
      className="mt-4 bg-gray-400 text-white px-4 py-2 rounded w-full"
      onClick={() => setActivePage("home")}
    >
      Voltar para Home
    </button>
  );

  const renderMenuButtons = () => (
    <div className="flex flex-wrap gap-4 justify-center mt-6">
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => setActivePage("cadastro")}
      >
        Cadastro de Itens
      </button>
      <button
        className="bg-purple-500 text-white px-4 py-2 rounded"
        onClick={() => setActivePage("valores")}
      >
        Preenchimento de Valores
      </button>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={() => setActivePage("vendas")}
      >
        Vendas
      </button>
      <button
        className="bg-yellow-500 text-white px-4 py-2 rounded"
        onClick={() => setActivePage("historico")}
      >
        Histórico
      </button>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => setActivePage("estoque")}
      >
        Estoque
      </button>
    </div>
  );

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">Smart Control App</h1>
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="bg-gray-600 text-white px-4 py-2 rounded"
      >
        Configurações
      </button>
    </div>
  );

  const renderSettings = () =>
    showSettings && (
      <div className="border border-gray-300 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Atualizar Login</h2>
        <input
          type="text"
          placeholder="Novo Usuário"
          value={auth.username}
          onChange={(e) => setAuth({ ...auth, username: e.target.value })}
          className="border p-2 rounded w-full mb-2"
        />
        <input
          type="password"
          placeholder="Nova Senha"
          value={auth.password}
          onChange={(e) => setAuth({ ...auth, password: e.target.value })}
          className="border p-2 rounded w-full mb-2"
        />
        <button
          onClick={updateCredentials}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Salvar
        </button>
      </div>
    );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {!loggedIn ? (
        <div className="max-w-sm mx-auto mt-20">
          <h2 className="text-xl font-bold mb-4">Login</h2>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <input
            type="text"
            placeholder="Usuário"
            value={auth.username}
            onChange={(e) => setAuth({ ...auth, username: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="password"
            placeholder="Senha"
            value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Entrar
          </button>
        </div>
      ) : (
        <>
          {renderHeader()}
          {renderSettings()}

          {activePage === "home" && (
            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Bem-vindo à Gestão da Smart Control Home
              </h2>
              <p className="text-gray-700">
                Escolha uma aba no menu para começar.
              </p>
              {renderMenuButtons()}
            </div>
          )}

          {activePage === "cadastro" && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4">Cadastro de Produto</h2>
              <input
                type="text"
                placeholder="Nome (obrigatório)"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="text"
                placeholder="Código (opcional)"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <button
                onClick={addOrUpdateProduct}
                className="bg-green-600 text-white px-4 py-2 rounded w-full mb-4"
              >
                {editIndex !== null ? "Atualizar Produto" : "Cadastrar Produto"}
              </button>
              {renderVoltarButton()}
            </div>
          )}

          {activePage === "valores" && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4">
                Preenchimento de Valores
              </h2>

              <input
                type="text"
                placeholder="Filtrar por nome"
                value={valorFiltro}
                onChange={(e) => setValorFiltro(e.target.value)}
                className="border p-2 rounded w-full mb-2"
              />

              <select
                value={valorForm.nome}
                onChange={(e) => handleValorSelect(e.target.value)}
                className="border p-2 rounded w-full mb-2"
              >
                <option value="">Selecione um produto</option>
                {produtosFiltrados.map((produto, index) => (
                  <option key={index} value={produto.nome}>
                    {produto.nome}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Valor de compra"
                value={valorForm.custo}
                onChange={(e) =>
                  setValorForm({ ...valorForm, custo: e.target.value })
                }
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="text"
                placeholder="Valor de venda"
                value={valorForm.preco}
                onChange={(e) =>
                  setValorForm({ ...valorForm, preco: e.target.value })
                }
                className="border p-2 rounded w-full mb-2"
              />
              <button
                onClick={salvarValores}
                className="bg-green-600 text-white px-4 py-2 rounded w-full mb-4"
              >
                Salvar Valores
              </button>

              {renderVoltarButton()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
