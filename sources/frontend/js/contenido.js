async function main() {
  const id = 1;
  const data = await fetchContenidoPage(id);

  if (data) {
    document.getElementById("plant-name").textContent = data["plant-name"];
    
  } else {
    console.log("No se recibió data del sensor.");
  }
}

main();