/*
 * AFD para a linguagem: L = { x em (a,b,c)+ | se x começa com a, a quantidade de b é par }
 */

class AnalisadorLexico {

  //  estados
  static INICIAL = "q0";
  static PAR = "q1";
  static IMPAR = "q2";
  static INICIA_BC = "q3";
  static INVALIDO = "qX";

  constructor() {
    this.historico = [];
    this.ultimoEstado = AnalisadorLexico.INICIAL;
    this.ultimoRastro = [];

    this.criarInterface();
  }

  //  interface que liga os elementos do HTML aos eventos 
  criarInterface() {
    this.entrada = document.getElementById("entrada");
    this.estadoLabel = document.getElementById("estadoLabel");
    this.rastroLabel = document.getElementById("rastroLabel");
    this.detalheLabel = document.getElementById("detalheLabel");
    this.resultadoLabel = document.getElementById("resultadoLabel");
    this.motivoLabel = document.getElementById("motivoLabel");
    this.listaHistorico = document.getElementById("listaHistorico");

    // tabela de transições
    const linhas = [
      ["q0", "q1", "q3", "q3", "Inicial"],
      ["q1", "q1", "q2", "q1", "Aceita (quantidade par de b)"],
      ["q2", "q2", "q1", "q2", "Rejeita (quantidade ímpar de b)"],
      ["q3", "q3", "q3", "q3", "Aceita (começou com b ou c)"],
      ["qX", "qX", "qX", "qX", "Rejeita (letra fora de a, b, c)"],
    ];
    const corpo = document.querySelector("#tabelaTransicoes tbody");
    for (const linha of linhas) {
      const tr = document.createElement("tr");
      for (const valor of linha) {
        const td = document.createElement("td");
        td.textContent = valor;
        tr.appendChild(td);
      }
      corpo.appendChild(tr);
    }

    // eventos
    this.entrada.addEventListener("keydown", (e) => {
      if (e.key === " ") this.finalizarPorEspaco(e);
      else if (e.key === "Enter") this.finalizarPorEnter(e);
    });
    this.entrada.addEventListener("keyup", () => this.atualizarAcompanhamento());

    document.getElementById("btnAnalisar")
      .addEventListener("click", () => this.analisarAtual());
    document.getElementById("btnLimparCampo")
      .addEventListener("click", () => this.limparCampo());
    document.getElementById("btnLimparHistorico")
      .addEventListener("click", () => this.limparHistorico());
  }

  //  função de transição do autômato 
  /* retorna o próximo estado conforme a tabela do autômato */
  transicao(estado, caractere) {
    if (estado === AnalisadorLexico.INVALIDO) {
      return AnalisadorLexico.INVALIDO;
    }

      // alfabeto da linguagem
    if (!"abc".includes(caractere)) {
      // letras fora do alfabeto não pertencem à linguagem.
      return AnalisadorLexico.INVALIDO;
    }

    if (estado === AnalisadorLexico.INICIAL) {
      if (caractere === "a") {
        return AnalisadorLexico.PAR;
      }
      return AnalisadorLexico.INICIA_BC;
    }

    if (estado === AnalisadorLexico.PAR) {
      return caractere === "b" ? AnalisadorLexico.IMPAR : AnalisadorLexico.PAR;
    }

    if (estado === AnalisadorLexico.IMPAR) {
      return caractere === "b" ? AnalisadorLexico.PAR : AnalisadorLexico.IMPAR;
    }

    if (estado === AnalisadorLexico.INICIA_BC) {
      return AnalisadorLexico.INICIA_BC;
    }

    return AnalisadorLexico.INVALIDO;
  }

  //  reconhecimento da sentença 
  processar(sentenca) {
    let estado = AnalisadorLexico.INICIAL;
    const caminho = [estado];
    let quantidadeB = 0;
    let caracteresValidos = 0;
    const letrasInvalidas = [];

    // Equivale ao isalpha() do Python: qualquer letra Unicode
    const ehLetra = (c) => /\p{L}/u.test(c);

    for (const caractere of sentenca) {
      // símbolos especiais e números são desconsiderados
      if (!ehLetra(caractere)) {
        continue;
      }

      // toda letra conta como conteúdo da sentença; letras fora de abc ou maiúsculas são inválidas para esta linguagem
      caracteresValidos += 1;

      // A especificação exige letras minúsculas
      if (!"abcdefghijklmnopqrstuvwxyz".includes(caractere)) {
        letrasInvalidas.push(caractere);
        estado = AnalisadorLexico.INVALIDO;
        caminho.push(estado);
        continue;
      }

      if ("abc".includes(caractere) && caractere === "b") {
        quantidadeB += 1;
      }

      estado = this.transicao(estado, caractere);
      caminho.push(estado);
    }

    // Critério final pra aceitação da sentença
    const aceita = caracteresValidos > 0 &&
      (estado === AnalisadorLexico.PAR || estado === AnalisadorLexico.INICIA_BC);

    // Primeira letra da sentença (ignorando o que não é letra)
    const primeiraLetra = Array.from(sentenca).find(ehLetra) || "";

    let motivo;
    if (caracteresValidos === 0) {
      motivo = "Sentença vazia: a linguagem exige pelo menos um símbolo.";
    } else if (letrasInvalidas.length > 0) {
      motivo = "Foram encontradas letras maiúsculas; use somente letras minúsculas.";
    } else if (estado === AnalisadorLexico.INVALIDO) {
      motivo = "A sentença contém letra fora do alfabeto {a, b, c}.";
    } else if (sentenca && primeiraLetra === "a") {
      motivo = `Começa com 'a' e possui ${quantidadeB} letra(s) 'b' ` +
        (quantidadeB % 2 === 0 ? "(quantidade par)." : "(quantidade ímpar).");
    } else {
      motivo = "Começa com 'b' ou 'c'; a quantidade de letras 'b' não restringe a aceitação.";
    }

    return { aceita, estado, caminho, quantidadeB, motivo };
  }

  //  acompanhamento em tempo real
  atualizarAcompanhamento() {
    const texto = this.entrada.value;
    const { estado, caminho, quantidadeB } = this.processar(texto);
    this.ultimoEstado = estado;
    this.ultimoRastro = caminho;

    const nomes = {
      q0: "inicial",
      q1: "par de b (estado de aceitação)",
      q2: "ímpar de b (estado de rejeição)",
      q3: "começou com b ou c (estado de aceitação)",
      qX: "inválido",
    };
    this.estadoLabel.textContent = `Estado atual: ${estado} — ${nomes[estado]}`;
    this.rastroLabel.textContent = "Caminho: " + caminho.join(" → ");
    this.detalheLabel.textContent =
      `Caracteres 'b' identificados: ${quantidadeB}. ` +
      "Símbolos especiais são ignorados.";
  }

  //  eventos de teclado 
  finalizarPorEspaco(evento) {
    this.analisarAtual();
    evento.preventDefault();
  }

  finalizarPorEnter(evento) {
    this.analisarAtual();
    evento.preventDefault();
  }

  //  análise da sentença digitada 
  analisarAtual() {
    const sentenca = this.entrada.value;
    if (!sentenca) {
      alert("Digite uma sentença antes de analisar.");
      return;
    }

    const { aceita, estado, caminho, quantidadeB, motivo } = this.processar(sentenca);

    if (aceita) {
      this.resultadoLabel.textContent = "SENTENÇA RECONHECIDA — ACEITA";
      this.resultadoLabel.className = "resultado aceita";
    } else {
      this.resultadoLabel.textContent = "SENTENÇA REJEITADA";
      this.resultadoLabel.className = "resultado rejeita";
    }
    this.motivoLabel.textContent = motivo;

    const registro = `${sentenca}  ->  ${aceita ? "ACEITA" : "REJEITADA"}`;
    this.historico.push(registro);
    const item = document.createElement("li");
    item.textContent = registro;
    this.listaHistorico.appendChild(item);
    this.listaHistorico.scrollTop = this.listaHistorico.scrollHeight;

    this.estadoLabel.textContent = `Estado final: ${estado}`;
    this.rastroLabel.textContent = "Caminho: " + caminho.join(" → ");
    this.detalheLabel.textContent = `Quantidade de b: ${quantidadeB}`;

    this.entrada.value = "";
    this.entrada.focus();
  }

  //  botões 
  limparCampo() {
    this.entrada.value = "";
    this.resultadoLabel.textContent = "Nenhuma sentença analisada.";
    this.resultadoLabel.className = "resultado";
    this.motivoLabel.textContent = "";
    this.estadoLabel.textContent = "Estado atual: q0 (inicial)";
    this.rastroLabel.textContent = "Caminho: q0";
    this.detalheLabel.textContent = "Aguardando caracteres...";
    this.entrada.focus();
  }

  limparHistorico() {
    this.historico.length = 0;
    this.listaHistorico.innerHTML = "";
  }
}

// ponto de entrada
document.addEventListener("DOMContentLoaded", () => {
  window.app = new AnalisadorLexico();
});