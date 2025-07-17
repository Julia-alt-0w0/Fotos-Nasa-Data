// chave da api
const MINHA_CHAVE_PESSOAL = "MffKvzzh1DwKdPDD6kkArNgDd5u60g4QRur3yOvx";
const apiKey = MINHA_CHAVE_PESSOAL || "DEMO_KEY"; // Usa sua chave, ou a DEMO_KEY como reserva

/**
 * Função para traduzir texto usando a API gratuita MyMemory.
 * Agora ela quebra textos longos em pedaços menores para evitar limites da API.
 * @param {string} textoParaTraduzir - O texto que será traduzido.
 * @returns {Promise<string>} - O texto traduzido.
 */
async function traduzirTexto(textoParaTraduzir) {
  if (!textoParaTraduzir) {
    return "";
  }

  // Função interna para traduzir um único pedaço de texto
  async function traduzirPedaço(pedaço) {
    if (!pedaço.trim()) return "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(pedaço)}&langpair=en|pt-br`;
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error('Falha na tradução do pedaço');
      const dados = await resposta.json();
      return dados.responseData.translatedText;
    } catch (erro) {
      console.error("Erro ao traduzir um pedaço:", erro);
      return pedaço; // Retorna o original em caso de erro
    }
  }

  // Se o texto for grande, divide em frases. O limite da API é ~500 chars na URL.
  if (textoParaTraduzir.length > 450) {
    console.log("Texto longo detectado. Traduzindo em pedaços...");
    // Divide o texto em frases (por ponto final, interrogação, exclamação)
    const pedaços = textoParaTraduzir.match(/[^.!?]+[.!?]+/g) || [textoParaTraduzir];
    
    // Traduz cada pedaço de forma assíncrona
    const promessasDeTraducao = pedaços.map(p => traduzirPedaço(p));
    
    // Espera todas as traduções terminarem
    const pedaçosTraduzidos = await Promise.all(promessasDeTraducao);
    
    // Junta os pedaços traduzidos
    return pedaçosTraduzidos.join(" ");
  } else {
    // Se o texto for curto, traduz de uma vez
    return await traduzirPedaço(textoParaTraduzir);
  }
}

document.getElementById("buscarBtn").addEventListener("click", async () => {
  const data = document.getElementById("data").value;
  const resultado = document.getElementById("resultado");

  if (!data) {
    resultado.innerHTML = "<p style='color:red;'>Escolha uma data válida.</p>";
    return;
  }

  resultado.innerHTML = "<p>Buscando e traduzindo... Por favor, aguarde. ⏳</p>";

  const urlNasa = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${data}`;

  try {
    const respostaNasa = await fetch(urlNasa);
    if (!respostaNasa.ok) {
      if (respostaNasa.status === 429) {
        throw new Error("Limite de requisições à API da NASA excedido. Tente novamente mais tarde.");
      }
      throw new Error("Erro na resposta da API da NASA: " + respostaNasa.status);
    }
    const dadosNasa = await respostaNasa.json();

    if (dadosNasa.media_type === "image") {
      const [tituloTraduzido, explicacaoTraduzida] = await Promise.all([
        traduzirTexto(dadosNasa.title),
        traduzirTexto(dadosNasa.explanation)
      ]);

      resultado.innerHTML = `
        <h2>${tituloTraduzido}</h2>
        <img src="${dadosNasa.url}" alt="${tituloTraduzido}" style="max-width: 100%; border-radius: 8px;" />
        <p>${explicacaoTraduzida}</p>
        <small>Data: ${dadosNasa.date}</small>
      `;
    } else {
      const tituloTraduzido = await traduzirTexto(dadosNasa.title);
      resultado.innerHTML = `<h2>${tituloTraduzido}</h2><p>A mídia para esta data não é uma imagem, mas sim um(a) ${dadosNasa.media_type}.</p>`;
    }
  } catch (erro) {
    resultado.innerHTML = `<p style='color:red;'>${erro.message} 😢</p>`;
    console.error("Erro capturado:", erro);
  }
});