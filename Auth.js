// ============================================================ 

// AUTENTICAÇÃO 

// Auth.gs 

// ============================================================ 

 

 

function gerarHashSenha(senha) { 

    if (!senha) { 
  
      throw new Error('Informe uma senha.'); 
  
    } 
  
   
  
    const bytes = Utilities.computeDigest( 
  
      Utilities.DigestAlgorithm.SHA_256, 
  
      String(senha), 
  
      Utilities.Charset.UTF_8 
  
    ); 
  
   
  
    return bytes 
  
      .map(function(byte) { 
  
        const valor = byte < 0 ? byte + 256 : byte; 
  
   
  
        return ('0' + valor.toString(16)).slice(-2); 
  
      }) 
  
      .join(''); 
  
  } 
  
   
  
   
  
  // ============================================================ 
  
  // LOGIN 
  
  // ============================================================ 
  
   
  
  function login(email, senha) { 
  
   
  
    if (!email || !senha) { 
  
      throw new Error( 
  
        'Informe o e-mail e a senha.' 
  
      ); 
  
    } 
  
   
  
    const usuarios = lerRegistros_('USUARIO'); 
  
   
  
    const emailInformado = 
  
      String(email).trim().toLowerCase(); 
  
   
  
    const usuario = usuarios.find(function(item) { 
  
      return String(item.EMAIL) 
  
        .trim() 
  
        .toLowerCase() === emailInformado; 
  
    }); 
  
   
  
    if (!usuario) { 
  
      throw new Error( 
  
        'E-mail ou senha inválidos.' 
  
      ); 
  
    } 
  
   
  
    const ativo = 
  
      usuario.ATIVO === true || 
  
      String(usuario.ATIVO).toUpperCase() === 'TRUE'; 
  
   
  
    if (!ativo) { 
  
      throw new Error( 
  
        'Este usuário está desativado.' 
  
      ); 
  
    } 
  
   
  
    const hash = gerarHashSenha(senha); 
  
   
  
    if (String(usuario.SENHA) !== hash) { 
  
      throw new Error( 
  
        'E-mail ou senha inválidos.' 
  
      ); 
  
    } 
  
   
  
    const token = Utilities.getUuid(); 
  
   
  
    const dadosUsuario = { 
  
      id_usuario: usuario.ID_USUARIO, 
  
      nome: usuario.NOME, 
  
      email: usuario.EMAIL, 
  
      perfil: String(usuario.PERFIL).toUpperCase() 
  
    }; 
  
   
  
    CacheService 
  
      .getScriptCache() 
  
      .put( 
  
        'LOGIN_' + token, 
  
        JSON.stringify(dadosUsuario), 
  
        21600 
  
      ); 
  
   
  
    return { 
  
      sucesso: true, 
  
      token: token, 
  
      usuario: dadosUsuario 
  
    }; 
  
  } 
  
   
  
   
  
  // ============================================================ 
  
  // LOGOUT 
  
  // ============================================================ 
  
   
  
  function logout(token) { 
  
    if (token) { 
  
      CacheService 
  
        .getScriptCache() 
  
        .remove('LOGIN_' + token); 
  
    } 
  
   
  
    return { 
  
      sucesso: true 
  
    }; 
  
  } 
  
   
  
   
  
  // ============================================================ 
  
  // AUTENTICAÇÃO 
  
  // ============================================================ 
  
   
  
  function exigirAutenticacao_(token) { 
  
   
  
    if (!token) { 
  
      throw new Error( 
  
        'Sessão não encontrada. Faça login novamente.' 
  
      ); 
  
    } 
  
   
  
    const cache = 
  
      CacheService.getScriptCache(); 
  
   
  
    const dados = 
  
      cache.get('LOGIN_' + token); 
  
   
  
    if (!dados) { 
  
      throw new Error( 
  
        'Sua sessão expirou. Faça login novamente.' 
  
      ); 
  
    } 
  
   
  
    return JSON.parse(dados); 
  
  } 
  
   
  
   
  
  // ============================================================ 
  
  // PERMISSÕES 
  
  // ============================================================ 
  
   
  
  function verificarPermissao_(usuario, perfisPermitidos) { 
  
   
  
    if (!usuario || !usuario.perfil) { 
  
      throw new Error( 
  
        'Usuário não autenticado.' 
  
      ); 
  
    } 
  
   
  
    const perfil = 
  
      String(usuario.perfil).toUpperCase(); 
  
   
  
    if (perfisPermitidos.indexOf(perfil) === -1) { 
  
      throw new Error( 
  
        'Você não possui permissão para realizar esta operação.' 
  
      ); 
  
    } 
  
   
  
    return true; 
  
  } 
  
   
  
   
  
  // ============================================================ 
  
  // CRIAÇÃO MANUAL DE HASH 
  
  // ============================================================ 
  
  // 
  
  // Esta função serve apenas para gerar o hash de uma senha 
  
  // que será colocado MANUALMENTE na planilha. 
  
  // 
  
  // Ela NÃO cria tabela, aba ou banco de dados. 
  
  // 
  
  // Exemplo: 
  
  // gerarHashParaPlanilha('123456') 
  
  // 
  
  // Depois copie o resultado para a coluna SENHA. 
  
  // 
  
   
  
  function gerarHashParaPlanilha(senha) { 
  
    return gerarHashSenha(senha); 
  
  } 
  
   