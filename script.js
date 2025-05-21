// 加载 JSON 文件
fetch("d:/cheng/programing/web/project/wxw/data/datadetail/1_1.json")
  .then((response) => response.json())
  .then((data) => {
    const contentDiv = document.getElementById("content");
    for (const key in data) {
      const item = data[key];
      const button = document.createElement("button");
      button.textContent = key;
      button.addEventListener("click", () => {
        if (item.flag === "1") {
          if (item.MixFile) {
            // 复制 MixFile 链接
            navigator.clipboard
              .writeText(item.MixFile)
              .then(() => {
                const notice = document.getElementById("copy-notice");
                notice.classList.remove("hidden");
                setTimeout(() => {
                  notice.classList.add("hidden");
                }, 5000);
              })
              .catch((err) => {
                console.error("复制失败: ", err);
              });
          }
        }
      });
      contentDiv.appendChild(button);
    }
  })
  .catch((error) => console.error("加载 JSON 失败: ", error));
