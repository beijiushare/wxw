// 全局状态
let currentPath = [];
// 基础 Giscus 链接模板
const baseGiscusUrl =
  "https://giscus.app/zh-CN/widget?origin=http%3A%2F%2F127.0.0.1%3A5500%2F&session=149fe82e2daee83dcc51ad25y5OeLQ%2Bz%2FL5yVVME5wK2IqQB3Q2d5qFVGddUtS%2FyouBsyyuroZeW7dZZWCOglt9R8uPc7k%2FBdIVAx22xwMlsQT0%2B3uTPNzZfWCEitbs2tWpy5Xj3kC66G8PiNH0%3D&theme=preferred_color_scheme&reactionsEnabled=1&emitMetadata=0&inputPosition=top&repo=beijiushare%2Fwxw&repoId=R_kgDOOkuBRg&category=&categoryId=undefined&strict=0&description=&backLink=http%3A%2F%2F127.0.0.1%3A5500%2F&number=";

// 存储当前的 term
let currentGiscusTerm = "5";

// 工具函数：递归加载 JSON 数据
async function loadData(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`${filePath} 加载失败`);
    const data = await response.json();

    // 递归处理对象，加载子 JSON 文件
    async function processObject(obj) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key) && obj[key].dataFile) {
          const subData = await loadData(`data/${obj[key].dataFile}`);
          obj[key] = { ...obj[key], ...subData };
          delete obj[key].dataFile;
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          await processObject(obj[key]);
        }
      }
      return obj;
    }

    return processObject(data);
  } catch (error) {
    console.error("加载 JSON 文件时出错:", error);
    return {};
  }
}

// 功能函数：更新路径导航
function updatePath() {
  const pathElement = document.getElementById("path");
  pathElement.innerHTML = "";

  // 根目录按钮
  const home = document.createElement("span");
  home.className = "home";
  home.textContent = "根目录";
  home.addEventListener("click", () => {
    currentPath = [];
    updatePath();
    navigateToPath();
  });
  pathElement.appendChild(home);

  if (currentPath.length === 0) return;

  // 路径分隔符
  pathElement.appendChild(document.createTextNode(" > "));

  // 路径分段
  let tempPath = [];
  currentPath.forEach((segment, index) => {
    tempPath.push(segment);
    const span = document.createElement("span");
    span.className = "path-segment";
    span.textContent = segment;

    // 非末级路径可点击返回
    if (index < currentPath.length - 1) {
      span.addEventListener("click", () => {
        currentPath = currentPath.slice(0, index + 1);
        updatePath();
        navigateToPath();
      });
    } else {
      span.style.fontWeight = "bold";
      span.style.color = "#333";
    }

    pathElement.appendChild(span);
    if (index < currentPath.length - 1) {
      const separator = document.createElement("span");
      separator.className = "path-separator";
      separator.textContent = ">";
      pathElement.appendChild(separator);
    }
  });
}

// 功能函数：导航到目标路径
function showLoading() {
  document.getElementById("loading").classList.remove("hide");
}

function hideLoading() {
  document.getElementById("loading").classList.add("hide");
}

function navigateToPath() {
  showLoading();
  loadData("data/content.json").then((data) => {
    let currentData = data;
    try {
      for (const segment of currentPath) {
        currentData = currentData[segment];
      }
      displayCatalog(currentData, document.getElementById("catalog"));
    } catch (error) {
      console.error("路径导航错误:", error);
      displayCatalog({}, document.getElementById("catalog"));
    } finally {
      hideLoading();
    }
  });
}

// 动态更新 Giscus iframe 的 src
function updateGiscusIframe(term) {
  currentGiscusTerm = term;
}

function displayCatalog(data, parentElement) {
  parentElement.innerHTML = "";
  const markdownContent = document.getElementById("markdown-content");
  markdownContent.innerHTML = "";

  if (Object.keys(data).length === 0) {
    parentElement.innerHTML =
      '<li class="empty-message">暂无内容（数据加载失败或目录为空）</li>';
    return;
  }

  // 处理层级描述（index.md）
  if (data.index) {
    const indexPath = `doc/${data.index.replace(/^\.\//, "")}`;
    fetch(indexPath)
      .then((res) => res.text())
      .then((text) => {
        markdownContent.innerHTML = marked.parse(text);
        // 提取 data-term 并更新 Giscus iframe
        const termMatch = text.match(/<!--\s*data-term="(\d+)"\s*-->/);
        const term = termMatch ? termMatch[1] : "5";
        updateGiscusIframe(term);
      })
      .catch((error) => {
        console.error("加载描述文件失败，路径:", indexPath, "错误:", error);
        markdownContent.innerHTML = `<div>加载描述失败（路径: ${indexPath}，错误已记录控制台）</div>`;
      });
  } else {
    markdownContent.innerHTML = "<div>本页面暂无描述</div>";
    // 若没有描述文件，设置默认的评论区
    updateGiscusIframe("5");
  }

  // 渲染目录列表
  try {
    for (const key in data) {
      if (key === "index") continue;

      const li = document.createElement("li");
      const value = data[key];

      const isMdFile =
        typeof value === "string" && value.toLowerCase().endsWith(".md");
      const isFinalLevel = value && value.flag === "1";
      const fileIcon =
        isFinalLevel || isMdFile
          ? "📄"
          : typeof value === "object" && value !== null
          ? "📁"
          : "📄";
      li.innerHTML = `<span class="file-icon">${fileIcon}</span>${key}`;

      if (isFinalLevel) {
        // 最后一个层级，弹出包含链接按钮的弹窗
        li.className = "file";
        li.addEventListener("click", () => {
          const modal = document.createElement("div");
          modal.className = "custom-modal";

          const modalContent = document.createElement("div");
          modalContent.className = "modal-content";

          // 遍历除 flag 外的其他属性作为链接
          for (const linkKey in value) {
            if (linkKey === "flag") continue;
            const linkBtn = document.createElement("button");
            linkBtn.className = "modal-link-btn";
            linkBtn.textContent = linkKey;
            linkBtn.addEventListener("click", () => {
              window.open(value[linkKey], "_blank");
              modal.remove(); // 点击后关闭弹窗
            });
            modalContent.appendChild(linkBtn);
          }

          // 创建关闭按钮
          const closeBtn = document.createElement("button");
          closeBtn.className = "modal-close-btn";
          closeBtn.textContent = "×";
          closeBtn.addEventListener("click", () => {
            modal.remove();
          });
          modalContent.appendChild(closeBtn);

          modal.appendChild(modalContent);
          document.body.appendChild(modal);
        });
      } else if (isMdFile) {
        // Markdown 文件处理
        li.className = "file";
        li.addEventListener("click", () => {
          currentPath = [key];
          updatePath();
          const mdFullPath = `doc/${value}`;
          fetch(mdFullPath)
            .then((res) => res.text())
            .then((text) => {
              markdownContent.innerHTML = marked.parse(text);
              const termMatch = text.match(/<!--\s*data-term="(\d+)"\s*-->/);
              const term = termMatch ? termMatch[1] : "5";
              updateGiscusIframe(term);
            })
            .catch((err) => {
              markdownContent.innerHTML = `<div>文件加载失败：${mdFullPath}</div>`;
            });
        });
      } else if (typeof value === "object" && value !== null) {
        // 文件夹处理
        li.addEventListener("click", () => {
          currentPath.push(key);
          updatePath();
          navigateToPath();
        });
      } else {
        // 普通文件处理
        li.className = "file";
        li.addEventListener("click", () => window.open(value, "_blank"));
      }
      parentElement.appendChild(li);
    }
  } catch (error) {
    console.error("目录渲染错误:", error);
    parentElement.innerHTML =
      '<li class="empty-message">目录渲染失败，请刷新页面</li>';
  }
}

async function initialize() {
  showLoading();
  try {
    const data = await loadData("data/content.json");
    displayCatalog(data, document.getElementById("catalog"));
    updatePath();
  } finally {
    hideLoading();
  }
}
initialize();

// 获取按钮元素
const giscusButton = document.getElementById("giscus-button");

// 为按钮添加点击事件监听器
giscusButton.addEventListener("click", () => {
  const giscusUrl = baseGiscusUrl + currentGiscusTerm;
  // 跳转到新页面
  window.open(giscusUrl, "_blank");
});
