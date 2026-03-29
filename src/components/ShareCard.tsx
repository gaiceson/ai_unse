import { useRef, useCallback } from 'react';

interface Props {
  title: string;
  score?: number;
  message: string;
  type: string;
}

export function ShareCard({ title, score, message, type }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const MSG_FONT = '26px -apple-system, sans-serif';
    const LINE_H = 40;
    const MAX_W = 860;

    // Pre-measure message height using an offscreen canvas
    const measureMsgHeight = () => {
      const mc = document.createElement('canvas');
      mc.width = 1080;
      const mctx = mc.getContext('2d');
      if (!mctx) return 0;
      mctx.font = MSG_FONT;
      let h = 0;
      for (const para of message.split('\n')) {
        if (para === '') { h += LINE_H / 2; continue; }
        let line = '';
        for (const char of para.split('')) {
          if (mctx.measureText(line + char).width > MAX_W) { h += LINE_H; line = char; }
          else line += char;
        }
        h += LINE_H;
      }
      return h;
    };

    const startY = score !== undefined ? 660 : 420;
    const msgH = measureMsgHeight();
    const footerY = startY + msgH + 30;
    const totalH = Math.max(1080, footerY + 60);

    canvas.width = 1080;
    canvas.height = totalH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, totalH);

    // Top accent bar
    ctx.fillStyle = '#3182F6';
    ctx.fillRect(0, 0, 1080, 6);

    ctx.textAlign = 'center';

    // App name
    ctx.fillStyle = '#191F28';
    ctx.font = 'bold 44px -apple-system, sans-serif';
    ctx.fillText('운세연구소', 540, 120);

    // Type badge
    ctx.fillStyle = '#3182F6';
    ctx.font = '28px -apple-system, sans-serif';
    ctx.fillText(type, 540, 170);

    // Divider
    ctx.strokeStyle = '#E5E8EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 210);
    ctx.lineTo(880, 210);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#191F28';
    ctx.font = 'bold 40px -apple-system, sans-serif';
    ctx.fillText(title, 540, 290);

    // Score circle
    if (score !== undefined) {
      ctx.beginPath();
      ctx.arc(540, 460, 110, 0, Math.PI * 2);
      ctx.strokeStyle = '#E5E8EB';
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(540, 460, 110, -Math.PI / 2, -Math.PI / 2 + (score / 100) * Math.PI * 2);
      ctx.strokeStyle = score >= 80 ? '#10B981' : '#3182F6';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.fillStyle = '#191F28';
      ctx.font = 'bold 64px -apple-system, sans-serif';
      ctx.fillText(`${score}`, 540, 480);
    }

    // Message (full, no cutoff)
    ctx.fillStyle = '#8B95A1';
    ctx.font = MSG_FONT;
    let y = startY;
    for (const para of message.split('\n')) {
      if (para === '') { y += LINE_H / 2; continue; }
      let line = '';
      for (const char of para.split('')) {
        const test = line + char;
        if (ctx.measureText(test).width > MAX_W) {
          ctx.fillText(line, 540, y);
          line = char;
          y += LINE_H;
        } else line = test;
      }
      ctx.fillText(line, 540, y);
      y += LINE_H;
    }

    // Footer (always below message)
    ctx.fillStyle = '#B0B8C1';
    ctx.font = '22px -apple-system, sans-serif';
    ctx.fillText('토스에서 운세연구소 보기', 540, y + 30);
  }, [title, score, message, type]);

  const getDeepLinkPath = useCallback(() => {
    const pathMap: Record<string, string> = {
      '오늘의 운세': 'intoss://fortunelab/fortune',
      '사주 분석': 'intoss://fortunelab/saju',
      '타로': 'intoss://fortunelab/tarot',
      '궁합 분석': 'intoss://fortunelab/compat',
      '상담': 'intoss://fortunelab/consult',
    };
    return pathMap[type] ?? 'intoss://fortunelab';
  }, [type]);

  const handleShare = useCallback(async () => {
    try {
      const { share } = await import('@apps-in-toss/web-framework');
      const scoreText = score !== undefined ? ` ${score}점` : '';

      // getTossShareLink is optional — fails before app is officially released
      let tossLinkLine = '';
      try {
        const { getTossShareLink } = await import('@apps-in-toss/web-bridge');
        const tossLink = await getTossShareLink(getDeepLinkPath());
        tossLinkLine = `\n\n👉 ${tossLink}`;
      } catch { /* pre-release or unsupported — share without deeplink */ }

      await share({
        message: `${title}${scoreText}\n\n${message}${tossLinkLine}\n\n[운세연구소]`,
      });
    } catch {
      // Share cancelled or not in Toss app - fallback to image download
      generateImage();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'unse-lab.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [generateImage, getDeepLinkPath, title, score, message]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button className="btn-secondary" onClick={handleShare}>
        공유하기
      </button>
    </>
  );
}
