import { describe, expect, it } from "vitest";
import { nextStage } from "./uploadMachine";

describe("upload machine stages", () => {
  it("advances processing stages until completion", () => {
    expect(nextStage("reading")).toBe("identifying");
    expect(nextStage("identifying")).toBe("extracting");
    expect(nextStage("extracting")).toBe("matching");
    expect(nextStage("matching")).toBe("completed");
    expect(nextStage("completed")).toBeNull();
  });
});
