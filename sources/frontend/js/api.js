const API_URL = "http://192.168.1.134:8000"

async function fetchContenidoPage(id) {
  const url = `${API_URL}/api/sensores/${id}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log("Datos del sensor:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener los datos:", error);
  }
}
