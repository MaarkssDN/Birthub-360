FROM pgvector/pgvector:pg17

# openssl: gera o certificado TLS autoassinado usado quando o Postgres sobe com `ssl=on`.
# Suporte a pgvector + PostGIS 3 com TLS autoassinado para ambientes de infraestrutura local/auxiliar.
# A chave privada nasce e fica dentro da imagem construída na própria instância (`build:` no
# compose) — nunca é commitada nem sai do servidor. Clientes usam `sslmode=require` (cifra o canal
# sem verificar CA), já que o certificado é autoassinado.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends postgresql-17-postgis-3 openssl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /etc/postgresql/tls \
    && openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
         -subj "/CN=birthhub-postgres" \
         -keyout /etc/postgresql/tls/server.key \
         -out /etc/postgresql/tls/server.crt \
    && chown postgres:postgres /etc/postgresql/tls/server.key /etc/postgresql/tls/server.crt \
    && chmod 600 /etc/postgresql/tls/server.key
