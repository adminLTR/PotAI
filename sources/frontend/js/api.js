const API_URL = "http://10.118.100.105:8000"

async function fetchContenidoPage(id) {
  const url = `${API_URL}/plantas/${id}/info-planta/`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al obtener los datos:", error);
  }
}
