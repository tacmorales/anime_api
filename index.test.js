const chai = require("chai");
const chaiHttp = require("chai-http");
const { server } = require("./index.js");
const PORT = process.env.PORT;

chai.use(chaiHttp)

describe("Pruebas al servidor Node", () => {
    it("Creación del servidor", () => {
        chai.expect(server).to.be.a('object');
    })

    it("Definición y validación de puerto", () => {
        chai.expect(server.address().port).to.be.equal(PORT);
    })
})