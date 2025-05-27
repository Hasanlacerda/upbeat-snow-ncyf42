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
  const [form, setForm] = useState({ nome: "", codigo: "", custo: "", preco: "", historicoCompras: [] });
  const [filtroData, setFiltroData] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [vendas, setVendas] = useState([]);
  const [vendaAtual, setVendaAtual] = useState({ comprador: "", itens: [{ nome: "", quantidade: 1, valor: "" }] });

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("credentials", JSON.stringify(credentials));
  }, [credentials]);

  const handleLogin = () => {
    if (auth.username === credentials.username && auth.password === credentials.password) {
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
      historicoCompras: form.historicoCompras || []
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
    setForm({ nome: "", codigo: "", custo: "", preco: "", historicoCompras: [] });
  };

  const renderVoltarButton = () => (
    <button className="mt-4 bg-gray-400 text-white px-4 py-2 rounded w-full" onClick={() => setActivePage("home")}>Voltar para Home</button>
  );

  const renderMenuButtons = () => (
    <div className="flex flex-wrap gap-4 justify-center mt-6">
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setActivePage("cadastro")}>Cadastro de Itens</button>
      <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={() => setActivePage("valores")}>Preenchimento de Valores</button>
      <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setActivePage("vendas")}>Vendas</button>
      <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={() => setActivePage("historico")}>Histórico</button>
      <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setActivePage("estoque")}>Estoque</button>
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
            onChange={e => setAuth({ ...auth, username: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="password"
            placeholder="Senha"
            value={auth.password}
            onChange={e => setAuth({ ...auth, password: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >Entrar</button>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">Smart Control App</h1>
          {renderMenuButtons()}

          {activePage === "cadastro" && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4">Cadastro de Produto</h2>
              <input
                type="text"
                placeholder="Nome (obrigatório)"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
                className="border p-2 rounded w-full mb-2"
              />
              <input
                type="text"
                placeholder="Código (opcional)"
                value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value })}
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

          {activePage === "vendas" && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-4">Registro de Venda</h2>
              <input
                type="text"
                placeholder="Nome do comprador"
                value={vendaAtual.comprador}
                onChange={(e) => setVendaAtual({ ...vendaAtual, comprador: e.target.value })}
                className="border p-2 rounded w-full mb-4"
              />
              {vendaAtual.itens.map((item, index) => (
                <div key={index} className="mb-4 border p-2 rounded">
                  <select
                    value={item.nome}
                    onChange={(e) => {
                      const nomeSelecionado = e.target.value;
                      const prod = products.find(p => p.nome === nomeSelecionado);
                      const preco = prod ? prod.preco : "";
                      const updatedItens = [...vendaAtual.itens];
                      updatedItens[index] = {
                        ...updatedItens[index],
                        nome: nomeSelecionado,
                        valor: preco
                      };
                      setVendaAtual({ ...vendaAtual, itens: updatedItens });
                    }}
                    className="border p-2 rounded w-full mb-2"
                  >
                    <option value="">Selecione um item</option>
                    {products.map((produto, i) => (
                      <option key={i} value={produto.nome}>{produto.nome}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Quantidade"
                    value={item.quantidade}
                    onChange={(e) => {
                      const updatedItens = [...vendaAtual.itens];
                      updatedItens[index].quantidade = parseInt(e.target.value);
                      setVendaAtual({ ...vendaAtual, itens: updatedItens });
                    }}
                    className="border p-2 rounded w-full mb-2"
                  />

                  <input
                    type="text"
                    placeholder="Valor (automático)"
                    value={item.valor || ""}
                    readOnly
                    className="border p-2 rounded w-full mb-2 bg-gray-100"
                  />
                </div>
              ))}

              <button
                onClick={() => setVendaAtual({
                  ...vendaAtual,
                  itens: [...vendaAtual.itens, { nome: "", quantidade: 1, valor: "" }]
                })}
                className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-4"
              >
                Adicionar Item
              </button>

              <button
                onClick={() => {
                  const novaVenda = {
                    ...vendaAtual,
                    data: new Date().toLocaleDateString()
                  };
                  setVendas([...vendas, novaVenda]);

                  const produtosAtualizados = [...products];
                  novaVenda.itens.forEach(item => {
                    const indexProduto = produtosAtualizados.findIndex(p => p.nome === item.nome);
                    if (indexProduto !== -1) {
                      produtosAtualizados[indexProduto].estoque =
                        (produtosAtualizados[indexProduto].estoque || 0) - item.quantidade;
                    }
                  });
                  setProducts(produtosAtualizados);

                  setVendaAtual({ comprador: "", itens: [{ nome: "", quantidade: 1, valor: "" }] });
                  alert("Venda registrada com sucesso!");
                }}
                className="bg-green-600 text-white px-4 py-2 rounded w-full"
              >
                Salvar Venda
              </button>
              {renderVoltarButton()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
