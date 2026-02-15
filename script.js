// Variables globales
let currentPage = 0;
let pages = [];
let quillInstances = [];
let selectedImage = null;

// Initialisation de la première page
function initFirstPage() {
  const firstPageContainer = document.querySelector('.editor-container');
  const quill = new Quill(firstPageContainer, {
    theme: 'snow',
    placeholder: 'Commence à écrire ici...',
    modules: {
      toolbar: false,
      history: {
        delay: 2000,
        maxStack: 500,
        userOnly: true
      }
    },
  });

  // Activation du glisser-déposer pour les images
  quill.root.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  quill.root.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.match(/^image\//)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const range = quill.getSelection();
        quill.insertEmbed(range.index, 'image', event.target.result);
        setupImageSelection();
      };
      reader.readAsDataURL(files[0]);
    }
  });

  quill.on('text-change', () => {
    savePageContent(currentPage);
  });

  quillInstances.push(quill);
  pages.push({ container: firstPageContainer, quill: quill });
  setupImageSelection();
}

// Fonction pour annuler la dernière action
function undoAction() {
  const quill = quillInstances[currentPage];
  quill.history.undo();
}

// Fonction pour rétablir la dernière action annulée
function redoAction() {
  const quill = quillInstances[currentPage];
  quill.history.redo();
}

// Fonction pour activer/désactiver la mise en forme
function toggleFormat(format) {
  const quill = quillInstances[currentPage];
  const isActive = quill.getFormat()[format];
  quill.format(format, !isActive);
}

// Fonction pour créer une liste
function formatList(type) {
  const quill = quillInstances[currentPage];
  const isActive = quill.getFormat().list === type;
  quill.format('list', isActive ? false : type);
}

// Fonction pour insérer une image
function insertImage() {
  const quill = quillInstances[currentPage];
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const range = quill.getSelection();
        quill.insertEmbed(range.index, 'image', event.target.result);
        setupImageSelection();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// Fonction pour ajouter une page
function addPage() {
  currentPage++;
  const pagesContainer = document.getElementById('pages');
  const newPage = document.createElement('div');
  newPage.className = 'page';
  newPage.innerHTML = `
    <div class="page-header">
      <div class="page-title">Page ${currentPage + 1}</div>
      <span class="delete-page" onclick="deletePage(this)">Supprimer</span>
    </div>
    <div class="editor-container"></div>
  `;
  pagesContainer.appendChild(newPage);

  const newPageContainer = newPage.querySelector('.editor-container');
  const quill = new Quill(newPageContainer, {
    theme: 'snow',
    placeholder: 'Commence à écrire ici...',
    modules: {
      toolbar: false,
      history: {
        delay: 2000,
        maxStack: 500,
        userOnly: true
      }
    },
  });

  quill.root.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  quill.root.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.match(/^image\//)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const range = quill.getSelection();
        quill.insertEmbed(range.index, 'image', event.target.result);
        setupImageSelection();
      };
      reader.readAsDataURL(files[0]);
    }
  });

  quill.on('text-change', () => {
    savePageContent(currentPage);
  });

  quillInstances.push(quill);
  pages.push({ container: newPageContainer, quill: quill });
  setupImageSelection();
}

// Fonction pour supprimer une page
function deletePage(element) {
  const pageElement = element.closest('.page');
  const pageIndex = Array.from(document.querySelectorAll('.page')).indexOf(pageElement);

  if (pageIndex !== -1) {
    pages.splice(pageIndex, 1);
    quillInstances.splice(pageIndex, 1);
    pageElement.remove();

    // Mise à jour des titres de page
    document.querySelectorAll('.page-title').forEach((title, index) => {
      title.textContent = `Page ${index + 1}`;
    });

    if (currentPage >= pageIndex) {
      currentPage--;
    }
  }
}

// Fonction pour sauvegarder le contenu d'une page
function savePageContent(pageIndex) {
  const content = quillInstances[pageIndex].root.innerHTML;
  localStorage.setItem(`pageContent_${pageIndex}`, content);
}

// Fonction pour charger le contenu d'une page
function loadPageContent(pageIndex) {
  const savedContent = localStorage.getItem(`pageContent_${pageIndex}`);
  if (savedContent) {
    quillInstances[pageIndex].root.innerHTML = savedContent;
    setupImageSelection();
  }
}

// Fonction pour télécharger le contenu en HTML
function saveAsHTML() {
  let fullContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Document exporté</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .page { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; }
        img { max-width: 100%; }
      </style>
    </head>
    <body>
  `;

  pages.forEach((page, index) => {
    fullContent += `
      <div class="page">
        <h2>Page ${index + 1}</h2>
        ${page.quill.root.innerHTML}
      </div>
    `;
  });

  fullContent += `
    </body>
    </html>
  `;

  const blob = new Blob([fullContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mon_document.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Fonction pour charger un fichier HTML
function loadHTMLFile(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const pageDivs = doc.querySelectorAll('.page');

      // Effacer les pages existantes
      document.querySelectorAll('.page').forEach((page, index) => {
        if (index > 0) page.remove();
      });
      pages = [pages[0]];
      quillInstances = [quillInstances[0]];
      currentPage = 0;

      // Charger chaque page
      pageDivs.forEach((pageDiv, index) => {
        if (index > 0) addPage();
        const quill = quillInstances[index];
        const pageContent = pageDiv.querySelector('.editor-container') ?
          pageDiv.querySelector('.editor-container').innerHTML :
          pageDiv.innerHTML.replace(/<h2>Page \d+<\/h2>/, '');
        quill.root.innerHTML = pageContent;
        setupImageSelection();
      });
    };
    reader.readAsText(file);
  }
}

// Fonction pour activer la sélection et le déplacement des images avec les flèches
function setupImageSelection() {
  document.querySelectorAll('.ql-editor img').forEach(img => {
    img.tabIndex = 0;
    img.style.outline = '2px solid transparent';

    img.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedImage) {
        selectedImage.style.outline = '2px solid transparent';
      }
      selectedImage = img;
      img.style.outline = '2px solid blue';
    });

    img.addEventListener('keydown', (e) => {
      if (selectedImage !== img) return;

      const step = 5;
      const currentStyle = window.getComputedStyle(img);
      const matrix = currentStyle.transform.match(/^matrix\((.+)\)$/);
      let x = matrix ? parseFloat(matrix[1].split(', ')[4]) : 0;
      let y = matrix ? parseFloat(matrix[1].split(', ')[5]) : 0;

      switch (e.key) {
        case 'ArrowUp':
          y -= step;
          break;
        case 'ArrowDown':
          y += step;
          break;
        case 'ArrowLeft':
          x -= step;
          break;
        case 'ArrowRight':
          x += step;
          break;
      }

      img.style.transform = `translate(${x}px, ${y}px)`;
      img.focus();
      e.preventDefault();
    });
  });
}

// Initialisation au chargement
window.addEventListener('load', () => {
  initFirstPage();
  loadPageContent(0);
});
