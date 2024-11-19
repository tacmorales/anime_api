const chai = require("chai");
const chaiHttp = require("chai-http");
const { servidor, port } = require("./index.js");

chai.use(chaiHttp)

describe("Pruebas al servidor Node", () => {
    it("Creación del servidor", () => {
        chai.expect(servidor).to.be.a('object');
    })

    it("Definición y validación de puerto", () => {
        chai.expect(port).to.be.a("number");
    })
})