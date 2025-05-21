var f = ["🌑", "🌒", "🌓", "🌔", "🌝", "🌖", "🌗", "🌘"];

function loop() {
  location.hash = f[Math.floor((Date.now() / 100) % f.length)];

  setTimeout(loop, 50);
}

// 判断当前窗口宽度是否大于 768px，若大于则认为是电脑屏幕，启动动画
if (window.innerWidth > 768) {
  loop();
}
