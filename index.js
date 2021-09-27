const processador = require('./processador')
const titleCase = require('title-case')
const _ = require('underscore')
const cors = require('cors')
const express = require('express')
const app = express()
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send("Hey, this is Avante! USJT")
})


app.get('/myself_among_others', (req, res) => {
    const getDados = (dados) => {
        res.send(dados)
    }
    const aux = (consolidatedAvtCoins) => {
        consolidatedAvtCoins = _.sortBy (consolidatedAvtCoins, o => o.avtCoins)
        consolidatedAvtCoins = consolidatedAvtCoins.reverse()
        const posicaoDoAluno = _.findIndex(consolidatedAvtCoins, (a) => a.ra === req.query.ra)
        let indexOfUpLimit = posicaoDoAluno <= 5 ? 0 : posicaoDoAluno - 5
        let indexOfBottomLimit = posicaoDoAluno >= consolidatedAvtCoins.length - 4 ? consolidatedAvtCoins.length - 1 : posicaoDoAluno + (10 - (posicaoDoAluno - indexOfUpLimit))
        console.log(indexOfUpLimit)
        console.log(posicaoDoAluno)
        console.log(indexOfBottomLimit)
        const thePositions = _.range(indexOfUpLimit, indexOfBottomLimit)
        const upPortion = consolidatedAvtCoins.slice(indexOfUpLimit, posicaoDoAluno)
        const BottomPortion = consolidatedAvtCoins.slice(posicaoDoAluno, indexOfBottomLimit)
        theFinalWindow = [...upPortion, ...BottomPortion].map((e, i) => ({posicao: thePositions[i], ...e}))
        console.log(theFinalWindow)
        getDados(theFinalWindow)
    }
    processador.consolidatedAvtCoins(aux)
})

app.get('/top_ones', (req, res) => {

})

app.get("/student_status", (req, res) => {
    const getDados = (dados) => {
        res.status(dados.ra !== 0 ? 200 : 404)
        res.send(dados)
    }
    const getStudentStatus = (ra, getDados) => {
        const aux = (itens) => {
            let alunoResultado = { nome: '', ra: 0, avtCoins: 0 }
            for (let item of itens) {
                for (let aluno of item.alunos) {
                    if (ra == aluno.ra) {
                        alunoResultado.nome = titleCase.titleCase(aluno.nome.toString().toLowerCase())
                        alunoResultado.ra = aluno.ra
                        alunoResultado.avtCoins += +aluno.avtCoins
                    }
                }
            }
            getDados(alunoResultado)
        }
        processador.obterBaseInteiraPorData(aux)
    }
    getStudentStatus(req.query.ra, getDados)
})

app.listen(process.env.PORT || 3000)

