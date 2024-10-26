const http = require("node:http");
const url = require("node:url");
const path = require("node:path");
const { readFileSync, writeFileSync } = require("node:fs");
const PORT = process.env.PORT;

// Ubicación del archivo de persistencia.
const dataAnimes = path.join(__dirname, "data", "anime.json");

// URI de la API
const apiPath = "/anime_api";

// Mensajes de errores
const messages = {
  wrongUri: {
    message: `Aquí no hay nada que ver. Si buscas la API, consultar http://localhost:${PORT}`,
  },
  wrongMethod: {
    message:
    "Petición realizada con un método no soportado. Este servidor solo soporta GET, PUT, POST, DELETE",
  },
};

const server = http.createServer((req, res) => {
  const method = req.method;
  const urlParsed = url.parse(req.url, true);

  //El diseño de la API se basa en que todas las consultas CRUD van al pathname /animes
  const pathName = urlParsed.pathname;
  if (pathName !== apiPath) {
    res.statusCode = 404;
    res.write(JSON.stringify(messages.wrongUri));
    return res.end();
  }

  //A pesar de que estas variables no se usan al entrar en ciertos métodos, se prioriza la legibilidad del código sobre la "lógica de optimizar el uso de memoria".
  //¿El id y el nombre son valores únicos?
  const params = urlParsed.query;
  const id = params.id || false;
  const nombre = params.nombre || false;
  const año = params.anio || false;
  const genero = params.genero || false;
  const autor = params.autor || false;

  // Headers. Siempre es el mismo.
  res.setHeader('Content-Type','application/json')

  //Para todo lo que es read, create, update, delete (GET, POST, PUT, DELETE)
  if (method === "GET") {
    const dataInStringFormat = readFileSync(dataAnimes, "utf-8");
    const dataInJsonFormat = JSON.parse(dataInStringFormat);

    //Si no se pasan los parámetros del id o del nombre, mostrar todo.
    //Como manejar si pasan año, genero o autor en esta consulta????, tal vez mostrar todos los animes que coincidan con estos parámetros? Por ahora ignorar.
    if (!(id || nombre)) {
      res.write(dataInStringFormat);
      return res.end();
    }

    const anime = dataInJsonFormat.
    res.write(anime);
    return res.end();



  } else if (method === "POST") {
    //¿Todos los atributos son obligatorios?
    //Si alguno no es obligatorio, ¿Como se maneja este caso cuando no pasan esa propiedad? ¿Es valido fijar la propiedad al valor null?

  } else if (method === "PUT") {
    //¿El id y el nombre son valores únicos?
    //Si la respuesta es si ¿Permitir editar solo indicando el nombre?
    //Asumo que el id es constante (no se puede cambiar). ¿Se puede cambiar el nombre? (asumo que si)

  } else if (method === "DELETE") {
    //¿El id y el nombre son valores únicos?
    //Si la respuesta es si ¿Permitir borrar solo indicando el nombre?

  } else {
    res.statusCode = 405;
    res.write(JSON.stringify());
    return res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto: ${PORT}`);
});
