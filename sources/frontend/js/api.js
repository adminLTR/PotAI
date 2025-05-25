const API_URL = "http://192.168.1.113:8000"

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
