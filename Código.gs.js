// ============================================================ 

// BIBLIOTECA ESCOLAR 

// Código.gs 

// ============================================================ 

 

// ID da planilha. 

// Se o projeto estiver vinculado à própria planilha, 

// não é necessário informar o ID. 

const ID_PLANILHA = ''; 

 

 

// ============================================================ 

// CONFIGURAÇÃO 

// ============================================================ 

 

function doGet() { 

  return HtmlService 

    .createTemplateFromFile('Index') 

    .evaluate() 

    .setTitle('Biblioteca Escolar') 

    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL); 

} 

 

 

// Inclui arquivos HTML dentro do Index.html. 

function include(nomeArquivo) { 

  return HtmlService 

    .createHtmlOutputFromFile(nomeArquivo) 

    .getContent(); 

} 

 

 

// Retorna a planilha. 

function getPlanilha_() { 

  if (ID_PLANILHA && ID_PLANILHA.trim() !== '') { 

    return SpreadsheetApp.openById(ID_PLANILHA); 

  } 

 

  return SpreadsheetApp.getActiveSpreadsheet(); 

} 

 

 

// Retorna uma aba existente. 

// IMPORTANTE: 

// Esta função NÃO cria abas. 

function getAba_(nome) { 

  const planilha = getPlanilha_(); 

  const aba = planilha.getSheetByName(nome); 

 

  if (!aba) { 

    throw new Error( 

      'A aba "' + nome + '" não existe na planilha.' 

    ); 

  } 

 

  return aba; 

} 

 

 

// ============================================================ 

// FUNÇÕES AUXILIARES 

// ============================================================ 

 

function obterCabecalhos_(aba) { 

  const ultimaColuna = aba.getLastColumn(); 

 

  if (ultimaColuna === 0) { 

    throw new Error( 

      'A aba "' + aba.getName() + '" não possui cabeçalhos.' 

    ); 

  } 

 

  return aba 

    .getRange(1, 1, 1, ultimaColuna) 

    .getValues()[0] 

    .map(function(cabecalho) { 

      return String(cabecalho).trim(); 

    }); 

} 

 

 

function encontrarColuna_(cabecalhos, nome) { 

  const indice = cabecalhos.indexOf(nome); 

 

  if (indice === -1) { 

    throw new Error( 

      'O campo "' + nome + '" não foi encontrado na aba.' 

    ); 

  } 

 

  return indice; 

} 

 

 

function lerRegistros_(nomeAba) { 

  const aba = getAba_(nomeAba); 

  const ultimaLinha = aba.getLastRow(); 

 

  if (ultimaLinha < 2) { 

    return []; 

  } 

 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const dados = aba 

    .getRange(2, 1, ultimaLinha - 1, cabecalhos.length) 

    .getValues(); 

 

  return dados.map(function(linha, indice) { 

    const objeto = { 

      _linha: indice + 2 

    }; 

 

    cabecalhos.forEach(function(cabecalho, coluna) { 

      objeto[cabecalho] = converterValor_(linha[coluna]); 

    }); 

 

    return objeto; 

  }); 

} 

 

 

function converterValor_(valor) { 

  if (valor instanceof Date) { 

    return Utilities.formatDate( 

      valor, 

      Session.getScriptTimeZone(), 

      'yyyy-MM-dd HH:mm:ss' 

    ); 

  } 

 

  return valor; 

} 

 

 

function numero_(valor) { 

  const numero = Number(valor); 

 

  if (isNaN(numero)) { 

    return 0; 

  } 

 

  return numero; 

} 

 

 

function proximoId_(nomeAba, campoId) { 

  const registros = lerRegistros_(nomeAba); 

 

  if (registros.length === 0) { 

    return 1; 

  } 

 

  const maior = registros.reduce(function(maximo, registro) { 

    const valor = numero_(registro[campoId]); 

 

    return valor > maximo ? valor : maximo; 

  }, 0); 

 

  return maior + 1; 

} 

 

 

function montarLinha_(cabecalhos, dados) { 

  return cabecalhos.map(function(cabecalho) { 

    return dados[cabecalho] !== undefined 

      ? dados[cabecalho] 

      : ''; 

  }); 

} 

 

 

function registrarAuditoria_(usuario, acao, tabela, idRegistro, descricao) { 

  try { 

    const aba = getAba_('AUDITORIA'); 

    const cabecalhos = obterCabecalhos_(aba); 

 

    const linha = { 

      ID_LOG: proximoId_('AUDITORIA', 'ID_LOG'), 

      ID_USUARIO: usuario ? usuario.id_usuario : '', 

      ACAO: acao, 

      TABELA: tabela, 

      ID_REGISTRO: idRegistro || '', 

      DATA_HORA: new Date(), 

      DESCRICAO: descricao || '' 

    }; 

 

    aba.appendRow( 

      montarLinha_(cabecalhos, linha) 

    ); 

 

  } catch (erro) { 

    console.log('Erro na auditoria: ' + erro.message); 

  } 

} 

 

 

// ============================================================ 

// LIVROS 

// ============================================================ 

 

function cadastrarLivro(token, livro) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  if (!livro.titulo || !livro.autor) { 

    throw new Error('Título e autor são obrigatórios.'); 

  } 

 

  const aba = getAba_('LIVRO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const livros = lerRegistros_('LIVRO'); 

 

  const codigo = String(livro.codigo || '').trim(); 

 

  if (codigo) { 

    const existeCodigo = livros.some(function(item) { 

      return String(item.CODIGO).trim() === codigo; 

    }); 

 

    if (existeCodigo) { 

      throw new Error('Já existe um livro com este código.'); 

    } 

  } 

 

  const isbn = String(livro.isbn || '').trim(); 

 

  if (isbn) { 

    const existeISBN = livros.some(function(item) { 

      return String(item.ISBN).trim() === isbn; 

    }); 

 

    if (existeISBN) { 

      throw new Error('Já existe um livro com este ISBN.'); 

    } 

  } 

 

  const quantidade = numero_(livro.quantidade); 

 

  if (quantidade < 0) { 

    throw new Error('A quantidade não pode ser negativa.'); 

  } 

 

  const registro = { 

    ID_LIVRO: proximoId_('LIVRO', 'ID_LIVRO'), 

    CODIGO: codigo, 

    ISBN: isbn, 

    TITULO: livro.titulo, 

    AUTOR: livro.autor, 

    EDITORA: livro.editora || '', 

    ANO: livro.ano || '', 

    ID_CATEGORIA: livro.id_categoria || '', 

    QUANTIDADE: quantidade, 

    DISPONIVEL: quantidade, 

    LOCALIZACAO: livro.localizacao || '', 

    ATIVO: true 

  }; 

 

  aba.appendRow( 

    montarLinha_(cabecalhos, registro) 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'CADASTRAR', 

    'LIVRO', 

    registro.ID_LIVRO, 

    'Livro cadastrado: ' + registro.TITULO 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Livro cadastrado com sucesso.' 

  }; 

} 

 

 

function listarLivros(token) { 

  exigirAutenticacao_(token); 

 

  return lerRegistros_('LIVRO'); 

} 

 

 

function buscarLivro(token, termo) { 

  exigirAutenticacao_(token); 

 

  const livros = lerRegistros_('LIVRO'); 

 

  termo = String(termo || '') 

    .toLowerCase() 

    .trim(); 

 

  if (!termo) { 

    return livros; 

  } 

 

  return livros.filter(function(livro) { 

    return [ 

      livro.CODIGO, 

      livro.ISBN, 

      livro.TITULO, 

      livro.AUTOR, 

      livro.EDITORA 

    ].some(function(valor) { 

      return String(valor || '') 

        .toLowerCase() 

        .includes(termo); 

    }); 

  }); 

} 

 

 

function atualizarLivro(token, livro) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const aba = getAba_('LIVRO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const livros = lerRegistros_('LIVRO'); 

 

  const registroAtual = livros.find(function(item) { 

    return Number(item.ID_LIVRO) === Number(livro.id_livro); 

  }); 

 

  if (!registroAtual) { 

    throw new Error('Livro não encontrado.'); 

  } 

 

  const quantidadeNova = numero_(livro.quantidade); 

 

  if (quantidadeNova < 0) { 

    throw new Error('A quantidade não pode ser negativa.'); 

  } 

 

  const quantidadeAntiga = numero_(registroAtual.QUANTIDADE); 

  const disponivelAntigo = numero_(registroAtual.DISPONIVEL); 

 

  const diferenca = quantidadeNova - quantidadeAntiga; 

  const disponivelNova = disponivelAntigo + diferenca; 

 

  if (disponivelNova < 0) { 

    throw new Error( 

      'A quantidade informada é menor que a quantidade de livros atualmente emprestada.' 

    ); 

  } 

 

  const registro = { 

    ID_LIVRO: registroAtual.ID_LIVRO, 

    CODIGO: livro.codigo || '', 

    ISBN: livro.isbn || '', 

    TITULO: livro.titulo, 

    AUTOR: livro.autor, 

    EDITORA: livro.editora || '', 

    ANO: livro.ano || '', 

    ID_CATEGORIA: livro.id_categoria || '', 

    QUANTIDADE: quantidadeNova, 

    DISPONIVEL: disponivelNova, 

    LOCALIZACAO: livro.localizacao || '', 

    ATIVO: livro.ativo !== false 

  }; 

 

  aba 

    .getRange( 

      registroAtual._linha, 

      1, 

      1, 

      cabecalhos.length 

    ) 

    .setValues([ 

      montarLinha_(cabecalhos, registro) 

    ]); 

 

  registrarAuditoria_( 

    usuario, 

    'ATUALIZAR', 

    'LIVRO', 

    registro.ID_LIVRO, 

    'Livro atualizado: ' + registro.TITULO 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Livro atualizado com sucesso.' 

  }; 

} 

 

 

function excluirLivro(token, idLivro) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const livros = lerRegistros_('LIVRO'); 

 

  const livro = livros.find(function(item) { 

    return Number(item.ID_LIVRO) === Number(idLivro); 

  }); 

 

  if (!livro) { 

    throw new Error('Livro não encontrado.'); 

  } 

 

  if (numero_(livro.QUANTIDADE) !== numero_(livro.DISPONIVEL)) { 

    throw new Error( 

      'Não é possível excluir um livro que possui exemplares emprestados.' 

    ); 

  } 

 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

 

  const possuiHistorico = emprestimos.some(function(item) { 

    return Number(item.ID_LIVRO) === Number(idLivro); 

  }); 

 

  if (possuiHistorico) { 

    // Em vez de apagar o histórico, inativa o livro. 

    const aba = getAba_('LIVRO'); 

    const cabecalhos = obterCabecalhos_(aba); 

    const colunaAtivo = encontrarColuna_(cabecalhos, 'ATIVO'); 

 

    aba 

      .getRange(livro._linha, colunaAtivo + 1) 

      .setValue(false); 

 

    registrarAuditoria_( 

      usuario, 

      'INATIVAR', 

      'LIVRO', 

      idLivro, 

      'Livro inativado devido ao histórico de empréstimos.' 

    ); 

 

    return { 

      sucesso: true, 

      mensagem: 'Livro inativado para preservar o histórico.' 

    }; 

  } 

 

  const aba = getAba_('LIVRO'); 

 

  aba.deleteRow(livro._linha); 

 

  registrarAuditoria_( 

    usuario, 

    'EXCLUIR', 

    'LIVRO', 

    idLivro, 

    'Livro excluído: ' + livro.TITULO 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Livro excluído com sucesso.' 

  }; 

} 

 

 

// ============================================================ 

// ALUNOS 

// ============================================================ 

 

function cadastrarAluno(token, aluno) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  if (!aluno.ra || !aluno.nome) { 

    throw new Error('RA e nome são obrigatórios.'); 

  } 

 

  const alunos = lerRegistros_('ALUNO'); 

 

  const raExiste = alunos.some(function(item) { 

    return String(item.RA).trim() === String(aluno.ra).trim(); 

  }); 

 

  if (raExiste) { 

    throw new Error('Já existe um aluno com este RA.'); 

  } 

 

  const aba = getAba_('ALUNO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const registro = { 

    ID_ALUNO: proximoId_('ALUNO', 'ID_ALUNO'), 

    RA: aluno.ra, 

    NOME: aluno.nome, 

    TURMA: aluno.turma || '', 

    SERIE: aluno.serie || '', 

    EMAIL: aluno.email || '', 

    TELEFONE: aluno.telefone || '', 

    ATIVO: true 

  }; 

 

  aba.appendRow( 

    montarLinha_(cabecalhos, registro) 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'CADASTRAR', 

    'ALUNO', 

    registro.ID_ALUNO, 

    'Aluno cadastrado: ' + registro.NOME 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Aluno cadastrado com sucesso.' 

  }; 

} 

 

 

function listarAlunos(token) { 

  exigirAutenticacao_(token); 

 

  return lerRegistros_('ALUNO'); 

} 

 

 

function atualizarAluno(token, aluno) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const aba = getAba_('ALUNO'); 

  const cabecalhos = obterCabecalhos_(aba); 

  const alunos = lerRegistros_('ALUNO'); 

 

  const registroAtual = alunos.find(function(item) { 

    return Number(item.ID_ALUNO) === Number(aluno.id_aluno); 

  }); 

 

  if (!registroAtual) { 

    throw new Error('Aluno não encontrado.'); 

  } 

 

  const registro = { 

    ID_ALUNO: registroAtual.ID_ALUNO, 

    RA: aluno.ra, 

    NOME: aluno.nome, 

    TURMA: aluno.turma || '', 

    SERIE: aluno.serie || '', 

    EMAIL: aluno.email || '', 

    TELEFONE: aluno.telefone || '', 

    ATIVO: aluno.ativo !== false 

  }; 

 

  aba 

    .getRange( 

      registroAtual._linha, 

      1, 

      1, 

      cabecalhos.length 

    ) 

    .setValues([ 

      montarLinha_(cabecalhos, registro) 

    ]); 

 

  registrarAuditoria_( 

    usuario, 

    'ATUALIZAR', 

    'ALUNO', 

    registro.ID_ALUNO, 

    'Aluno atualizado.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Aluno atualizado com sucesso.' 

  }; 

} 

 

 

function excluirAluno(token, idAluno) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const alunos = lerRegistros_('ALUNO'); 

 

  const aluno = alunos.find(function(item) { 

    return Number(item.ID_ALUNO) === Number(idAluno); 

  }); 

 

  if (!aluno) { 

    throw new Error('Aluno não encontrado.'); 

  } 

 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

 

  const possuiEmprestimo = emprestimos.some(function(item) { 

    return Number(item.ID_USUARIO) === Number(idAluno) && 

           String(item.TIPO_USUARIO) === 'ALUNO' && 

           String(item.STATUS) === 'ATIVO'; 

  }); 

 

  if (possuiEmprestimo) { 

    throw new Error( 

      'Não é possível excluir um aluno com empréstimo ativo.' 

    ); 

  } 

 

  const aba = getAba_('ALUNO'); 

 

  aba.deleteRow(aluno._linha); 

 

  registrarAuditoria_( 

    usuario, 

    'EXCLUIR', 

    'ALUNO', 

    idAluno, 

    'Aluno excluído.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Aluno excluído com sucesso.' 

  }; 

} 

 

 

// ============================================================ 

// PROFESSORES 

// ============================================================ 

 

function cadastrarProfessor(token, professor) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  if (!professor.nome) { 

    throw new Error('O nome é obrigatório.'); 

  } 

 

  const aba = getAba_('PROFESSOR'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const registro = { 

    ID_PROFESSOR: proximoId_('PROFESSOR', 'ID_PROFESSOR'), 

    NOME: professor.nome, 

    EMAIL: professor.email || '', 

    TELEFONE: professor.telefone || '', 

    DISCIPLINA: professor.disciplina || '', 

    ATIVO: true 

  }; 

 

  aba.appendRow( 

    montarLinha_(cabecalhos, registro) 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'CADASTRAR', 

    'PROFESSOR', 

    registro.ID_PROFESSOR, 

    'Professor cadastrado: ' + registro.NOME 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Professor cadastrado com sucesso.' 

  }; 

} 

 

 

function listarProfessores(token) { 

  exigirAutenticacao_(token); 

 

  return lerRegistros_('PROFESSOR'); 

} 

 

 

function atualizarProfessor(token, professor) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const aba = getAba_('PROFESSOR'); 

  const cabecalhos = obterCabecalhos_(aba); 

  const professores = lerRegistros_('PROFESSOR'); 

 

  const registroAtual = professores.find(function(item) { 

    return Number(item.ID_PROFESSOR) === Number(professor.id_professor); 

  }); 

 

  if (!registroAtual) { 

    throw new Error('Professor não encontrado.'); 

  } 

 

  const registro = { 

    ID_PROFESSOR: registroAtual.ID_PROFESSOR, 

    NOME: professor.nome, 

    EMAIL: professor.email || '', 

    TELEFONE: professor.telefone || '', 

    DISCIPLINA: professor.disciplina || '', 

    ATIVO: professor.ativo !== false 

  }; 

 

  aba 

    .getRange( 

      registroAtual._linha, 

      1, 

      1, 

      cabecalhos.length 

    ) 

    .setValues([ 

      montarLinha_(cabecalhos, registro) 

    ]); 

 

  registrarAuditoria_( 

    usuario, 

    'ATUALIZAR', 

    'PROFESSOR', 

    registro.ID_PROFESSOR, 

    'Professor atualizado.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Professor atualizado com sucesso.' 

  }; 

} 

 

 

function excluirProfessor(token, idProfessor) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const professores = lerRegistros_('PROFESSOR'); 

 

  const professor = professores.find(function(item) { 

    return Number(item.ID_PROFESSOR) === Number(idProfessor); 

  }); 

 

  if (!professor) { 

    throw new Error('Professor não encontrado.'); 

  } 

 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

 

  const possuiEmprestimo = emprestimos.some(function(item) { 

    return Number(item.ID_USUARIO) === Number(idProfessor) && 

           String(item.TIPO_USUARIO) === 'PROFESSOR' && 

           String(item.STATUS) === 'ATIVO'; 

  }); 

 

  if (possuiEmprestimo) { 

    throw new Error( 

      'Não é possível excluir um professor com empréstimo ativo.' 

    ); 

  } 

 

  const aba = getAba_('PROFESSOR'); 

 

  aba.deleteRow(professor._linha); 

 

  registrarAuditoria_( 

    usuario, 

    'EXCLUIR', 

    'PROFESSOR', 

    idProfessor, 

    'Professor excluído.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Professor excluído com sucesso.' 

  }; 

} 

 

 

// ============================================================ 

// CATEGORIAS 

// ============================================================ 

 

function cadastrarCategoria(token, categoria) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  if (!categoria.nome) { 

    throw new Error('O nome da categoria é obrigatório.'); 

  } 

 

  const aba = getAba_('CATEGORIA'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const registro = { 

    ID_CATEGORIA: proximoId_( 

      'CATEGORIA', 

      'ID_CATEGORIA' 

    ), 

    NOME: categoria.nome, 

    DESCRICAO: categoria.descricao || '', 

    ATIVO: true 

  }; 

 

  aba.appendRow( 

    montarLinha_(cabecalhos, registro) 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'CADASTRAR', 

    'CATEGORIA', 

    registro.ID_CATEGORIA, 

    'Categoria cadastrada.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Categoria cadastrada com sucesso.' 

  }; 

} 

 

 

function listarCategorias(token) { 

  exigirAutenticacao_(token); 

 

  return lerRegistros_('CATEGORIA'); 

} 

 

 

// ============================================================ 

// EMPRÉSTIMOS 

// ============================================================ 

 

function realizarEmprestimo(token, dados) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  if (!dados.id_livro) { 

    throw new Error('Informe o livro.'); 

  } 

 

  if (!dados.tipo_usuario || !dados.id_usuario) { 

    throw new Error('Informe o usuário.'); 

  } 

 

  const livros = lerRegistros_('LIVRO'); 

 

  const livro = livros.find(function(item) { 

    return Number(item.ID_LIVRO) === Number(dados.id_livro); 

  }); 

 

  if (!livro) { 

    throw new Error('Livro não encontrado.'); 

  } 

 

  if (livro.ATIVO === false || String(livro.ATIVO).toUpperCase() === 'FALSE') { 

    throw new Error('Este livro está inativo.'); 

  } 

 

  if (numero_(livro.DISPONIVEL) <= 0) { 

    throw new Error('Este livro não está disponível.'); 

  } 

 

  const tipo = String(dados.tipo_usuario).toUpperCase(); 

 

  if (tipo !== 'ALUNO' && tipo !== 'PROFESSOR') { 

    throw new Error('Tipo de usuário inválido.'); 

  } 

 

  const abaUsuario = getAba_(tipo); 

 

  const usuarios = lerRegistros_(tipo); 

 

  const campoId = tipo === 'ALUNO' 

    ? 'ID_ALUNO' 

    : 'ID_PROFESSOR'; 

 

  const usuarioBiblioteca = usuarios.find(function(item) { 

    return Number(item[campoId]) === Number(dados.id_usuario); 

  }); 

 

  if (!usuarioBiblioteca) { 

    throw new Error('Usuário não encontrado.'); 

  } 

 

  if ( 

    usuarioBiblioteca.ATIVO === false || 

    String(usuarioBiblioteca.ATIVO).toUpperCase() === 'FALSE' 

  ) { 

    throw new Error('O usuário está inativo.'); 

  } 

 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

 

  const emprestimoAtivo = emprestimos.some(function(item) { 

    return Number(item.ID_USUARIO) === Number(dados.id_usuario) && 

           String(item.TIPO_USUARIO) === tipo && 

           String(item.STATUS) === 'ATIVO'; 

  }); 

 

  if (emprestimoAtivo) { 

    throw new Error( 

      'Este usuário já possui um empréstimo ativo.' 

    ); 

  } 

 

  const dataEmprestimo = new Date(); 

 

  const dataPrevista = dados.data_prevista 

    ? new Date(dados.data_prevista) 

    : new Date(); 

 

  if (!dados.data_prevista) { 

    dataPrevista.setDate( 

      dataPrevista.getDate() + 7 

    ); 

  } 

 

  const aba = getAba_('EMPRESTIMO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const registro = { 

    ID_EMPRESTIMO: proximoId_( 

      'EMPRESTIMO', 

      'ID_EMPRESTIMO' 

    ), 

    ID_LIVRO: livro.ID_LIVRO, 

    TIPO_USUARIO: tipo, 

    ID_USUARIO: dados.id_usuario, 

    DATA_EMPRESTIMO: dataEmprestimo, 

    DATA_PREVISTA: dataPrevista, 

    DATA_DEVOLUCAO: '', 

    STATUS: 'ATIVO', 

    OBSERVACAO: dados.observacao || '' 

  }; 

 

  aba.appendRow( 

    montarLinha_(cabecalhos, registro) 

  ); 

 

  atualizarDisponibilidadeLivro_( 

    livro.ID_LIVRO, 

    -1 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'EMPRESTAR', 

    'EMPRESTIMO', 

    registro.ID_EMPRESTIMO, 

    'Livro emprestado: ' + livro.TITULO 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Empréstimo realizado com sucesso.' 

  }; 

} 

 

 

function listarEmprestimos(token) { 

  exigirAutenticacao_(token); 

 

  atualizarEmprestimosAtrasados_(); 

 

  return lerRegistros_('EMPRESTIMO'); 

} 

 

 

function registrarDevolucao(token, idEmprestimo) { 

  const usuario = exigirAutenticacao_(token); 

 

  verificarPermissao_(usuario, [ 

    'ADMIN', 

    'BIBLIOTECARIO' 

  ]); 

 

  const aba = getAba_('EMPRESTIMO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

 

  const emprestimo = emprestimos.find(function(item) { 

    return Number(item.ID_EMPRESTIMO) === Number(idEmprestimo); 

  }); 

 

  if (!emprestimo) { 

    throw new Error('Empréstimo não encontrado.'); 

  } 

 

  if (String(emprestimo.STATUS) === 'DEVOLVIDO') { 

    throw new Error('Este empréstimo já foi devolvido.'); 

  } 

 

  const colunaDataDevolucao = 

    encontrarColuna_(cabecalhos, 'DATA_DEVOLUCAO'); 

 

  const colunaStatus = 

    encontrarColuna_(cabecalhos, 'STATUS'); 

 

  aba 

    .getRange( 

      emprestimo._linha, 

      colunaDataDevolucao + 1 

    ) 

    .setValue(new Date()); 

 

  aba 

    .getRange( 

      emprestimo._linha, 

      colunaStatus + 1 

    ) 

    .setValue('DEVOLVIDO'); 

 

  atualizarDisponibilidadeLivro_( 

    emprestimo.ID_LIVRO, 

    1 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'DEVOLVER', 

    'EMPRESTIMO', 

    idEmprestimo, 

    'Livro devolvido.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Devolução registrada com sucesso.' 

  }; 

} 

 

 

function atualizarEmprestimosAtrasados_() { 

  const aba = getAba_('EMPRESTIMO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const colunaStatus = 

    encontrarColuna_(cabecalhos, 'STATUS'); 

 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

 

  const agora = new Date(); 

 

  emprestimos.forEach(function(emprestimo) { 

 

    if (String(emprestimo.STATUS) !== 'ATIVO') { 

      return; 

    } 

 

    if (!emprestimo.DATA_PREVISTA) { 

      return; 

    } 

 

    const dataPrevista = 

      new Date(emprestimo.DATA_PREVISTA); 

 

    if (dataPrevista < agora) { 

      aba 

        .getRange( 

          emprestimo._linha, 

          colunaStatus + 1 

        ) 

        .setValue('ATRASADO'); 

    } 

  }); 

} 

 

 

function atualizarDisponibilidadeLivro_(idLivro, quantidade) { 

  const aba = getAba_('LIVRO'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const livros = lerRegistros_('LIVRO'); 

 

  const livro = livros.find(function(item) { 

    return Number(item.ID_LIVRO) === Number(idLivro); 

  }); 

 

  if (!livro) { 

    throw new Error('Livro não encontrado.'); 

  } 

 

  const novaQuantidade = 

    numero_(livro.DISPONIVEL) + quantidade; 

 

  if (novaQuantidade < 0) { 

    throw new Error( 

      'A quantidade disponível não pode ser negativa.' 

    ); 

  } 

 

  if (novaQuantidade > numero_(livro.QUANTIDADE)) { 

    throw new Error( 

      'A quantidade disponível não pode ser maior que o estoque.' 

    ); 

  } 

 

  const colunaDisponivel = 

    encontrarColuna_(cabecalhos, 'DISPONIVEL'); 

 

  aba 

    .getRange( 

      livro._linha, 

      colunaDisponivel + 1 

    ) 

    .setValue(novaQuantidade); 

} 

 

 

// ============================================================ 

// RESERVAS 

// ============================================================ 

 

function realizarReserva(token, dados) { 

  const usuario = exigirAutenticacao_(token); 

 

  if (!dados.id_livro) { 

    throw new Error('Informe o livro.'); 

  } 

 

  if (!dados.tipo_usuario || !dados.id_usuario) { 

    throw new Error('Informe o usuário.'); 

  } 

 

  const tipo = 

    String(dados.tipo_usuario).toUpperCase(); 

 

  if (tipo !== 'ALUNO' && tipo !== 'PROFESSOR') { 

    throw new Error('Tipo de usuário inválido.'); 

  } 

 

  const livros = lerRegistros_('LIVRO'); 

 

  const livro = livros.find(function(item) { 

    return Number(item.ID_LIVRO) === Number(dados.id_livro); 

  }); 

 

  if (!livro) { 

    throw new Error('Livro não encontrado.'); 

  } 

 

  if (numero_(livro.DISPONIVEL) > 0) { 

    throw new Error( 

      'O livro está disponível. Não é necessário realizar uma reserva.' 

    ); 

  } 

 

  const reservas = lerRegistros_('RESERVA'); 

 

  const reservaExistente = reservas.some(function(item) { 

    return Number(item.ID_LIVRO) === Number(dados.id_livro) && 

           Number(item.ID_USUARIO) === Number(dados.id_usuario) && 

           String(item.TIPO_USUARIO) === tipo && 

           String(item.STATUS) === 'ATIVA'; 

  }); 

 

  if (reservaExistente) { 

    throw new Error( 

      'Este usuário já possui uma reserva ativa para este livro.' 

    ); 

  } 

 

  const aba = getAba_('RESERVA'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const registro = { 

    ID_RESERVA: proximoId_( 

      'RESERVA', 

      'ID_RESERVA' 

    ), 

    ID_LIVRO: dados.id_livro, 

    TIPO_USUARIO: tipo, 

    ID_USUARIO: dados.id_usuario, 

    DATA_RESERVA: new Date(), 

    DATA_EXPIRACAO: '', 

    STATUS: 'ATIVA' 

  }; 

 

  aba.appendRow( 

    montarLinha_(cabecalhos, registro) 

  ); 

 

  registrarAuditoria_( 

    usuario, 

    'RESERVAR', 

    'RESERVA', 

    registro.ID_RESERVA, 

    'Reserva realizada para o livro: ' + livro.TITULO 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Reserva realizada com sucesso.' 

  }; 

} 

 

 

function listarReservas(token) { 

  exigirAutenticacao_(token); 

 

  return lerRegistros_('RESERVA'); 

} 

 

 

function cancelarReserva(token, idReserva) { 

  const usuario = exigirAutenticacao_(token); 

 

  const aba = getAba_('RESERVA'); 

  const cabecalhos = obterCabecalhos_(aba); 

 

  const reservas = lerRegistros_('RESERVA'); 

 

  const reserva = reservas.find(function(item) { 

    return Number(item.ID_RESERVA) === Number(idReserva); 

  }); 

 

  if (!reserva) { 

    throw new Error('Reserva não encontrada.'); 

  } 

 

  const colunaStatus = 

    encontrarColuna_(cabecalhos, 'STATUS'); 

 

  aba 

    .getRange( 

      reserva._linha, 

      colunaStatus + 1 

    ) 

    .setValue('CANCELADA'); 

 

  registrarAuditoria_( 

    usuario, 

    'CANCELAR', 

    'RESERVA', 

    idReserva, 

    'Reserva cancelada.' 

  ); 

 

  return { 

    sucesso: true, 

    mensagem: 'Reserva cancelada com sucesso.' 

  }; 

} 

 

 

// ============================================================ 

// DASHBOARD 

// ============================================================ 

 

function obterDashboard(token) { 

  exigirAutenticacao_(token); 

 

  atualizarEmprestimosAtrasados_(); 

 

  const livros = lerRegistros_('LIVRO'); 

  const alunos = lerRegistros_('ALUNO'); 

  const professores = lerRegistros_('PROFESSOR'); 

  const emprestimos = lerRegistros_('EMPRESTIMO'); 

  const reservas = lerRegistros_('RESERVA'); 

 

  const livrosAtivos = livros.filter(function(item) { 

    return item.ATIVO !== false && 

           String(item.ATIVO).toUpperCase() !== 'FALSE'; 

  }); 

 

  return { 

    totalLivros: livrosAtivos.reduce(function(total, livro) { 

      return total + numero_(livro.QUANTIDADE); 

    }, 0), 

 

    livrosDisponiveis: livrosAtivos.reduce(function(total, livro) { 

      return total + numero_(livro.DISPONIVEL); 

    }, 0), 

 

    livrosEmprestados: livrosAtivos.reduce(function(total, livro) { 

      return total + 

        numero_(livro.QUANTIDADE) - 

        numero_(livro.DISPONIVEL); 

    }, 0), 

 

    totalAlunos: alunos.filter(function(item) { 

      return item.ATIVO !== false && 

        String(item.ATIVO).toUpperCase() !== 'FALSE'; 

    }).length, 

 

    totalProfessores: professores.filter(function(item) { 

      return item.ATIVO !== false && 

        String(item.ATIVO).toUpperCase() !== 'FALSE'; 

    }).length, 

 

    emprestimosAtivos: emprestimos.filter(function(item) { 

      return String(item.STATUS) === 'ATIVO'; 

    }).length, 

 

    emprestimosAtrasados: emprestimos.filter(function(item) { 

      return String(item.STATUS) === 'ATRASADO'; 

    }).length, 

 

    reservasAtivas: reservas.filter(function(item) { 

      return String(item.STATUS) === 'ATIVA'; 

    }).length 

  }; 

} 
