// Chave da API da NASA
const MINHA_CHAVE_PESSOAL = "MffKvzzh1DwKdPDD6kkArNgDd5u60g4QRur3yOvx";
const apiKey = MINHA_CHAVE_PESSOAL || "DEMO_KEY";

// Referências aos elementos da página
const loader = document.getElementById("loader");
const buscarBtn = document.getElementById("buscarBtn");
const resultadoDiv = document.getElementById("resultado"); // Movido para o escopo global para ser acessível por ambas as funções

/**
 * Função para traduzir texto usando a API MyMemory.
 * @param {string} textoParaTraduzir - O texto para ser traduzido.
 * @returns {Promise<string>} - O texto traduzido.
 */
async function traduzirTexto(textoParaTraduzir) {
    if (!textoParaTraduzir) return "";

    // A função de tradução por pedaços é mais robusta
    async function traduzirPedaço(pedaço) {
        if (!pedaço.trim()) return "";
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(pedaço)}&langpair=en|pt-br`;
        try {
            const resposta = await fetch(url);
            if (!resposta.ok) throw new Error('Falha na tradução');
            const dados = await resposta.json();
            return dados.responseData.translatedText;
        } catch (erro) {
            console.error("Erro ao traduzir um pedaço:", erro);
            return pedaço; // Retorna o texto original em caso de falha
        }
    }

    if (textoParaTraduzir.length > 450) {
        const pedaços = textoParaTraduzir.match(/[^.!?]+[.!?]+/g) || [textoParaTraduzir];
        const promessasDeTraducao = pedaços.map(p => traduzirPedaço(p));
        const pedaçosTraduzidos = await Promise.all(promessasDeTraducao);
        return pedaçosTraduzidos.join(" ");
    } else {
        return await traduzirPedaço(textoParaTraduzir);
    }
}

// Evento de clique no botão de busca
buscarBtn.addEventListener("click", async () => {
    const dataInput = document.getElementById("data");
    const data = dataInput.value;

    if (!data) {
        resultadoDiv.innerHTML = "<p style='color:red;'>Por favor, escolha uma data válida.</p>";
        return;
    }

    // Lógica de carregamento
    resultadoDiv.innerHTML = "";   // Limpa resultados antigos
    loader.style.display = 'flex'; // Mostra o loader do planeta

    const urlNasa = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&date=${data}`;

    try {
        const respostaNasa = await fetch(urlNasa);
        if (!respostaNasa.ok) {
            if (respostaNasa.status === 429) {
                throw new Error("Limite de requisições à API da NASA excedido. Tente novamente mais tarde.");
            }
            const erroData = await respostaNasa.json();
            throw new Error(erroData.msg || "Não foi possível buscar a imagem para esta data.");
        }
        const dadosNasa = await respostaNasa.json();

        if (dadosNasa.media_type === "image") {
            const [tituloTraduzido, explicacaoTraduzida] = await Promise.all([
                traduzirTexto(dadosNasa.title),
                traduzirTexto(dadosNasa.explanation)
            ]);

            resultadoDiv.innerHTML = `
                <h2>${tituloTraduzido}</h2>
                <img src="${dadosNasa.url}" alt="${tituloTraduzido}" />
                <p>${explicacaoTraduzida}</p>
                <small>Data: ${dadosNasa.date}</small>
            `;
            // ---> CORREÇÃO 1: SALVANDO O RESULTADO DE IMAGEM <---
            localStorage.setItem('ultimaBuscaApod', resultadoDiv.innerHTML);

        } else { // Caso seja um vídeo ou outro tipo de mídia
            const tituloTraduzido = await traduzirTexto(dadosNasa.title);
            resultadoDiv.innerHTML = `
                <h2>${tituloTraduzido}</h2>
                <p>A mídia para esta data é um vídeo ou outro formato. Você pode vê-lo no site da NASA.</p>
                <a href="${dadosNasa.url}" target="_blank">Ver mídia original</a>
            `;
            // ---> CORREÇÃO 1: SALVANDO O RESULTADO DE VÍDEO <---
            localStorage.setItem('ultimaBuscaApod', resultadoDiv.innerHTML);
        }
    } catch (erro) {
        resultadoDiv.innerHTML = `<p style='color:red;'>${erro.message} 😢</p>`;
        console.error("Erro capturado:", erro);
    } finally {
        // Esconde o loader, não importa se deu certo ou errado
        loader.style.display = 'none';
    }
});


// ---> CORREÇÃO 2: POSICIONAMENTO CORRETO DO CÓDIGO DE CARREGAMENTO <---
// Este código agora está FORA do evento de clique e será executado UMA VEZ quando a página carregar.
document.addEventListener('DOMContentLoaded', () => {
    const buscaSalva = localStorage.getItem('ultimaBuscaApod');

    if (buscaSalva) {
        resultadoDiv.innerHTML = buscaSalva;
    }
});