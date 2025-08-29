/* --- IndexedDB minimal para tu GameManager --- */
const DB_NAME = "BoardGamesDB";
const DB_VERSION = 1;
let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      // Crear store "games" y precargar datos iniciales si no existe
      if (!db.objectStoreNames.contains("games")) {
        const store = db.createObjectStore("games", { keyPath: "id" });
        initialGames.forEach(game => store.add(game));
      }

      // Crear store "wishlist" vacío si no existe
      if (!db.objectStoreNames.contains("wishlist")) {
        db.createObjectStore("wishlist", { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = (event) => reject(event.target.error);
  });
}

function loadArray(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveItem(storeName, item) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/* --- Datos iniciales de ejemplo --- */
const initialGames = [
  { id: 1, name: "Catan", minPlayers: 3, maxPlayers: 4, duration: 90, description: "Juego de estrategia donde los jugadores recolectan recursos y construyen asentamientos.", image: "https://assetsio.gnwcdn.com/catan-board-game-gameplay-layout-settlements-roads-robber.jpeg?width=690&quality=70&format=jpg&auto=webp", link: "https://devir.es/catan", category: "Estratégico" },
  { id: 2, name: "Dixit", minPlayers: 3, maxPlayers: 6, duration: 30, description: "Juego de imaginación y creatividad donde los jugadores dan pistas sobre ilustraciones oníricas.", image: "https://juegosdemesayrol.com/wp-content/uploads/Dixit-1-1.jpg", link: "https://zacatrus.es/dixit.html", category: "Familiar" },
  { id: 3, name: "Código Secreto", minPlayers: 2, maxPlayers: 8, duration: 15, description: "Juego de palabras donde dos equipos compiten para encontrar a todos sus agentes secretos.", image: "https://i0.wp.com/losjuegossobrelamesa.com/wp-content/uploads/Tablero2.jpg?fit=820%2C507&ssl=1", link: "https://devir.es/codigo-secreto", category: "Party" },
  { id: 4, name: "Aventureros al tren", minPlayers: 2, maxPlayers: 5, duration: 60, description: "Juego de construir rutas de tren a través de Norteamérica recolectando cartas de colores.", image: "https://juegosdemesayrol.com/wp-content/uploads/C8A9209.jpg", link: "https://zacatrus.es/aventureros-al-tren-europa.html", category: "Familiar" },
  { id: 5, name: "7 Wonders", minPlayers: 2, maxPlayers: 7, duration: 30, description: "Juego de cartas de drafting donde los jugadores construyen una civilización a lo largo de tres eras.", image: "https://tabletopterrain.com/cdn/shop/files/tabletop-terrain-board-game-insert-7-wonders-2nd-edition-with-expansions-board-game-insert-organizer-39610962804963.webp?v=1683486676&width=1214", link: "https://zacatrus.es/7-wonders-nueva-edicion.html", category: "Estratégico" },
];


/* --- GameManager completo --- */
class GameManager {
  constructor() {
    this.games = [];
    this.wishlistGames = [];
    this.currentSection = "my-games";

    initDB().then(async () => {
      const gamesFromDB = await loadArray("games");
      const wishlistFromDB = await loadArray("wishlist");
      this.games = gamesFromDB.length ? gamesFromDB : initialGames;
      this.wishlistGames = wishlistFromDB;
      this.init();
      this.setupImport();
    });
  }

  normalizeText(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, "").toLowerCase();
  }

  escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async saveGames() {
    await clearStore("games");
    for (const game of this.games) await saveItem("games", game);
  }

  async saveWishlist() {
    await clearStore("wishlist");
    for (const game of this.wishlistGames) await saveItem("wishlist", game);
  }

  init() {
    this.renderGames();
    this.setupEventListeners();
  }

  async addToWishlist(gameId) {
    const index = this.games.findIndex(g => g.id === gameId);
    if (index !== -1) {
      const game = this.games.splice(index, 1)[0];
      this.wishlistGames.push(game);
      await this.saveGames();
      await this.saveWishlist();
      this.updateCurrentView();
    }
  }

  async removeFromWishlist(gameId) {
    const index = this.wishlistGames.findIndex(g => g.id === gameId);
    if (index !== -1) {
      const game = this.wishlistGames.splice(index, 1)[0];
      this.games.push(game);
      await this.saveGames();
      await this.saveWishlist();
      this.updateCurrentView();
    }
  }

  async toggleWishlist(gameId) {
    const inWishlist = this.wishlistGames.some(g => g.id === gameId);
    const inGames = this.games.some(g => g.id === gameId);
    if (inWishlist) await this.removeFromWishlist(gameId);
    else if (inGames) await this.addToWishlist(gameId);
  }

  updateCurrentView() {
    if (this.currentSection === "my-games") this.renderGames();
    else if (this.currentSection === "wishlist") this.renderWishlist();
    else if (this.currentSection === "search") {
      const searchButton = document.getElementById("search-button");
      if (searchButton) searchButton.click();
    }
  }

  renderGames(filteredGames = null) {
    const container = document.getElementById("games-container");
    const gamesToRender = filteredGames || this.games;
    if (gamesToRender.length === 0) {
      container.classList.remove("games-grid");
      container.innerHTML = `<div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;">
        <i class="fas fa-dice" style="font-size:3rem;margin-bottom:10px;"></i>
        <p>No hay juegos en tu colección</p>
        <button class="btn" onclick="gameManager.showSection('add-game')"><i class="fas fa-plus"></i> Añadir primer juego</button>
      </div>`;
      return;
    }
    container.classList.add("games-grid");
    container.innerHTML = gamesToRender.map(game => this.createGameCard(game, false)).join("");
  }

  renderWishlist() {
    const container = document.getElementById("wishlist-container");
    if (this.wishlistGames.length === 0) {
      container.classList.remove("games-grid");
      container.innerHTML = `<div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;">
        <i class="fas fa-heart" style="font-size:3rem;margin-bottom:10px;"></i>
        <p>No tienes juegos en tu lista de deseados</p>
        <p>Haz clic en el icono de la estrella en cualquier juego para añadirlo aquí</p>
      </div>`;
      return;
    }
    container.classList.add("games-grid");
    container.innerHTML = this.wishlistGames.map(game => this.createGameCard(game, false)).join("");
  }

createGameCard(game, isSearchResult = false) {
    const isInWishlist = this.wishlistGames.some(g => g.id === game.id);
    const isInGames = this.games.some(g => g.id === game.id);
    let wishlistAction = "";
    if (isSearchResult) wishlistAction = `gameManager.toggleWishlist(${game.id})`;
    else if (isInWishlist) wishlistAction = `gameManager.removeFromWishlist(${game.id})`;
    else wishlistAction = `gameManager.addToWishlist(${game.id})`;

    // Limitar descripción a aprox 3 líneas
    const maxLength = 200; // ajusta según el ancho de la tarjeta
    let shortDescription = game.description || "Sin descripción";
    if (shortDescription.length > maxLength) {
        shortDescription = shortDescription.slice(0, maxLength) + "…";
    }

    return `<div class="game-card" data-id="${game.id}">
      <div class="game-image" style="background-image: url('${game.image || "https://via.placeholder.com/300x180?text=Sin+Imagen"}')">${!game.image?'<i class="fas fa-dice"></i>':''}</div>
      <div class="game-details">
        <h3>${game.name}</h3>
        <div class="game-info">
          <span><i class="fas fa-users"></i> ${game.minPlayers}-${game.maxPlayers}</span>
          <span><i class="fas fa-clock"></i> ${game.duration} min</span>
        </div>
        <p class="game-description">${shortDescription}</p>
        <div class="game-actions">
          <button class="btn btn-details" onclick="gameManager.showGameDetails(${game.id})"><i class="fas fa-info-circle"></i> Detalles</button>
          <button class="btn btn-wishlist ${isInWishlist?"heart":"star"}" onclick="${wishlistAction}" title="${isInWishlist?"Pulsa el corazón para mandar este juego a tu colección (Ya es tuyo)":"Pulsa la estrella para añadir este juego a tus deseados (Si aún no lo tienes)"}">
            <i class="fas ${isInWishlist?"fa-heart":"fa-star"}"></i>
          </button>
          ${!isSearchResult && (isInGames || isInWishlist)?`<button class="btn btn-delete" onclick="gameManager.deleteGame(${game.id})" title="Eliminar este juego de tu colección o lista de deseados"><i class="fas fa-trash"></i></button>`:""}
        </div>
      </div>
    </div>`;
}


showGameDetails(gameId) {
    let game = this.games.find(g => g.id === gameId) || this.wishlistGames.find(g => g.id === gameId);
    if (!game) return;

    const modal = document.getElementById("game-modal");
    const content = document.getElementById("modal-game-details");

    // Limitar ancho de la imagen y añadir contenedor flexible
    content.innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:20px;">
      <div class="game-image" style="width:200px; height:150px; flex-shrink:0; background-image:url('${game.image || "https://via.placeholder.com/300x180?text=Sin+Imagen"}'); display:flex;align-items:center;justify-content:center;">
        ${!game.image ? '<i class="fas fa-dice"></i>' : ''}
      </div>
      <div style="flex:1; min-width:200px;">
        <h2>${game.name}</h2>
        <div style="display:flex;gap:15px;flex-wrap:wrap;margin:10px 0;">
          <span><i class="fas fa-users"></i> ${game.minPlayers}-${game.maxPlayers} jugadores</span>
          <span><i class="fas fa-clock"></i> ${game.duration} minutos</span>
        </div>
        ${game.category ? `<p><strong>Categoría:</strong> ${game.category}</p>` : ""}
      </div>
    </div>
    <div style="margin-bottom:20px;">
      <h3>Descripción</h3>
      <p style="white-space: pre-wrap; word-wrap: break-word; max-height:200px; overflow-y:auto; padding-right:5px;">
        ${game.description || "No hay descripción disponible."}
      </p>
    </div>
    ${game.link ? `<div style="text-align:center;"><a href="${game.link}" target="_blank" class="btn btn-details"><i class="fas fa-external-link"></i> Ver más información</a></div>` : ""}`;

    modal.style.display = "block";
}

  addGame(event) {
    event.preventDefault();

    const name = document.getElementById("game-name").value;
    const minPlayers = parseInt(document.getElementById("min-players").value);
    const maxPlayers = parseInt(document.getElementById("max-players").value);
    const duration = parseInt(document.getElementById("duration").value);
    const description = document.getElementById("description").value;
    const link = document.getElementById("link").value;
    const category = document.getElementById("category").value;

    const imageUpload = document.getElementById("image-upload");
    const imageUrl = ""; // se llenará si se sube archivo

    if (minPlayers > maxPlayers) {
      alert("El número mínimo de jugadores no puede ser mayor que el máximo");
      return;
    }

    const list = document.getElementById("list-select").value;

    const newGame = {
      id: Date.now(),
      name,
      minPlayers,
      maxPlayers,
      duration,
      description,
      image: imageUrl,
      link,
      category
    };

    const finalizeAdd = async (game, list) => {
      if (list === "my-games") {
        this.games.push(game);
        await this.saveGames();
      } else {
        this.wishlistGames.push(game);
        await this.saveWishlist();
      }

      this.renderGames();
      document.getElementById("game-form")?.reset();

      const preview = document.getElementById("image-preview");
      if (preview) preview.style.display = "none";

      alert("¡Juego añadido correctamente!");
      this.showSection("my-games");
    };

    if (imageUpload?.files?.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        newGame.image = e.target.result;
        finalizeAdd(newGame, list);
      };
      reader.readAsDataURL(imageUpload.files[0]);
    } else {
      finalizeAdd(newGame, list);
    }
  }


  async deleteGame(gameId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este juego?")) return;
    const gameIndex = this.games.findIndex(g => g.id === gameId);
    if (gameIndex !== -1) { this.games.splice(gameIndex, 1); await this.saveGames(); }
    else { const wishlistIndex = this.wishlistGames.findIndex(g => g.id === gameId); if (wishlistIndex !== -1) { this.wishlistGames.splice(wishlistIndex, 1); await this.saveWishlist(); } }
    this.updateCurrentView();
  }

  filterGames() {
    const nameFilter = this.normalizeText(document.getElementById("search-name").value);
    const playersFilter = parseInt(document.getElementById("search-players").value);
    const durationFilter = document.getElementById("search-duration").value;
    const filtered = this.games.filter(game => {
      if (nameFilter && !this.normalizeText(game.name).includes(nameFilter)) return false;
      if (playersFilter && (playersFilter < game.minPlayers || playersFilter > game.maxPlayers)) return false;
      if (durationFilter) { if (durationFilter === "short" && game.duration >= 30) return false; if (durationFilter === "medium" && (game.duration < 30 || game.duration > 60)) return false; if (durationFilter === "long" && game.duration <= 60) return false; }
      return true;
    });
    this.renderGames(filtered);
  }

  searchGames() {
    const nameFilter = this.normalizeText(document.getElementById("search-name-all").value);
    const playersFilter = parseInt(document.getElementById("search-players-all").value);
    const durationFilter = document.getElementById("search-duration-all").value;
    const allGames = [...this.games, ...this.wishlistGames];
    const results = allGames.filter(game => {
      if (nameFilter && !this.normalizeText(game.name).includes(nameFilter)) return false;
      if (playersFilter && (playersFilter < game.minPlayers || playersFilter > game.maxPlayers)) return false;
      if (durationFilter) { if (durationFilter === "short" && game.duration >= 30) return false; if (durationFilter === "medium" && (game.duration < 30 || game.duration > 60)) return false; if (durationFilter === "long" && game.duration <= 60) return false; }
      return true;
    });
    this.renderSearchResults(results);
  }

  renderSearchResults(results) {
    const container = document.getElementById("search-results");
    if (results.length === 0) {
      container.classList.remove("games-grid");
      container.innerHTML = `<div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;"><i class="fas fa-search" style="font-size:3rem;margin-bottom:10px;"></i><p>No se encontraron juegos que coincidan con tu búsqueda</p></div>`;
      return;
    }
    container.classList.add("games-grid");
    container.innerHTML = results.map(game => this.createGameCard(game, true)).join("");
  }

  showSection(sectionId) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
    document.querySelectorAll(".hexagon").forEach(h => h.classList.remove("active"));
    document.querySelector(`.hexagon[data-section="${sectionId}"]`)?.classList.add("active");
    this.currentSection = sectionId;
    if (sectionId === "my-games") this.renderGames();
    else if (sectionId === "wishlist") this.renderWishlist();
    else if (sectionId === "search") { const r = document.getElementById("search-results"); r.classList.remove("games-grid"); r.innerHTML = `<div class="empty-state" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;"><i class="fas fa-search" style="font-size:3rem;margin-bottom:10px;"></i><p>Utiliza el formulario de búsqueda para encontrar juegos entre tus juegos y los deseados</p></div>`; }
    else if (sectionId === "export") this.exportGames();
    else if (sectionId === "import") document.getElementById("import-file")?.click();
  }

  setupEventListeners() {
    document.querySelectorAll(".hexagon").forEach(hex => hex.addEventListener("click", () => { this.showSection(hex.getAttribute("data-section")); }));
    document.getElementById("apply-filters")?.addEventListener("click", () => { this.filterGames(); });
    document.getElementById("search-button")?.addEventListener("click", () => { this.searchGames(); });
    document.getElementById("game-form")?.addEventListener("submit", e => this.addGame(e));
    document.querySelector(".close")?.addEventListener("click", () => { document.getElementById("game-modal").style.display = "none"; });
    window.addEventListener("click", e => { if (e.target === document.getElementById("game-modal")) document.getElementById("game-modal").style.display = "none"; });
    ["search-name", "search-players", "search-duration", "search-name-all", "search-players-all", "search-duration-all"].forEach(id => {
      document.getElementById(id)?.addEventListener("keyup", e => {
        if (e.key === "Enter") {
          if (id.includes("all")) document.getElementById("search-button")?.click();
          else document.getElementById("apply-filters")?.click();
        }
      });
    });
    document.getElementById("image-upload")?.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.getElementById("image-preview");
          const img = document.getElementById("preview-img");
          if (preview && img) { img.src = e.target.result; preview.style.display = "block"; }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  setupImport() {
    document.getElementById("import-file")?.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.games && Array.isArray(data.games)) this.games = data.games;
          if (data.wishlistGames && Array.isArray(data.wishlistGames)) this.wishlistGames = data.wishlistGames;
          await this.saveGames();
          await this.saveWishlist();
          this.updateCurrentView();
          alert("¡Importación completada!");
        } catch (err) { alert("Error al importar el archivo: JSON inválido"); }
      };
      reader.readAsText(file);
    });
  }

exportGames() {
    const data = { games: this.games, wishlistGames: this.wishlistGames };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([`\uFEFF${json}`], { type: "application/json;charset=utf-8" });

    // Detecta Safari / iOS
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
        // Safari no soporta descarga automática: abrir JSON en nueva pestaña
        const reader = new FileReader();
        reader.onload = function (e) {
            const newWindow = window.open();
            newWindow.document.write(`<pre>${e.target.result}</pre>`);
        };
        reader.readAsText(blob);
    } else {
        // Descarga directa en navegadores compatibles
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mis-juegos.json";
        a.click();
        URL.revokeObjectURL(url);
    }
  }
}

/* --- Inicializar la aplicación --- */
document.addEventListener("DOMContentLoaded", () => {
  initDB().then(() => {
    console.log("IndexedDB inicializada ✅");
    window.gameManager = new GameManager();
  }).catch(err => {
    console.error("Error al inicializar la base de datos ❌", err);
  });
});