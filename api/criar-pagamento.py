import json
import os
import uuid
import urllib.request
import urllib.error

from http.server import BaseHTTPRequestHandler


# =========================================================
# PREÇOS OFICIAIS
# =========================================================
#
# IMPORTANTE:
# O navegador NÃO decide o preço.
# O servidor decide o preço usando plano + quantidade de meses.
#
# Isso impede que alguém altere o valor pelo DevTools.
# =========================================================

PLANOS = {

    "basic": {
        1: {
            "nome": "Plano Basic - Mensal",
            "valor": "199.90"
        },

        3: {
            "nome": "Plano Basic - 3 meses",
            "valor": "549.90"
        },

        6: {
            "nome": "Plano Basic - 6 meses",
            "valor": "999.90"
        }
    },


    "essencial": {
        1: {
            "nome": "Plano Essencial - Mensal",
            "valor": "249.90"
        },

        3: {
            "nome": "Plano Essencial - 3 meses",
            "valor": "649.90"
        },

        6: {
            "nome": "Plano Essencial - 6 meses",
            "valor": "1149.90"
        }
    },


    "premium": {
        1: {
            "nome": "Plano Premium - Mensal",
            "valor": "299.90"
        },

        3: {
            "nome": "Plano Premium - 3 meses",
            "valor": "799.90"
        },

        6: {
            "nome": "Plano Premium - 6 meses",
            "valor": "1399.90"
        }
    }
}


class handler(BaseHTTPRequestHandler):

    # =====================================================
    # HEADERS
    # =====================================================

    def enviar_headers(self, status=200):

        self.send_response(status)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )

        self.end_headers()


    # =====================================================
    # RESPOSTA JSON
    # =====================================================

    def responder(self, dados, status=200):

        self.enviar_headers(status)

        resposta = json.dumps(
            dados,
            ensure_ascii=False
        )

        self.wfile.write(
            resposta.encode("utf-8")
        )


    # =====================================================
    # TESTE DO ENDPOINT
    # =====================================================

    def do_GET(self):

        self.responder({
            "ok": True,
            "mensagem": "Backend do Mercado Pago funcionando.",
            "endpoint": "/api/criar-pagamento"
        })


    # =====================================================
    # PREFLIGHT CORS
    # =====================================================

    def do_OPTIONS(self):

        self.enviar_headers(204)


    # =====================================================
    # CRIAR PAGAMENTO
    # =====================================================

    def do_POST(self):

        try:

            # -------------------------------------------------
            # 1. ACCESS TOKEN
            # -------------------------------------------------

            access_token = os.environ.get(
                "MERCADO_PAGO_ACCESS_TOKEN"
            )

            if not access_token:

                self.responder(
                    {
                        "ok": False,
                        "erro": (
                            "MERCADO_PAGO_ACCESS_TOKEN "
                            "não está configurado na Vercel."
                        )
                    },
                    500
                )

                return


            # -------------------------------------------------
            # 2. LER O JSON ENVIADO PELO SITE
            # -------------------------------------------------

            tamanho = int(
                self.headers.get(
                    "Content-Length",
                    0
                )
            )

            corpo = self.rfile.read(
                tamanho
            ).decode("utf-8")

            dados = json.loads(
                corpo or "{}"
            )


            # -------------------------------------------------
            # 3. IDENTIFICAR PLANO
            # -------------------------------------------------

            plano = str(
                dados.get(
                    "plano",
                    ""
                )
            ).strip().lower()

            try:

                meses = int(
                    dados.get(
                        "meses",
                        0
                    )
                )

            except (TypeError, ValueError):

                meses = 0


            if (
                plano not in PLANOS
                or meses not in PLANOS[plano]
            ):

                self.responder(
                    {
                        "ok": False,
                        "erro": "Plano ou período inválido."
                    },
                    400
                )

                return


            produto = PLANOS[
                plano
            ][
                meses
            ]


            # -------------------------------------------------
            # 4. DADOS DO CLIENTE
            # -------------------------------------------------

            cliente = dados.get(
                "cliente",
                {}
            )

            if not isinstance(
                cliente,
                dict
            ):

                cliente = {}


            email = str(
                cliente.get(
                    "email",
                    ""
                )
            ).strip()


            if (
                not email
                or "@" not in email
            ):

                self.responder(
                    {
                        "ok": False,
                        "erro": (
                            "Informe um e-mail válido "
                            "antes de iniciar o pagamento."
                        )
                    },
                    400
                )

                return


            # -------------------------------------------------
            # 5. IDENTIFICADOR INTERNO
            # -------------------------------------------------

            referencia = (
                "rn_"
                + plano
                + "_"
                + str(meses)
                + "_"
                + uuid.uuid4().hex[:16]
            )


            # -------------------------------------------------
            # 6. ORDER DO MERCADO PAGO
            # -------------------------------------------------

            order = {

                "type":
                    "online",

                "processing_mode":
                    "manual",

                "total_amount":
                    produto["valor"],

                "external_reference":
                    referencia,

                "description":
                    produto["nome"],

                "payer": {
                    "email":
                        email
                },

                "items": [
                    {
                        "title":
                            produto["nome"],

                        "unit_price":
                            produto["valor"],

                        "quantity":
                            1
                    }
                ]
            }


            # -------------------------------------------------
            # 7. REQUISIÇÃO AO MERCADO PAGO
            # -------------------------------------------------

            requisicao = urllib.request.Request(

                "https://api.mercadopago.com/v1/orders",

                data=json.dumps(
                    order
                ).encode("utf-8"),

                headers={
                    "Authorization":
                        "Bearer " + access_token,

                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json",

                    "X-Idempotency-Key":
                        str(uuid.uuid4())
                },

                method="POST"
            )


            # -------------------------------------------------
            # 8. RESPOSTA DO MERCADO PAGO
            # -------------------------------------------------

            with urllib.request.urlopen(
                requisicao,
                timeout=20
            ) as resposta_mp:

                retorno = json.loads(
                    resposta_mp
                    .read()
                    .decode("utf-8")
                )


            checkout_url = retorno.get(
                "checkout_url"
            )

            order_id = retorno.get(
                "id"
            )


            if not checkout_url:

                self.responder(
                    {
                        "ok": False,
                        "erro": (
                            "Mercado Pago não retornou "
                            "a URL do checkout."
                        ),
                        "detalhes": retorno
                    },
                    502
                )

                return


            # -------------------------------------------------
            # 9. DEVOLVER URL PARA O SITE
            # -------------------------------------------------

            self.responder({
                "ok": True,

                "checkoutUrl":
                    checkout_url,

                "orderId":
                    order_id,

                "referencia":
                    referencia
            })


        # =====================================================
        # ERRO RETORNADO PELO MERCADO PAGO
        # =====================================================

        except urllib.error.HTTPError as erro:

            try:

                detalhes = json.loads(
                    erro.read().decode(
                        "utf-8"
                    )
                )

            except Exception:

                detalhes = {
                    "mensagem":
                        "Erro retornado pelo Mercado Pago."
                }


            self.responder(
                {
                    "ok": False,
                    "erro": (
                        "O Mercado Pago recusou "
                        "a criação do pagamento."
                    ),
                    "detalhes": detalhes
                },
                erro.code
            )


        # =====================================================
        # OUTRO ERRO
        # =====================================================

        except Exception as erro:

            self.responder(
                {
                    "ok": False,
                    "erro": str(erro)
                },
                500
            )