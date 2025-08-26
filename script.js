// Datos iniciales de ejemplo
const initialGames = [
  {
    id: 1,
    name: "Catan",
    minPlayers: 3,
    maxPlayers: 4,
    duration: 90,
    description:
      "Juego de estrategia donde los jugadores recolectan recursos y construyen asentamientos.",
    image:
      "https://assetsio.gnwcdn.com/catan-board-game-gameplay-layout-settlements-roads-robber.jpeg?width=690&quality=70&format=jpg&auto=webp",
    link: "https://devir.es/catan",
    category: "Estratégico",
  },
  {
    id: 2,
    name: "Dixit",
    minPlayers: 3,
    maxPlayers: 6,
    duration: 30,
    description:
      "Juego de imaginación y creatividad donde los jugadores dan pistas sobre ilustraciones oníricas.",
    image:
      "https://i0.wp.com/www.julianmarquina.es/wp-content/uploads/Dixit-version-gratuita-del-famoso-juego-de-mesa-de-cuentacuentos.jpg?fit=1200%2C822&ssl=1",
    link: "https://zacatrus.es/dixit.html",
    category: "Familiar",
  },
  {
    id: 3,
    name: "Código Secreto",
    minPlayers: 2,
    maxPlayers: 8,
    duration: 15,
    description:
      "Juego de palabras donde dos equipos compiten para encontrar a todos sus agentes secretos.",
    image:
      "https://devir.es/sites/default/files/styles/product/public/2023-03/codigosecreto.png",
    link: "https://devir.es/codigo-secreto",
    category: "Party",
  },
  {
    id: 4,
    name: "Ticket to Ride",
    minPlayers: 2,
    maxPlayers: 5,
    duration: 60,
    description:
      "Juego de construir rutas de tren a través de Norteamérica recolectando cartas de colores.",
    image:
      "https://zacatrus.es/media/catalog/product/t/i/ticket-to-ride-europa-1.jpg",
    link: "https://zacatrus.es/ticket-to-ride-europa.html",
    category: "Familiar",
  },
  {
    id: 5,
    name: "7 Wonders",
    minPlayers: 2,
    maxPlayers: 7,
    duration: 30,
    description:
      "Juego de cartas de drafting donde los jugadores construyen una civilización a lo largo de tres eras.",
    image: "https://zacatrus.es/media/catalog/product/7/w/7wonders2020-1_1.jpg",
    link: "https://zacatrus.es/7-wonders-nueva-edicion.html",
    category: "Estratégico",
  },
];

// Clase para gestionar los juegos
class GameManager {
  constructor() {
    this.games = this.loadGames();
    this.wishlistGames = this.loadWishlistGames();
    this.currentSection = "my-games";
    this.init();

    // Inicializar import
    this.setupImport();
  }

  // Cargar juegos desde localStorage
  loadGames() {
    const savedGames = localStorage.getItem("boardGames");
    return savedGames ? JSON.parse(savedGames) : initialGames;
  }

  // Cargar lista de deseos desde localStorage
  loadWishlistGames() {
    const savedWishlist = localStorage.getItem("boardGamesWishlist");
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  }

  // Guardar juegos en localStorage
  saveGames() {
    localStorage.setItem("boardGames", JSON.stringify(this.games));
  }

  // Guardar lista de deseos en localStorage
  saveWishlist() {
    localStorage.setItem(
      "boardGamesWishlist",
      JSON.stringify(this.wishlistGames)
    );
  }

  // Inicializar la aplicación
  init() {
    this.renderGames();
    this.setupEventListeners();
  }

  // Añadir juego a lista de deseos (mueve de juegos a deseados)
  addToWishlist(gameId) {
    const gameIndex = this.games.findIndex((game) => game.id === gameId);
    if (gameIndex !== -1) {
      const game = this.games[gameIndex];
      this.games.splice(gameIndex, 1);
      this.wishlistGames.push(game);
      this.saveGames();
      this.saveWishlist();
      this.updateCurrentView();
    }
  }

  // Quitar de lista de deseos (mueve de deseados a juegos)
  removeFromWishlist(gameId) {
    const gameIndex = this.wishlistGames.findIndex(
      (game) => game.id === gameId
    );
    if (gameIndex !== -1) {
      const game = this.wishlistGames[gameIndex];
      this.wishlistGames.splice(gameIndex, 1);
      this.games.push(game);
      this.saveGames();
      this.saveWishlist();
      this.updateCurrentView();
    }
  }

  // Alternar juego en lista de deseos
  toggleWishlist(gameId) {
    // Determinar en qué lista está actualmente el juego
    const inWishlist = this.wishlistGames.some((game) => game.id === gameId);
    const inGames = this.games.some((game) => game.id === gameId);

    if (inWishlist) {
      this.removeFromWishlist(gameId);
    } else if (inGames) {
      this.addToWishlist(gameId);
    }
  }

  // Actualizar la vista actual
  updateCurrentView() {
    if (this.currentSection === "my-games") {
      this.renderGames();
    } else if (this.currentSection === "wishlist") {
      this.renderWishlist();
    } else if (this.currentSection === "search") {
      const searchButton = document.getElementById("search-button");
      if (searchButton) searchButton.click();
    }
  }

  // Renderizar juegos en la sección correspondiente
  renderGames(filteredGames = null) {
    const gamesToRender = filteredGames || this.games;
    const gamesContainer = document.getElementById("games-container");

    if (gamesToRender.length === 0) {
      // Quitar grid para que el estado vacío se centre
      gamesContainer.classList.remove("games-grid");

      gamesContainer.innerHTML = `
            <div class="empty-state"
                 style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;">
                <i class="fas fa-dice" style="font-size:3rem;margin-bottom:10px;"></i>
                <p>No hay juegos en tu colección</p>
                <button class="btn" onclick="gameManager.showSection('add-game')">
                    <i class="fas fa-plus"></i> Añadir primer juego
                </button>
            </div>
        `;
      return;
    }

    // Si hay juegos, asegurarse de que la clase grid esté activa
    gamesContainer.classList.add("games-grid");
    gamesContainer.innerHTML = gamesToRender
      .map((game) => this.createGameCard(game, false))
      .join("");
  }

  // Exportar juegos y lista de deseos a archivo JSON
  exportGames() {
    const data = {
      games: this.games,
      wishlistGames: this.wishlistGames,
    };
    const json = JSON.stringify(data, null, 2); // formato bonito
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-juegos.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Importar juegos desde un archivo JSON
  setupImport() {
    const importInput = document.getElementById("import-file");
    importInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.games && Array.isArray(data.games)) this.games = data.games;
          if (data.wishlistGames && Array.isArray(data.wishlistGames))
            this.wishlistGames = data.wishlistGames;
          this.saveGames();
          this.saveWishlist();
          this.updateCurrentView();
          alert("¡Importación completada!");
        } catch (err) {
          alert("Error al importar el archivo: JSON inválido");
        }
      };
      reader.readAsText(file);
    });
  }

  // Renderizar lista de deseos
  renderWishlist() {
    const wishlistContainer = document.getElementById("wishlist-container");

    if (this.wishlistGames.length === 0) {
      // Quitar grid para que el estado vacío se centre
      wishlistContainer.classList.remove("games-grid");

      wishlistContainer.innerHTML = `
            <div class="empty-state"
                 style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;">
                <i class="fas fa-heart" style="font-size:3rem;margin-bottom:10px;"></i>
                <p>No tienes juegos en tu lista de deseados</p>
                <p>Haz clic en el icono de la estrella en cualquier juego para añadirlo aquí</p>
            </div>
        `;
      return;
    }

    // Si hay juegos, asegurarse de que la clase grid esté activa
    wishlistContainer.classList.add("games-grid");
    wishlistContainer.innerHTML = this.wishlistGames
      .map((game) => this.createGameCard(game, false))
      .join("");
  }

  // Crear tarjeta de juego
  createGameCard(game, isSearchResult = false) {
    const isInWishlist = this.wishlistGames.some(
      (wishlistGame) => wishlistGame.id === game.id
    );
    const isInGames = this.games.some((myGame) => myGame.id === game.id);

    // Determinar la acción del botón según dónde esté el juego
    let wishlistAction = "";
    if (isSearchResult) {
      wishlistAction = `gameManager.toggleWishlist(${game.id})`;
    } else if (isInWishlist) {
      wishlistAction = `gameManager.removeFromWishlist(${game.id})`;
    } else {
      wishlistAction = `gameManager.addToWishlist(${game.id})`;
    }

    return `
        <div class="game-card" data-id="${game.id}">
            <div class="game-image" style="background-image: url('${
              game.image ||
              "https://via.placeholder.com/300x180?text=Sin+Imagen"
            }')">
                ${!game.image ? '<i class="fas fa-dice"></i>' : ""}
            </div>
            <div class="game-details">
                <h3>${game.name}</h3>
                <div class="game-info">
                    <span><i class="fas fa-users"></i> ${game.minPlayers}-${
      game.maxPlayers
    }</span>
                    <span><i class="fas fa-clock"></i> ${
                      game.duration
                    } min</span>
                </div>
                <p class="game-description">${
                  game.description || "Sin descripción"
                }</p>
                <div class="game-actions">
                    <button class="btn btn-details" onclick="gameManager.showGameDetails(${
                      game.id
                    })">
                        <i class="fas fa-info-circle"></i> Detalles
                    <button 
                        class="btn btn-wishlist ${isInWishlist ? "heart" : "star"}" 
                        onclick="${wishlistAction}"
                        title="${
                        isInWishlist
        ? "Pulsa el corazón para mandar este juego a tu colección (Ya es tuyo)"
        : "Pulsa la estrella para añadir este juego a tus deseados (Si aún no lo tienes)"
                 }"
            >
    <i class="fas ${isInWishlist ? "fa-heart" : "fa-star"}"></i>
</button>
                    ${
                      !isSearchResult && isInGames
                        ? `
                    <button class="btn btn-delete" onclick="gameManager.deleteGame(${game.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
  }

  // Mostrar detalles del juego en un modal
  showGameDetails(gameId) {
    // Buscar el juego en ambas listas
    let game = this.games.find((g) => g.id === gameId);
    if (!game) {
      game = this.wishlistGames.find((g) => g.id === gameId);
    }
    if (!game) return;

    const modal = document.getElementById("game-modal");
    const modalContent = document.getElementById("modal-game-details");

    modalContent.innerHTML = `
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div class="game-image" style="width: 200px; height: 150px; background-image: url('${
                  game.image ||
                  "https://via.placeholder.com/300x180?text=Sin+Imagen"
                }')">
                    ${!game.image ? '<i class="fas fa-dice"></i>' : ""}
                </div>
                <div>
                    <h2>${game.name}</h2>
                    <div style="display: flex; gap: 15px; margin: 10px 0;">
                        <span><i class="fas fa-users"></i> ${game.minPlayers}-${
      game.maxPlayers
    } jugadores</span>
                        <span><i class="fas fa-clock"></i> ${
                          game.duration
                        } minutos</span>
                    </div>
                    ${
                      game.category
                        ? `<p><strong>Categoría:</strong> ${game.category}</p>`
                        : ""
                    }
                </div>
            </div>
            <div style="margin-bottom: 20px;">
                <h3>Descripción</h3>
                <p>${game.description || "No hay descripción disponible."}</p>
            </div>
            ${
              game.link
                ? `
            <div style="text-align: center;">
                <a href="${game.link}" target="_blank" class="btn btn-details">
                    <i class="fas fa-external-link"></i> Ver más información
                </a>
            </div>
            `
                : ""
            }
        `;

    modal.style.display = "block";
  }

  // Añadir nuevo juego (con comprobaciones seguras)
  addGame(event) {
    event.preventDefault();

    const name = document.getElementById("game-name").value;
    const minPlayers = parseInt(document.getElementById("min-players").value);
    const maxPlayers = parseInt(document.getElementById("max-players").value);
    const duration = parseInt(document.getElementById("duration").value);
    const description = document.getElementById("description").value;
    const link = document.getElementById("link").value;
    const category = document.getElementById("category").value;

    // Campo de URL de imagen (puede no existir)
    const imageUrlEl = document.getElementById("image");
    const imageUrl = imageUrlEl ? imageUrlEl.value : "";

    // Campo de archivo (puede no existir)
    const imageUpload = document.getElementById("image-upload");

    // Validación básica
    if (minPlayers > maxPlayers) {
      alert("El número mínimo de jugadores no puede ser mayor que el máximo");
      return;
    }

    const newGame = {
      id: Date.now(),
      name,
      minPlayers,
      maxPlayers,
      duration,
      description,
      image: imageUrl, // por defecto usamos la URL si existe
      link,
      category,
    };

    // Si hay input file y archivo seleccionado, guardamos base64
    if (imageUpload && imageUpload.files && imageUpload.files.length > 0) {
      const file = imageUpload.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        newGame.image = e.target.result;
        this.finalizeAddGame(newGame);
      };
      reader.readAsDataURL(file);
    } else {
      this.finalizeAddGame(newGame);
    }
  }

  // Finalizar la adición del juego (con comprobaciones seguras)
  finalizeAddGame(game) {
    this.games.push(game);
    this.saveGames();
    this.renderGames();

    const form = document.getElementById("game-form");
    if (form) form.reset();

    const preview = document.getElementById("image-preview");
    if (preview) preview.style.display = "none";

    alert("¡Juego añadido correctamente!");
    this.showSection("my-games");
  }

  // Eliminar juego
  deleteGame(gameId) {
    if (!confirm("¿Estás seguro de que quieres eliminar este juego?")) return;

    // Buscar en ambas listas y eliminar
    const gameIndex = this.games.findIndex((game) => game.id === gameId);
    if (gameIndex !== -1) {
      this.games.splice(gameIndex, 1);
      this.saveGames();
    } else {
      const wishlistIndex = this.wishlistGames.findIndex(
        (game) => game.id === gameId
      );
      if (wishlistIndex !== -1) {
        this.wishlistGames.splice(wishlistIndex, 1);
        this.saveWishlist();
      }
    }

    this.updateCurrentView();
  }

  // Filtrar juegos (solo en "Mis juegos")
  filterGames() {
    const nameFilter = document
      .getElementById("search-name")
      .value.toLowerCase();
    const playersFilter = parseInt(
      document.getElementById("search-players").value
    );
    const durationFilter = document.getElementById("search-duration").value;

    const filteredGames = this.games.filter((game) => {
      // Filtrar por nombre
      if (nameFilter && !game.name.toLowerCase().includes(nameFilter)) {
        return false;
      }

      // Filtrar por número de jugadores
      if (
        playersFilter &&
        (playersFilter < game.minPlayers || playersFilter > game.maxPlayers)
      ) {
        return false;
      }

      // Filtrar por duración
      if (durationFilter) {
        if (durationFilter === "short" && game.duration >= 30) return false;
        if (
          durationFilter === "medium" &&
          (game.duration < 30 || game.duration > 60)
        )
          return false;
        if (durationFilter === "long" && game.duration <= 60) return false;
      }

      return true;
    });

    this.renderGames(filteredGames);
  }

  // Buscar en "Mis juegos" + "Deseados"
  searchGames() {
    const nameFilter = document
      .getElementById("search-name-all")
      .value.toLowerCase();
    const playersFilter = parseInt(
      document.getElementById("search-players-all").value
    );
    const durationFilter = document.getElementById("search-duration-all").value;

    // 👇 Usa wishlistGames (no wishlist)
    const allGames = [...this.games, ...this.wishlistGames];

    const results = allGames.filter((game) => {
      if (nameFilter && !game.name.toLowerCase().includes(nameFilter))
        return false;
      if (
        playersFilter &&
        (playersFilter < game.minPlayers || playersFilter > game.maxPlayers)
      )
        return false;
      if (durationFilter) {
        if (durationFilter === "short" && game.duration >= 30) return false;
        if (
          durationFilter === "medium" &&
          (game.duration < 30 || game.duration > 60)
        )
          return false;
        if (durationFilter === "long" && game.duration <= 60) return false;
      }
      return true;
    });

    this.renderSearchResults(results);
  }

  // Renderizar resultados de búsqueda
  renderSearchResults(results) {
    const container = document.getElementById("search-results");

    if (results.length === 0) {
      // Quitar grid para que el estado vacío se centre
      container.classList.remove("games-grid");
      container.innerHTML = `
      <div class="empty-state"
           style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;">
        <i class="fas fa-search" style="font-size:3rem;margin-bottom:10px;"></i>
        <p>No se encontraron juegos que coincidan con tu búsqueda</p>
      </div>
    `;
      return;
    }

    // Con resultados: volvemos a modo grid de cartas
    container.classList.add("games-grid");
    container.innerHTML = results
      .map((game) => this.createGameCard(game, true))
      .join("");
  }

  // Mostrar sección específica
  showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.add("active");

    // Actualizar navegación de hexágonos
    document.querySelectorAll(".hexagon").forEach((hex) => {
      hex.classList.remove("active");
    });
    document
      .querySelector(`.hexagon[data-section="${sectionId}"]`)
      .classList.add("active");

    // Guardar sección actual
    this.currentSection = sectionId;

    // Renderizar la sección correspondiente
    if (sectionId === "my-games") {
      this.renderGames();
    } else if (sectionId === "wishlist") {
      this.renderWishlist();
    } else if (sectionId === "search") {
      const results = document.getElementById("search-results");
      results.classList.remove("games-grid"); // quitar grid
      results.innerHTML = `
    <div class="empty-state"
         style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;min-height:200px;">
      <i class="fas fa-search" style="font-size:3rem;margin-bottom:10px;"></i>
      <p>Utiliza el formulario de búsqueda para encontrar juegos entre tus juegos y los deseados</p>
    </div>
  `;
    } else if (sectionId === "export") {
      this.exportGames(); // tu función de exportar
    } else if (sectionId === "import") {
      document.getElementById("import-file").click(); // disparar input file invisible
    }
  }

  // Configurar event listeners
  setupEventListeners() {
    // Navegación por hexágonos
    document.querySelectorAll(".hexagon").forEach((hex) => {
      hex.addEventListener("click", () => {
        const section = hex.getAttribute("data-section");
        this.showSection(section);
      });
    });

    // Filtros
    const applyFiltersBtn = document.getElementById("apply-filters");
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        this.filterGames();
      });
    }

    // Búsqueda
    const searchButton = document.getElementById("search-button");
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        this.searchGames();
      });
    }

    // Formulario
    const gameForm = document.getElementById("game-form");
    if (gameForm) {
      gameForm.addEventListener("submit", (e) => {
        this.addGame(e);
      });
    }

    // Modal
    const closeModalBtn = document.querySelector(".close");
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        document.getElementById("game-modal").style.display = "none";
      });
    }

    window.addEventListener("click", (e) => {
      const modal = document.getElementById("game-modal");
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });

    // Permitir búsqueda con Enter
    const searchInputs = [
      "search-name",
      "search-players",
      "search-duration",
      "search-name-all",
      "search-players-all",
      "search-duration-all",
    ];

    searchInputs.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("keyup", (e) => {
          if (e.key === "Enter") {
            if (
              id.startsWith("search-name-all") ||
              id.startsWith("search-players-all") ||
              id.startsWith("search-duration-all")
            ) {
              const searchBtn = document.getElementById("search-button");
              if (searchBtn) searchBtn.click();
            } else {
              const applyFiltersBtn = document.getElementById("apply-filters");
              if (applyFiltersBtn) applyFiltersBtn.click();
            }
          }
        });
      }
    });

    // Preview de imagen al subir archivo
    const imageUpload = document.getElementById("image-upload");
    if (imageUpload) {
      imageUpload.addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const preview = document.getElementById("image-preview");
            const previewImg = document.getElementById("preview-img");
            if (preview && previewImg) {
              previewImg.src = e.target.result;
              preview.style.display = "block";
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.gameManager = new GameManager();
});
