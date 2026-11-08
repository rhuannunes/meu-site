/**
 * ============================================================
 * RHUAN NUNES - DISPONIBILIDADE DO GOOGLE AGENDA
 * ============================================================
 *
 * Este código:
 *
 * 1. lê os períodos em que você informou que está disponível;
 * 2. verifica se já existe compromisso na sua agenda principal;
 * 3. calcula os horários realmente livres;
 * 4. envia esses horários para o seu site.
 *
 * Ele NÃO processa pagamentos.
 * Ele NÃO confirma consultas.
 * ============================================================
 */


const CONFIG_AGENDA = {

    /*
     * ID do calendário que criaremos especificamente
     * para informar os horários em que você aceita consultas.
     *
     * Vamos substituir este texto depois.
     */
    CALENDARIO_DISPONIBILIDADE_ID:
        '76782750775200214affe39f38b5e4e189b096b43d3b3702a915983a9143d27c@group.calendar.google.com',


    /*
     * PRIMARY significa:
     * use sua agenda principal para verificar compromissos
     * que já ocupam determinado horário.
     */
    CALENDARIO_OCUPADO_ID:
        'PRIMARY',


    /*
     * Fuso horário usado pelo site.
     */
    FUSO:
        'America/Sao_Paulo',


    /*
     * Intervalo entre cada possibilidade de início.
     *
     * Exemplo:
     * 14:00
     * 14:15
     * 14:30
     * 14:45
     */
    PASSO_MINUTOS:
        60,


    /*
     * Impede alguém de marcar uma consulta em cima da hora.
     *
     * Exemplo:
     * com 12 horas, um horário precisa estar pelo menos
     * 12 horas no futuro para aparecer no site.
     */
    ANTECEDENCIA_MINIMA_HORAS:
        24,


    /*
     * Duração da primeira consulta de cada modalidade.
     */
    DURACOES: {

        essencial:
            50,

        premium:
            50

    }

};


/* ============================================================
   RECEBE A CONSULTA DO SITE
   ============================================================ */

function doGet(e) {

    const action =
        String(
            (
                e &&
                e.parameter &&
                e.parameter.action
            ) || ''
        );


    if (
        action !==
        'availability'
    ) {

        return responder_(
            {
                ok: false,
                erro: 'Ação inválida.'
            },
            e
        );

    }


    try {

        /* ====================================================
           PLANO
           ==================================================== */

        const plano =
            String(
                e.parameter.plano ||
                ''
            ).toLowerCase();


        /* ====================================================
           MÊS CONSULTADO
           formato esperado: 2026-11
           ==================================================== */

        const mes =
            String(
                e.parameter.mes ||
                ''
            );


        if (
            !CONFIG_AGENDA
                .DURACOES[
            plano
            ]
        ) {

            throw new Error(
                'Plano inválido.'
            );

        }


        if (
            !/^\d{4}-\d{2}$/
                .test(
                    mes
                )
        ) {

            throw new Error(
                'Mês inválido. Use YYYY-MM.'
            );

        }


        const [
            ano,
            numeroMes
        ] =
            mes
                .split('-')
                .map(Number);


        /* ====================================================
           INÍCIO E FIM DO MÊS
           ==================================================== */

        const inicio =
            new Date(
                ano,
                numeroMes - 1,
                1,
                0,
                0,
                0
            );


        const fim =
            new Date(
                ano,
                numeroMes,
                1,
                0,
                0,
                0
            );


        const duracaoMin =
            CONFIG_AGENDA
                .DURACOES[
            plano
            ];


        /* ====================================================
           CALENDÁRIO DE DISPONIBILIDADE
           ==================================================== */

        const calendarioDisponibilidade =
            CalendarApp
                .getCalendarById(
                    CONFIG_AGENDA
                        .CALENDARIO_DISPONIBILIDADE_ID
                );


        if (
            !calendarioDisponibilidade
        ) {

            throw new Error(
                'Calendário de disponibilidade não encontrado.'
            );

        }


        /* ====================================================
           CALENDÁRIO QUE BLOQUEIA HORÁRIOS OCUPADOS
           ==================================================== */

        const calendarioOcupado =
            CONFIG_AGENDA
                .CALENDARIO_OCUPADO_ID ===
                'PRIMARY'

                ? CalendarApp
                    .getDefaultCalendar()

                : CalendarApp
                    .getCalendarById(
                        CONFIG_AGENDA
                            .CALENDARIO_OCUPADO_ID
                    );


        if (
            !calendarioOcupado
        ) {

            throw new Error(
                'Calendário usado para conflitos não encontrado.'
            );

        }


        /* ====================================================
           BUSCAR EVENTOS
           ==================================================== */

        const janelas =
            calendarioDisponibilidade
                .getEvents(
                    inicio,
                    fim
                );


        const ocupados =
            calendarioOcupado
                .getEvents(
                    inicio,
                    fim
                );


        /* ====================================================
           ANTECEDÊNCIA MÍNIMA
           ==================================================== */

        const limiteMinimo =
            new Date(
                Date.now() +

                CONFIG_AGENDA
                    .ANTECEDENCIA_MINIMA_HORAS *

                60 *
                60 *
                1000
            );


        const dias =
            {};


        /* ====================================================
           PROCESSAR AS JANELAS DE DISPONIBILIDADE
           ==================================================== */

        janelas.forEach(
            function (
                janela
            ) {

                const inicioJanela =
                    new Date(
                        janela
                            .getStartTime()
                    );


                let cursor =
                    new Date(
                        inicioJanela
                    );


                /*
                 * Garante que os horários oferecidos
                 * comecem sempre em hora cheia.
                 *
                 * Exemplo:
                 * disponibilidade começa 14:30
                 * primeiro horário oferecido = 15:00
                 */
                cursor.setMinutes(
                    0,
                    0,
                    0
                );


                if (
                    cursor <
                    inicioJanela
                ) {

                    cursor.setHours(
                        cursor.getHours() + 1
                    );

                }


                const fimJanela =
                    new Date(
                        janela
                            .getEndTime()
                    );


                while (
                    true
                ) {

                    const fimConsulta =
                        new Date(

                            cursor
                                .getTime() +

                            duracaoMin *
                            60 *
                            1000

                        );


                    /*
                     * Se a consulta não couber mais
                     * dentro do período disponível,
                     * encerramos esse bloco.
                     */

                    if (
                        fimConsulta >
                        fimJanela
                    ) {

                        break;

                    }


                    /* ========================================
                       VERIFICAR SE ESTÁ NO FUTURO
                       ======================================== */

                    const estaNoFuturo =
                        cursor >=
                        limiteMinimo;


                    /* ========================================
                       VERIFICAR CONFLITO
                       ======================================== */

                    const temConflito =
                        ocupados.some(
                            function (
                                evento
                            ) {

                                const inicioOcupado =
                                    evento
                                        .getStartTime();


                                const fimOcupado =
                                    evento
                                        .getEndTime();


                                return (

                                    cursor <
                                    fimOcupado

                                    &&

                                    fimConsulta >
                                    inicioOcupado

                                );

                            }
                        );


                    /* ========================================
                       HORÁRIO LIVRE
                       ======================================== */

                    if (
                        estaNoFuturo &&
                        !temConflito
                    ) {

                        const data =
                            Utilities
                                .formatDate(

                                    cursor,

                                    CONFIG_AGENDA
                                        .FUSO,

                                    'yyyy-MM-dd'

                                );


                        const hora =
                            Utilities
                                .formatDate(

                                    cursor,

                                    CONFIG_AGENDA
                                        .FUSO,

                                    'HH:mm'

                                );


                        if (
                            !dias[
                            data
                            ]
                        ) {

                            dias[
                                data
                            ] =
                                [];

                        }


                        dias[
                            data
                        ].push(
                            hora
                        );

                    }


                    /* ========================================
                       AVANÇA 15 MINUTOS
                       ======================================== */

                    cursor =
                        new Date(

                            cursor
                                .getTime() +

                            CONFIG_AGENDA
                                .PASSO_MINUTOS *

                            60 *
                            1000

                        );

                }

            }
        );


        /* ====================================================
           REMOVER DUPLICADOS E ORDENAR
           ==================================================== */

        Object
            .keys(
                dias
            )
            .forEach(
                function (
                    data
                ) {

                    dias[
                        data
                    ] =
                        [
                            ...new Set(
                                dias[
                                data
                                ]
                            )
                        ].sort();

                }
            );


        /* ====================================================
           RESPOSTA PARA O SITE
           ==================================================== */

        return responder_(
            {

                ok:
                    true,

                fuso:
                    CONFIG_AGENDA
                        .FUSO,

                plano:
                    plano,

                duracaoMinutos:
                    duracaoMin,

                dias:
                    dias

            },
            e
        );


    } catch (
    erro
    ) {

        return responder_(
            {

                ok:
                    false,

                erro:
                    erro.message

            },
            e
        );

    }

}


/* ============================================================
   RETORNO JSON / JSONP
   ============================================================ */

function responder_(
    dados,
    e
) {

    const callback =
        String(
            (
                e &&
                e.parameter &&
                e.parameter.callback
            ) || ''
        );


    const json =
        JSON.stringify(
            dados
        );


    /*
     * O site está hospedado fora do Google.
     *
     * JSONP permite que ele consulte o Apps Script
     * sem termos problema de CORS.
     */

    if (
        callback &&
        /^[a-zA-Z_$][0-9a-zA-Z_$]*$/
            .test(
                callback
            )
    ) {

        return ContentService
            .createTextOutput(

                callback +
                '(' +
                json +
                ');'

            )
            .setMimeType(

                ContentService
                    .MimeType
                    .JAVASCRIPT

            );

    }


    /*
     * Se acessarmos diretamente pelo navegador,
     * devolve JSON normal.
     */

    return ContentService
        .createTextOutput(
            json
        )
        .setMimeType(

            ContentService
                .MimeType
                .JSON

        );

}
