import { formatProfileLeagueLabel } from "../../lib/profileLeagueLabel";

describe("profile league label", () => {
  test("リーグ未参加時は unjoined ラベルを表示", () => {
    expect(formatProfileLeagueLabel(null, "未参加")).toBe("未参加");
  });

  test("リーグ取得時は icon + tier name を表示", () => {
    expect(
      formatProfileLeagueLabel(
        {
          tier_icon: "🥈",
          tier_name: "シルバー",
        },
        "未参加"
      )
    ).toBe("🥈 シルバー");
  });
});
