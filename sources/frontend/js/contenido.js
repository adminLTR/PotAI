async function main() {
  const id = 1;
  const data = await fetchContenidoPage(id);
  console.log(data)

  if (data) {
    document.getElementById("plant-name").textContent = data["nombre"];
    document.getElementById("temperatura-actual").textContent = data["temperatura_actual"] + "°C";
    document.getElementById("humedad-actual").textContent = data["humedad_actual"] + "%";
    document.getElementById("tipo").textContent = data["tipo_planta"];

    const historialBody = document.getElementById("riegos-historial");
    historialBody.innerHTML = ""; // Limpiar contenido anterior si lo hay

    data["ultimos_riegos"].forEach(riego => {
      const fecha = new Date(riego.fecha);
      const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <th scope="row">${hora}</th>
        <td>${riego.volumen_salida} ml</td>
        <td>${riego.temperatura}°C</td>
        <td>${riego.humedad}%</td>
      `;

      historialBody.appendChild(tr);
    });

  } else {
    console.log("No se recibió data del sensor.");
  }
}

main();