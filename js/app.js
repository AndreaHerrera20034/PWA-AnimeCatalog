// Seleccionar el contenedor donde se mostrarán las tarjetas
const animeGrid = document.getElementById('anime-grid');

// Referencias a los botones y secciones
const addTab = document.getElementById('addTab');
const searchTab = document.getElementById('searchTab');
const addSection = document.getElementById('add-section');
const searchSection = document.getElementById('search-section');

// Función para activar y desactivar secciones
function switchTab(event) {
    const isAddTab = event.target.id === 'addTab';

    // Cambiar la clase active de los botones
    addTab.classList.toggle('active', isAddTab);
    searchTab.classList.toggle('active', !isAddTab);

    // Mostrar la sección correspondiente
    addSection.classList.toggle('active', isAddTab);
    searchSection.classList.toggle('active', !isAddTab);
}

// Manejar el clic en los botones de navegación
addTab.addEventListener('click', switchTab);
searchTab.addEventListener('click', switchTab);

// Función de búsqueda de anime
document.getElementById('searchButton').addEventListener('click', () => {
    const query = document.getElementById('searchInput').value;
    fetchAnimeSearch(query);
});

// Función para obtener los resultados de la búsqueda
function fetchAnimeSearch(query) {
    const apiUrl = `http://localhost:4000/api/search/animes?query=${query}`; // URL de la API para buscar animes

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            displayAnimeCatalog(data); // Mostrar los animes encontrados
        })
        .catch(error => {
            console.error('Error al buscar los animes:', error);
            document.getElementById('anime-grid').innerHTML = '<p>Error al cargar los animes.</p>';
        });
}

// Función para obtener las series desde la API
function fetchSeries() {
    const apiUrl = 'http://localhost:4000/api/animes'; // URL de la API para obtener las series

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la API');
            }
            return response.json(); // Parsear la respuesta como JSON
        })
        .then(data => {
            displayAnimeCatalog(data); // Mostrar las series en el catálogo
        })
        .catch(error => {
            console.error('Error al obtener las series:', error);
            animeGrid.innerHTML = '<p>Error al cargar las series.</p>';
        });
}

// Traer los animes en cards
function displayAnimeCatalog(animeData) {
    // console.log('Datos recibidos:', animeData); // Verificar los datos recibidos

    animeGrid.innerHTML = ''; // Limpiar la grilla actual

    // Iterar sobre cada anime en el arreglo recibido
    animeData.forEach(animeObj => {
        // En este caso, el objeto completo es animeObj
        // console.log('Anime procesado:', animeObj); // Verificar el acceso a los datos correctos

        const card = document.createElement('div');
        card.classList.add('anime-card');

        // Crear el contenido de la tarjeta para cada anime
        card.innerHTML = `
            <img src="${animeObj.image}" alt="${animeObj.title}">
            <div class="anime-card-content">
                <h3>${animeObj.title}</h3>
                <p>Género: ${animeObj.genre}</p>
                <p>Episodios: ${animeObj.episodes}</p>
                <button onclick="editAnime('${animeObj._id}')">Editar</button>
                <button onclick="deleteAnime('${animeObj._id}')">Eliminar</button>
            </div>
        `;

        // Agregar la tarjeta al contenedor
        animeGrid.appendChild(card);
    });
}

// Llamar a la función para obtener las series al cargar la página
fetchSeries();

// Seleccionar el formulario del DOM
const animeForm = document.getElementById('anime-form');

let editMode = false; // Para indicar si estamos editando
let editAnimeId = null; // ID del anime que estamos editando

// Función para traer los datos de un anime y rellenar el formulario
function editAnime(id) {
    const apiUrl = `http://localhost:4000/api/animes/${id}`; // Asegúrate de que esta ruta existe en tu backend

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener el anime');
            }
            return response.json();
        })
        .then(anime => {
            // Rellenar el formulario con los datos del anime a editar
            document.getElementById('title-input').value = anime.title;
            document.getElementById('genre-input').value = anime.genre;
            document.getElementById('episodes-input').value = anime.episodes;

            // Mostrar la imagen actual (en lugar de intentar establecer el valor del input file)
            const imagePreview = document.getElementById('image-preview');
            imagePreview.src = anime.image; // Asignar la URL de la imagen a un <img>

            // Cambiar a modo edición
            editMode = true;
            editAnimeId = anime._id;
        })
        .catch(error => {
            console.error('Error al cargar el anime para editar:', error);
        });
}

// Modificar la función de submit del formulario para manejar tanto creación como edición
animeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Crear un objeto FormData
    const formData = new FormData();
    formData.append('title', document.getElementById('title-input').value);
    formData.append('genre', document.getElementById('genre-input').value);
    formData.append('episodes', document.getElementById('episodes-input').value);

    // Verificar si se seleccionó una nueva imagen
    const imageFile = document.getElementById('image-input').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    if (editMode) {
        // Si estamos en modo edición
        const apiUrl = `http://localhost:4000/api/update/animes/${editAnimeId}`;

        fetch(apiUrl, {
            method: 'PUT',
            body: formData, // Enviar FormData en el cuerpo
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al actualizar el anime');
            }
            return response.json();
        })
        .then(data => {
            console.log('Anime actualizado:', data);
            fetchSeries(); // Refrescar lista
            editMode = false; // Salir del modo edición
            editAnimeId = null; // Limpiar el ID
        })
        .catch(error => {
            console.error('Error al actualizar el anime:', error);
        });
    } else {
        // Si estamos en modo creación
        const apiUrl = 'http://localhost:4000/api/post/crear';

        fetch(apiUrl, {
            method: 'POST',
            body: formData, // Enviar FormData en el cuerpo
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al añadir el anime');
            }
            return response.json();
        })
        .then(data => {
            console.log('Serie añadida:', data);
            fetchSeries(); // Refrescar lista
        })
        .catch(error => {
            console.error('Error al añadir la serie:', error);
        });
    }

    // Limpiar el formulario
    animeForm.reset();
});

// Función para eliminar un anime
function deleteAnime(id) {
    const apiUrl = `http://localhost:4000/api/delete/anime/${id}`;  // URL de la API para eliminar el anime por su ID

    // Confirmar antes de eliminar
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este anime?');
    if (!confirmDelete) {
        return;  // Si el usuario cancela, no hacer nada
    }

    // Realizar la solicitud DELETE para eliminar el anime
    fetch(apiUrl, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al eliminar el anime');
        }
        return response.json();
    })
    .then(data => {
        console.log('Anime eliminado:', data);
        fetchSeries();  // Refrescar la lista de series después de eliminar
    })
    .catch(error => {
        console.error('Error al eliminar el anime:', error);
    });
}

if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(reg => {
        console.log('Service Worker registrado', reg);

        // Verificar si hay conexión y realizar sincronización
        if (navigator.onLine) {
            reg.sync.register('sync-animes');
        }
    })
    .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
    });
}


fetchAnimeSearch('');