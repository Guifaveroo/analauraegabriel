import { describe, expect, it } from "vitest";
import { buildPixPayload, crc16, isValidPixPayload, normalizePixKey, parseEmv, sanitizeText } from "@/lib/pix/brcode";

describe("crc16", () => {
  it("calcula o valor de verificação padrão CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("buildPixPayload", () => {
  it("reproduz o exemplo do manual do Banco Central", () => {
    const payload = buildPixPayload({
      keyType: "random",
      key: "123e4567-e12b-12d1-a456-426655440000",
      beneficiary: "Fulano de Tal",
      city: "BRASILIA",
    });
    expect(payload).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("inclui valor, txid e normaliza nome/cidade", () => {
    const payload = buildPixPayload({
      keyType: "email",
      key: "Noivos@Exemplo.com",
      beneficiary: "Ana Laura Conceição de Albuquerque Souza",
      city: "São José dos Campos",
      amount: 250,
      txid: "PRES-ABC123",
    });
    const f = parseEmv(payload);
    expect(f["54"]).toBe("250.00");
    expect(f["59"]).toBe("Ana Laura Conceicao de Al");
    expect(f["59"].length).toBeLessThanOrEqual(25);
    expect(f["60"]).toBe("Sao Jose dos Ca");
    expect(parseEmv(f["26"])["01"]).toBe("noivos@exemplo.com");
    expect(parseEmv(f["62"])["05"]).toBe("PRESABC123");
    expect(isValidPixPayload(payload)).toBe(true);
  });

  it("gera um código diferente para cada valor", () => {
    const base = { keyType: "cpf" as const, key: "529.982.247-25", beneficiary: "Ana", city: "Recife" };
    const a = buildPixPayload({ ...base, amount: 100 });
    const b = buildPixPayload({ ...base, amount: 100.5 });
    expect(a).not.toBe(b);
    expect(parseEmv(b)["54"]).toBe("100.50");
  });

  it("detecta payload adulterado", () => {
    const p = buildPixPayload({ keyType: "phone", key: "(11) 98765-4321", beneficiary: "Ana", city: "SP", amount: 10 });
    expect(isValidPixPayload(p)).toBe(true);
    expect(isValidPixPayload(p.replace("10.00", "99.00"))).toBe(false);
  });
});

describe("normalizePixKey", () => {
  it("valida e normaliza cada tipo de chave", () => {
    expect(normalizePixKey("cpf", "529.982.247-25")).toBe("52998224725");
    expect(() => normalizePixKey("cpf", "111.111.111-11")).toThrow();
    expect(normalizePixKey("cnpj", "11.222.333/0001-81")).toBe("11222333000181");
    expect(() => normalizePixKey("cnpj", "11.222.333/0001-82")).toThrow();
    expect(normalizePixKey("phone", "11 98765-4321")).toBe("+5511987654321");
    expect(normalizePixKey("phone", "+55 (21) 3456-7890")).toBe("+552134567890");
    expect(() => normalizePixKey("email", "invalido")).toThrow();
    expect(() => normalizePixKey("random", "abc")).toThrow();
  });
});

describe("sanitizeText", () => {
  it("remove acentos e símbolos", () => {
    expect(sanitizeText("Ação & Coração!", 25)).toBe("Acao Coracao");
  });
});
