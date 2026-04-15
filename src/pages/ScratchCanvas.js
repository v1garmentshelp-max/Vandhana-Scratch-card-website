import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function ScratchCanvas({
  width = 300,
  height = 300,
  coverColor = '#C4C7CF',
  coverImage = null,
  brushSize = 20,
  finishPercent = 40,
  onComplete = () => {},
  children
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [done, setDone] = useState(false);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const throttleRef = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width = width;
    c.height = height;
    if (coverImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = coverImage;
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = coverColor;
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, coverColor, coverImage]);

  const rel = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }, []);

  const scratch = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last.current = { x, y };
  }, [brushSize]);

  const ratioCleared = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return 0;
    const ctx = c.getContext('2d');
    const step = 8;
    const { width: w, height: h } = c;
    const data = ctx.getImageData(0, 0, w, h).data;
    let clear = 0;
    let total = 0;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const a = data[(y * w + x) * 4 + 3];
        total++;
        if (a < 10) clear++;
      }
    }
    return (clear / total) * 100;
  }, []);

  const start = useCallback((x, y) => {
    drawing.current = true;
    last.current = { x, y };
  }, []);

  const move = useCallback((x, y) => {
    if (!drawing.current || done) return;
    scratch(x, y);
    const now = Date.now();
    if (now - throttleRef.current > 200) {
      throttleRef.current = now;
      const percent = ratioCleared();
      if (percent >= finishPercent) {
        setDone(true);
        onComplete();
      }
    }
  }, [done, scratch, ratioCleared, finishPercent, onComplete]);

  const end = useCallback(() => {
    drawing.current = false;
    if (!done) {
      const percent = ratioCleared();
      if (percent >= finishPercent) {
        setDone(true);
        onComplete();
      }
    }
  }, [done, ratioCleared, finishPercent, onComplete]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onMouseDown = (e) => {
      const { x, y } = rel(e.clientX, e.clientY);
      start(x, y);
    };

    const onMouseMove = (e) => {
      const { x, y } = rel(e.clientX, e.clientY);
      move(x, y);
    };

    const onTouchStart = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const { x, y } = rel(t.clientX, t.clientY);
      start(x, y);
    };

    const onTouchMove = (e) => {
      const t = e.touches[0];
      if (!t) return;
      const { x, y } = rel(t.clientX, t.clientY);
      move(x, y);
    };

    const onUp = () => end();

    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);

    return () => {
      wrap.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      wrap.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [rel, start, move, end]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width, height, touchAction: 'none' }}>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}