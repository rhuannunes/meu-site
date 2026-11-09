import hashlib
import hmac
import json
import re
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import parse_qs, urlsplit
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


def contratacoes(acao=None, referencia=None, pedido=None):
    url = os.environ["CONTRATACOES_SCRIPT_URL"]
    chave = os.environ["CONTRATACOES_SECRET"]
    corpo = {"chave": chave, "acao": acao, "referencia": referencia, "pedido": pedido}
    requisicao = urllib.request.Request(
        url,
        data=json.dumps(corpo).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(requisicao, timeout=8) as resposta:
        resultado = json.load(resposta)
    if resultado.get("ok") is not True:
        raise RuntimeError("Apps Script recusou a operação")
    return resultado


def agora():
    return datetime.now(timezone.utc).isoformat()


class handler(BaseHTTPRequestHandler):

    def confirmar_pagamento(self, parametros):
        segredo = os.environ.get("MERCADO_PAGO_WEBHOOK_SECRET")
        if not segredo:
            return self.responder({"ok": False, "erro": "Webhook não configurado."}, 503)

        order_id = parametros.get("data.id", [""])[0]
        request_id = self.headers.get("x-request-id", "")
        assinatura = dict(
            (chave.strip(), valor.strip())
            for parte in self.headers.get("x-signature", "").split(",")
            for chave, separador, valor in [parte.partition("=")]
            if separador
        )
        ts = assinatura.get("ts", "")
        recebido = assinatura.get("v1", "")
        if not re.fullmatch(r"ORD[A-Z0-9]+", order_id, re.IGNORECASE) or not request_id or not ts.isdecimal():
            self.log_message("Webhook recusado: id_valido=%s request_id_presente=%s timestamp_valido=%s", bool(re.fullmatch(r"ORD[A-Z0-9]+", order_id, re.IGNORECASE)), bool(request_id), ts.isdecimal())
            return self.responder({"ok": False}, 401)
        manifesto = f"id:{order_id};request-id:{request_id};ts:{ts};"
        esperado = hmac.new(segredo.encode(), manifesto.encode(), hashlib.sha256).hexdigest()
        if not re.fullmatch(r"[a-f0-9]{64}", recebido) or not hmac.compare_digest(esperado, recebido):
            self.log_message("Webhook recusado: %s", "assinatura divergente" if re.fullmatch(r"[a-f0-9]{64}", recebido) else "assinatura ausente ou malformada")
            return self.responder({"ok": False}, 401)

        return self.registrar_pagamento(order_id)

    def recuperar_pagamento(self, parametros):
        segredo = os.environ.get("CONTRATACOES_SECRET", "")
        chave = self.headers.get("X-Contratacoes-Key", "")
        if not segredo or not hmac.compare_digest(chave.encode(), segredo.encode()):
            self.log_message("Recuperação recusada: chave_recebida=%s chave_configurada=%s", bool(chave), bool(segredo))
            return self.responder({"ok": False, "erro": "Acesso negado."}, 401)

        order_id = parametros.get("order_id", [""])[0]
        if not re.fullmatch(r"ORDTST[A-Z0-9]{1,60}", order_id):
            return self.responder({"ok": False, "erro": "Informe o ID de um pedido de teste."}, 400)
        return self.registrar_pagamento(order_id, recuperacao=True)

    def registrar_pagamento(self, order_id, recuperacao=False):
        try:
            token = os.environ["MERCADO_PAGO_ACCESS_TOKEN"]
            requisicao = urllib.request.Request(
                f"https://api.mercadopago.com/v1/orders/{order_id.upper()}",
                headers={"Authorization": "Bearer " + token},
            )
            with urllib.request.urlopen(requisicao, timeout=7) as resposta:
                ordem = json.load(resposta)
            if ordem.get("status") != "processed" or ordem.get("status_detail") != "accredited":
                if recuperacao:
                    return self.responder({"ok": False, "erro": "Pedido ainda não creditado."}, 409)
                return self.responder({"ok": True})

            referencia = ordem.get("external_reference", "")
            if not re.fullmatch(r"rn_(basic|essencial|premium)_[136]_[a-f0-9]{16}", referencia):
                return self.responder({"ok": True})
            pedido = contratacoes("ler_pendente", referencia).get("pedido")
            if not pedido:
                if recuperacao:
                    return self.responder({"ok": False, "erro": "Pedido pendente ausente ou já registrado."}, 404)
                # Notificação repetida após a remoção do pendente, ou pedido anterior à integração.
                return self.responder({"ok": True})

            esperado = Decimal(str(pedido["VALOR"]))
            if (
                str(ordem.get("id", "")).lower() != order_id.lower()
                or pedido.get("MERCADO_PAGO_ORDER_ID") != ordem.get("id")
                or Decimal(str(ordem.get("total_amount"))) != esperado
                or Decimal(str(ordem.get("total_paid_amount"))) < esperado
            ):
                return self.responder({"ok": False, "erro": "Pedido não corresponde ao pagamento."}, 409)

            pedido.update({
                "STATUS_PAGAMENTO": "APROVADO",
                "MERCADO_PAGO_ORDER_ID": ordem["id"],
                "MERCADO_PAGO_STATUS": ordem["status_detail"],
                "PAGO_EM": ordem.get("last_updated_date") or agora(),
            })
            contratacoes(pedido=pedido)
            contratacoes("remover_pendente", referencia)
            return self.responder({"ok": True})
        except Exception:
            # A resposta não expõe credenciais nem dados pessoais e permite retentativa.
            return self.responder({"ok": False, "erro": "Falha ao registrar confirmação."}, 503)


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
        parametros = parse_qs(urlsplit(self.path).query)
        if parametros.get("recuperar") == ["1"]:
            return self.recuperar_pagamento(parametros)

        if parametros.get("webhook") == ["1"]:
            return self.confirmar_pagamento(parametros)

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


            if not checkout_url or not order_id:

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
            # 9. GUARDAR CONTATO ANTES DE DEVOLVER A URL
            # -------------------------------------------------

            if os.environ.get("MERCADO_PAGO_WEBHOOK_SECRET"):
                nome = str(cliente.get("nome", "")).strip()
                whatsapp = str(cliente.get("whatsapp", "")).strip()
                if not nome or not whatsapp or len(nome) > 200 or len(whatsapp) > 40 or len(email) > 254:
                    return self.responder({"ok": False, "erro": "Confira nome, e-mail e WhatsApp."}, 400)
                try:
                    contratacoes("guardar_pendente", referencia, {
                        "PEDIDO_ID": referencia,
                        "CRIADO_EM": agora(),
                        "PLANO": plano,
                        "PERIODO": "Mensal" if meses == 1 else f"{meses} meses",
                        "MESES": meses,
                        "VALOR": float(produto["valor"]),
                        "NOME": nome,
                        "EMAIL": email,
                        "WHATSAPP": whatsapp,
                        "MERCADO_PAGO_ORDER_ID": order_id,
                    })
                except Exception:
                    return self.responder({"ok": False, "erro": "Não foi possível preparar o registro do pedido."}, 503)

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