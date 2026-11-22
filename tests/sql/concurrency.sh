#!/usr/bin/env bash
# Dispara 20 solicitações simultâneas para um presente de quantidade 3.
# Esperado: exatamente 3 sucessos.
set -euo pipefail
DB="${1:-wedtest}"
PSQL="psql -X -q -t -A -d $DB"
TMP=$(mktemp)
GIFT=$($PSQL -c "insert into public.gifts (name, price, mode, quantity) values ('Teste concorrência', 10, 'limited', 3) returning id" | head -1)
for i in $(seq 1 20); do
  ( $PSQL -c "select 1 from public.create_gift_order('$GIFT', 'Convidado $i', null)" >/dev/null 2>&1 && echo ok || echo fail ) &
done > "$TMP"; wait
OK=$(grep -c ok "$TMP" || true)
COUNT=$($PSQL -c "select count(*) from public.gift_orders where gift_id = '$GIFT'")
$PSQL -c "delete from public.gift_orders where gift_id='$GIFT'; delete from public.gifts where id='$GIFT'" >/dev/null
rm -f "$TMP"
echo "sucessos=$OK pedidos=$COUNT"
[ "$OK" = "3" ] && [ "$COUNT" = "3" ] && echo "OK: concorrência" || { echo "FALHA: concorrência"; exit 1; }
