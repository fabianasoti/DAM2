// Página de inicio de sesión

const formulario = document.querySelector("#formulario")
const mensaje = document.querySelector("#mensaje")
const botonEntrar = document.querySelector("#entrar")

// Si ya hay una sesión iniciada, pasamos directamente a la aplicación
fetch("api/002-sesion.php?accion=yo")
  .then(function (respuesta) {
    if (respuesta.ok) { location.href = "index.html" }
  })
  .catch(function () {})

formulario.onsubmit = async function (evento) {
  evento.preventDefault()    // que el formulario no recargue la página
  mensaje.textContent = ""

  const email = document.querySelector("#email").value.trim()
  const password = document.querySelector("#password").value
  if (email === "" || password === "") {
    mensaje.textContent = "Escribe tu email y tu contraseña"
    return
  }

  botonEntrar.disabled = true
  try {
    const respuesta = await fetch("api/002-sesion.php?accion=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    })
    const datos = await respuesta.json()
    if (datos.ok) {
      location.href = "index.html"
    } else {
      mensaje.textContent = datos.error
      document.querySelector("#password").value = ""
    }
  } catch (error) {
    mensaje.textContent = "No se puede conectar con el servidor"
  }
  botonEntrar.disabled = false
}
