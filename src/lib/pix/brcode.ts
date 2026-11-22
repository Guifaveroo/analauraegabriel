/**
 * Gerador de PIX estático no padrão BR Code (EMV® QRCPS-MPM) do Banco Central.
 * Referência: Manual de Padrões para Iniciação do Pix — BR Code.
 * Nenhuma API bancária é utilizada: o código é montado localmente.
 */

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

export type PixPayloadInput = {
  keyType: PixKeyType;
  key: string;
  beneficiary: string;
  city: string;
  amount?: number;
  txid?: string;
  description?: string;
};

/** CRC16/CCITT-FALSE (polinômio 0x1021, valor inicial 0xFFFF), exigido pelo campo 63. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  if (value.length > 99) throw new Error(`Campo ${id} excede 99 caracteres`);
  return id + String(value.length).padStart(2, "0") + value;
}

/** Remove acentos e caracteres fora do conjunto aceito pelos bancos. */
export function sanitizeText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 .,\-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

const onlyDigits = (v: string) => v.replace(/\D/g, "");

function validCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

function validCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

/** Normaliza a chave PIX conforme o tipo. Lança erro com mensagem amigável se inválida. */
export function normalizePixKey(type: PixKeyType, raw: string): string {
  const key = raw.trim();
  switch (type) {
    case "cpf": {
      const d = onlyDigits(key);
      if (!validCpf(d)) throw new Error("CPF inválido");
      return d;
    }
    case "cnpj": {
      const d = onlyDigits(key);
      if (!validCnpj(d)) throw new Error("CNPJ inválido");
      return d;
    }
    case "phone": {
      let d = onlyDigits(key);
      if (d.length === 10 || d.length === 11) d = "55" + d;
      if (!/^55\d{10,11}$/.test(d)) throw new Error("Telefone inválido — use DDD + número");
      return "+" + d;
    }
    case "email": {
      const e = key.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 77) throw new Error("E-mail inválido");
      return e;
    }
    case "random": {
      const r = key.toLowerCase();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(r)) {
        throw new Error("Chave aleatória inválida");
      }
      return r;
    }
  }
}

/** Monta o código "PIX copia e cola" (que também é o conteúdo do QR Code). */
export function buildPixPayload(input: PixPayloadInput): string {
  const key = normalizePixKey(input.keyType, input.key);
  const name = sanitizeText(input.beneficiary, 25);
  const city = sanitizeText(input.city, 15);
  if (!name) throw new Error("Nome do beneficiário obrigatório");
  if (!city) throw new Error("Cidade do beneficiário obrigatória");

  let account = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  const description = input.description ? sanitizeText(input.description, 99) : "";
  if (description) {
    const room = 99 - account.length - 4;
    if (room > 0) account += tlv("02", description.slice(0, room).trim());
  }

  const txid = (input.txid ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";

  let payload =
    tlv("00", "01") +
    tlv("26", account) +
    tlv("52", "0000") +
    tlv("53", "986");

  if (input.amount !== undefined && input.amount > 0) {
    payload += tlv("54", input.amount.toFixed(2));
  }

  payload += tlv("58", "BR") + tlv("59", name) + tlv("60", city) + tlv("62", tlv("05", txid));
  payload += "6304";
  return payload + crc16(payload);
}

/** Decodifica um payload EMV em pares id/valor (usado nos testes e na pré-visualização). */
export function parseEmv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (Number.isNaN(len)) throw new Error("Payload inválido");
    out[id] = payload.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

export function isValidPixPayload(payload: string): boolean {
  if (payload.length < 8) return false;
  const body = payload.slice(0, -4);
  return body.endsWith("6304") && crc16(body) === payload.slice(-4);
}
