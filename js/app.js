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

// Función para obtener las series desde la API o desde localStorage si no hay conexión
function fetchSeries() {
    const apiUrl = 'http://localhost:4000/api/animes'; // URL de la API para obtener las series

    // Verificar si hay conexión a la API
    if (navigator.onLine) {
        console.log('Conexión a la API detectada.');
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error en la respuesta de la API');
                }
                return response.json(); // Parsear la respuesta como JSON
            })
            .then(data => {
                localStorage.setItem('animeData', JSON.stringify(data)); // Guardar en localStorage
                displayAnimeCatalog(data); // Mostrar las series en el catálogo
            })
            .catch(error => {
                console.error('Error al obtener las series:', error);
                animeGrid.innerHTML = '<p>Error al cargar las series.</p>';
            });
    } else {
        // Si no hay conexión, obtener los datos de localStorage
        console.log('Sin conexión, buscando en localStorage...');
        const storedData = localStorage.getItem('animeData');
        if (storedData) {
            console.log('Datos recuperados de localStorage:', storedData);
            const parsedData = JSON.parse(storedData);
            displayAnimeCatalog(parsedData); // Mostrar los datos sin duplicar
        } else {
            console.log('No se encontraron datos en localStorage.');
            animeGrid.innerHTML = '<p>No hay datos disponibles.</p>';
        }
    }
}

// Traer los animes en cards
function displayAnimeCatalog(animeData) {
    animeGrid.innerHTML = ''; // Limpiar la grilla actual

    // Iterar sobre cada anime en el arreglo recibido
    animeData.forEach(animeObj => {
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

// Función para sincronizar los animes almacenados en localStorage con la API cuando se vuelva a tener conexión
// Función para sincronizar los animes almacenados en localStorage con la API
function syncLocalStorageWithAPI() {
    const storedData = localStorage.getItem('pendingAnimes');
    if (storedData) {
        const pendingAnimes = JSON.parse(storedData);
        let alertMessage = 'Los siguientes animes han sido sincronizados con la API:\n';

        // Para asegurarnos de que no se sincroniza dos veces el mismo anime
        const syncedAnimes = [];

        pendingAnimes.forEach(anime => {
            // Verificamos si este anime ya fue procesado anteriormente
            if (!syncedAnimes.includes(anime.title)) {
                syncedAnimes.push(anime.title); // Añadimos el título para evitar duplicados
                const apiUrl = anime._id
                    ? `http://localhost:4000/api/update/animes/${anime._id}`
                    : 'http://localhost:4000/api/post/crear';

                const formData = new FormData();
                formData.append('title', anime.title);
                formData.append('genre', anime.genre);
                formData.append('episodes', anime.episodes);
                if (anime.image) formData.append('image', anime.image);

                fetch(apiUrl, {
                    method: anime._id ? 'PUT' : 'POST',
                    body: formData,
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Anime sincronizado con la API:', data);
                        removeFromLocalStorage(anime._id);
                        alertMessage += `${anime.title}\n`; // Agregar el título del anime a la alerta
                    })
                    .catch(error => {
                        console.error('Error al sincronizar el anime con la API:', error);
                    });
            }
        });

        // Mostrar la alerta solo después de que todos los animes hayan sido sincronizados
        setTimeout(() => {
            if (pendingAnimes.length > 0) {
                alert(alertMessage);

                // Recargar la página después de mostrar la alerta
                window.location.reload();
            }
        }, 1000); // Un pequeño retraso para que se muestre después de la sincronización
    }
}

// Llamar a esta función cuando el usuario vuelva a estar en línea
window.addEventListener('online', () => {
    console.log('¡Volvió la conexión a Internet! Sincronizando datos...');
    syncLocalStorageWithAPI();
});

function saveAnimeToLocalStorage(anime) {
    let pendingAnimes = JSON.parse(localStorage.getItem('pendingAnimes')) || [];
    
    // Verificar si el anime ya está en localStorage por título
    const animeExists = pendingAnimes.some(storedAnime => storedAnime.title === anime.title);
    if (!animeExists) {
        pendingAnimes.push(anime);
        localStorage.setItem('pendingAnimes', JSON.stringify(pendingAnimes));
    }
}

// Función para eliminar un anime sincronizado de localStorage
function removeFromLocalStorage(animeId) {
    let pendingAnimes = JSON.parse(localStorage.getItem('pendingAnimes')) || [];
    pendingAnimes = pendingAnimes.filter(anime => anime._id !== animeId);
    localStorage.setItem('pendingAnimes', JSON.stringify(pendingAnimes));
}

// Modificar el evento de submit del formulario para guardar animes en localStorage si no hay conexión
animeForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Crear un objeto de anime
    const anime = {
        title: document.getElementById('title-input').value,
        genre: document.getElementById('genre-input').value,
        episodes: document.getElementById('episodes-input').value,
        image: document.getElementById('image-input').files[0],
    };

    if (navigator.onLine) {
        // Si estamos en línea, guardamos directamente en la API
        const apiUrl = editMode 
            ? `http://localhost:4000/api/update/animes/${editAnimeId}` 
            : 'http://localhost:4000/api/post/crear';
        
        const formData = new FormData();
        formData.append('title', anime.title);
        formData.append('genre', anime.genre);
        formData.append('episodes', anime.episodes);
        if (anime.image) formData.append('image', anime.image);

        fetch(apiUrl, {
            method: editMode ? 'PUT' : 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            console.log('Anime guardado en la API:', data);
            fetchSeries();  // Refrescar la lista de series
            editMode = false; // Limpiar el modo de edición
            editAnimeId = null; // Limpiar el ID
        })
        .catch(error => {
            console.error('Error al guardar el anime en la API:', error);
            // Si ocurre un error, guardar el anime en localStorage
            saveAnimeToLocalStorage(anime);
        });
    } else {
        // Si estamos fuera de línea, guardamos el anime en localStorage
        saveAnimeToLocalStorage(anime);
    }

    // Limpiar el formulario
    animeForm.reset();
});

// Modificar la función de submit del formulario para manejar tanto creación como edición
// Función para actualizar o añadir un anime
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
            // Si no hay conexión, almacenar en localStorage para subir luego
            if (!navigator.onLine) {
                let storedData = localStorage.getItem('animeData');
                storedData = storedData ? JSON.parse(storedData) : [];
                storedData.push(data); // Añadir la nueva serie al localStorage
                localStorage.setItem('animeData', JSON.stringify(storedData));
                console.log('Datos guardados en localStorage para sincronizar luego:', localStorage.getItem('animeData'));
            }
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

// Llamada inicial a la función de búsqueda
fetchAnimeSearch('');


// // Seleccionar el contenedor donde se mostrarán las tarjetas
// const animeGrid = document.getElementById('anime-grid');

// // Referencias a los botones y secciones
// const addTab = document.getElementById('addTab');
// const searchTab = document.getElementById('searchTab');
// const addSection = document.getElementById('add-section');
// const searchSection = document.getElementById('search-section');

// // Función para activar y desactivar secciones
// function switchTab(event) {
//     const isAddTab = event.target.id === 'addTab';

//     // Cambiar la clase active de los botones
//     addTab.classList.toggle('active', isAddTab);
//     searchTab.classList.toggle('active', !isAddTab);

//     // Mostrar la sección correspondiente
//     addSection.classList.toggle('active', isAddTab);
//     searchSection.classList.toggle('active', !isAddTab);
// }

// // Manejar el clic en los botones de navegación
// addTab.addEventListener('click', switchTab);
// searchTab.addEventListener('click', switchTab);

// // Función de búsqueda de anime
// document.getElementById('searchButton').addEventListener('click', () => {
//     const query = document.getElementById('searchInput').value;
//     fetchAnimeSearch(query);
// });

// // Función para obtener los resultados de la búsqueda
// function fetchAnimeSearch(query) {
//     const apiUrl = `http://localhost:4000/api/search/animes?query=${query}`; // URL de la API para buscar animes

//     fetch(apiUrl)
//         .then(response => response.json())
//         .then(data => {
//             displayAnimeCatalog(data); // Mostrar los animes encontrados
//         })
//         .catch(error => {
//             console.error('Error al buscar los animes:', error);
//             document.getElementById('anime-grid').innerHTML = '<p>Error al cargar los animes.</p>';
//         });
// }

// // Función para obtener las series desde la API
// function fetchSeries() {
//     const apiUrl = 'http://localhost:4000/api/animes'; // URL de la API para obtener las series

//     fetch(apiUrl)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Error en la respuesta de la API');
//             }
//             return response.json(); // Parsear la respuesta como JSON
//         })
//         .then(data => {
//             displayAnimeCatalog(data); // Mostrar las series en el catálogo
//         })
//         .catch(error => {
//             console.error('Error al obtener las series:', error);
//             animeGrid.innerHTML = '<p>Error al cargar las series.</p>';
//         });
// }

// // Traer los animes en cards
// function displayAnimeCatalog(animeData) {
//     // console.log('Datos recibidos:', animeData); // Verificar los datos recibidos

//     animeGrid.innerHTML = ''; // Limpiar la grilla actual

//     // Iterar sobre cada anime en el arreglo recibido
//     animeData.forEach(animeObj => {
//         // En este caso, el objeto completo es animeObj
//         // console.log('Anime procesado:', animeObj); // Verificar el acceso a los datos correctos

//         const card = document.createElement('div');
//         card.classList.add('anime-card');

//         // Crear el contenido de la tarjeta para cada anime
//         card.innerHTML = `
//             <img src="${animeObj.image}" alt="${animeObj.title}">
//             <div class="anime-card-content">
//                 <h3>${animeObj.title}</h3>
//                 <p>Género: ${animeObj.genre}</p>
//                 <p>Episodios: ${animeObj.episodes}</p>
//                 <button onclick="editAnime('${animeObj._id}')">Editar</button>
//                 <button onclick="deleteAnime('${animeObj._id}')">Eliminar</button>
//             </div>
//         `;

//         // Agregar la tarjeta al contenedor
//         animeGrid.appendChild(card);
//     });
// }

// // Llamar a la función para obtener las series al cargar la página
// fetchSeries();

// // Seleccionar el formulario del DOM
// const animeForm = document.getElementById('anime-form');

// let editMode = false; // Para indicar si estamos editando
// let editAnimeId = null; // ID del anime que estamos editando

// // Función para traer los datos de un anime y rellenar el formulario
// function editAnime(id) {
//     const apiUrl = `http://localhost:4000/api/animes/${id}`; // Asegúrate de que esta ruta existe en tu backend

//     fetch(apiUrl)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Error al obtener el anime');
//             }
//             return response.json();
//         })
//         .then(anime => {
//             // Rellenar el formulario con los datos del anime a editar
//             document.getElementById('title-input').value = anime.title;
//             document.getElementById('genre-input').value = anime.genre;
//             document.getElementById('episodes-input').value = anime.episodes;

//             // Mostrar la imagen actual (en lugar de intentar establecer el valor del input file)
//             const imagePreview = document.getElementById('image-preview');
//             imagePreview.src = anime.image; // Asignar la URL de la imagen a un <img>

//             // Cambiar a modo edición
//             editMode = true;
//             editAnimeId = anime._id;
//         })
//         .catch(error => {
//             console.error('Error al cargar el anime para editar:', error);
//         });
// }

// // Modificar la función de submit del formulario para manejar tanto creación como edición
// animeForm.addEventListener('submit', (e) => {
//     e.preventDefault();

//     // Crear un objeto FormData
//     const formData = new FormData();
//     formData.append('title', document.getElementById('title-input').value);
//     formData.append('genre', document.getElementById('genre-input').value);
//     formData.append('episodes', document.getElementById('episodes-input').value);

//     // Verificar si se seleccionó una nueva imagen
//     const imageFile = document.getElementById('image-input').files[0];
//     if (imageFile) {
//         formData.append('image', imageFile);
//     }

//     if (editMode) {
//         // Si estamos en modo edición
//         const apiUrl = `http://localhost:4000/api/update/animes/${editAnimeId}`;

//         fetch(apiUrl, {
//             method: 'PUT',
//             body: formData, // Enviar FormData en el cuerpo
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Error al actualizar el anime');
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log('Anime actualizado:', data);
//             fetchSeries(); // Refrescar lista
//             editMode = false; // Salir del modo edición
//             editAnimeId = null; // Limpiar el ID
//         })
//         .catch(error => {
//             console.error('Error al actualizar el anime:', error);
//         });
//     } else {
//         // Si estamos en modo creación
//         const apiUrl = 'http://localhost:4000/api/post/crear';

//         fetch(apiUrl, {
//             method: 'POST',
//             body: formData, // Enviar FormData en el cuerpo
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Error al añadir el anime');
//             }
//             return response.json();
//         })
//         .then(data => {
//             console.log('Serie añadida:', data);
//             fetchSeries(); // Refrescar lista
//         })
//         .catch(error => {
//             console.error('Error al añadir la serie:', error);
//         });
//     }

//     // Limpiar el formulario
//     animeForm.reset();
// });

// // Función para eliminar un anime
// function deleteAnime(id) {
//     const apiUrl = `http://localhost:4000/api/delete/anime/${id}`;  // URL de la API para eliminar el anime por su ID

//     // Confirmar antes de eliminar
//     const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este anime?');
//     if (!confirmDelete) {
//         return;  // Si el usuario cancela, no hacer nada
//     }

//     // Realizar la solicitud DELETE para eliminar el anime
//     fetch(apiUrl, {
//         method: 'DELETE',
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Error al eliminar el anime');
//         }
//         return response.json();
//     })
//     .then(data => {
//         console.log('Anime eliminado:', data);
//         fetchSeries();  // Refrescar la lista de series después de eliminar
//     })
//     .catch(error => {
//         console.error('Error al eliminar el anime:', error);
//     });
// }

// fetchAnimeSearch('');