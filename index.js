//Diseño de la API:
//El pathname al que se consulta es /api/anime/
//Para especificar las consultas (Solicitar información, en este caso solo con id y/o nombre), estas se reciben desde query params, (también llamado query en la composición de la URL)
//Para entender las partes de una URL, revisar https://web.dev/articles/url-parts?hl=es-419
//Las opciones a actualizar se pasan desde el body como un objeto json.

const http = require("node:http");
const path = require("node:path");
const { readFileSync, writeFileSync } = require("node:fs");
const PORT = process.env.PORT || 0;

// Ubicación del archivo de persistencia.
const absolutePathOfAnimeJson = path.join(__dirname, "data", "anime.json");

// URI de la API
const apiURI = "/api/anime/";

// Mensajes de errores
const messages = {
  wrongUri: {
    message: `Aquí no hay nada que ver. Si buscas la API, consultar http://localhost:${PORT}/api/anime`,
  },
  animeNotFound: {
    message: `El anime solicitado no existe: el id o el nombre entregado no existen en el registro. Si se entregaron ambos es posible que el id no corresponde al nombre del animé.`,
  },
  animeRepeated: {
    message: `El nombre del anime que se desea registrar ya existe.`,
  },
  missingArguments: {
    message: `Falta información que entregar. Puede faltar el Id (DELETE o PUT) o alguno(s) de los parámetros del body para crear (POST).`,
  },
  wrongMethod: {
    message: "Método no soportado. Este servidor solo soporta GET, PUT, POST y DELETE",
  },
};

  //====================================
  //=======CREACIÓN DEL SERVIDOR========
  //====================================
const server = http.createServer((req, res) => {
  // Headers. Siempre es el mismo.
  res.setHeader('Content-Type','application/json')

  //Se crea un objeto URL que representa la ruta a la que se está accediendo (ver lectura sesión 7, página 10)
  //globalThis. se puede omitir, ya que representa el objeto global que existe en todo entorno de ejecución de javascript, el cual tiene acceso a "librerías" o API's, como console, como Math, String, Number, etc... No lo omito, porque cuando es un objeto con el que no se ha trabajado antes (desconocido), lo pongo para que quede claro de donde viene. 
  //Esto también se puede conseguir con const urlImport = require("node:url"); que a diferencia de URL retorna un objeto más sencillo. https://stackoverflow.com/questions/69913108/node-js-url-module-vs-javascript-url
  const urlParsed = new globalThis.URL(req.url, `http://${req.headers.host}`);

  //Gracias a urlParsed.pathname se guarda la ruta relativa de la URL que solicitan. Esto se llama URI (ver partes de una URL)y se guarda en la variable requestedURI.
  const requestedURI = urlParsed.pathname;

  //En este caso la ruta relativa o requestedURI se desea que sea igual a /api/anime que esta guardado en la variable apiURI. Si esto no se cumple, se devuelve un 404.
  if ( !(apiURI === requestedURI || apiURI === `${requestedURI}/`) ) {
    res.statusCode = 404;
    res.write(JSON.stringify(messages.wrongUri));
    return res.end();
  }

  //Se obtiene el método consultado (GET, POST, PUT O DELETE)
  const method = req.method;

  //A pesar de que estas variables no siempre se usan al entrar en ciertos métodos, se prioriza la legibilidad del código sobre la "lógica de optimizar el uso de memoria".
  //Se recuperan los query params en un objeto URLSearchParams (ver lectura sesión 7, página 15)
  const queryParams = new globalThis.URLSearchParams(urlParsed.searchParams);
  
  let animeConsulted = null;
  if(queryParams){
    animeConsulted = {
      "id": queryParams.get("id"),
      "nombre": queryParams.get("nombre"),
    }
  }
  
  //Un gran bloque de if else, para resolver por cada método
  //==================
  //=======GET========
  //==================
  if (method === "GET") {
    //Se recupera el contenido del archivo anime.json
    const dataInStringFormat = readFileSync(absolutePathOfAnimeJson, "utf-8");

    //Si el cliente no entrega ni el id ni el nombre, mostrar todo. Se ignoran el resto de posibles parámetros (año, genero, autor)
    if (!(animeConsulted?.id || animeConsulted?.nombre)) {
      res.write(dataInStringFormat);
      return res.end();
    }
    
    //Si existe el id o el nombre, solo necesitamos recuperar 1 anime, entonces para buscar este anime se pasa el texto a JSON para consultar por él.
    const dataInJsonFormat = JSON.parse(dataInStringFormat);
    
    //Se inicializa la variable donde se guardará el anime encontrado.
    let animeFound = null;

    //Si pasan solo el id se busca por id y se devuelve el animé encontrado.
    if (animeConsulted.id && !animeConsulted.nombre){
      animeFound = dataInJsonFormat[animeConsulted.id]; //<- si esto falla, animeFound será undefined
    }

    //Si pasan solo el nombre se busca por el nombre y se devuelve el animé encontrado.
    if (animeConsulted.nombre && !animeConsulted.id){
      //Nos olvidamos del id, se pasa cada anime (sin el id, solo como objeto) 
      const animes = Object.values(dataInJsonFormat);
      for(anime of animes){
        //Si el nombre coincide con el solicitado se guarda y se deja de buscar
        if (anime.nombre === animeConsulted.nombre){
          animeFound = anime; //<- se guarda
          break; //<- se deja de buscar
        }
        //Si nunca se entra al if, animeFound se mantendrá null
      }
    }

    //Si pasan el id y el nombre se buscar por el id y luego se verifica que el nombre que nos solicitan coincida con el encontrado por el id, y si esto se cumple se devuelve.
    if (animeConsulted.nombre && animeConsulted.id){
      const possibleAnime = dataInJsonFormat[animeConsulted.id];
      if (possibleAnime?.nombre === animeConsulted.nombre){
        animeFound = possibleAnime;
      }
    }

    //Si no se encontró el anime, la variable animeFound seguirá siendo null, por lo que se devuelve 404
    if (!animeFound){
      res.statusCode = 404;
      res.write(JSON.stringify(messages.animeNotFound));
      return res.end();
    }

    //Si no entro al if anterior, significa que se encontró el animé! se entrega al cliente el anime solicitado
    res.statusCode = 200;
    res.write(JSON.stringify(animeFound));
    return res.end();

  //===================
  //=======POST========
  //===================
  } else if (method === "POST") {
    //Cuando se crea o se actualiza algo, el cliente envía la nueva información a traves del body. Para recuperar la información del body se debe utilizar la función req.on con el siguiente patrón: 
    let animeSended = "";
    req.on("data", (chunk) => {
      animeSended += chunk.toString()
    })
    req.on("end", () => {
      //Y aquí se trabaja con el contenido del body ya recuperado, que en este caso es el animeSended
      animeSended = JSON.parse(animeSended);
      //¿Todos los atributos son obligatorios? SI (me respondió Osman el Lunes esto)
      //Entonces primero debemos verificar que nos pasan todos los parámetros.
      if(!(animeSended.nombre && animeSended.genero && animeSended["año"] && animeSended.autor)){
        req.statusCode = 422;
        res.write(JSON.stringify(messages.missingArguments));
        return res.end()
      }

      //Si existe un anime con el mismo nombre, rechazamos la entrada, entonces para buscar este posible duplicado se lee el archivo anime.json y se pasa a un objeto json.
      const dataInStringFormat = readFileSync(absolutePathOfAnimeJson, "utf-8");
      const dataInJsonFormat = JSON.parse(dataInStringFormat);
      //Queremos recorrer cada objeto del archivo (el id no nos interesa):
      const animes = Object.values(dataInJsonFormat);
      //Se inicializa la variable booleana que indicará si está duplicado el nombre
      let animeAlreadyExist = false;
      //Se recorre los animes del archivo
      for (anime of animes){
        //Si el nombre del anime en el archivo es igual al nombre del anime enviado por el cliente, cambiar la variable animeAlreadyExist a true
        if (String(anime.nombre).toLowerCase() === String(animeSended.nombre).toLowerCase()){
          animeAlreadyExist = true;
          break;
        }
      }

      //Si el animé ya existe retornar mostrando el error al cliente.
      if (animeAlreadyExist){
        res.statusCode = 409;
        res.write(JSON.stringify(messages.animeRepeated));
        return res.end();
      }

      //Llegado a este punto, se realizaron las 2 validaciones por lo que se procede a registrar al nuevo animé.
      //Primero generamos el id
      const animeId = new String(animes.length + 1);
      //Se crea el objeto del anime en el mismo formato que el documento original
      const newAnime = {};
      newAnime[animeId] = animeSended;
      //Luego se agrega el nuevo objeto a dataInJsonFormat
      Object.assign(dataInJsonFormat, newAnime);
      //Se escribe el objeto ya modificado
      writeFileSync(absolutePathOfAnimeJson, JSON.stringify(dataInJsonFormat),"utf-8");
      res.writeHead(201);
      //se devuelve newAnime, en vez de animeSended, ya que newAnime posee el id!
      return res.end(JSON.stringify({message: "Registro de animé exitoso", data: newAnime}));
    })

  //==================
  //=======PUT========
  //==================
  } else if (method === "PUT") {
    //DISEÑO: Se edita consultando (query params) con el id (y solo con el id). Los datos a actualizar se entregan desde el body
    //El id es constante, no puede cambiar.
    //El id y el nombre son valores únicos
    //Se puede cambiar el nombre. 
    //Entonces se debe validar que el nombre no coincida con otro anime si se intenta cambiar este atributo.

    //Cuando se crea o se actualiza algo, el cliente envía la nueva información a traves del body.
    //Para recuperar la información del body se debe utilizar la función req.on con el siguiente patrón: 
    let animeSended = "";
    req.on("data", (chunk) => {
      animeSended += chunk.toString();
    })
    req.on("end", () => {
      //Y aquí se trabaja con el contenido del body ya recuperado, que en este caso es el animeSended
      animeSended = JSON.parse(animeSended);

      //Se recupera el id del anime que están solicitando actualizar (esta no es nueva data, no viene del body, viene del query)
      const animeIdToUpdate = animeConsulted.id;

      //Si el cliente no envía el id del anime que desea actualizar, retornar error 422.
      if (!animeIdToUpdate){
        req.statusCode = 422;
        res.write(JSON.stringify(messages.missingArguments));
        return res.end();
      }

      //Al actualizar no es necesario enviar todos las propiedades de un anime, pero debe enviarse al menos 1 para que tenga sentido actualizarlo. Entonces debemos verificar que nos pasan al menos algo para actualizar.
      if(!(animeSended.nombre || animeSended.genero || animeSended["año"] || animeSended.autor)){
        req.statusCode = 422;
        res.write(JSON.stringify(messages.missingArguments));
        return res.end();
      }
      //Los dos anteriores se podrían unir en un solo if pero se mantiene separado por claridad y razones educativas.

      //El anime que se quiere actualizar debe existir, entonces para buscar anime se lee el archivo anime.json y se pasa a un objeto json.
      const dataInStringFormat = readFileSync(absolutePathOfAnimeJson, "utf-8");
      const dataInJsonFormat = JSON.parse(dataInStringFormat);
      //Recuperamos el anime solicitado a actualizar
      let animeToUpdate = dataInJsonFormat[animeIdToUpdate];
      //Si no existe el id del anime que se quiere solicitar retornar error 404.
      if (!animeToUpdate){
        res.statusCode = 404;
        res.write(JSON.stringify(messages.wrongUri));
        return res.end();
      }

      //Si se manda un nombre a actualizar se debe...
      if(animeSended.nombre){
        //...verificar que el nombre no se repita con un anime ya registrado
        // se extraen los objetos animes en un arreglo con Object.values(data)
        const animes = Object.values(dataInJsonFormat);
        //Se inicializa la variable booleana que indicará si está duplicado el nombre
        let animeAlreadyExist = false;
        //Se recorre los animes del archivo
        for (anime of animes){
          //Si el nombre del anime en el archivo es igual al nombre del anime enviado por el cliente, cambiar la variable animeAlreadyExist a true
          if (String(anime.nombre).toLowerCase() === String(animeSended.nombre).toLowerCase()){
            animeAlreadyExist = true;
            break;
          }
        }
        //Si el animé ya existe bajo ese nombre retornar mostrando el error al cliente.
        if (animeAlreadyExist){
          res.statusCode = 409;
          res.write(JSON.stringify(messages.animeRepeated));
          return res.end();
        }
      }

      //Llegado a este punto, la actualización del anime es valida, por lo que se actualiza en el objeto dataInJsonFormat y se escribe en el archivo
      //Primero se crea genera el animé actualizado.
      let animeUpdated = { ...animeToUpdate, ...animeSended };
      //Se sobre escribe este anime actualizado en el objeto dataInJsonFormat
      dataInJsonFormat[animeIdToUpdate] = animeUpdated;
      //Se escriben los animes en el archivo.
      writeFileSync(absolutePathOfAnimeJson, JSON.stringify(dataInJsonFormat), "utf-8");
      //Se crea una replica del objeto ya actualizado, pero con su id
      const animeUpdatedWithId = {};
      animeUpdatedWithId[animeIdToUpdate] = animeUpdated;
      //Se envía mensaje de confirmación al cliente con la información del animé actualizado.
      return res.end(JSON.stringify({ message: "Animé modificado con éxito", data: animeUpdatedWithId}));
  });

  //=====================
  //=======DELETE========
  //=====================
  } else if (method === "DELETE") {
    //Se recupera el id del anime que están solicitando borrar
    const animeIdToDelete = animeConsulted.id;

    //Se verifica si se entregó el id para buscar el anime a borrar.
    if (!animeIdToDelete){
      req.statusCode = 422;
      res.write(JSON.stringify(messages.missingArguments));
      return res.end();
    }

    //El anime que se quiere actualizar debe existir, entonces para buscar anime se lee el archivo anime.json y se pasa a un objeto json.
    const dataInStringFormat = readFileSync(absolutePathOfAnimeJson, "utf-8");
    const dataInJsonFormat = JSON.parse(dataInStringFormat);

    //Se guarda en esta variable el anime que se desea borrar.
    const animeFound = dataInJsonFormat[animeIdToDelete];

    //Si no se encontró el anime, la variable animeFound será undefined, en ese caso se devuelve 404
    if (!animeFound){
      res.statusCode = 404;
      res.write(JSON.stringify(messages.animeNotFound));
      return res.end();
    }

    //Se elimina el anime en el objeto dataInJsonFormat
    delete dataInJsonFormat[animeIdToDelete];
    //Se escribe en el archivo
    writeFileSync(absolutePathOfAnimeJson, JSON.stringify(dataInJsonFormat), "utf-8");
    //Se crea una replica del objeto ya eliminado
    const animeDeletedWithId = {};
    animeDeletedWithId[animeIdToDelete] = animeFound;
    //Se envía la info al cliente.
    return res.end(JSON.stringify({ message: "Anime eliminado con éxito", data: animeDeletedWithId}));
  }

  //Este último else, es el "fallback" en el caso de que soliciten una petición con un metodo distinto de los definidos (GET, POST, PUT, DELETE).
  else{
    req.statusCode = 405;
    res.write(JSON.stringify(messages.wrongMethod));
    return res.end();
  }
})

//Se utiliza el puerto fijado en el archivo .env
server.listen(PORT, () => {
  //Aquí se recupera el port en el que está corriendo el servidor (server), con el método address que devuelve un objeto que tiene la propiedad PORT.
  console.log(`Servidor corriendo en: ${server.address().port}`);
});

module.exports = { server }
