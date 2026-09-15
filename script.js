<script>

// ============================================================
// ESTADO DA APLICAÇÃO
// ============================================================

let token = sessionStorage.getItem('biblioteca_token') || '';

let usuarioLogado = null;

let livrosCache = [];
let alunosCache = [];
let professoresCache = [];
let categoriasCache = [];


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  configurarEventos();

  atualizarData();

  if (token) {

    google.script.run
      .withSuccessHandler(function(usuario) {

        usuarioLogado = usuario;

        mostrarSistema();

      })
      .withFailureHandler(function() {

        sessionStorage.removeItem('biblioteca_token');

        token = '';

        mostrarLogin();

      })
      .validarSessao(token);

  } else {

    mostrarLogin();

  }

});


// ============================================================
// EVENTOS
// ============================================================

function configurarEventos() {

  document
    .getElementById('formLogin')
    .addEventListener(
      'submit',
      fazerLogin
    );


  document
    .getElementById('formLivro')
    .addEventListener(
      'submit',
      salvarLivro
    );


  document
    .getElementById('formAluno')
    .addEventListener(
      'submit',
      salvarAluno
    );


  document
    .getElementById('formProfessor')
    .addEventListener(
      'submit',
      salvarProfessor
    );


  document
    .getElementById('formEmprestimo')
    .addEventListener(
      'submit',
      salvarEmprestimo
    );


  document
    .getElementById('emprestimoTipo')
    .addEventListener(
      'change',
      carregarUsuariosEmprestimo
    );


  document
    .getElementById('pesquisaLivro')
    .addEventListener(
      'input',
      pesquisarLivros
    );


  document
    .getElementById('btnLogout')
    .addEventListener(
      'click',
      fazerLogout
    );


  document
    .querySelectorAll('.menu-item[data-tela]')
    .forEach(function(botao) {

      botao.addEventListener(
        'click',
        function() {

          abrirTela(
            this.dataset.tela
          );

        }
      );

    });

}


// ============================================================
// LOGIN
// ============================================================

function fazerLogin(event) {

  event.preventDefault();

  const email =
    document.getElementById('loginEmail').value;

  const senha =
    document.getElementById('loginSenha').value;

  mostrarLoginMensagem(
    'Entrando...',
    ''
  );

  google.script.run

    .withSuccessHandler(function(resposta) {

      token = resposta.token;

      usuarioLogado = resposta.usuario;

      sessionStorage.setItem(
        'biblioteca_token',
        token
      );

      mostrarSistema();

    })

    .withFailureHandler(function(erro) {

      mostrarLoginMensagem(
        erro.message,
        'erro'
      );

    })

    .login(
      email,
      senha
    );
}


function mostrarLoginMensagem(texto, tipo) {

  const elemento =
    document.getElementById('loginMensagem');

  elemento.textContent = texto;

  elemento.className =
    'mensagem ' + tipo;
}


function mostrarLogin() {

  document
    .getElementById('telaLogin')
    .classList.remove('hidden');

  document
    .getElementById('sistema')
    .classList.add('hidden');

}


function mostrarSistema() {

  document
    .getElementById('telaLogin')
    .classList.add('hidden');

  document
    .getElementById('sistema')
    .classList.remove('hidden');

  if (usuarioLogado) {

    document.getElementById(
      'nomeUsuario'
    ).textContent =
      usuarioLogado.nome;

    document.getElementById(
      'perfilUsuario'
    ).textContent =
      usuarioLogado.perfil;

  }

  carregarDashboard();

  carregarLivros();

  carregarAlunos();

  carregarProfessores();

  carregarCategorias();

}


function fazerLogout() {

  google.script.run
    .withSuccessHandler(function() {

      sessionStorage.removeItem(
        'biblioteca_token'
      );

      token = '';

      usuarioLogado = null;

      mostrarLogin();

    })
    .logout(token);

}


// ============================================================
// NAVEGAÇÃO
// ============================================================

function abrirTela(nomeTela) {

  document
    .querySelectorAll('.tela')
    .forEach(function(tela) {

      tela.classList.add('hidden');

    });


  const tela =
    document.getElementById(nomeTela);

  if (tela) {
    tela.classList.remove('hidden');
  }


  document
    .querySelectorAll('.menu-item[data-tela]')
    .forEach(function(botao) {

      botao.classList.remove('active');

      if (
        botao.dataset.tela === nomeTela
      ) {
        botao.classList.add('active');
      }

    });


  const titulos = {
    dashboard: 'Dashboard',
    livros: 'Livros',
    alunos: 'Alunos',
    professores: 'Professores',
    emprestimos: 'Empréstimos',
    reservas: 'Reservas'
  };

  document.getElementById(
    'tituloPagina'
  ).textContent =
    titulos[nomeTela] || 'Biblioteca';


  if (nomeTela === 'dashboard') {
    carregarDashboard();
  }

  if (nomeTela === 'livros') {
    carregarLivros();
  }

  if (nomeTela === 'alunos') {
    carregarAlunos();
  }

  if (nomeTela === 'professores') {
    carregarProfessores();
  }

  if (nomeTela === 'emprestimos') {
    carregarEmprestimos();
  }

  if (nomeTela === 'reservas') {
    carregarReservas();
  }

}


// ============================================================
// DASHBOARD
// ============================================================

function carregarDashboard() {

  google.script.run

    .withSuccessHandler(function(dados) {

      document.getElementById(
        'totalLivros'
      ).textContent =
        dados.totalLivros;

      document.getElementById(
        'livrosDisponiveis'
      ).textContent =
        dados.livrosDisponiveis;

      document.getElementById(
        'livrosEmprestados'
      ).textContent =
        dados.livrosEmprestados;

      document.getElementById(
        'emprestimosAtrasados'
      ).textContent =
        dados.emprestimosAtrasados;

      document.getElementById(
        'totalAlunos'
      ).textContent =
        dados.totalAlunos;

      document.getElementById(
        'totalProfessores'
      ).textContent =
        dados.totalProfessores;

      document.getElementById(
        'emprestimosAtivos'
      ).textContent =
        dados.emprestimosAtivos;

      document.getElementById(
        'reservasAtivas'
      ).textContent =
        dados.reservasAtivas;

    })

    .withFailureHandler(tratarErro)

    .obterDashboard(token);

}


// ============================================================
// LIVROS
// ============================================================

function carregarLivros() {

  google.script.run

    .withSuccessHandler(function(livros) {

      livrosCache = livros;

      renderizarLivros(livros);

    })

    .withFailureHandler(tratarErro)

    .listarLivros(token);

}


function renderizarLivros(livros) {

  const tbody =
    document.getElementById(
      'tabelaLivros'
    );

  tbody.innerHTML = '';

  if (!livros.length) {

    tbody.innerHTML =
      '<tr><td colspan="8">Nenhum livro encontrado.</td></tr>';

    return;
  }


  livros.forEach(function(livro) {

    const disponivel =
      Number(livro.DISPONIVEL || 0);

    const ativo =
      livro.ATIVO !== false &&
      String(livro.ATIVO).toUpperCase() !== 'FALSE';

    const status =
      disponivel > 0 && ativo
        ? '<span class="status status-disponivel">Disponível</span>'
        : '<span class="status status-indisponivel">Indisponível</span>';

    const tr =
      document.createElement('tr');

    tr.innerHTML = `

      <td>${escapeHTML(livro.CODIGO || '-')}</td>

      <td>
        <strong>
          ${escapeHTML(livro.TITULO || '')}
        </strong>
      </td>

      <td>
        ${escapeHTML(livro.AUTOR || '')}
      </td>

      <td>
        ${escapeHTML(
          buscarNomeCategoria(
            livro.ID_CATEGORIA
          )
        )}
      </td>

      <td>
        ${livro.QUANTIDADE || 0}
      </td>

      <td>
        ${livro.DISPONIVEL || 0}
      </td>

      <td>
        ${status}
      </td>

      <td>

        <div class="actions">

          <button
            class="btn btn-small btn-secondary"
            onclick="editarLivro(${livro.ID_LIVRO})"
          >
            Editar
          </button>

          <button
            class="btn btn-small btn-danger"
            onclick="excluirLivro(${livro.ID_LIVRO})"
          >
            Excluir
          </button>

        </div>

      </td>

    `;

    tbody.appendChild(tr);

  });

}


function pesquisarLivros() {

  const termo =
    document.getElementById(
      'pesquisaLivro'
    ).value;

  google.script.run

    .withSuccessHandler(function(livros) {

      renderizarLivros(livros);

    })

    .withFailureHandler(tratarErro)

    .buscarLivro(
      token,
      termo
    );

}


function abrirModalLivro(livro) {

  document
    .getElementById('formLivro')
    .reset();

  document.getElementById(
    'livroId'
  ).value = '';

  document.getElementById(
    'tituloModalLivro'
  ).textContent = 'Novo livro';


  if (livro) {

    document.getElementById(
      'tituloModalLivro'
    ).textContent = 'Editar livro';

    document.getElementById(
      'livroId'
    ).value = livro.ID_LIVRO;

    document.getElementById(
      'livroCodigo'
    ).value = livro.CODIGO || '';

    document.getElementById(
      'livroISBN'
    ).value = livro.ISBN || '';

    document.getElementById(
      'livroTitulo'
    ).value = livro.TITULO || '';

    document.getElementById(
      'livroAutor'
    ).value = livro.AUTOR || '';

    document.getElementById(
      'livroEditora'
    ).value = livro.EDITORA || '';

    document.getElementById(
      'livroAno'
    ).value = livro.ANO || '';

    document.getElementById(
      'livroCategoria'
    ).value = livro.ID_CATEGORIA || '';

    document.getElementById(
      'livroQuantidade'
    ).value = livro.QUANTIDADE || 0;

    document.getElementById(
      'livroLocalizacao'
    ).value = livro.LOCALIZACAO || '';

  }

  document
    .getElementById('modalLivro')
    .classList.remove('hidden');

}


function salvarLivro(event) {

  event.preventDefault();

  const id =
    document.getElementById(
      'livroId'
    ).value;

  const livro = {

    id_livro: id,

    codigo:
      document.getElementById(
        'livroCodigo'
      ).value,

    isbn:
      document.getElementById(
        'livroISBN'
      ).value,

    titulo:
      document.getElementById(
        'livroTitulo'
      ).value,

    autor:
      document.getElementById(
        'livroAutor'
      ).value,

    editora:
      document.getElementById(
        'livroEditora'
      ).value,

    ano:
      document.getElementById(
        'livroAno'
      ).value,

    id_categoria:
      document.getElementById(
        'livroCategoria'
      ).value,

    quantidade:
      document.getElementById(
        'livroQuantidade'
      ).value,

    localizacao:
      document.getElementById(
        'livroLocalizacao'
      ).value

  };


  const funcao = id
    ? 'atualizarLivro'
    : 'cadastrarLivro';


  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      fecharModal('modalLivro');

      carregarLivros();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    [funcao](
      token,
      livro
    );

}


function editarLivro(id) {

  const livro =
    livrosCache.find(function(item) {

      return Number(item.ID_LIVRO) ===
        Number(id);

    });

  if (livro) {
    abrirModalLivro(livro);
  }

}


function excluirLivro(id) {

  if (!confirm(
    'Deseja realmente excluir este livro?'
  )) {
    return;
  }

  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      carregarLivros();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    .excluirLivro(
      token,
      id
    );

}


// ============================================================
// CATEGORIAS
// ============================================================

function carregarCategorias() {

  google.script.run

    .withSuccessHandler(function(categorias) {

      categoriasCache = categorias;

      const select =
        document.getElementById(
          'livroCategoria'
        );

      select.innerHTML =
        '<option value="">Selecione</option>';

      categorias.forEach(function(categoria) {

        const option =
          document.createElement('option');

        option.value =
          categoria.ID_CATEGORIA;

        option.textContent =
          categoria.NOME;

        select.appendChild(option);

      });

    })

    .withFailureHandler(tratarErro)

    .listarCategorias(token);

}


function buscarNomeCategoria(id) {

  const categoria =
    categoriasCache.find(function(item) {

      return Number(item.ID_CATEGORIA) ===
        Number(id);

    });

  return categoria
    ? categoria.NOME
    : '-';
}


// ============================================================
// ALUNOS
// ============================================================

function carregarAlunos() {

  google.script.run

    .withSuccessHandler(function(alunos) {

      alunosCache = alunos;

      const tbody =
        document.getElementById(
          'tabelaAlunos'
        );

      tbody.innerHTML = '';

      if (!alunos.length) {

        tbody.innerHTML =
          '<tr><td colspan="7">Nenhum aluno cadastrado.</td></tr>';

        return;
      }


      alunos.forEach(function(aluno) {

        const ativo =
          aluno.ATIVO !== false &&
          String(aluno.ATIVO).toUpperCase() !== 'FALSE';

        const tr =
          document.createElement('tr');

        tr.innerHTML = `

          <td>${escapeHTML(aluno.RA || '')}</td>

          <td>
            <strong>
              ${escapeHTML(aluno.NOME || '')}
            </strong>
          </td>

          <td>${escapeHTML(aluno.TURMA || '-')}</td>

          <td>${escapeHTML(aluno.SERIE || '-')}</td>

          <td>${escapeHTML(aluno.EMAIL || '-')}</td>

          <td>
            ${
              ativo
                ? '<span class="status status-disponivel">Ativo</span>'
                : '<span class="status status-indisponivel">Inativo</span>'
            }
          </td>

          <td>

            <div class="actions">

              <button
                class="btn btn-small btn-secondary"
                onclick="editarAluno(${aluno.ID_ALUNO})"
              >
                Editar
              </button>

              <button
                class="btn btn-small btn-danger"
                onclick="excluirAluno(${aluno.ID_ALUNO})"
              >
                Excluir
              </button>

            </div>

          </td>

        `;

        tbody.appendChild(tr);

      });

    })

    .withFailureHandler(tratarErro)

    .listarAlunos(token);

}


function abrirModalAluno(aluno) {

  document
    .getElementById('formAluno')
    .reset();

  document.getElementById(
    'alunoId'
  ).value = '';

  if (aluno) {

    document.getElementById(
      'alunoId'
    ).value = aluno.ID_ALUNO;

    document.getElementById(
      'alunoRA'
    ).value = aluno.RA || '';

    document.getElementById(
      'alunoNome'
    ).value = aluno.NOME || '';

    document.getElementById(
      'alunoTurma'
    ).value = aluno.TURMA || '';

    document.getElementById(
      'alunoSerie'
    ).value = aluno.SERIE || '';

    document.getElementById(
      'alunoEmail'
    ).value = aluno.EMAIL || '';

    document.getElementById(
      'alunoTelefone'
    ).value = aluno.TELEFONE || '';

  }

  document
    .getElementById('modalAluno')
    .classList.remove('hidden');

}


function salvarAluno(event) {

  event.preventDefault();

  const id =
    document.getElementById(
      'alunoId'
    ).value;

  const aluno = {

    id_aluno: id,

    ra:
      document.getElementById(
        'alunoRA'
      ).value,

    nome:
      document.getElementById(
        'alunoNome'
      ).value,

    turma:
      document.getElementById(
        'alunoTurma'
      ).value,

    serie:
      document.getElementById(
        'alunoSerie'
      ).value,

    email:
      document.getElementById(
        'alunoEmail'
      ).value,

    telefone:
      document.getElementById(
        'alunoTelefone'
      ).value

  };


  const funcao = id
    ? 'atualizarAluno'
    : 'cadastrarAluno';


  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      fecharModal('modalAluno');

      carregarAlunos();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    [funcao](
      token,
      aluno
    );

}


function editarAluno(id) {

  const aluno =
    alunosCache.find(function(item) {

      return Number(item.ID_ALUNO) ===
        Number(id);

    });

  if (aluno) {
    abrirModalAluno(aluno);
  }

}


function excluirAluno(id) {

  if (!confirm(
    'Deseja excluir este aluno?'
  )) {
    return;
  }

  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      carregarAlunos();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    .excluirAluno(
      token,
      id
    );

}


// ============================================================
// PROFESSORES
// ============================================================

function carregarProfessores() {

  google.script.run

    .withSuccessHandler(function(professores) {

      professoresCache = professores;

      const tbody =
        document.getElementById(
          'tabelaProfessores'
        );

      tbody.innerHTML = '';

      if (!professores.length) {

        tbody.innerHTML =
          '<tr><td colspan="6">Nenhum professor cadastrado.</td></tr>';

        return;
      }


      professores.forEach(function(professor) {

        const ativo =
          professor.ATIVO !== false &&
          String(professor.ATIVO).toUpperCase() !== 'FALSE';

        const tr =
          document.createElement('tr');

        tr.innerHTML = `

          <td>
            <strong>
              ${escapeHTML(professor.NOME || '')}
            </strong>
          </td>

          <td>
            ${escapeHTML(professor.EMAIL || '-')}
          </td>

          <td>
            ${escapeHTML(professor.TELEFONE || '-')}
          </td>

          <td>
            ${escapeHTML(professor.DISCIPLINA || '-')}
          </td>

          <td>
            ${
              ativo
                ? '<span class="status status-disponivel">Ativo</span>'
                : '<span class="status status-indisponivel">Inativo</span>'
            }
          </td>

          <td>

            <div class="actions">

              <button
                class="btn btn-small btn-secondary"
                onclick="editarProfessor(${professor.ID_PROFESSOR})"
              >
                Editar
              </button>

              <button
                class="btn btn-small btn-danger"
                onclick="excluirProfessor(${professor.ID_PROFESSOR})"
              >
                Excluir
              </button>

            </div>

          </td>

        `;

        tbody.appendChild(tr);

      });

    })

    .withFailureHandler(tratarErro)

    .listarProfessores(token);

}


function abrirModalProfessor(professor) {

  document
    .getElementById('formProfessor')
    .reset();

  document.getElementById(
    'professorId'
  ).value = '';

  if (professor) {

    document.getElementById(
      'professorId'
    ).value =
      professor.ID_PROFESSOR;

    document.getElementById(
      'professorNome'
    ).value =
      professor.NOME || '';

    document.getElementById(
      'professorEmail'
    ).value =
      professor.EMAIL || '';

    document.getElementById(
      'professorTelefone'
    ).value =
      professor.TELEFONE || '';

    document.getElementById(
      'professorDisciplina'
    ).value =
      professor.DISCIPLINA || '';

  }

  document
    .getElementById('modalProfessor')
    .classList.remove('hidden');

}


function salvarProfessor(event) {

  event.preventDefault();

  const id =
    document.getElementById(
      'professorId'
    ).value;

  const professor = {

    id_professor: id,

    nome:
      document.getElementById(
        'professorNome'
      ).value,

    email:
      document.getElementById(
        'professorEmail'
      ).value,

    telefone:
      document.getElementById(
        'professorTelefone'
      ).value,

    disciplina:
      document.getElementById(
        'professorDisciplina'
      ).value

  };


  const funcao = id
    ? 'atualizarProfessor'
    : 'cadastrarProfessor';


  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      fecharModal('modalProfessor');

      carregarProfessores();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    [funcao](
      token,
      professor
    );

}


function editarProfessor(id) {

  const professor =
    professoresCache.find(function(item) {

      return Number(item.ID_PROFESSOR) ===
        Number(id);

    });

  if (professor) {
    abrirModalProfessor(professor);
  }

}


function excluirProfessor(id) {

  if (!confirm(
    'Deseja excluir este professor?'
  )) {
    return;
  }

  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      carregarProfessores();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    .excluirProfessor(
      token,
      id
    );

}


// ============================================================
// EMPRÉSTIMOS
// ============================================================

function carregarEmprestimos() {

  google.script.run

    .withSuccessHandler(function(emprestimos) {

      const tbody =
        document.getElementById(
          'tabelaEmprestimos'
        );

      tbody.innerHTML = '';

      if (!emprestimos.length) {

        tbody.innerHTML =
          '<tr><td colspan="7">Nenhum empréstimo encontrado.</td></tr>';

        return;
      }


      emprestimos.forEach(function(emprestimo) {

        const livro =
          livrosCache.find(function(item) {

            return Number(item.ID_LIVRO) ===
              Number(emprestimo.ID_LIVRO);

          });


        let usuarioNome = '-';

        if (
          String(emprestimo.TIPO_USUARIO) ===
          'ALUNO'
        ) {

          const aluno =
            alunosCache.find(function(item) {

              return Number(item.ID_ALUNO) ===
                Number(emprestimo.ID_USUARIO);

            });

          if (aluno) {
            usuarioNome = aluno.NOME;
          }

        } else {

          const professor =
            professoresCache.find(function(item) {

              return Number(item.ID_PROFESSOR) ===
                Number(emprestimo.ID_USUARIO);

            });

          if (professor) {
            usuarioNome = professor.NOME;
          }

        }


        let classeStatus =
          'status-ativo';

        if (
          String(emprestimo.STATUS) ===
          'ATRASADO'
        ) {
          classeStatus =
            'status-atrasado';
        }

        if (
          String(emprestimo.STATUS) ===
          'DEVOLVIDO'
        ) {
          classeStatus =
            'status-devolvido';
        }


        const tr =
          document.createElement('tr');

        tr.innerHTML = `

          <td>
            ${emprestimo.ID_EMPRESTIMO}
          </td>

          <td>
            ${escapeHTML(
              livro
                ? livro.TITULO
                : 'Livro não encontrado'
            )}
          </td>

          <td>
            ${escapeHTML(usuarioNome)}
            <small>
              (${escapeHTML(
                emprestimo.TIPO_USUARIO
              )})
            </small>
          </td>

          <td>
            ${formatarData(
              emprestimo.DATA_EMPRESTIMO
            )}
          </td>

          <td>
            ${formatarData(
              emprestimo.DATA_PREVISTA
            )}
          </td>

          <td>
            <span class="status ${classeStatus}">
              ${escapeHTML(
                emprestimo.STATUS
              )}
            </span>
          </td>

          <td>

            ${
              String(emprestimo.STATUS) !==
              'DEVOLVIDO'

              ? `

                <button
                  class="btn btn-small btn-success"
                  onclick="devolverLivro(${emprestimo.ID_EMPRESTIMO})"
                >
                  Devolver
                </button>

              `

              : '-'
            }

          </td>

        `;

        tbody.appendChild(tr);

      });

    })

    .withFailureHandler(tratarErro)

    .listarEmprestimos(token);

}


function abrirModalEmprestimo() {

  document
    .getElementById('formEmprestimo')
    .reset();

  carregarLivrosSelect();

  document
    .getElementById('modalEmprestimo')
    .classList.remove('hidden');

}


function carregarLivrosSelect() {

  const select =
    document.getElementById(
      'emprestimoLivro'
    );

  select.innerHTML =
    '<option value="">Selecione o livro</option>';

  livrosCache
    .filter(function(livro) {

      return Number(livro.DISPONIVEL) > 0 &&
        livro.ATIVO !== false &&
        String(livro.ATIVO).toUpperCase() !== 'FALSE';

    })
    .forEach(function(livro) {

      const option =
        document.createElement('option');

      option.value =
        livro.ID_LIVRO;

      option.textContent =
        livro.TITULO +
        ' (' +
        livro.DISPONIVEL +
        ' disponível(is))';

      select.appendChild(option);

    });

}


function carregarUsuariosEmprestimo() {

  const tipo =
    document.getElementById(
      'emprestimoTipo'
    ).value;

  const select =
    document.getElementById(
      'emprestimoUsuario'
    );

  select.innerHTML =
    '<option value="">Selecione o usuário</option>';


  if (tipo === 'ALUNO') {

    alunosCache
      .filter(function(aluno) {

        return aluno.ATIVO !== false &&
          String(aluno.ATIVO).toUpperCase() !== 'FALSE';

      })
      .forEach(function(aluno) {

        const option =
          document.createElement('option');

        option.value =
          aluno.ID_ALUNO;

        option.textContent =
          aluno.RA +
          ' - ' +
          aluno.NOME;

        select.appendChild(option);

      });

  }


  if (tipo === 'PROFESSOR') {

    professoresCache
      .filter(function(professor) {

        return professor.ATIVO !== false &&
          String(professor.ATIVO).toUpperCase() !== 'FALSE';

      })
      .forEach(function(professor) {

        const option =
          document.createElement('option');

        option.value =
          professor.ID_PROFESSOR;

        option.textContent =
          professor.NOME;

        select.appendChild(option);

      });

  }

}


function salvarEmprestimo(event) {

  event.preventDefault();

  const dados = {

    id_livro:
      document.getElementById(
        'emprestimoLivro'
      ).value,

    tipo_usuario:
      document.getElementById(
        'emprestimoTipo'
      ).value,

    id_usuario:
      document.getElementById(
        'emprestimoUsuario'
      ).value,

    data_prevista:
      document.getElementById(
        'emprestimoData'
      ).value,

    observacao:
      document.getElementById(
        'emprestimoObservacao'
      ).value

  };


  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      fecharModal(
        'modalEmprestimo'
      );

      carregarEmprestimos();

      carregarLivros();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    .realizarEmprestimo(
      token,
      dados
    );

}


function devolverLivro(id) {

  if (!confirm(
    'Confirmar devolução do livro?'
  )) {
    return;
  }

  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      carregarEmprestimos();

      carregarLivros();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    .registrarDevolucao(
      token,
      id
    );

}


// ============================================================
// RESERVAS
// ============================================================

function carregarReservas() {

  google.script.run

    .withSuccessHandler(function(reservas) {

      const tbody =
        document.getElementById(
          'tabelaReservas'
        );

      tbody.innerHTML = '';

      if (!reservas.length) {

        tbody.innerHTML =
          '<tr><td colspan="7">Nenhuma reserva encontrada.</td></tr>';

        return;
      }


      reservas.forEach(function(reserva) {

        const livro =
          livrosCache.find(function(item) {

            return Number(item.ID_LIVRO) ===
              Number(reserva.ID_LIVRO);

          });


        let usuarioNome = '-';

        if (
          String(reserva.TIPO_USUARIO) ===
          'ALUNO'
        ) {

          const aluno =
            alunosCache.find(function(item) {

              return Number(item.ID_ALUNO) ===
                Number(reserva.ID_USUARIO);

            });

          if (aluno) {
            usuarioNome = aluno.NOME;
          }

        } else {

          const professor =
            professoresCache.find(function(item) {

              return Number(item.ID_PROFESSOR) ===
                Number(reserva.ID_USUARIO);

            });

          if (professor) {
            usuarioNome = professor.NOME;
          }

        }


        const tr =
          document.createElement('tr');

        tr.innerHTML = `

          <td>
            ${reserva.ID_RESERVA}
          </td>

          <td>
            ${escapeHTML(
              livro
                ? livro.TITULO
                : '-'
            )}
          </td>

          <td>
            ${escapeHTML(
              reserva.TIPO_USUARIO
            )}
          </td>

          <td>
            ${escapeHTML(
              usuarioNome
            )}
          </td>

          <td>
            ${formatarData(
              reserva.DATA_RESERVA
            )}
          </td>

          <td>
            <span class="status status-ativo">
              ${escapeHTML(
                reserva.STATUS
              )}
            </span>
          </td>

          <td>

            ${
              String(reserva.STATUS) ===
              'ATIVA'

              ? `

                <button
                  class="btn btn-small btn-danger"
                  onclick="cancelarReserva(${reserva.ID_RESERVA})"
                >
                  Cancelar
                </button>

              `

              : '-'
            }

          </td>

        `;

        tbody.appendChild(tr);

      });

    })

    .withFailureHandler(tratarErro)

    .listarReservas(token);

}


function cancelarReserva(id) {

  if (!confirm(
    'Deseja cancelar esta reserva?'
  )) {
    return;
  }

  google.script.run

    .withSuccessHandler(function(resposta) {

      alert(resposta.mensagem);

      carregarReservas();

      carregarDashboard();

    })

    .withFailureHandler(tratarErro)

    .cancelarReserva(
      token,
      id
    );

}


// ============================================================
// MODAIS
// ============================================================

function fecharModal(id) {

  document
    .getElementById(id)
    .classList.add('hidden');

}


// ============================================================
// UTILITÁRIOS
// ============================================================

function formatarData(valor) {

  if (!valor) {
    return '-';
  }

  const data =
    new Date(valor);

  if (isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toLocaleDateString(
    'pt-BR'
  );

}


function atualizarData() {

  const agora =
    new Date();

  document.getElementById(
    'dataAtual'
  ).textContent =
    agora.toLocaleDateString(
      'pt-BR',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    );

}


function tratarErro(erro) {

  const mensagem =
    erro && erro.message
      ? erro.message
      : 'Ocorreu um erro inesperado.';

  alert(mensagem);

  if (
    mensagem.includes('sessão') ||
    mensagem.includes('Sessão')
  ) {

    sessionStorage.removeItem(
      'biblioteca_token'
    );

    token = '';

    mostrarLogin();

  }

}


function escapeHTML(valor) {

  if (valor === null ||
      valor === undefined) {

    return '';

  }

  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}

</script>