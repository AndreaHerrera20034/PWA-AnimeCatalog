// Seleccionar el contenedor donde se mostrarán las tarjetas
const animeGrid = document.getElementById('anime-grid');

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
    console.log('Datos recibidos:', animeData); // Verificar los datos recibidos

    animeGrid.innerHTML = ''; // Limpiar la grilla actual

    // Iterar sobre cada anime en el arreglo recibido
    animeData.forEach(animeObj => {
        // En este caso, el objeto completo es animeObj
        console.log('Anime procesado:', animeObj); // Verificar el acceso a los datos correctos

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

// Función para añadir una nueva serie al catálogo
animeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Obtener los valores del formulario
    const title = document.getElementById('title-input').value;
    const genre = document.getElementById('genre-input').value;
    const episodes = document.getElementById('episodes-input').value;
    const image = document.getElementById('image-input').value;

    // Crear un objeto con los datos del nuevo anime
    const newAnime = { title, genre, episodes, image };

    // URL de la API para añadir una nueva serie
    const apiUrl = 'http://localhost:4000/api/post/crear';

    // Enviar la solicitud POST a la API
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAnime)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al añadir la serie');
        }
        return response.json(); // Convertir la respuesta en JSON
    })
    .then(data => {
        console.log('Serie añadida:', data);
        fetchSeries(); // Refrescar la lista de series después de añadir
    })
    .catch(error => {
        console.error('Error al añadir la serie:', error);
    });

    // Limpiar el formulario
    animeForm.reset();
});
