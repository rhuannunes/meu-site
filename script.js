/* ==================================================
   1. SEMPRE ABRIR O SITE NO TOPO
   ================================================== */

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('pageshow', function () {
    window.scrollTo(0, 0);
});


/* ==================================================
   2. MENU MOBILE
   ================================================== */

const botaoMenu =
    document.querySelector('header nav > i.fa-bars');

const menuPrincipal =
    document.querySelector('.navegacao-primaria');

if (botaoMenu && menuPrincipal) {

    botaoMenu.addEventListener('click', function () {
        menuPrincipal.classList.toggle('ativado');
    });

    menuPrincipal
        .querySelectorAll('a')
        .forEach(function (link) {

            link.addEventListener('click', function () {
                menuPrincipal.classList.remove('ativado');
            });

        });

}


/* ==================================================
   3. MENU E SETAS - ROLAGEM SUAVE

   A ROLAGEM CONTINUA TOTALMENTE LIVRE.

   Não existe:
   - trava de página;
   - scroll obrigatório;
   - snap automático;
   - bloqueio da roda do mouse;
   - bloqueio do teclado;
   - correção automática da posição da tela.

   O botão lateral "Voltar para Home" é tratado
   separadamente para garantir que chegue em Y = 0.
   ================================================== */

document
    .querySelectorAll(
        '.navegacao-primaria a[href^="#"], .seta-pagina[href^="#"], .rodape-site a[href^="#"]'
    )
    .forEach(function (link) {

        link.addEventListener('click', function (event) {

            const seletor =
                link.getAttribute('href');

            if (!seletor || seletor === '#') {
                return;
            }

            const destino =
                document.querySelector(seletor);

            if (!destino) {
                return;
            }

            event.preventDefault();

            destino.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

        });

    });


/* ==================================================
   4. SETAS DESAPARECENDO GRADUALMENTE
   ================================================== */

const setasPaginas =
    document.querySelectorAll('.seta-pagina');


function atualizarOpacidadeSetas() {

    setasPaginas.forEach(function (seta) {

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
                progressoPixels / distanciaFade
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

    });

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

window.addEventListener('load', function () {

    const blocoTexto =
        document.querySelector('.prova-social-texto');

    const fraseDepoimentos =
        document.querySelector('.frase-depoimentos-cursiva');

    const referenciaFonte =
        document.querySelector('.destaque-experiencia');

    const frases =
        document.querySelectorAll(
            '.frase-depoimentos-cursiva .frase-escrita'
        );

    const ultimaFrase =
        frases.length
            ? frases[frases.length - 1]
            : null;

    const seta =
        document.querySelector('.seta-depoimentos');


    if (!blocoTexto || !fraseDepoimentos) {
        return;
    }


    if (referenciaFonte) {

        const estiloReferencia =
            window.getComputedStyle(referenciaFonte);

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


    fraseDepoimentos.style.color = '#ffffff';


    blocoTexto.classList.remove(
        'escrita-ativa'
    );


    if (seta) {
        seta.classList.remove(
            'desenhando'
        );
    }


    if (ultimaFrase && seta) {

        function terminouUltimaFrase(event) {

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


            setTimeout(function () {

                seta.classList.add(
                    'desenhando'
                );

            }, 100);

        }


        ultimaFrase.addEventListener(
            'animationend',
            terminouUltimaFrase
        );

    }


    setTimeout(function () {

        requestAnimationFrame(function () {

            requestAnimationFrame(function () {

                blocoTexto.classList.add(
                    'escrita-ativa'
                );

            });

        });

    }, 700);

});


/* ==================================================
   6. PLANOS - ESCOLHA DA DURAÇÃO + CHECKOUT
   ================================================== */

const cardsPlanos =
    document.querySelectorAll(
        '.consultoria-planos .plano-vendas-card'
    );

const avisoCheckout =
    document.querySelector(
        '#checkout-vendas-aviso'
    );


cardsPlanos.forEach(function (card) {

    const opcoes =
        card.querySelectorAll(
            '.plano-opcao'
        );

    const precoDisplay =
        card.querySelector(
            '[data-preco-display]'
        );

    const botaoComprar =
        card.querySelector(
            '.plano-vendas-comprar'
        );


    function selecionarOpcao(opcao) {

        opcoes.forEach(function (item) {
            item.classList.remove('ativo');
        });

        opcao.classList.add('ativo');


        if (precoDisplay) {

            precoDisplay.textContent =
                opcao.dataset.preco || '';

        }

    }


    opcoes.forEach(function (opcao) {

        opcao.addEventListener(
            'click',
            function () {

                selecionarOpcao(opcao);

            }
        );

    });


    if (!botaoComprar) {
        return;
    }


    botaoComprar.addEventListener(
        'click',
        function () {

            const opcaoAtiva =
                card.querySelector(
                    '.plano-opcao.ativo'
                );

            if (!opcaoAtiva) {
                return;
            }


            const linkCheckout =
                opcaoAtiva.dataset.checkoutUrl
                    ? opcaoAtiva.dataset.checkoutUrl.trim()
                    : '';

            const modalidade =
                card.dataset.modalidade ||
                'Consultoria';

            const periodo =
                opcaoAtiva.dataset.periodo ||
                '';

            const preco =
                opcaoAtiva.dataset.preco ||
                '';


            if (linkCheckout) {

                window.open(
                    linkCheckout,
                    '_blank',
                    'noopener,noreferrer'
                );

                return;
            }


            if (!avisoCheckout) {
                return;
            }


            avisoCheckout.textContent =
                modalidade +
                ' · ' +
                periodo +
                ' · R$ ' +
                preco +
                ' — pagamento online será disponibilizado em breve.';


            avisoCheckout.classList.add(
                'ativo'
            );


            clearTimeout(
                window.avisoCheckoutTimer
            );


            window.avisoCheckoutTimer =
                setTimeout(function () {

                    avisoCheckout.classList.remove(
                        'ativo'
                    );

                }, 6000);

        }
    );

});


/* ==================================================
   7. BOTÃO FIXO - VOLTAR PARA A HOME

   - Só aparece quando a Página 2 começa.
   - Ao clicar, vai para o topo REAL da página:
     window.scrollY = 0.
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

    if (!botaoVoltarHome || !paginaDiferenciais) {
        return;
    }

    const inicioPagina2 =
        paginaDiferenciais.offsetTop;

    const estaNaPagina2OuAbaixo =
        window.scrollY >=
        inicioPagina2 - 2;


    if (estaNaPagina2OuAbaixo) {

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
   8. ANO AUTOMÁTICO DO RODAPÉ
   ================================================== */

const anoAtual =
    document.querySelector(
        '#ano-atual'
    );

if (anoAtual) {

    anoAtual.textContent =
        new Date().getFullYear();

}