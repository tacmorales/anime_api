const chai = require("chai");
const chaiHttp = require("chai-http");
const { server } = require("./index.js");
const PORT = process.env.PORT;

chai.use(chaiHttp)

describe("Pruebas al servidor Node", () => {
    it("Creación del servidor", () => {
        chai.expect(server).to.be.a('object');
    })

    it(`Aplicación corriendo por el puerto definido: ${PORT}`, () => {
        chai.expect(Number(server.address().port)).to.be.equal(Number(PORT));
    })
})