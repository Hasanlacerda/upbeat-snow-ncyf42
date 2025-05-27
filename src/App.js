import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaHistory,
  FaBoxes,
  FaUserCog,
} from "react-icons/fa";

export default function App() {
  // ========== ESTADOS ========== //
  const [auth, setAuth] = useState({ username: "", password: "" });
  const [credentials, setCredentials] = useState(() => {
    const saved = localStorage.getItem("credentials");
    return saved ? JSON.parse(saved) : { username: "admin", password: "1234" };
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("home");
  const [editIndex, setEditIndex] = useState(null);

  // Produtos
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("products");
    return saved
      ? JSON.parse(saved)
      : [
          {
            nome: "Sensor de Movimento",
            codigo: "SM001",
            custo: "25.00",
            preco: "50.00",
            estoque: 10,
            estoqueMinimo: 5,
            categoria: "Sensor",
          },
        ];
  });

  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    custo: "",
    preco: "",
    estoque: "",
    estoqueMinimo: "5",
    categoria: "Dispositivo",
  });

  // Vendas
  const [vendas, setVendas] = useState(() => {
    const saved = localStorage.getItem("vendas");
    return saved ? JSON.parse(saved) : [];
  });

  const [vendaAtual, setVendaAtual] = useState({
    comprador: "",
    itens: [{ nome: "", quantidade: 1, valor: "" }],
  });

  // Serviços
  const [servicos, setServicos] = useState([
    { itemSelecionado: "", valor: 0, quantidade: 1 },
  ]);
  const [maoDeObra, setMaoDeObra] = useState(0);
  const [clienteServico, setClienteServico] = useState("");

  // Backup
  const [lastBackup, setLastBackup] = useState(null);

  // ========== EFFECTS ========== //
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("vendas", JSON.stringify(vendas));
    localStorage.setItem("credentials", JSON.stringify(credentials));
  }, [products, vendas, credentials]);

  useEffect(() => {
    // Configura backup automático a cada 30 minutos
    const backupInterval = setInterval(() => {
      const backupData = {
        products,
        vendas,
        credentials,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        `backup_${new Date().getTime()}`,
        JSON.stringify(backupData)
      );
      setLastBackup(new Date().toLocaleString());

      // Limpa backups antigos (mantém apenas os 5 mais recentes)
      const backups = Object.keys(localStorage)
        .filter((key) => key.startsWith("backup_"))
        .sort()
        .reverse();
      if (backups.length > 5) {
        backups.slice(5).forEach((key) => localStorage.removeItem(key));
      }
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(backupInterval);
  }, [products, vendas, credentials]);

  // ========== FUNÇÕES GERAIS ========== //
  const handleLogin = () => {
    if (
      auth.username === credentials.username &&
      auth.password === credentials.password
    ) {
      setLoggedIn(true);
      setError("");
    } else {
      setError("Usuário ou senha inválidos");
    }
  };

  const alterarCredenciais = () => {
    const novoLogin = prompt("Novo login:", credentials.username);
    if (novoLogin === null) return;

    const novaSenha = prompt("Nova senha:", credentials.password);
    if (novaSenha === null) return;

    if (!novoLogin || !novaSenha) {
      alert("Login e senha não podem estar vazios!");
      return;
    }

    setCredentials({ username: novoLogin, password: novaSenha });
    alert("Credenciais alteradas com sucesso!");
  };

  const atualizarEstoque = (nomeProduto, quantidade, operacao = "diminuir") => {
    setProducts((prevProducts) =>
      prevProducts.map((produto) =>
        produto.nome === nomeProduto
          ? {
              ...produto,
              estoque:
                operacao === "diminuir"
                  ? produto.estoque - quantidade
                  : produto.estoque + quantidade,
            }
          : produto
      )
    );
  };

  // ========== CADASTRO ========== //
  const addOrUpdateProduct = () => {
    if (!form.nome) {
      alert("O campo Nome é obrigatório!");
      return;
    }

    const updatedProduct = {
      nome: form.nome,
      codigo: form.codigo || "",
      custo: form.custo || "0",
      preco: form.preco || "0",
      estoque: Number(form.estoque) || 0,
      estoqueMinimo: Number(form.estoqueMinimo) || 5,
      categoria: form.categoria || "Dispositivo",
    };

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
      estoque: "",
      estoqueMinimo: "5",
      categoria: "Dispositivo",
    });
  };

  const editarProduto = (index) => {
    setForm(products[index]);
    setEditIndex(index);
    setActivePage("cadastro");
  };

  const excluirProduto = (index) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir "${products[index].nome}"?`
      )
    ) {
      const novosProdutos = [...products];
      novosProdutos.splice(index, 1);
      setProducts(novosProdutos);
    }
  };

  // ========== VENDAS ========== //
  const adicionarItemVenda = () => {
    setVendaAtual({
      ...vendaAtual,
      itens: [...vendaAtual.itens, { nome: "", quantidade: 1, valor: "" }],
    });
  };

  const removerItemVenda = (index) => {
    if (vendaAtual.itens.length > 1) {
      const novosItens = [...vendaAtual.itens];
      novosItens.splice(index, 1);
      setVendaAtual({ ...vendaAtual, itens: novosItens });
    }
  };

  const finalizarVenda = () => {
    if (!vendaAtual.comprador || vendaAtual.itens.some((item) => !item.nome)) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    // Atualiza estoque
    vendaAtual.itens.forEach((item) => {
      if (item.nome && item.quantidade) {
        atualizarEstoque(item.nome, item.quantidade, "diminuir");
      }
    });

    const totalVenda = vendaAtual.itens.reduce(
      (sum, item) => sum + (Number(item.valor) || 0) * (item.quantidade || 0),
      0
    );

    const novaVenda = {
      ...vendaAtual,
      data: new Date().toLocaleDateString(),
      total: totalVenda,
    };

    setVendas([...vendas, novaVenda]);
    setVendaAtual({
      comprador: "",
      itens: [{ nome: "", quantidade: 1, valor: "" }],
    });
    alert("Venda registrada com sucesso!");
  };

  // ========== SERVIÇOS ========== //
  const adicionarItemServico = () => {
    setServicos([
      ...servicos,
      { itemSelecionado: "", valor: 0, quantidade: 1 },
    ]);
  };

  const removerItemServico = (index) => {
    if (servicos.length > 1) {
      const novosServicos = [...servicos];
      novosServicos.splice(index, 1);
      setServicos(novosServicos);
    }
  };

  const salvarServico = () => {
    if (!clienteServico || maoDeObra <= 0) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    const totalServico =
      servicos.reduce((sum, item) => sum + item.valor * item.quantidade, 0) +
      Number(maoDeObra);

    const novoServico = {
      data: new Date().toLocaleDateString(),
      cliente: clienteServico,
      itens: servicos
        .filter((item) => item.itemSelecionado)
        .map((item) => ({
          nome: item.itemSelecionado,
          quantidade: item.quantidade,
          valor: item.valor,
        })),
      maoDeObra: Number(maoDeObra),
      total: totalServico,
    };

    // Atualiza estoque
    servicos.forEach((item) => {
      if (item.itemSelecionado && item.quantidade) {
        atualizarEstoque(item.itemSelecionado, item.quantidade, "diminuir");
      }
    });

    setVendas([...vendas, novoServico]);

    // Exporta para Excel
    const dados = [
      {
        Data: novoServico.data,
        Cliente: novoServico.cliente,
        Itens: novoServico.itens
          .map((i) => `${i.nome} (${i.quantidade}x)`)
          .join(", "),
        "Mão de Obra": novoServico.maoDeObra,
        Total: novoServico.total,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Serviço");
    XLSX.writeFile(wb, `servico_${novoServico.cliente}.xlsx`);

    // Limpa formulário
    setServicos([{ itemSelecionado: "", valor: 0, quantidade: 1 }]);
    setMaoDeObra(0);
    setClienteServico("");
    alert("Serviço salvo com sucesso!");
  };

  // ========== COMPONENTES REUTILIZÁVEIS ========== //
  const renderVoltarButton = () => (
    <button
      className="mt-4 bg-gray-500 text-white px-4 py-2 rounded w-full"
      onClick={() => setActivePage("home")}
    >
      Voltar para Home
    </button>
  );

  const renderMenuButtons = () => (
    <div className="relative">
      {/* Botão de alterar credenciais (topo direito) */}
      <button
        onClick={alterarCredenciais}
        className="absolute top-0 right-0 bg-purple-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
        title="Alterar login/senha"
      >
        <FaUserCog /> Alterar Credenciais
      </button>

      {/* Mensagem de backup */}
      {lastBackup && (
        <div className="absolute top-0 left-0 text-xs text-gray-500">
          Último backup: {lastBackup}
        </div>
      )}

      {/* Botões principais (centralizados) */}
      <div className="flex flex-wrap gap-4 justify-center mt-8 pt-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setActivePage("cadastro")}
        >
          <FaEdit /> Cadastro
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setActivePage("vendas")}
        >
          <FaSave /> Vendas
        </button>
        <button
          className="bg-cyan-500 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setActivePage("servicos")}
        >
          <FaEdit /> Serviços
        </button>
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setActivePage("historico")}
        >
          <FaHistory /> Histórico
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"
          onClick={() => setActivePage("estoque")}
        >
          <FaBoxes /> Estoque
        </button>
      </div>
    </div>
  );

  // ========== PÁGINAS ========== //
  const renderLogin = () => (
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
  );

  const renderCadastro = () => (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-4">
        {editIndex !== null ? "Editar Produto" : "Cadastrar Produto"}
      </h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Nome *</label>
          <input
            type="text"
            placeholder="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Código</label>
          <input
            type="text"
            placeholder="Código interno"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1">Custo (R$)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.custo}
            onChange={(e) => setForm({ ...form, custo: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Estoque</label>
          <input
            type="number"
            placeholder="Quantidade"
            value={form.estoque}
            onChange={(e) => setForm({ ...form, estoque: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">Estoque Mínimo</label>
          <input
            type="number"
            value={form.estoqueMinimo}
            onChange={(e) =>
              setForm({ ...form, estoqueMinimo: e.target.value })
            }
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="border p-2 rounded w-full"
          >
            <option value="Dispositivo">Dispositivo</option>
            <option value="Sensor">Sensor</option>
            <option value="Atuador">Atuador</option>
          </select>
        </div>
      </div>

      <button
        onClick={addOrUpdateProduct}
        className="bg-green-600 text-white px-4 py-2 rounded w-full mb-6 flex items-center justify-center gap-2"
      >
        <FaSave />{" "}
        {editIndex !== null ? "Atualizar Produto" : "Cadastrar Produto"}
      </button>

      <div className="border-t pt-4">
        <h3 className="font-bold mb-3">Produtos Cadastrados</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {products.map((produto, index) => (
            <div
              key={index}
              className="flex justify-between items-center border p-2 rounded"
            >
              <div>
                <p className="font-medium">{produto.nome}</p>
                <p className="text-sm text-gray-600">
                  {produto.codigo} | R$ {produto.preco} | Estoque:{" "}
                  {produto.estoque}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editarProduto(index)}
                  className="text-blue-500 hover:text-blue-700 p-1"
                  title="Editar"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => excluirProduto(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Excluir"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {renderVoltarButton()}
    </div>
  );

  const renderVendas = () => {
    const totalVenda = vendaAtual.itens.reduce(
      (sum, item) => sum + (Number(item.valor) || 0) * (item.quantidade || 0),
      0
    );

    return (
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Registro de Venda</h2>

        <input
          type="text"
          placeholder="Nome do Cliente"
          value={vendaAtual.comprador}
          onChange={(e) =>
            setVendaAtual({ ...vendaAtual, comprador: e.target.value })
          }
          className="border p-2 rounded w-full mb-4"
        />

        {vendaAtual.itens.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 mb-4 items-end">
            <select
              value={item.nome}
              onChange={(e) => {
                const produto = products.find((p) => p.nome === e.target.value);
                const novosItens = [...vendaAtual.itens];
                novosItens[index] = {
                  nome: e.target.value,
                  valor: produto ? produto.preco : "",
                  quantidade: item.quantidade,
                };
                setVendaAtual({ ...vendaAtual, itens: novosItens });
              }}
              className="border p-2 rounded"
            >
              <option value="">Selecione</option>
              {products.map((prod) => (
                <option key={prod.nome} value={prod.nome}>
                  {prod.nome}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              value={item.quantidade}
              onChange={(e) => {
                const novosItens = [...vendaAtual.itens];
                novosItens[index].quantidade = Math.max(
                  1,
                  parseInt(e.target.value) || 1
                );
                setVendaAtual({ ...vendaAtual, itens: novosItens });
              }}
              className="border p-2 rounded"
            />

            <input
              type="text"
              value={item.valor ? `R$ ${item.valor}` : ""}
              readOnly
              className="border p-2 rounded bg-gray-100"
            />

            <button
              onClick={() => removerItemVenda(index)}
              className="bg-red-500 text-white p-2 rounded h-10 flex items-center justify-center"
              disabled={vendaAtual.itens.length <= 1}
            >
              <FaTrash />
            </button>
          </div>
        ))}

        <button
          onClick={adicionarItemVenda}
          className="bg-blue-500 text-white px-3 py-1 rounded mb-4 flex items-center gap-2"
        >
          <FaPlus /> Adicionar Item
        </button>

        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p className="font-bold">Total: R$ {totalVenda.toFixed(2)}</p>
        </div>

        <button
          onClick={finalizarVenda}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Finalizar Venda
        </button>

        {renderVoltarButton()}
      </div>
    );
  };

  const renderServicos = () => {
    const totalServico =
      servicos.reduce((sum, item) => sum + item.valor * item.quantidade, 0) +
      Number(maoDeObra);

    return (
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-4">Registro de Serviço</h2>

        <input
          type="text"
          placeholder="Cliente *"
          value={clienteServico}
          onChange={(e) => setClienteServico(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        {servicos.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-2 mb-4 items-end">
            <select
              value={item.itemSelecionado}
              onChange={(e) => {
                const produto = products.find((p) => p.nome === e.target.value);
                const novosServicos = [...servicos];
                novosServicos[index] = {
                  itemSelecionado: e.target.value,
                  valor: produto ? Number(produto.preco) : 0,
                  quantidade: item.quantidade,
                };
                setServicos(novosServicos);
              }}
              className="border p-2 rounded"
            >
              <option value="">Selecione um item</option>
              {products.map((produto) => (
                <option key={produto.nome} value={produto.nome}>
                  {produto.nome}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={item.valor}
              readOnly
              className="border p-2 rounded bg-gray-100"
            />

            <input
              type="number"
              min="1"
              value={item.quantidade}
              onChange={(e) => {
                const novosServicos = [...servicos];
                novosServicos[index].quantidade = Math.max(
                  1,
                  Number(e.target.value)
                );
                setServicos(novosServicos);
              }}
              className="border p-2 rounded"
            />

            <button
              onClick={() => removerItemServico(index)}
              className="bg-red-500 text-white p-2 rounded h-10 flex items-center justify-center"
              disabled={servicos.length <= 1}
            >
              <FaTrash />
            </button>
          </div>
        ))}

        <button
          onClick={adicionarItemServico}
          className="bg-blue-500 text-white px-3 py-1 rounded mb-6 flex items-center gap-2"
        >
          <FaPlus /> Adicionar Item
        </button>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-1">Mão de Obra *</label>
            <input
              type="number"
              min="0"
              value={maoDeObra}
              onChange={(e) => setMaoDeObra(e.target.value)}
              className="border p-2 rounded w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Total</label>
            <input
              type="text"
              value={`R$ ${totalServico.toFixed(2)}`}
              readOnly
              className="border p-2 rounded w-full bg-gray-100 font-bold"
            />
          </div>
        </div>

        <button
          onClick={salvarServico}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Salvar Serviço e Gerar Excel
        </button>

        {renderVoltarButton()}
      </div>
    );
  };

  const renderHistorico = () => (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-4">Histórico</h2>
      <div className="space-y-4">
        {vendas.length === 0 ? (
          <p className="text-gray-500">Nenhum registro encontrado</p>
        ) : (
          vendas.map((venda, index) => (
            <div key={index} className="border p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">
                    {venda.comprador || venda.cliente}
                  </p>
                  <p className="text-sm text-gray-600">{venda.data}</p>
                </div>
                <p className="font-bold text-lg">R$ {venda.total.toFixed(2)}</p>
              </div>

              <div className="mt-3">
                <p className="font-semibold">Itens:</p>
                <ul className="ml-4">
                  {venda.itens.map((item, i) => (
                    <li key={i} className="text-sm">
                      • {item.nome} ({item.quantidade}x) - R${" "}
                      {item.valor * item.quantidade}
                    </li>
                  ))}
                </ul>
              </div>

              {venda.maoDeObra && (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Mão de obra:</span> R${" "}
                  {venda.maoDeObra}
                </p>
              )}
            </div>
          ))
        )}
      </div>
      {renderVoltarButton()}
    </div>
  );

  const renderEstoque = () => (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-4">Controle de Estoque</h2>

      {/* Cabeçalho da tabela */}
      <div className="grid grid-cols-12 gap-2 mb-2 font-semibold border-b pb-2">
        <div className="col-span-5">Produto</div>
        <div className="col-span-3">Código</div>
        <div className="col-span-2 text-right">Estoque</div>
        <div className="col-span-2 text-right">Mínimo</div>
      </div>

      {/* Lista de produtos */}
      <div className="space-y-2">
        {products.map((produto, index) => (
          <div
            key={index}
            className={`grid grid-cols-12 gap-2 p-2 rounded ${
              produto.estoque < produto.estoqueMinimo
                ? "bg-red-50 border-l-4 border-red-500"
                : "hover:bg-gray-50"
            }`}
          >
            <div
              className="col-span-5 font-medium truncate"
              title={produto.nome}
            >
              {produto.nome}
            </div>
            <div
              className="col-span-3 text-gray-600 truncate"
              title={produto.codigo}
            >
              {produto.codigo || "---"}
            </div>
            <div
              className={`col-span-2 text-right font-bold ${
                produto.estoque < produto.estoqueMinimo
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {produto.estoque}
              {produto.estoque < produto.estoqueMinimo && (
                <span className="text-xs ml-1">↓</span>
              )}
            </div>
            <div className="col-span-2 text-right text-gray-600">
              {produto.estoqueMinimo}
            </div>
          </div>
        ))}
      </div>

      {renderVoltarButton()}
    </div>
  );
  // ========== RENDER PRINCIPAL ========== //
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {!loggedIn ? (
        renderLogin()
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">Smart Control Home</h1>

          {activePage === "home" && renderMenuButtons()}
          {activePage === "cadastro" && renderCadastro()}
          {activePage === "vendas" && renderVendas()}
          {activePage === "servicos" && renderServicos()}
          {activePage === "historico" && renderHistorico()}
          {activePage === "estoque" && renderEstoque()}
        </>
      )}
    </div>
  );
}
