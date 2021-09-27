const processador = require ('./processador')
const titleCase = require ('title-case')
const express = require('express')
const app = express()
app.use(express.json())

app.get ('/', (req, res) => {
    res.send("Hey, this is Avante! USJT")
})

app.get ("/student_status", (req, res) => {
    const getDados = (dados) => {
        res.status(dados.ra !== 0 ? 200 : 404)
        res.send(dados)
    }
    const getStudentStatus = (ra, getDados) => {
        const aux = (itens) => {
          let alunoResultado = {nome: '', ra: 0, avtCoins: 0}
          for (let item of itens){
            for (let aluno of item.alunos){
              if (ra == aluno.ra){
                alunoResultado.nome = titleCase.titleCase(aluno.nome.toString().toLowerCase())
                alunoResultado.ra = aluno.ra
                alunoResultado.avtCoins += +aluno.avtCoins
              }
            }
          }
          getDados(alunoResultado)
        }
        processador(aux)
      }
      getStudentStatus(req.query.ra, getDados)
})

app.listen (process.env.PORT || 3000)

