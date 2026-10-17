import { describe, expect, it } from "vitest";
import { DEFAULT_MATH_BATTLE_GIFT_MAPPINGS, findMathBattleGiftMapping, parseTeamJoinComment } from "../../src/index.js";

describe("Tarik Tambang comment & gift parsing", () => {
  it("numbers are answers, never team joins", () => {
    expect(parseTeamJoinComment("1")).toBeNull();
    expect(parseTeamJoinComment("2")).toBeNull();
  });

  it("accepts loose team join spellings", () => {
    expect(parseTeamJoinComment("tim biru")).toBe("BLUE");
    expect(parseTeamJoinComment("#MERAH!")).toBe("RED");
    expect(parseTeamJoinComment("biru dong")).toBeNull();
  });

  it("matches default gifts by TikTok id or name", () => {
    expect(findMathBattleGiftMapping(DEFAULT_MATH_BATTLE_GIFT_MAPPINGS, "5655")?.team).toBe("BLUE");
    expect(findMathBattleGiftMapping(DEFAULT_MATH_BATTLE_GIFT_MAPPINGS, "999999", "tiktok")?.team).toBe("RED");
    expect(findMathBattleGiftMapping(DEFAULT_MATH_BATTLE_GIFT_MAPPINGS, "999999", "Unknown")).toBeNull();
  });
});
