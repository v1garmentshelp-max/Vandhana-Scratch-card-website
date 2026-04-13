import React, { useEffect, useRef, useState } from 'react';

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
    const ctx = c.getContext('2d');
    c.width = width;
    c.height = height;
    if (coverImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = coverImage;
    } else {
      ctx.fillStyle = coverColor;
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, coverColor, coverImage]);

  const rel = (clientX, clientY) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const scratch = (x, y) => {
    const ctx = canvasRef.current.getContext('2d');
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
  };

  const ratioCleared = () => {
    const c = canvasRef.current;
    const ctx = c.getContext('2d');
    const step = 8;
    const { width: w, height: h } = c;
    const data = ctx.getImageData(0, 0, w, h).data;
    let clear = 0, total = 0;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const a = data[(y * w + x) * 4 + 3];
        total++;
        if (a < 10) clear++;
      }
    }
    return (clear / total) * 100;
  };

  const start = (x, y) => {
    drawing.current = true;
    last.current = { x, y };
  };
  const move = (x, y) => {
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
  };
  const end = () => {
    drawing.current = false;
    if (!done) {
      const percent = ratioCleared();
      if (percent >= finishPercent) {
        setDone(true);
        onComplete();
      }
    }
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const onMouseDown = (e) => start(...Object.values(rel(e.clientX, e.clientY)));
    const onMouseMove = (e) => move(...Object.values(rel(e.clientX, e.clientY)));
    const onTouchStart = (e) => {
      const t = e.touches[0];
      start(...Object.values(rel(t.clientX, t.clientY)));
    };
    const onTouchMove = (e) => {
      const t = e.touches[0];
      move(...Object.values(rel(t.clientX, t.clientY)));
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
  }, [done]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width, height, touchAction: 'none' }}>
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
