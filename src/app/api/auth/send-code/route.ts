import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Server-side in-memory code store (resets on server restart)
const globalForCodes = globalThis as unknown as { verificationCodes: Map<string, { code: string; expiresAt: number }> };
if (!globalForCodes.verificationCodes) {
  globalForCodes.verificationCodes = new Map();
}

// QQ SMTP transporter (lazy init)
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (transporter) return transporter;

  const email = process.env.QQ_EMAIL;
  const password = process.env.QQ_SMTP_PASSWORD;

  if (!email || !password || email === "your_qq@qq.com") {
    console.warn("[SMTP] QQ_EMAIL or QQ_SMTP_PASSWORD not configured, falling back to console mode");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: "smtp.qq.com",
    port: 465,
    secure: true, // SSL
    auth: { user: email, pass: password },
  });

  return transporter;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code with 10-minute expiry
    globalForCodes.verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const mailer = getTransporter();

    if (!mailer) {
      // Dev fallback: print to console
      console.log(`\n========================================`);
      console.log(`[DEV] 验证码 for ${email}: ${code}`);
      console.log(`========================================\n`);
      return NextResponse.json({
        success: true,
        message: "验证码已发送（开发模式：请查看终端输出）",
        devCode: code, // only returned when SMTP not configured
      });
    }

    // Send real email
    await mailer.sendMail({
      from: `"校园互助答疑" <${process.env.QQ_EMAIL}>`,
      to: email,
      subject: "校园互助答疑平台 - 邮箱验证码",
      html: `
        <div style="max-width: 480px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">🎓 校园互助答疑平台</h1>
          </div>
          <div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">你好，</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">你正在注册校园互助答疑平台，验证码如下：</p>
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #92400e;">${code}</span>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>
          </div>
        </div>
      `,
    });

    console.log(`[SMTP] 验证码已发送至 ${email}: ${code}`);

    return NextResponse.json({
      success: true,
      message: "验证码已发送至你的邮箱，请查收",
    });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json({ error: "发送失败，请稍后重试" }, { status: 500 });
  }
}
