/* ==================================================
   CONFIGURAÇÃO DO AGENDAMENTO
   ==================================================

   1) GOOGLE AGENDA:
      Depois de publicar o arquivo google-agenda-backend.gs
      como Web App no Google Apps Script, cole a URL abaixo.

   Exemplo:
   AGENDA_API_URL:
   'https://script.google.com/macros/s/SEU_ID/exec'

   2) PAGAMENTO:
      O endpoint de pagamento ficará vazio até escolhermos
      Mercado Pago / PagBank / Stripe.

   IMPORTANTE:
   Nunca coloque ACCESS TOKEN ou senha do provedor de
   pagamento dentro deste arquivo. Este JavaScript fica
   público no GitHub Pages.
   ================================================== */

const CONFIG_AGENDAMENTO = {

    AGENDA_API_URL:
        '',

    CHECKOUT_API_URL:
        '',

    FUSO:
        'America/Sao_Paulo',

    PLANOS: {

        basic: {
            nome: 'Plano Basic',
            modalidade: 'Online Essencial',
            exigeAgenda: false,
            exigeEndereco: false,
            consultaInicialMinutos: 0,
            retornoMinutos: 0
        },

        essencial: {
            nome: 'Plano Essencial',
            modalidade: 'Online com Videoconsulta',
            exigeAgenda: true,
            exigeEndereco: false,
            consultaInicialMinutos: 45,
            retornoMinutos: 30
        },

        premium: {
            nome: 'Plano Premium',
            modalidade: 'Atendimento a domicílio',
            exigeAgenda: true,
            exigeEndereco: true,
            consultaInicialMinutos: 60,
            retornoMinutos: 45,
            cidade: 'Anápolis - GO'
        }

    }

};


/* ==================================================
   1. ABERTURA / RETORNO PARA O SITE

   REGRA IMPORTANTE:
   - Se abrir o site normalmente, começa no topo.
   - Se a URL tiver uma âncora, por exemplo:
     index.html#consultoria
     NÃO forçamos o topo.

   Isso permite que "Voltar aos planos" realmente
   volte para a seção de planos.
   ================================================== */

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('pageshow', function () {

    if (
        document.body.classList.contains(
            'pagina-fluxo'
        )
    ) {
        return;
    }

    if (window.location.hash) {
        return;
    }

    window.scrollTo(0, 0);
});


/* ==================================================
   2. MENU MOBILE
   ================================================== */

const botaoMenu =
    document.querySelector(
        'header nav > i.fa-bars'
    );

const menuPrincipal =
    document.querySelector(
        '.navegacao-primaria'
    );

if (botaoMenu && menuPrincipal) {

    botaoMenu.addEventListener(
        'click',
        function () {

            menuPrincipal.classList.toggle(
                'ativado'
            );

        }
    );


    menuPrincipal
        .querySelectorAll('a')
        .forEach(function (link) {

            link.addEventListener(
                'click',
                function () {

                    menuPrincipal.classList.remove(
                        'ativado'
                    );

                }
            );

        });

}


/* ==================================================
   3. MENU E SETAS - ROLAGEM SUAVE
   ================================================== */

document
    .querySelectorAll(
        '.navegacao-primaria a[href^="#"], .seta-pagina[href^="#"], .seta-objetivos-consultoria[href^="#"], .rodape-site a[href^="#"]'
    )
    .forEach(function (link) {

        link.addEventListener(
            'click',
            function (event) {

                const seletor =
                    link.getAttribute('href');

                if (
                    !seletor ||
                    seletor === '#'
                ) {
                    return;
                }

                const destino =
                    document.querySelector(
                        seletor
                    );

                if (!destino) {
                    return;
                }

                event.preventDefault();

                destino.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

            }
        );

    });


/* ==================================================
   4. SETAS DESAPARECENDO GRADUALMENTE
   ================================================== */

const setasPaginas =
    document.querySelectorAll(
        '.seta-pagina'
    );


function atualizarOpacidadeSetas() {

    setasPaginas.forEach(
        function (seta) {

            const pagina =
                seta.closest(
                    '.pagina-home, .diferenciais, .services, .consultoria-planos'
                );

            if (!pagina) {
                return;
            }

            const retangulo =
                pagina.getBoundingClientRect();

            const progressoPixels =
                Math.max(
                    0,
                    -retangulo.top
                );

            const distanciaFade =
                Math.max(
                    180,
                    window.innerHeight * 0.42
                );

            const progresso =
                Math.min(
                    1,
                    progressoPixels /
                    distanciaFade
                );

            const opacidade =
                1 - progresso;

            seta.style.setProperty(
                '--seta-opacidade',
                opacidade.toFixed(3)
            );

            if (opacidade <= 0.06) {

                seta.classList.add(
                    'seta-quase-invisivel'
                );

            } else {

                seta.classList.remove(
                    'seta-quase-invisivel'
                );

            }

        }
    );

}


window.addEventListener(
    'load',
    atualizarOpacidadeSetas
);


window.addEventListener(
    'scroll',
    atualizarOpacidadeSetas,
    {
        passive: true
    }
);


window.addEventListener(
    'resize',
    atualizarOpacidadeSetas
);


/* ==================================================
   5. TEXTO AO LADO DO CELULAR
   ================================================== */

window.addEventListener(
    'load',
    function () {

        const blocoTexto =
            document.querySelector(
                '.prova-social-texto'
            );

        const fraseDepoimentos =
            document.querySelector(
                '.frase-depoimentos-cursiva'
            );

        const referenciaFonte =
            document.querySelector(
                '.destaque-experiencia'
            );

        const frases =
            document.querySelectorAll(
                '.frase-depoimentos-cursiva .frase-escrita'
            );

        const ultimaFrase =
            frases.length
                ? frases[frases.length - 1]
                : null;

        const seta =
            document.querySelector(
                '.seta-depoimentos'
            );


        if (
            !blocoTexto ||
            !fraseDepoimentos
        ) {
            return;
        }


        if (referenciaFonte) {

            const estiloReferencia =
                window.getComputedStyle(
                    referenciaFonte
                );

            fraseDepoimentos.style.fontFamily =
                estiloReferencia.fontFamily;

            fraseDepoimentos.style.fontWeight =
                estiloReferencia.fontWeight;

            fraseDepoimentos.style.fontStyle =
                estiloReferencia.fontStyle;

            fraseDepoimentos.style.fontStretch =
                estiloReferencia.fontStretch;

            fraseDepoimentos.style.fontVariant =
                estiloReferencia.fontVariant;

            fraseDepoimentos.style.fontFeatureSettings =
                estiloReferencia.fontFeatureSettings;

            fraseDepoimentos.style.fontKerning =
                estiloReferencia.fontKerning;

            fraseDepoimentos.style.letterSpacing =
                estiloReferencia.letterSpacing;

        }


        fraseDepoimentos.style.color =
            '#ffffff';


        blocoTexto.classList.remove(
            'escrita-ativa'
        );


        if (seta) {

            seta.classList.remove(
                'desenhando'
            );

        }


        if (
            ultimaFrase &&
            seta
        ) {

            function terminouUltimaFrase(
                event
            ) {

                if (
                    event.animationName !==
                    'revelar-como-escrita'
                ) {
                    return;
                }


                ultimaFrase.removeEventListener(
                    'animationend',
                    terminouUltimaFrase
                );


                setTimeout(
                    function () {

                        seta.classList.add(
                            'desenhando'
                        );

                    },
                    100
                );

            }


            ultimaFrase.addEventListener(
                'animationend',
                terminouUltimaFrase
            );

        }


        setTimeout(
            function () {

                requestAnimationFrame(
                    function () {

                        requestAnimationFrame(
                            function () {

                                blocoTexto.classList.add(
                                    'escrita-ativa'
                                );

                            }
                        );

                    }
                );

            },
            700
        );

    }
);


/* ==================================================
   6. UTILITÁRIOS DOS PLANOS
   ================================================== */

const formatadorReal =
    new Intl.NumberFormat(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );


function converterPrecoParaNumero(
    valor
) {

    if (!valor) {
        return 0;
    }

    const valorLimpo =
        String(valor)
            .replace(/\./g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');

    const numero =
        Number(valorLimpo);

    return Number.isFinite(numero)
        ? numero
        : 0;

}


function normalizarPrecoParaURL(
    valor
) {

    return String(valor || '')
        .trim();

}


function montarDadosPlanoDoCard(
    card
) {

    const opcaoAtiva =
        card.querySelector(
            '.plano-opcao.ativo'
        );

    if (!opcaoAtiva) {
        return null;
    }

    const planoSlug =
        card.dataset.plano || '';

    const configPlano =
        CONFIG_AGENDAMENTO.PLANOS[
            planoSlug
        ];

    if (!configPlano) {
        return null;
    }

    return {
        plano:
            planoSlug,

        nomePlano:
            configPlano.nome,

        modalidade:
            configPlano.modalidade,

        periodo:
            opcaoAtiva.dataset.periodo ||
            '',

        meses:
            Number(
                opcaoAtiva.dataset.meses ||
                1
            ),

        preco:
            normalizarPrecoParaURL(
                opcaoAtiva.dataset.preco
            ),

        exigeAgenda:
            configPlano.exigeAgenda,

        exigeEndereco:
            configPlano.exigeEndereco,

        consultaInicialMinutos:
            configPlano
                .consultaInicialMinutos,

        retornoMinutos:
            configPlano
                .retornoMinutos,

        cidade:
            configPlano.cidade || ''
    };

}


function salvarContratacao(
    dados
) {

    sessionStorage.setItem(
        'rn_contratacao',
        JSON.stringify(dados)
    );

}


function lerContratacao() {

    try {

        const valor =
            sessionStorage.getItem(
                'rn_contratacao'
            );

        return valor
            ? JSON.parse(valor)
            : null;

    } catch (erro) {

        return null;

    }

}


function dadosDaURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const plano =
        params.get('plano');

    const config =
        CONFIG_AGENDAMENTO.PLANOS[
            plano
        ];

    if (!config) {
        return null;
    }

    return {
        plano:
            plano,

        nomePlano:
            config.nome,

        modalidade:
            config.modalidade,

        periodo:
            params.get('periodo') ||
            'Mensal',

        meses:
            Number(
                params.get('meses') ||
                1
            ),

        preco:
            params.get('preco') ||
            '',

        exigeAgenda:
            config.exigeAgenda,

        exigeEndereco:
            config.exigeEndereco,

        consultaInicialMinutos:
            config
                .consultaInicialMinutos,

        retornoMinutos:
            config
                .retornoMinutos,

        cidade:
            config.cidade || ''
    };

}


function montarURLAgendamento(
    dados
) {

    const params =
        new URLSearchParams({
            plano:
                dados.plano,
            periodo:
                dados.periodo,
            meses:
                String(dados.meses),
            preco:
                dados.preco
        });

    return (
        'agendamento.html?' +
        params.toString()
    );

}


function montarURLPagamento(
    dados
) {

    const params =
        new URLSearchParams({
            plano:
                dados.plano,
            periodo:
                dados.periodo,
            meses:
                String(dados.meses),
            preco:
                dados.preco
        });

    return (
        'pagamento.html?' +
        params.toString()
    );

}


/* ==================================================
   7. PLANOS - DURAÇÃO + PREÇO + ECONOMIA
   ================================================== */

const cardsPlanos =
    document.querySelectorAll(
        '.consultoria-planos .plano-vendas-card'
    );


cardsPlanos.forEach(
    function (card) {

        const opcoes =
            card.querySelectorAll(
                '.plano-opcao'
            );

        const precoDisplay =
            card.querySelector(
                '[data-preco-display]'
            );

        const economiaDisplay =
            card.querySelector(
                '[data-economia-display]'
            );

        const opcaoMensal =
            Array.from(opcoes)
                .find(
                    function (opcao) {

                        return (
                            Number(
                                opcao.dataset.meses
                            ) === 1
                        );

                    }
                ) ||
            opcoes[0];


        function atualizarEconomia(
            opcao
        ) {

            if (
                !economiaDisplay ||
                !opcaoMensal
            ) {
                return;
            }

            const meses =
                Number(
                    opcao.dataset.meses ||
                    1
                );

            const precoMensal =
                converterPrecoParaNumero(
                    opcaoMensal.dataset.preco
                );

            const precoSelecionado =
                converterPrecoParaNumero(
                    opcao.dataset.preco
                );

            const valorAvulso =
                precoMensal * meses;

            const economia =
                valorAvulso -
                precoSelecionado;


            if (
                meses > 1 &&
                economia > 0
            ) {

                economiaDisplay.textContent =
                    'Economia de ' +
                    formatadorReal.format(
                        economia
                    );

                economiaDisplay.classList.add(
                    'ativo'
                );

            } else {

                economiaDisplay.textContent =
                    '';

                economiaDisplay.classList.remove(
                    'ativo'
                );

            }

        }


        function selecionarOpcao(
            opcao
        ) {

            opcoes.forEach(
                function (item) {

                    item.classList.remove(
                        'ativo'
                    );

                }
            );

            opcao.classList.add(
                'ativo'
            );


            if (precoDisplay) {

                precoDisplay.textContent =
                    opcao.dataset.preco ||
                    '';

            }


            atualizarEconomia(
                opcao
            );

        }


        opcoes.forEach(
            function (opcao) {

                opcao.addEventListener(
                    'click',
                    function () {

                        selecionarOpcao(
                            opcao
                        );

                    }
                );

            }
        );


        const opcaoInicial =
            card.querySelector(
                '.plano-opcao.ativo'
            ) ||
            opcoes[0];


        if (opcaoInicial) {

            selecionarOpcao(
                opcaoInicial
            );

        }

    }
);


/* ==================================================
   8. COMPRAR ESTE PLANO
   ================================================== */

document
    .querySelectorAll(
        '.consultoria-planos .plano-vendas-comprar'
    )
    .forEach(
        function (botao) {

            botao.addEventListener(
                'click',
                function () {

                    const card =
                        botao.closest(
                            '.plano-vendas-card'
                        );

                    if (!card) {
                        return;
                    }

                    const dados =
                        montarDadosPlanoDoCard(
                            card
                        );

                    if (!dados) {
                        return;
                    }

                    salvarContratacao(
                        dados
                    );


                    if (
                        !dados.exigeAgenda
                    ) {

                        window.location.href =
                            montarURLPagamento(
                                dados
                            );

                        return;
                    }


                    window.location.href =
                        montarURLAgendamento(
                            dados
                        );

                }
            );

        }
    );


/* ==================================================
   9. GOOGLE AGENDA - JSONP
   ================================================== */

function consultarDisponibilidadeGoogle(
    plano,
    mes
) {

    return new Promise(
        function (
            resolve,
            reject
        ) {

            const urlBase =
                CONFIG_AGENDAMENTO
                    .AGENDA_API_URL
                    .trim();


            if (!urlBase) {

                reject(
                    new Error(
                        'Agenda ainda não conectada ao Google.'
                    )
                );

                return;
            }


            const callback =
                '__rnAgenda_' +
                Date.now() +
                '_' +
                Math.random()
                    .toString(36)
                    .slice(2);


            const script =
                document.createElement(
                    'script'
                );


            const timeout =
                setTimeout(
                    function () {

                        limpar();

                        reject(
                            new Error(
                                'O Google Agenda demorou para responder.'
                            )
                        );

                    },
                    12000
                );


            function limpar() {

                clearTimeout(
                    timeout
                );

                delete window[
                    callback
                ];

                if (
                    script.parentNode
                ) {

                    script.parentNode.removeChild(
                        script
                    );

                }

            }


            window[
                callback
            ] =
                function (dados) {

                    limpar();

                    if (
                        !dados ||
                        dados.ok !== true
                    ) {

                        reject(
                            new Error(
                                dados &&
                                dados.erro
                                    ? dados.erro
                                    : 'Não foi possível carregar a agenda.'
                            )
                        );

                        return;
                    }


                    resolve(
                        dados
                    );

                };


            const separador =
                urlBase.includes('?')
                    ? '&'
                    : '?';


            script.src =
                urlBase +
                separador +
                new URLSearchParams({
                    action:
                        'availability',
                    plano:
                        plano,
                    mes:
                        mes,
                    callback:
                        callback
                }).toString();


            script.onerror =
                function () {

                    limpar();

                    reject(
                        new Error(
                            'Não foi possível acessar o Google Agenda.'
                        )
                    );

                };


            document.head.appendChild(
                script
            );

        }
    );

}


/* ==================================================
   10. CALENDÁRIO PERSONALIZADO
   ================================================== */

const MESES_PT = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
];


function formatarDataISO(
    ano,
    mesZero,
    dia
) {

    return (
        String(ano) +
        '-' +
        String(
            mesZero + 1
        ).padStart(2, '0') +
        '-' +
        String(dia)
            .padStart(2, '0')
    );

}


function formatarDataHumana(
    dataISO
) {

    const partes =
        dataISO
            .split('-')
            .map(Number);

    const data =
        new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

    return new Intl.DateTimeFormat(
        'pt-BR',
        {
            weekday:
                'long',
            day:
                '2-digit',
            month:
                'long'
        }
    ).format(data);

}


function mesISO(
    data
) {

    return (
        data.getFullYear() +
        '-' +
        String(
            data.getMonth() + 1
        ).padStart(
            2,
            '0'
        )
    );

}


function criarCalendario(
    container,
    dadosPlano
) {

    let mesAtual =
        new Date();

    mesAtual =
        new Date(
            mesAtual.getFullYear(),
            mesAtual.getMonth(),
            1
        );


    let disponibilidade =
        {};

    let dataSelecionada =
        '';

    let horaSelecionada =
        '';


    container.innerHTML =
        `
        <div class="agenda-status">
            <i class="fa-regular fa-calendar"></i>
            <span data-agenda-status>
                Carregando disponibilidade...
            </span>
        </div>

        <div class="agenda-calendario-topo">
            <button
                aria-label="Mês anterior"
                data-mes-anterior
                type="button"
            >
                <i class="fa-solid fa-chevron-left"></i>
            </button>

            <div
                class="agenda-mes"
                data-agenda-mes
            ></div>

            <button
                aria-label="Próximo mês"
                data-mes-proximo
                type="button"
            >
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>

        <div class="agenda-semana">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
        </div>

        <div
            class="agenda-dias"
            data-agenda-dias
        ></div>

        <div
            class="agenda-horarios"
            data-agenda-horarios
            hidden
        >
            <div
                class="agenda-horarios-titulo"
                data-agenda-horarios-titulo
            ></div>

            <div
                class="agenda-horarios-grade"
                data-agenda-horarios-grade
            ></div>
        </div>

        <div
            class="agenda-selecao"
            data-agenda-selecao
            hidden
        ></div>
        `;


    const status =
        container.querySelector(
            '[data-agenda-status]'
        );

    const statusBox =
        status.closest(
            '.agenda-status'
        );

    const tituloMes =
        container.querySelector(
            '[data-agenda-mes]'
        );

    const diasBox =
        container.querySelector(
            '[data-agenda-dias]'
        );

    const horariosBox =
        container.querySelector(
            '[data-agenda-horarios]'
        );

    const horariosTitulo =
        container.querySelector(
            '[data-agenda-horarios-titulo]'
        );

    const horariosGrade =
        container.querySelector(
            '[data-agenda-horarios-grade]'
        );

    const selecaoBox =
        container.querySelector(
            '[data-agenda-selecao]'
        );

    const botaoAnterior =
        container.querySelector(
            '[data-mes-anterior]'
        );

    const botaoProximo =
        container.querySelector(
            '[data-mes-proximo]'
        );

    const escopo =
        container.closest(
            '.agenda-modal-painel, .fluxo-card'
        );

    const botaoContinuar =
        escopo
            ? escopo.querySelector(
                '[data-agenda-continuar]'
            )
            : null;


    function limparSelecao() {

        dataSelecionada =
            '';

        horaSelecionada =
            '';

        horariosBox.hidden =
            true;

        selecaoBox.hidden =
            true;

        if (botaoContinuar) {

            botaoContinuar.hidden =
                true;

        }

    }


    function desenharDias() {

        diasBox.innerHTML =
            '';

        tituloMes.textContent =
            MESES_PT[
                mesAtual.getMonth()
            ] +
            ' ' +
            mesAtual.getFullYear();


        const ano =
            mesAtual.getFullYear();

        const mes =
            mesAtual.getMonth();

        const primeiroDiaSemana =
            new Date(
                ano,
                mes,
                1
            ).getDay();

        const totalDias =
            new Date(
                ano,
                mes + 1,
                0
            ).getDate();


        for (
            let i = 0;
            i < primeiroDiaSemana;
            i += 1
        ) {

            const vazio =
                document.createElement(
                    'span'
                );

            vazio.className =
                'agenda-dia';

            vazio.setAttribute(
                'aria-hidden',
                'true'
            );

            diasBox.appendChild(
                vazio
            );

        }


        for (
            let dia = 1;
            dia <= totalDias;
            dia += 1
        ) {

            const dataISO =
                formatarDataISO(
                    ano,
                    mes,
                    dia
                );

            const horarios =
                disponibilidade[
                    dataISO
                ] || [];

            const botaoDia =
                document.createElement(
                    'button'
                );

            botaoDia.type =
                'button';

            botaoDia.className =
                'agenda-dia';

            botaoDia.textContent =
                String(dia);


            if (
                horarios.length
            ) {

                botaoDia.classList.add(
                    'tem-horarios'
                );

                botaoDia.addEventListener(
                    'click',
                    function () {

                        dataSelecionada =
                            dataISO;

                        horaSelecionada =
                            '';

                        container
                            .querySelectorAll(
                                '.agenda-dia.selecionado'
                            )
                            .forEach(
                                function (item) {

                                    item.classList.remove(
                                        'selecionado'
                                    );

                                }
                            );

                        botaoDia.classList.add(
                            'selecionado'
                        );

                        mostrarHorarios(
                            dataISO,
                            horarios
                        );

                    }
                );

            } else {

                botaoDia.disabled =
                    true;

            }


            diasBox.appendChild(
                botaoDia
            );

        }

    }


    function mostrarHorarios(
        dataISO,
        horarios
    ) {

        horariosGrade.innerHTML =
            '';

        horariosBox.hidden =
            false;

        selecaoBox.hidden =
            true;

        horariosTitulo.textContent =
            'Horários disponíveis em ' +
            formatarDataHumana(
                dataISO
            );


        horarios.forEach(
            function (hora) {

                const botaoHora =
                    document.createElement(
                        'button'
                    );

                botaoHora.type =
                    'button';

                botaoHora.className =
                    'agenda-horario';

                botaoHora.textContent =
                    hora;


                botaoHora.addEventListener(
                    'click',
                    function () {

                        horaSelecionada =
                            hora;

                        horariosGrade
                            .querySelectorAll(
                                '.agenda-horario.selecionado'
                            )
                            .forEach(
                                function (item) {

                                    item.classList.remove(
                                        'selecionado'
                                    );

                                }
                            );

                        botaoHora.classList.add(
                            'selecionado'
                        );


                        selecaoBox.textContent =
                            'Selecionado: ' +
                            formatarDataHumana(
                                dataSelecionada
                            ) +
                            ' às ' +
                            horaSelecionada +
                            ' · ' +
                            dadosPlano
                                .consultaInicialMinutos +
                            ' min';

                        selecaoBox.hidden =
                            false;


                        if (
                            botaoContinuar
                        ) {

                            botaoContinuar.hidden =
                                false;

                        }

                    }
                );

                horariosGrade.appendChild(
                    botaoHora
                );

            }
        );

    }


    async function carregarMes() {

        limparSelecao();

        statusBox.classList.remove(
            'erro'
        );

        status.textContent =
            'Consultando seus horários no Google Agenda...';

        disponibilidade =
            {};

        desenharDias();


        try {

            const resposta =
                await consultarDisponibilidadeGoogle(
                    dadosPlano.plano,
                    mesISO(
                        mesAtual
                    )
                );

            disponibilidade =
                resposta.dias ||
                {};

            const totalDias =
                Object.keys(
                    disponibilidade
                ).length;


            if (totalDias) {

                status.textContent =
                    'Horários livres atualizados pelo Google Agenda.';

            } else {

                status.textContent =
                    'Não há horários disponíveis neste mês.';

            }


            desenharDias();

        } catch (erro) {

            statusBox.classList.add(
                'erro'
            );

            status.textContent =
                erro.message +
                ' O calendário visual já está pronto; falta apenas conectar a URL do Apps Script no início do script.js.';

            desenharDias();

        }

    }


    if (botaoAnterior) {

        botaoAnterior.addEventListener(
            'click',
            function () {

                mesAtual =
                    new Date(
                        mesAtual.getFullYear(),
                        mesAtual.getMonth() - 1,
                        1
                    );

                carregarMes();

            }
        );

    }


    if (botaoProximo) {

        botaoProximo.addEventListener(
            'click',
            function () {

                mesAtual =
                    new Date(
                        mesAtual.getFullYear(),
                        mesAtual.getMonth() + 1,
                        1
                    );

                carregarMes();

            }
        );

    }


    if (botaoContinuar) {

        botaoContinuar.addEventListener(
            'click',
            function () {

                if (
                    !dataSelecionada ||
                    !horaSelecionada
                ) {
                    return;
                }

                const dadosAtualizados =
                    {
                        ...dadosPlano,

                        data:
                            dataSelecionada,

                        hora:
                            horaSelecionada
                    };


                salvarContratacao(
                    dadosAtualizados
                );


                if (
                    dadosAtualizados
                        .exigeEndereco
                ) {

                    window.location.href =
                        'endereco.html';

                } else {

                    window.location.href =
                        montarURLPagamento(
                            dadosAtualizados
                        );

                }

            }
        );

    }


    carregarMes();

}


/* ==================================================
   11. MODAL - CONSULTAR DISPONIBILIDADE
   ================================================== */

const agendaModal =
    document.querySelector(
        '#agenda-modal'
    );

const agendaModalFechar =
    document.querySelector(
        '#agenda-modal-fechar'
    );


function fecharAgendaModal() {

    if (!agendaModal) {
        return;
    }

    agendaModal.classList.remove(
        'ativo'
    );

    agendaModal.setAttribute(
        'aria-hidden',
        'true'
    );

    document.body.style.overflow =
        '';

}


document
    .querySelectorAll(
        '.consultoria-planos .plano-vendas-disponibilidade'
    )
    .forEach(
        function (botao) {

            botao.addEventListener(
                'click',
                function () {

                    const card =
                        botao.closest(
                            '.plano-vendas-card'
                        );

                    if (
                        !card ||
                        !agendaModal
                    ) {
                        return;
                    }

                    const dados =
                        montarDadosPlanoDoCard(
                            card
                        );

                    if (!dados) {
                        return;
                    }


                    salvarContratacao(
                        dados
                    );


                    const titulo =
                        agendaModal.querySelector(
                            '#agenda-modal-titulo'
                        );

                    const subtitulo =
                        agendaModal.querySelector(
                            '#agenda-modal-subtitulo'
                        );

                    if (titulo) {

                        titulo.textContent =
                            'Disponibilidade · ' +
                            dados.nomePlano;

                    }

                    if (subtitulo) {

                        subtitulo.textContent =
                            dados.modalidade +
                            ' · consulta inicial de aproximadamente ' +
                            dados.consultaInicialMinutos +
                            ' min';

                    }


                    const widget =
                        agendaModal.querySelector(
                            '[data-agenda-widget]'
                        );

                    if (widget) {

                        criarCalendario(
                            widget,
                            dados
                        );

                    }


                    agendaModal.classList.add(
                        'ativo'
                    );

                    agendaModal.setAttribute(
                        'aria-hidden',
                        'false'
                    );

                    document.body.style.overflow =
                        'hidden';

                }
            );

        }
    );


if (agendaModalFechar) {

    agendaModalFechar.addEventListener(
        'click',
        fecharAgendaModal
    );

}


if (agendaModal) {

    agendaModal.addEventListener(
        'click',
        function (event) {

            if (
                event.target ===
                agendaModal
            ) {

                fecharAgendaModal();

            }

        }
    );

}


document.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key ===
            'Escape'
        ) {

            fecharAgendaModal();

        }

    }
);


/* ==================================================
   12. PÁGINA AGENDAMENTO.HTML
   ================================================== */

function preencherResumoPlano(
    elemento,
    dados
) {

    if (
        !elemento ||
        !dados
    ) {
        return;
    }

    const duracao =
        dados.consultaInicialMinutos
            ? (
                'Consulta inicial · ' +
                dados.consultaInicialMinutos +
                ' min'
            )
            : 'Sem consulta ao vivo';


    elemento.innerHTML =
        `
        <div>
            <strong>
                ${dados.nomePlano}
                ·
                ${dados.periodo}
            </strong>

            <span>
                ${dados.modalidade}
                ·
                ${duracao}
            </span>
        </div>

        <span class="fluxo-resumo-preco">
            ${formatadorReal.format(
                converterPrecoParaNumero(
                    dados.preco
                )
            )}
        </span>
        `;

}


const paginaAgendamentoWidget =
    document.querySelector(
        '.pagina-fluxo [data-agenda-widget]'
    );


if (
    paginaAgendamentoWidget &&
    window.location.pathname
        .toLowerCase()
        .includes(
            'agendamento'
        )
) {

    let dados =
        dadosDaURL() ||
        lerContratacao();


    if (dados) {

        salvarContratacao(
            dados
        );


        document
            .querySelectorAll(
                '[data-resumo-plano]'
            )
            .forEach(
                function (elemento) {

                    preencherResumoPlano(
                        elemento,
                        dados
                    );

                }
            );


        if (
            dados.exigeAgenda
        ) {

            criarCalendario(
                paginaAgendamentoWidget,
                dados
            );

        } else {

            paginaAgendamentoWidget.innerHTML =
                `
                <div class="agenda-status">
                    <i class="fa-regular fa-comments"></i>
                    <span>
                        O Plano Basic não exige agendamento.
                        O acompanhamento é realizado pelo WhatsApp.
                    </span>
                </div>
                `;

            const escopo =
                paginaAgendamentoWidget
                    .closest(
                        '.fluxo-card'
                    );

            const continuar =
                escopo
                    ? escopo.querySelector(
                        '[data-agenda-continuar]'
                    )
                    : null;

            if (continuar) {

                continuar.hidden =
                    false;

                continuar.addEventListener(
                    'click',
                    function () {

                        window.location.href =
                            montarURLPagamento(
                                dados
                            );

                    }
                );

            }

        }

    }

}


/* ==================================================
   13. PÁGINA ENDERECO.HTML
   ================================================== */

const enderecoForm =
    document.querySelector(
        '#endereco-form'
    );


if (enderecoForm) {

    const dados =
        lerContratacao();


    document
        .querySelectorAll(
            '[data-resumo-plano]'
        )
        .forEach(
            function (elemento) {

                preencherResumoPlano(
                    elemento,
                    dados
                );

            }
        );


    enderecoForm.addEventListener(
        'submit',
        function (event) {

            event.preventDefault();


            const formData =
                new FormData(
                    enderecoForm
                );

            const endereco =
                Object.fromEntries(
                    formData.entries()
                );


            const atualizados =
                {
                    ...dados,

                    endereco:
                        endereco,

                    cliente: {
                        nome:
                            endereco.nome,

                        email:
                            endereco.email,

                        whatsapp:
                            endereco.whatsapp
                    }
                };


            salvarContratacao(
                atualizados
            );


            window.location.href =
                montarURLPagamento(
                    atualizados
                );

        }
    );

}


/* ==================================================
   14. PÁGINA PAGAMENTO.HTML
   ================================================== */

const pagamentoForm =
    document.querySelector(
        '#pagamento-dados'
    );

const pagamentoAviso =
    document.querySelector(
        '#pagamento-aviso'
    );


if (pagamentoForm) {

    const dados =
        lerContratacao() ||
        dadosDaURL();


    document
        .querySelectorAll(
            '[data-resumo-plano]'
        )
        .forEach(
            function (elemento) {

                preencherResumoPlano(
                    elemento,
                    dados
                );

            }
        );


    if (
        dados &&
        dados.cliente
    ) {

        const nome =
            pagamentoForm.querySelector(
                '[name="nome"]'
            );

        const email =
            pagamentoForm.querySelector(
                '[name="email"]'
            );

        const whatsapp =
            pagamentoForm.querySelector(
                '[name="whatsapp"]'
            );

        if (nome) {

            nome.value =
                dados.cliente.nome ||
                '';

        }

        if (email) {

            email.value =
                dados.cliente.email ||
                '';

        }

        if (whatsapp) {

            whatsapp.value =
                dados.cliente.whatsapp ||
                '';

        }

    }


    pagamentoForm.addEventListener(
        'submit',
        async function (event) {

            event.preventDefault();


            const formData =
                new FormData(
                    pagamentoForm
                );

            const cliente =
                Object.fromEntries(
                    formData.entries()
                );


            const dadosFinais =
                {
                    ...dados,

                    cliente:
                        cliente
                };


            salvarContratacao(
                dadosFinais
            );


            const checkoutApi =
                CONFIG_AGENDAMENTO
                    .CHECKOUT_API_URL
                    .trim();


            if (!checkoutApi) {

                if (pagamentoAviso) {

                    pagamentoAviso.textContent =
                        'Fluxo salvo. O próximo passo é conectar o provedor de pagamento. Quando ele estiver configurado, este botão abrirá o checkout seguro e a consulta só será confirmada após o pagamento aprovado.';

                    pagamentoAviso.classList.add(
                        'ativo'
                    );

                }

                return;
            }


            try {

                const resposta =
                    await fetch(
                        checkoutApi,
                        {
                            method:
                                'POST',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify(
                                    dadosFinais
                                )
                        }
                    );


                const retorno =
                    await resposta.json();


                if (
                    !resposta.ok ||
                    !retorno.checkoutUrl
                ) {

                    throw new Error(
                        retorno.erro ||
                        'Não foi possível iniciar o pagamento.'
                    );

                }


                window.location.href =
                    retorno.checkoutUrl;


            } catch (erro) {

                if (pagamentoAviso) {

                    pagamentoAviso.textContent =
                        erro.message;

                    pagamentoAviso.classList.add(
                        'ativo'
                    );

                }

            }

        }
    );

}


/* ==================================================
   15. BOTÃO FIXO - VOLTAR PARA A HOME
   ================================================== */

const botaoVoltarHome =
    document.querySelector(
        '.voltar-home-global'
    );

const paginaDiferenciais =
    document.querySelector(
        '#diferenciais'
    );


function atualizarBotaoVoltarHome() {

    if (
        !botaoVoltarHome ||
        !paginaDiferenciais
    ) {
        return;
    }

    const inicioPagina2 =
        paginaDiferenciais.offsetTop;

    const estaNaPagina2OuAbaixo =
        window.scrollY >=
        inicioPagina2 - 2;


    if (
        estaNaPagina2OuAbaixo
    ) {

        botaoVoltarHome.classList.add(
            'ativo'
        );

    } else {

        botaoVoltarHome.classList.remove(
            'ativo'
        );

    }

}


if (botaoVoltarHome) {

    botaoVoltarHome.addEventListener(
        'click',
        function (event) {

            event.preventDefault();

            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });

        }
    );

}


window.addEventListener(
    'load',
    atualizarBotaoVoltarHome
);


window.addEventListener(
    'scroll',
    atualizarBotaoVoltarHome,
    {
        passive: true
    }
);


window.addEventListener(
    'resize',
    atualizarBotaoVoltarHome
);


/* ==================================================
   16. ANO AUTOMÁTICO DO RODAPÉ
   ================================================== */

const anoAtual =
    document.querySelector(
        '#ano-atual'
    );

if (anoAtual) {

    anoAtual.textContent =
        new Date().getFullYear();

}