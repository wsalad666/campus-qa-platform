import { NextRequest, NextResponse } from "next/server";

const globalForCodes = globalThis as unknown as { verificationCodes: Map<string, { code: string; expiresAt: number }> };
if (!globalForCodes.verificationCodes) {
  globalForCodes.verificationCodes = new Map();
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "邮箱和验证码不能为空" }, { status: 400 });
    }

    const record = globalForCodes.verificationCodes.get(email);

    if (!record) {
      return NextResponse.json({ error: "请先发送验证码" }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      globalForCodes.verificationCodes.delete(email);
      return NextResponse.json({ error: "验证码已过期，请重新发送" }, { status: 400 });
    }

    if (record.code !== code) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    // Code verified, remove from store
    globalForCodes.verificationCodes.delete(email);

    return NextResponse.json({ success: true, message: "验证成功" });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
